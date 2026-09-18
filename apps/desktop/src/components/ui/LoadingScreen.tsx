"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { Blinds, blindsDuration } from "@/components/ui/Blinds";

interface LoadingScreenProps {
  ready: boolean;
  onComplete: () => void;
}

/**
 * LoadingScreen — persiana de acento cerrada + contador; se abre al estar lista.
 *
 * Visual: SOLO las lamas de `Blinds`, sin logo ni contador (decisión del
 * cliente). Cubren la pantalla desde el primer paint (SSR incluido, sin flash)
 * y al llegar a 100 % se recogen de arriba abajo y aparece la escena. El
 * progreso sigue existiendo para lectores de pantalla (`aria-live`) y para la
 * máquina de fases, pero no se pinta.
 * Es la MISMA persiana que `PageTransition` usa entre rutas: una sola pieza
 * visual para "cargar" y "cambiar de pestaña".
 *
 * Pure React state + a single requestAnimationFrame loop.
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
 *   "opening" — blinds retract (CSS transition), then onComplete fires.
 */

const PHASE_1_DURATION = 1000;  // ms — minimum on-screen time
const STALL_DURATION   = 15000; // ms — slow drift while stalled
/**
 * Escotilla de emergencia. Sin esto, si `ready` no llega nunca (fallo de WebGL,
 * chunk de física que no baja, red cortada a mitad) la pantalla de carga se
 * queda clavada en 95 % PARA SIEMPRE y el sitio es inaccesible. Pasado este
 * plazo se continúa igualmente: se verá el canvas entrar tarde, pero la web
 * queda utilizable. Debe ser holgadamente mayor que STALL_DURATION para no
 * dispararse en conexiones lentas que sí van a terminar.
 */
const STALL_TIMEOUT    = 25000; // ms — continuar aunque `ready` no llegue
const SPRINT_DURATION  = 350;   // ms — sprint to 100 once ready
const STALL_PEAK       = 95;    // value reached at end of stall

const easeInOut1 = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeIn2    = (t: number) => t * t;

type Phase = "loading" | "stall" | "sprint" | "opening";

export function LoadingScreen({ ready, onComplete }: LoadingScreenProps) {
  const t = useT();

  const [count, setCount]             = useState(0);
  const [opening, setOpening]         = useState(false);

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

    let openTimer = 0;

    // Avoid setState if the displayed value didn't change → fewer re-renders.
    let lastCount = -1;
    const setCountIfChanged = (v: number) => {
      if (v !== lastCount) { lastCount = v; setCount(v); }
    };

    const tick = (now: number) => {
      if (startTime === null) {
        startTime      = now;
        phaseStartTime = now;
      }
      const elapsed = now - startTime;

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
        const stallElapsed = now - phaseStartTime;
        const stallT = Math.min(stallElapsed / STALL_DURATION, 1);
        const v      = 85 + stallT * (STALL_PEAK - 85);
        setCountIfChanged(Math.round(v));
        if (readyRef.current || stallElapsed >= STALL_TIMEOUT) {
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
          // La persiana se abre con transición CSS (Blinds); el contador y el
          // logo se van en el mismo barrido. Al terminar, onComplete desmonta.
          phase = "opening";
          setOpening(true);
          openTimer = window.setTimeout(() => onCompleteRef.current(), blindsDuration());
          return;
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(openTimer);
    };
  }, []);

  return (
    <div
      data-testid="loading-screen"
      className="fixed inset-0 z-50 flex flex-col"
      style={{ pointerEvents: opening ? "none" : "auto" }}
    >
      <Blinds closed={!opening} />

      {/* Progreso solo para tecnología asistiva: visualmente son solo las franjas */}
      <span className="sr-only" aria-live="polite" aria-label={t.loading.ariaLabel}>
        {count}%
      </span>
    </div>
  );
}
