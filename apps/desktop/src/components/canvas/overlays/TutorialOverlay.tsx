"use client";

import { useState, useEffect, useRef } from "react";
import type { GameState } from "@/hooks/use-game-state";
import { useT } from "@/lib/i18n";
import { useGullRush } from "@/hooks/use-gull-rush";
import styles from "./TutorialOverlay.module.css";

/**
 * Los controles primero: mover → fila → enganchar → soltar. NO se enseña el
 * clic en un contenedor: dispara la maniobra automática, que lo engancha, lo
 * lleva al barco y navega a otra página sin dejar acabar el tutorial. Ese
 * atajo lo explican las balizas y la etiqueta "Clic para viajar" del HUD.
 */
type Trigger = "pickup" | "move" | "row" | "throw";

type TutorialStep = {
  /** Teclas dibujadas como tapas físicas (mismo lenguaje que el mando RC). */
  keys: { label: string; accent?: boolean }[];
  action: string;
  trigger: Trigger;
};

const MOVE_KEYS = ["KeyA", "KeyD", "ArrowLeft", "ArrowRight"];
/** Eje de profundidad: alejar / acercar el pórtico (ver `quay-rows.ts`). */
const ROW_KEYS = ["KeyW", "KeyS", "ArrowUp", "ArrowDown"];
/** Botones del mando que cuentan como "ha cambiado de fila". */
const ROW_REMOTE = '[data-testid="remote-up"],[data-testid="remote-down"]';
const MOVE_REMOTE = '[data-testid="remote-left"],[data-testid="remote-right"]';
const FADE_MS = 400;

interface TutorialOverlayProps {
  gameState: GameState;
}

export function TutorialOverlay({ gameState }: TutorialOverlayProps) {
  const t = useT();
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);
  const [fading, setFading]   = useState(false);
  // Ronda de caza: el cartel se funde y el tutorial se PAUSA (sin avanzar de
  // paso, sin flecha ni escuchas) hasta que acaba; entonces vuelve donde estaba.
  const hunting = useGullRush(gameState);
  const stepRef = useRef(step);
  stepRef.current = step;

  const lower = { label: t.game.remote.lower, accent: true };
  // Steps derived from translations so they react to locale changes.
  // Las tapas replican los botones del mando: flechas olive, gancho lima.
  const steps: TutorialStep[] = [
    { keys: [{ label: "◀" }, { label: "▶" }], action: t.tutorial.move, trigger: "move" },
    { keys: [{ label: "▲" }, { label: "▼" }], action: t.tutorial.row, trigger: "row" },
    { keys: [lower], action: t.tutorial.pickup, trigger: "pickup" },
    { keys: [lower], action: t.tutorial.throw, trigger: "throw" },
  ];
  const current = visible ? steps[step] : undefined;
  const trigger = hunting ? undefined : current?.trigger;

  // Delay tutorial start so containers have time to land on the quay
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  /** Funde el cartel y pasa al paso `next` (o lo cierra si era el último). */
  const goTo = useRef<(next: number) => void>(() => {});
  goTo.current = (next: number) => {
    setFading(true);
    setTimeout(() => {
      setFading(false);
      if (next >= steps.length) {
        setVisible(false);
        return;
      }
      setStep(next);
    }, FADE_MS);
  };

  // Pasos de mando: "mover" (A/D o las flechas laterales del
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

  // Enganchar: callback de gameState, sin polling.
  useEffect(() => {
    if (trigger !== "pickup") return;
    gameState.onHoldingUpdate.current = (holding) => {
      if (!holding) return;
      gameState.onHoldingUpdate.current = null;
      goTo.current(stepRef.current + 1);
    };
    return () => { gameState.onHoldingUpdate.current = null; };
  }, [trigger, step, gameState]);

  // Soltar: último paso, cierra el tutorial.
  useEffect(() => {
    if (trigger !== "throw") return;
    gameState.onThrow.current = () => {
      gameState.onThrow.current = null;
      goTo.current(stepRef.current + 1);
    };
    return () => { gameState.onThrow.current = null; };
  }, [trigger, step, gameState]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[max(12vh,104px)] z-30 flex flex-col items-center gap-5">
      {current && (
        <div
          className="flex flex-col items-center"
          style={{
            opacity: fading || hunting ? 0 : 1,
            transition: "opacity var(--duration-fast) var(--ease)",
          }}
        >
          <div className={styles.sign} data-testid="tutorial-sign" key={step}>
            <div className={styles.keys} aria-hidden>
              {current.keys.map((k, i) => (
                <span key={i} className={`${styles.cap} ${k.accent ? styles.accent : ""}`}>
                  {k.label}
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
