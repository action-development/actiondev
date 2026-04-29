"use client";

import { useT } from "@/lib/i18n";

export function ScoreHint() {
  const t = useT();

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex flex-col items-center gap-2">
      <p className="micro-label text-foreground/55 tracking-[0.2em]">{t.game.scoreHint}</p>
      {/* Animated chevron — bounces to draw attention */}
      <svg
        aria-hidden
        width="12"
        height="8"
        viewBox="0 0 12 8"
        fill="none"
        className="text-accent/60 animate-bounce"
        style={{ animationDuration: "1.6s" }}
      >
        <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
