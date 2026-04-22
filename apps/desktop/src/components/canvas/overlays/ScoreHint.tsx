"use client";

export function ScoreHint() {
  return (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
      <p className="micro-label text-foreground/40">Score to scroll</p>
    </div>
  );
}
