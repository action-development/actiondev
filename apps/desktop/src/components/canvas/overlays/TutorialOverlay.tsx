"use client";

import { useState, useEffect, useRef } from "react";
import type { GameState } from "@/hooks/use-game-state";
import { ACTION_KEYS } from "@/hooks/use-action-queue";
import { useT } from "@/lib/i18n";
import styles from "./TutorialOverlay.module.css";

type Trigger = "pickup" | "move" | "row" | "throw" | "legend";

type TutorialStep = {
  /** Teclas dibujadas como tapas físicas (mismo lenguaje que el mando RC). */
  keys: { label: string; accent?: boolean; mouse?: boolean }[];
  action: string;
  trigger: Trigger;
};

/**
 * DOS CAMINOS, porque hay dos tipos de visitante:
 *
 * - `click` (por defecto): el camino fácil. "Haz clic en un contenedor" con la
 *   flecha holográfica señalando uno en la escena (`gameState.pointAt`); la
 *   maniobra automática hace el resto. Al acabar, una leyenda breve cuenta que
 *   también se puede manejar a mano.
 * - `manual`: si lo primero que hace es tocar teclas o el mando, se le enseñan
 *   los controles paso a paso (mover → fila → enganchar → soltar).
 */
type Track = "click" | "manual";

const MOVE_KEYS = ["KeyA", "KeyD", "ArrowLeft", "ArrowRight"];
/** Eje de profundidad: alejar / acercar el pórtico (ver `quay-rows.ts`). */
const ROW_KEYS = ["KeyW", "KeyS", "ArrowUp", "ArrowDown"];
/** Botones del mando que cuentan como "ha cambiado de fila". */
const ROW_REMOTE = '[data-testid="remote-up"],[data-testid="remote-down"]';
const MOVE_REMOTE = '[data-testid="remote-left"],[data-testid="remote-right"]';
const ANY_REMOTE = '[data-testid^="remote-"]';
/** Contenedor que señala el primer paso: el de proyectos, ya en la fila del barco. */
const POINT_TARGET = "projects";
/** Cuánto se queda la leyenda final del camino fácil. */
const LEGEND_MS = 4500;
const FADE_MS = 400;

interface TutorialOverlayProps {
  gameState: GameState;
}

