"use client";

import { useEffect, useState } from "react";
import type { GameState } from "@/hooks/use-game-state";
import { useT } from "@/lib/i18n";

/** Clave de `localStorage`: las bajas se conservan entre visitas. */
const STORAGE_KEY = "action:gulls-downed";

function readStored(): number {
  try {
    const n = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function writeStored(n: number) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(n));
  } catch {
    /* modo privado / sin almacenamiento: el contador vive sólo en sesión */
  }
}

/**
 * Easter egg: contador de gaviotas abatidas, arriba a la derecha, bajo el
 * header. No existe en el DOM hasta la primera baja — quien no dispara no
 * sabe que está. Silueta de gaviota que da la vuelta y número que salta con
 * cada baja. Se suscribe a `gameState.onGullKill` como el resto de overlays.
 */
export function GullTally({ gameState }: { gameState: GameState }) {
  const t = useT();
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(readStored());
    gameState.onGullKill.current = () => {
      setCount((n) => {
        const next = n + 1;
        writeStored(next);
        return next;
      });
    };
    return () => {
      gameState.onGullKill.current = null;
    };
  }, [gameState]);

  if (count === 0) return null;

  return (
    <div
      className="tally-pop absolute right-8 top-28 z-30 flex items-center gap-3 rounded-full border border-border/70 bg-background/60 px-4 py-2 backdrop-blur-sm pointer-events-none select-none"
      data-testid="gull-tally"
      role="status"
      aria-live="polite"
      aria-label={`${t.game.tally.label}: ${count}`}
    >
      {/* Silueta en vuelo — gira 180° (panza arriba) con cada baja. */}
      <svg
        key={`bird-${count}`}
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
        key={`n-${count}`}
        className="tally-bump inline-block min-w-[1.4ch] text-center font-mono text-lg font-bold leading-none text-accent tabular-nums"
      >
        {count}
      </span>
    </div>
  );
}
