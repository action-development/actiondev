"use client";

import { useState, useEffect, useRef } from "react";
import type { GameState } from "@/hooks/use-game-state";
import { useT } from "@/lib/i18n";
import styles from "./TutorialOverlay.module.css";

type TutorialStep = {
  /** Teclas dibujadas como tapas físicas (mismo lenguaje que el mando RC). */
  keys: { label: string; accent?: boolean }[];
  action: string;
  trigger: "move" | "pickup" | "throw";
};

const MOVE_KEYS = ["KeyA", "KeyD", "ArrowLeft", "ArrowRight"];

interface TutorialOverlayProps {
  gameState: GameState;
}

export function TutorialOverlay({ gameState }: TutorialOverlayProps) {
  const t = useT();
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);
  const [fading, setFading]   = useState(false);
  const stepRef = useRef(step);
  stepRef.current = step;

  // Steps derived from translations so they react to locale changes
  // Las tapas replican los botones del mando: flechas olive, gancho lima.
  const TUTORIAL_STEPS: TutorialStep[] = [
    { keys: [{ label: "◀" }, { label: "▶" }],          action: t.tutorial.move,   trigger: "move"   },
    { keys: [{ label: t.game.remote.lower, accent: true }], action: t.tutorial.pickup, trigger: "pickup" },
    { keys: [{ label: t.game.remote.lower, accent: true }], action: t.tutorial.throw,  trigger: "throw"  },
  ];

  // Delay tutorial start so containers have time to land on the quay
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Paso "mover": teclas A/D o un click (que lanza la maniobra automática).
  // NO se escucha `mousemove`: el ratón ya no conduce la grúa.
  useEffect(() => {
    if (!visible || step >= TUTORIAL_STEPS.length) return;
    if (TUTORIAL_STEPS[step].trigger !== "move") return;

    let done = false;
    const advance = () => {
      if (done) return;
      done = true;
      setFading(true);
      setTimeout(() => {
        setFading(false);
        const next = stepRef.current + 1;
        if (next >= TUTORIAL_STEPS.length) setVisible(false);
        else setStep(next);
      }, 400);
    };

    const onKey = (e: KeyboardEvent) => { if (MOVE_KEYS.includes(e.code)) advance(); };
    const onDown = (e: MouseEvent) => { if (e.button === 0) advance(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, visible]);

  // Pickup step — subscribe to gameState callback (no polling)
  useEffect(() => {
    if (!visible || step >= TUTORIAL_STEPS.length) return;
    if (TUTORIAL_STEPS[step].trigger !== "pickup") return;

    gameState.onHoldingUpdate.current = (holding) => {
      if (!holding) return;
      setFading(true);
      setTimeout(() => {
        setFading(false);
        const next = stepRef.current + 1;
        if (next >= TUTORIAL_STEPS.length) setVisible(false);
        else setStep(next);
        gameState.onHoldingUpdate.current = null;
      }, 400);
    };
    return () => { gameState.onHoldingUpdate.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, visible, gameState]);

  // Throw step — subscribe to gameState callback (no polling)
  useEffect(() => {
    if (!visible || step >= TUTORIAL_STEPS.length) return;
    if (TUTORIAL_STEPS[step].trigger !== "throw") return;

    gameState.onThrow.current = () => {
      setFading(true);
      setTimeout(() => {
        setFading(false);
        setVisible(false);
        gameState.onThrow.current = null;
      }, 400);
    };
    return () => { gameState.onThrow.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, visible, gameState]);

  if (!visible || step >= TUTORIAL_STEPS.length) return null;

  const current = TUTORIAL_STEPS[step];

  return (
    <div
      className="absolute inset-0 z-30 flex items-start justify-center pt-[16vh] pointer-events-none"
      style={{
        opacity: fading ? 0 : 1,
        transition: "opacity var(--duration-fast) var(--ease)",
      }}
    >
      <div className="flex flex-col items-center">
        <div className={styles.sign} data-testid="tutorial-sign">
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
          {TUTORIAL_STEPS.map((_, i) => (
            <span key={i} className={styles.led} data-on={i <= step} data-current={i === step} />
          ))}
        </div>
      </div>
    </div>
  );
}