export function TutorialOverlay({ gameState }: TutorialOverlayProps) {
  const t = useT();
  const [track, setTrack]     = useState<Track>("click");
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);
  const [fading, setFading]   = useState(false);
  const stepRef = useRef(step);
  stepRef.current = step;

  const lower = { label: t.game.remote.lower, accent: true };
  // Steps derived from translations so they react to locale changes.
  // Las tapas replican los botones del mando: flechas olive, gancho lima.
  const TRACKS: Record<Track, TutorialStep[]> = {
    click: [
      { keys: [{ label: "", mouse: true }], action: t.tutorial.click, trigger: "pickup" },
      { keys: [lower], action: t.tutorial.throw, trigger: "throw" },
      { keys: [{ label: "◀" }, { label: "▶" }, { label: "▲" }, { label: "▼" }, lower], action: t.tutorial.manual, trigger: "legend" },
    ],
    manual: [
      { keys: [{ label: "◀" }, { label: "▶" }], action: t.tutorial.move, trigger: "move" },
      { keys: [{ label: "▲" }, { label: "▼" }], action: t.tutorial.row, trigger: "row" },
      { keys: [lower], action: t.tutorial.pickup, trigger: "pickup" },
      { keys: [lower], action: t.tutorial.throw, trigger: "throw" },
    ],
  };
  const steps = TRACKS[track];
  const current = visible ? steps[step] : undefined;
  const trigger = current?.trigger;

  // Delay tutorial start so containers have time to land on the quay
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  /** Funde el cartel y pasa al paso `next` de `nextTrack` (o lo cierra). */
  const goTo = useRef<(next: number, nextTrack?: Track) => void>(() => {});
  goTo.current = (next: number, nextTrack: Track = track) => {
    setFading(true);
    setTimeout(() => {
      setFading(false);
      if (next >= TRACKS[nextTrack].length) {
        setVisible(false);
        return;
      }
      setTrack(nextTrack);
      setStep(next);
    }, FADE_MS);
  };

  // La flecha holográfica señala un contenedor SOLO en el paso "haz clic".
  const pointing = track === "click" && step === 0 && visible;
  useEffect(() => {
    gameState.pointAt.current = pointing ? POINT_TARGET : null;
    return () => {
      gameState.pointAt.current = null;
    };
  }, [pointing, gameState]);

  // Camino fácil, paso 1: si en vez de pinchar toca teclas o el mando, pasa al
  // camino manual (saltándose "mover" si lo primero que ha hecho es mover).
  useEffect(() => {
    if (!pointing) return;
    let done = false;
    const toManual = (moved: boolean) => {
      if (done) return;
      done = true;
      goTo.current(moved ? 1 : 0, "manual");
    };
    const onKey = (e: KeyboardEvent) => {
      if (MOVE_KEYS.includes(e.code)) toManual(true);
      else if (ROW_KEYS.includes(e.code) || ACTION_KEYS.has(e.code)) toManual(false);
    };
    const onDown = (e: MouseEvent) => {
      const el = e.target;
      if (!(el instanceof Element) || !el.closest(ANY_REMOTE)) return;
      toManual(el.closest(MOVE_REMOTE) !== null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [pointing]);

  // Pasos de mando del camino manual: "mover" (A/D o las flechas laterales del
  // mando) y "cambiar de fila" (W/S/↑/↓ o las flechas verticales).
  // NO se escucha `mousemove`: el ratón no conduce la grúa.
  useEffect(() => {
    if (trigger !== "move" && trigger !== "row") return;
    let done = false;
    const advance = () => {
      if (done) return;
      done = true;
      goTo.current(stepRef.current + 1);
    };
    const codes = trigger === "row" ? ROW_KEYS : MOVE_KEYS;
    const remote = trigger === "row" ? ROW_REMOTE : MOVE_REMOTE;
    const onKey = (e: KeyboardEvent) => { if (codes.includes(e.code)) advance(); };
    const onDown = (e: MouseEvent) => {
      const el = e.target;
      if (el instanceof Element && el.closest(remote)) advance();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [trigger, step]);

  // Enganchar (los dos caminos): callback de gameState, sin polling.
  useEffect(() => {
    if (trigger !== "pickup") return;
    gameState.onHoldingUpdate.current = (holding) => {
      if (!holding) return;
      gameState.onHoldingUpdate.current = null;
      goTo.current(stepRef.current + 1);
    };
    return () => { gameState.onHoldingUpdate.current = null; };
  }, [trigger, step, gameState]);

  // Soltar: en el camino fácil lleva a la leyenda; en el manual, cierra.
  useEffect(() => {
    if (trigger !== "throw") return;
    gameState.onThrow.current = () => {
      gameState.onThrow.current = null;
      goTo.current(stepRef.current + 1);
    };
    return () => { gameState.onThrow.current = null; };
  }, [trigger, step, gameState]);

  // Leyenda final: se va sola.
  useEffect(() => {
    if (trigger !== "legend") return;
    const id = setTimeout(() => goTo.current(stepRef.current + 1), LEGEND_MS);
    return () => clearTimeout(id);
  }, [trigger]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[max(12vh,104px)] z-30 flex flex-col items-center gap-5">
      {current && (
        <div
          className="flex flex-col items-center"
          style={{
            opacity: fading ? 0 : 1,
            transition: "opacity var(--duration-fast) var(--ease)",
          }}
        >
          <div className={styles.sign} data-testid="tutorial-sign" key={`${track}-${step}`}>
            <div className={styles.keys} aria-hidden>
              {current.keys.map((k, i) => (
                <span key={i} className={`${styles.cap} ${k.accent ? styles.accent : ""}`}>
                  {k.mouse ? <MouseIcon /> : k.label}
                </span>
              ))}
            </div>
            <span aria-hidden className={styles.divider} />
            <span className={styles.action}>{current.action}</span>
          </div>
          <div className={styles.leds} aria-hidden>
            {steps.map((_, i) => (
              <span key={i} className={styles.led} data-on={i <= step} data-current={i === step} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Ratón con el botón izquierdo en lima: "clic". */
function MouseIcon() {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden>
      <rect x="1.2" y="1.2" width="11.6" height="15.6" rx="5.8" stroke="currentColor" strokeWidth="2" />
      <path d="M7 1.5V7.5H1.5" stroke="currentColor" strokeWidth="2" />
      <path d="M2.2 6.6V5.2A3.6 3.6 0 0 1 6.1 2.2V6.6Z" fill="#c8ff00" />
    </svg>
  );
}
