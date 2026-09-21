"use client";

import { useEffect, useRef, useState } from "react";
import type { GameState } from "@/hooks/use-game-state";
import { useT } from "@/lib/i18n";
import { playStreakSfx } from "@/lib/hero-sfx";
import {
  NO_STREAK,
  ROUND_SECONDS,
  STREAK_WINDOW_MS,
  isNewRecord,
  multiplierFor,
  registerStreakKill,
  secondsLeft,
  streakAlive,
} from "../port/gull-rush";

/** Clave de `localStorage`: el récord de PUNTOS en una ronda se conserva entre visitas. */
const STORAGE_KEY = "action:gulls-record";

function readRecord(): number {
  try {
    const n = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function writeRecord(n: number) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(n));
  } catch {
    /* modo privado / sin almacenamiento: el récord vive sólo en sesión */
  }
}

/** Tiempo que los avisos centrales están en pantalla (igual que `.tally-banner` en globals.css). */
const BANNER_MS = 1000;

interface Round {
  running: boolean;
  /** Puntos de la ronda: cada baja vale el multiplicador vigente. */
  score: number;
  /** Segundos que faltan (0 = ronda terminada o sin empezar). */
  left: number;
  /** Récord ya persistido. */
  record: number;
  /** La última ronda cerrada batió el récord. */
  beaten: boolean;
  /** Bajas seguidas de la racha viva (0 = sin racha). */
  streak: number;
  /** Multiplicador vigente. */
  mult: number;
  /** Instante de la última baja: reinicia la barra que se vacía. */
  streakAt: number;
}

const INITIAL: Round = {
  running: false, score: 0, left: 0, record: 0, beaten: false, streak: 0, mult: 1, streakAt: 0,
};

/**
 * Easter egg: ronda de caza de gaviotas, arriba a la derecha, bajo el header.
 * No existe en el DOM hasta la primera baja — quien no dispara no sabe que
 * está. La primera baja arranca una cuenta atrás de `ROUND_SECONDS` y publica
 * `gameState.gullRush.active` (entran las gaviotas extra, ver `Seagulls.tsx`);
 * al acabar se compara con el récord persistido. Una baja tras el final
 * arranca otra ronda.
 *
 * Racha (`gull-rush.ts`): bajas a menos de 1,5 s unas de otras; cada 5 sube el
 * multiplicador y la baja vale ×N puntos. Cada subida lanza un aviso central
 * con impacto. Se suscribe a `gameState.onGullKill` como el resto de overlays.
 */
