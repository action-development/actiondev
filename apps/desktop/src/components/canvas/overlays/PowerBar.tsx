"use client";

import { useRef, useEffect } from "react";
import type { GameState } from "@/hooks/use-game-state";

interface PowerBarProps {
  gameState: GameState;
}

export function PowerBar({ gameState }: PowerBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef       = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gameState.onPowerUpdate.current = (power, charging) => {
      const container = containerRef.current;
      const bar       = barRef.current;
      if (!container || !bar) return;
      container.style.display = charging ? "flex" : "none";
      bar.style.width = `${power * 100}%`;
      // Stay within brand palette: foreground → accent as power ramps up.
      bar.style.backgroundColor =
        power < 0.4 ? "var(--foreground)" : power < 0.75 ? "var(--accent)" : "var(--accent)";
      bar.style.opacity = power < 0.4 ? "0.7" : "1";
    };
    return () => { gameState.onPowerUpdate.current = null; };
  }, [gameState]);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex-col items-center gap-3 pointer-events-none"
      style={{ display: "none" }}
    >
      <div className="w-48 h-[3px] bg-[var(--hairline-strong)] rounded-full overflow-hidden">
        <div ref={barRef} className="h-full rounded-full transition-[background-color,opacity]" />
      </div>
      <p className="micro-label mt-1 text-foreground/50">Release to throw</p>
    </div>
  );
}
