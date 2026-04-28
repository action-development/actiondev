"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useT } from "@/lib/i18n";

interface LoadingScreenProps {
  ready: boolean;
  onComplete: () => void;
}

/**
 * LoadingScreen — pure React state + a single requestAnimationFrame loop.
 *
 * Why no GSAP here:
 *   GSAP fights React reconciliation when DOM properties are touched from both
 *   sides. Several earlier attempts to mix them produced subtle bugs (number
 *   stuck at 0, bar reset on every parent re-render, etc.). React state is the
 *   cleanest and most reliable source of truth for values React renders.
 *
 *   GSAP is still used elsewhere in the app — it's the right tool when React
 *   doesn't render the value (e.g. the Three.js Canvas). For DOM nodes that
 *   React renders, React state wins.
 *
 * Phase machine driven from the rAF loop:
 *   "loading" — count 0 → 85 over 1 s (guaranteed minimum on-screen time).
 *   "stall"   — count 85 → 95 very slowly while waiting for ready.
 *   "sprint"  — when ready becomes true, count → 100 quickly.
 *   "fading"  — opacity 1 → 0, then onComplete fires.
 */

const LOGO_DURATION    = 550;   // ms — logo fade-in/translate
const PHASE_1_DURATION = 1000;  // ms — minimum on-screen time
const STALL_DURATION   = 15000; // ms — slow drift while stalled
const SPRINT_DURATION  = 350;   // ms — sprint to 100 once ready
const FADE_DURATION    = 500;   // ms — final container fade-out
const STALL_PEAK       = 95;    // value reached at end of stall

const easeInOut1 = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeIn2    = (t: number) => t * t;
const easeOut2   = (t: number) => 1 - Math.pow(1 - t, 2);
const easeOut3   = (t: number) => 1 - Math.pow(1 - t, 3);

type Phase = "loading" | "stall" | "sprint" | "fading" | "done";

export function LoadingScreen({ ready, onComplete }: LoadingScreenProps) {
  const t = useT();

  const [count, setCount]             = useState(0);
  const [opacity, setOpacity]         = useState(1);
  const [logoOpacity, setLogoOpacity] = useState(0);
  const [logoY, setLogoY]             = useState(16);

  // Mirror props into refs so the rAF loop closure always reads the current value
  // without having to re-create the loop when ready or onComplete change.
  const readyRef      = useRef(ready);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { readyRef.current      = ready;      }, [ready]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Single animation loop — runs once on mount.
  useEffect(() => {
    let raf = 0;
    let phase: Phase = "loading";
    let startTime: number | null = null;
    let phaseStartTime = 0;
    let sprintFromVal = 0;

    // Avoid setState if the displayed value didn't change → fewer re-renders.
    let lastCount = -1;
    let lastOpacity = 1;
    const setCountIfChanged = (v: number) => {
      if (v !== lastCount) { lastCount = v; setCount(v); }
    };
    const setOpacityIfChanged = (v: number) => {
      if (Math.abs(v - lastOpacity) > 0.01) { lastOpacity = v; setOpacity(v); }
    };

    const tick = (now: number) => {
      if (startTime === null) {
        startTime      = now;
        phaseStartTime = now;
      }
      const elapsed = now - startTime;

      // Logo entrance — independent of counter phase
      const logoT = Math.min(elapsed / LOGO_DURATION, 1);
      const lE    = easeOut3(logoT);
      setLogoOpacity(lE);
      setLogoY(16 * (1 - lE));

      if (phase === "loading") {
        const t = Math.min(elapsed / PHASE_1_DURATION, 1);
        setCountIfChanged(Math.round(easeInOut1(t) * 85));
        if (t >= 1) {
          if (readyRef.current) {
            phase           = "sprint";
            phaseStartTime  = now;
            sprintFromVal   = 85;
          } else {
            phase           = "stall";
            phaseStartTime  = now;
          }
        }
      } else if (phase === "stall") {
        const stallT = Math.min((now - phaseStartTime) / STALL_DURATION, 1);
        const v      = 85 + stallT * (STALL_PEAK - 85);
        setCountIfChanged(Math.round(v));
        if (readyRef.current) {
          phase          = "sprint";
          phaseStartTime = now;
          sprintFromVal  = v;
        }
      } else if (phase === "sprint") {
        const t = Math.min((now - phaseStartTime) / SPRINT_DURATION, 1);
        setCountIfChanged(
          Math.round(sprintFromVal + (100 - sprintFromVal) * easeIn2(t))
        );
        if (t >= 1) {
          phase          = "fading";
          phaseStartTime = now;
        }
      } else if (phase === "fading") {
        const t = Math.min((now - phaseStartTime) / FADE_DURATION, 1);
        setOpacityIfChanged(1 - easeOut2(t));
        if (t >= 1) {
          phase = "done";
          onCompleteRef.current();
          return;
        }
      }

      if (phase !== "done") raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      style={{ opacity }}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-16 px-8">

        {/* Logo */}
        <div style={{ opacity: logoOpacity, transform: `translateY(${logoY}px)` }}>
          <Image
            src="/logos/logo.webp"
            alt="Action"
            width={1563}
            height={625}
            priority
            className="w-40 h-auto md:w-52"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </div>

        {/* Counter + bar */}
        <div className="flex flex-col items-center gap-5 select-none">
          <div
            className="font-mono font-bold tabular-nums text-foreground leading-none"
            style={{ fontSize: "clamp(72px, 10vw, 120px)" }}
            aria-live="polite"
            aria-label={t.loading.ariaLabel}
          >
            <span>{count}</span>
            <span
              className="text-accent"
              style={{ fontSize: "0.4em", marginLeft: "0.06em" }}
              aria-hidden
            >
              %
            </span>
          </div>

          <div className="w-40 md:w-52 h-px bg-foreground/10 overflow-hidden">
            <div
              className="h-full bg-accent origin-left"
              style={{ transform: `scaleX(${count / 100})` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