export function GullTally({ gameState }: { gameState: GameState }) {
  const t = useT();
  /** Aviso central de inicio / fin: `id` cambia en cada uno para reiniciar la animación. */
  const [banner, setBanner] = useState<{ id: number; kind: "start" | "end" } | null>(null);
  /** Aviso de subida de multiplicador. */
  const [streakBanner, setStreakBanner] = useState<{ id: number; mult: number; count: number } | null>(null);
  const [round, setRound] = useState<Round>(INITIAL);
  /** Estado mutable de la ronda: el intervalo lo lee sin depender de renders. */
  const live = useRef({ endsAt: 0, score: 0, record: 0, timer: 0, streak: NO_STREAK });

  useEffect(() => {
    if (!banner) return;
    // Dura 1 s (misma duración que `.tally-banner`): luego sale del DOM.
    const id = window.setTimeout(() => setBanner(null), BANNER_MS);
    return () => window.clearTimeout(id);
  }, [banner]);

  useEffect(() => {
    if (!streakBanner) return;
    const id = window.setTimeout(() => setStreakBanner(null), BANNER_MS);
    return () => window.clearTimeout(id);
  }, [streakBanner]);

  useEffect(() => {
    const s = live.current;
    const rush = gameState.gullRush.current;
    s.record = readRecord();
    setRound((r) => ({ ...r, record: s.record }));

    const finish = () => {
      window.clearInterval(s.timer);
      s.timer = 0;
      gameState.setRush(false);
      s.streak = NO_STREAK;
      const beaten = isNewRecord(s.score, s.record);
      if (beaten) {
        s.record = s.score;
        writeRecord(s.record);
      }
      setRound({ ...INITIAL, score: s.score, record: s.record, beaten });
      setStreakBanner(null);
      setBanner({ id: Date.now(), kind: "end" });
    };

    const tick = () => {
      const now = Date.now();
      const left = secondsLeft(s.endsAt, now);
      if (left <= 0) {
        finish();
        return;
      }
      // ¿Más de 1,5 s sin matar? La racha se pierde y el multiplicador vuelve a ×1.
      const lost = s.streak.count > 0 && !streakAlive(s.streak, now);
      if (lost) s.streak = NO_STREAK;
      setRound((r) => {
        if (r.left === left && !lost) return r;
        return lost ? { ...r, left, streak: 0, mult: 1 } : { ...r, left };
      });
    };

    gameState.onGullKill.current = () => {
      const now = Date.now();
      if (!rush.active) {
        gameState.setRush(true);
        s.score = 0;
        s.streak = NO_STREAK;
        s.endsAt = now + ROUND_SECONDS * 1000;
        s.timer = window.setInterval(tick, 100);
        setBanner({ id: s.endsAt, kind: "start" });
      }
      const hit = registerStreakKill(s.streak, now);
      s.streak = hit.streak;
      s.score += hit.mult;
      if (hit.levelUp) {
        setStreakBanner({ id: now, mult: hit.mult, count: hit.streak.count });
        playStreakSfx(hit.mult);
      }
      setRound({
        running: true,
        score: s.score,
        left: secondsLeft(s.endsAt, now),
        record: s.record,
        beaten: false,
        streak: hit.streak.count,
        mult: multiplierFor(hit.streak.count),
        streakAt: now,
      });
    };
    return () => {
      gameState.onGullKill.current = null;
      window.clearInterval(s.timer);
      gameState.setRush(false);
    };
  }, [gameState]);

  const { running, score, left, record, beaten, streak, mult, streakAt } = round;
  if (score === 0 && !running) return null;

  const urgent = running && left <= 5;

  return (
    <>
      {/* Aviso central de inicio / fin de ronda: banda + texto con entrada tipo "slam" (CSS). */}
      {banner && (
        <div
          key={banner.id}
          className="pointer-events-none absolute inset-x-0 top-[26%] z-30 flex select-none justify-center"
          data-testid="gull-banner"
          data-kind={banner.kind}
          role="alert"
        >
          <div className="tally-banner flex w-full flex-col items-center gap-3 bg-gradient-to-r from-transparent via-background/75 to-transparent py-7">
            <span className="tally-banner-title font-mono text-5xl font-bold uppercase leading-none tracking-[0.35em] text-foreground">
              {banner.kind === "start" ? t.game.tally.roundStart : t.game.tally.roundEnd}
            </span>
            {banner.kind === "start" && (
              <span className="tally-banner-sub font-mono text-xs font-semibold uppercase tracking-[0.5em] text-accent">
                {ROUND_SECONDS} {t.game.tally.seconds}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Subida de multiplicador: "×2" enorme + "RACHA · 5 MUERTES". Crece con el nivel. */}
      {streakBanner && (
        <div
          key={streakBanner.id}
          className="pointer-events-none absolute inset-x-0 top-[42%] z-30 flex select-none justify-center"
          data-testid="gull-streak-banner"
          data-mult={streakBanner.mult}
          role="alert"
        >
          <div className="tally-banner flex w-full flex-col items-center gap-2 bg-gradient-to-r from-transparent via-background/75 to-transparent py-5">
            <span
              className="tally-streak-mult font-mono font-black leading-none text-accent"
              style={{ fontSize: `${Math.min(9, 4.5 + streakBanner.mult * 0.5)}rem` }}
            >
              ×{streakBanner.mult}
            </span>
            <span className="tally-banner-sub font-mono text-sm font-bold uppercase tracking-[0.5em] text-foreground">
              {t.game.tally.streak} · {streakBanner.count} {t.game.tally.streakKills}
            </span>
          </div>
        </div>
      )}

      <div
        className="tally-pop absolute right-8 top-28 z-30 flex flex-col items-end gap-2 pointer-events-none select-none"
        data-testid="gull-tally"
        data-state={running ? "running" : "over"}
      >
        <div
          className="relative flex items-center gap-3 overflow-hidden rounded-full border border-border/70 bg-background/60 px-4 py-2 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label={`${t.game.tally.label}: ${score}`}
        >
          {/* Silueta en vuelo — gira 180° (panza arriba) con cada baja. */}
          <svg
            key={`bird-${score}`}
            aria-hidden
            width="30"
            height="18"
            viewBox="0 0 32 20"
            className="tally-bird text-foreground"
            fill="currentColor"
          >
            <path d="M1.5 10.5C6.5 2.5 12 3 15 8.5L16 10.5L17 8.5C20 3 25.5 2.5 30.5 10.5C25.5 8 20.5 9.5 17.6 13L16 17L14.4 13C11.5 9.5 6.5 8 1.5 10.5Z" />
          </svg>
          <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-foreground/55">×</span>
          <span
            key={`n-${score}`}
            className="tally-bump inline-block min-w-[1.4ch] text-center font-mono text-lg font-bold leading-none text-accent tabular-nums"
          >
            {score}
          </span>
          {/* Cuenta atrás: sólo mientras dura la ronda. */}
          {running && (
            <>
              <span aria-hidden className="h-4 w-px bg-border" />
              <span
                className={`font-mono text-lg font-bold leading-none tabular-nums ${urgent ? "tally-urgent text-accent" : "text-foreground"}`}
                role="timer"
                aria-label={`${t.game.tally.timeLeft}: ${left} ${t.game.tally.seconds}`}
                data-testid="gull-timer"
              >
                {left}
                <span className="ml-0.5 text-[11px] font-semibold text-foreground/55">s</span>
              </span>
            </>
          )}
          {/* Barra fina de tiempo pegada al borde inferior. */}
          {running && (
            <span
              aria-hidden
              className="tally-bar absolute inset-x-0 bottom-0 h-px origin-left bg-accent"
              style={{ animationDuration: `${ROUND_SECONDS}s` }}
            />
          )}
        </div>

        {/* Racha viva: bajas seguidas, multiplicador y barra que se vacía en 1,5 s. */}
        {running && streak > 0 && (
          <div
            className="relative flex items-center gap-2 overflow-hidden rounded-full border border-border/70 bg-background/60 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] backdrop-blur-sm"
            data-testid="gull-streak"
            data-streak={streak}
            data-mult={mult}
          >
            <span className="text-foreground/55">{t.game.tally.streak}</span>
            <span className="text-foreground tabular-nums">{streak}</span>
            <span key={`m-${mult}`} className="tally-bump text-sm font-black text-accent tabular-nums">
              ×{mult}
            </span>
            <span
              aria-hidden
              key={`s-${streakAt}`}
              className="tally-bar absolute inset-x-0 bottom-0 h-px origin-left bg-accent"
              style={{ animationDuration: `${STREAK_WINDOW_MS}ms` }}
            />
          </div>
        )}

        <div
          className="flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] backdrop-blur-sm"
          data-testid="gull-record"
        >
          <span className="text-foreground/55">{t.game.tally.record}</span>
          <span className="text-foreground tabular-nums">{record}</span>
          {beaten && (
            <span className="tally-bump text-accent" data-testid="gull-new-record">
              {t.game.tally.newRecord}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
