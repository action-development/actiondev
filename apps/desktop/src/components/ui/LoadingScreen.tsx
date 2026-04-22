"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
          onComplete,
        });
      },
    });

    tl.to({}, { duration: 1.5 });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Wordmark on loading — matches header + footer so the brand lands before the site does */}
        <div className="flex items-baseline gap-1 font-mono text-[12px] font-bold uppercase tracking-[0.22em] text-foreground/70">
          <span>Action</span>
          <span aria-hidden className="text-accent">●</span>
        </div>
        <p className="micro-label text-foreground/40">Loading</p>
      </div>
    </div>
  );
}
