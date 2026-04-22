"use client";

import { useState, useEffect, useRef } from "react";
import type { GameState } from "@/hooks/use-game-state";

type TutorialStep = {
  label: string;
  action: string;
  trigger: "key" | "pickup" | "throw";
  keys?: string[];
};

const TUTORIAL_STEPS: TutorialStep[] = [
  { label: "A / D",       action: "to move",       trigger: "key",    keys: ["KeyA", "KeyD", "ArrowLeft", "ArrowRight"] },
  { label: "W / S",       action: "to rotate",     trigger: "key",    keys: ["KeyW", "KeyS", "ArrowUp",   "ArrowDown"]  },
  { label: "SPACE",       action: "to jump",       trigger: "key",    keys: ["Space"] },
  { label: "E",           action: "to pick up",    trigger: "pickup" },
  { label: "CLICK & DRAG",action: "to aim & throw",trigger: "throw"  },
];

interface TutorialOverlayProps {
  gameState: GameState;
}

export function TutorialOverlay({ gameState }: TutorialOverlayProps) {
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);
  const [fading, setFading]   = useState(false);
  const stepRef = useRef(step);
  stepRef.current = step;

  // Delay tutorial start so cubes have time to fall
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Key-based steps — window listener
  useEffect(() => {
    if (!visible || step >= TUTORIAL_STEPS.length) return;
    const current = TUTORIAL_STEPS[step];
    if (current.trigger !== "key" || !current.keys) return;

    const advance = () => {
      setFading(true);
      setTimeout(() => {
        setFading(false);
        const next = stepRef.current + 1;
        if (next >= TUTORIAL_STEPS.length) setVisible(false);
        else setStep(next);
      }, 400);
    };

    const onKey = (e: KeyboardEvent) => { if (current.keys!.includes(e.code)) advance(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
  }, [step, visible, gameState]);

  if (!visible || step >= TUTORIAL_STEPS.length) return null;

  const current = TUTORIAL_STEPS[step];

  return (
    <div
      className="absolute inset-0 z-30 flex items-start justify-center pt-[30vh] pointer-events-none"
      style={{
        opacity: fading ? 0 : 1,
        transition: "opacity var(--duration-fast) var(--ease)",
      }}
    >
      <div className="flex flex-col items-center gap-4">
        {/*
         * Keycap block: thin hairline border, no heavy text-shadow glow.
         * Trust the typography: mono + accent tiny dot instead of dropshadow clouds.
         */}
        <div className="flex items-center gap-4 rounded-md border border-[var(--hairline-strong)] bg-background/80 px-6 py-3 backdrop-blur-sm">
          <span className="font-mono text-[13px] font-semibold tracking-[0.18em] uppercase text-foreground">
            {current.label}
          </span>
          <span aria-hidden className="h-3 w-px bg-[var(--hairline-strong)]" />
          <span className="micro-label text-foreground/50">{current.action}</span>
        </div>
        {/* Step indicator — 5 ticks aligned to the scroll-indicator vocabulary */}
        <div className="flex items-center gap-1.5">
          {TUTORIAL_STEPS.map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={`h-px transition-all ${
                i <= step
                  ? "w-6 bg-accent"
                  : "w-3 bg-[var(--hairline-strong)]"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
