"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { AudioEnergy } from "@/hooks/use-audio-analyser";

/**
 * Blob orgánico procedural sobre canvas 2D, reactivo al audio.
 *
 * ── Forma ──────────────────────────────────────────────────────────
 * Superelipse deformada por una suma de armónicos senoidales:
 *
 *   sq(θ)  = 1 / max(|cos θ|, |sin θ|)       → mezcla círculo ↔ cuadrado
 *   n(θ,t) = Σ aᵢ · sin(kᵢ·θ + ωᵢ·t + φᵢ)    → ondulación orgánica
 *   r(θ,t) = R · (1 + n) · (1 + (sq − 1)·b)
 *
 * Los armónicos altos (k=7,11) son los que facetan la silueta; sin
 * ellos el contorno queda demasiado limpio y se lee como una gota.
 *
 * ── Por qué las velocidades son números feos ───────────────────────
 * Los ωᵢ están elegidos en proporciones NO armónicas (0.23, 0.31,
 * 0.41, 0.57…). Con velocidades múltiplos entre sí la figura vuelve a
 * su estado inicial cada pocos segundos y el bucle canta. Así el
 * periodo combinado es larguísimo y el movimiento no se repite a la
 * vista.
 *
 * ── Por qué hay un canvas fuera de pantalla ────────────────────────
 * Las capas de "vidrio" se pintan a media resolución y se suben
 * escaladas al canvas principal. El reescalado del navegador ya las
 * difumina y las funde entre sí: antes, con tres contornos nítidos,
 * el resultado se leía como anillos concéntricos, no como volumen.
 * Es además mucho más barato que aplicar ctx.filter a resolución
 * completa en cada frame — que es lo que importa en móvil.
 */

type Harmonic = { k: number; amp: number; speed: number; phase: number };

const SEGMENTS = 148;
const MAX_DPR = 1.5;
/** Las capas de vidrio se renderizan a esta fracción de resolución. */
const GLASS_SCALE = 0.5;
const SILENT: AudioEnergy = { bass: 0, mid: 0, level: 0 };

const SHELL: Harmonic[] = [
  { k: 2, amp: 0.042, speed: 0.23, phase: 0 },
  { k: 3, amp: 0.055, speed: -0.31, phase: 1.7 },
  { k: 5, amp: 0.028, speed: 0.41, phase: 3.1 },
  { k: 7, amp: 0.016, speed: -0.57, phase: 0.6 },
];

const CORE: Harmonic[] = [
  { k: 3, amp: 0.062, speed: 0.37, phase: 2.2 },
  { k: 4, amp: 0.034, speed: -0.29, phase: 0.9 },
  { k: 6, amp: 0.026, speed: 0.53, phase: 4.4 },
  { k: 11, amp: 0.012, speed: -0.71, phase: 1.3 },
];

function blobPath(
  radius: number,
  harmonics: Harmonic[],
  time: number,
  squareness: number,
  gain: number,
): Path2D {
  const path = new Path2D();

  for (let i = 0; i <= SEGMENTS; i += 1) {
    const theta = (i / SEGMENTS) * Math.PI * 2;

    let wave = 0;
    for (const h of harmonics) {
      wave += Math.sin(h.k * theta + h.speed * time + h.phase) * h.amp * gain;
    }

    const squircle = 1 / Math.max(Math.abs(Math.cos(theta)), Math.abs(Math.sin(theta)), 0.01);
    const r = radius * (1 + wave) * (1 + (squircle - 1) * squareness);

    const x = Math.cos(theta) * r;
    const y = Math.sin(theta) * r;
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }

  path.closePath();
  return path;
}

export function MorphBlob({
  className,
  energyRef,
}: {
  className?: string;
  /** Ref vivo del analizador. Se lee por frame — nunca por estado de React. */
  energyRef?: RefObject<AudioEnergy>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const glass = document.createElement("canvas");
    const gctx = glass.getContext("2d");
    if (!gctx) return;

    let frame = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = Math.max(rect.width, 1);
      height = Math.max(rect.height, 1);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      glass.width = Math.max(Math.floor(width * GLASS_SCALE), 1);
      glass.height = Math.max(Math.floor(height * GLASS_SCALE), 1);
    };

    const draw = (time: number) => {
      const { bass, mid, level } = energyRef?.current ?? SILENT;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const base = Math.min(width, height) * 0.32 * (1 + bass * 0.14);
      const gain = 1 + mid * 1.4;

      // Deriva lenta del centro: sin esto la masa parece clavada al eje.
      const driftX = Math.sin(time * 0.19) * base * 0.045;
      const driftY = Math.cos(time * 0.13) * base * 0.04;

      // ── Capas de vidrio, a media resolución ───────────────────────
      gctx.setTransform(1, 0, 0, 1, 0, 0);
      gctx.clearRect(0, 0, glass.width, glass.height);
      gctx.save();
      gctx.scale(GLASS_SCALE, GLASS_SCALE);
      gctx.translate(cx + driftX, cy + driftY);
      gctx.filter = `blur(${Math.max(base * 0.05, 2)}px)`;

      const shells: Array<[number, number, number]> = [
        // [radio, opacidad, desfase temporal]
        [base * 1.44, 0.16, 0],
        [base * 1.26, 0.15, 2.4],
        [base * 1.1, 0.14, 5.1],
      ];
      for (const [radius, alpha, offset] of shells) {
        gctx.save();
        gctx.rotate(Math.sin(time * 0.07 + offset) * 0.09);
        gctx.fillStyle = `rgba(150, 146, 140, ${alpha})`;
        gctx.fill(blobPath(radius, SHELL, time + offset, 0.32, gain * 0.85));
        gctx.restore();
      }
      gctx.restore();

      // Subida escalada: el propio remuestreo funde las capas.
      ctx.drawImage(glass, 0, 0, width, height);

      // ── Núcleo, a resolución completa ─────────────────────────────
      ctx.save();
      ctx.translate(cx + driftX, cy + driftY);
      ctx.rotate(Math.sin(time * 0.11 + 1.2) * -0.07);

      const core = blobPath(base, CORE, time, 0.22, gain);
      const grad = ctx.createLinearGradient(-base, -base * 1.2, base * 0.8, base);
      grad.addColorStop(0, "rgba(150, 214, 238, 0.95)");
      grad.addColorStop(0.45, "rgba(104, 184, 216, 0.94)");
      grad.addColorStop(1, "rgba(58, 138, 176, 0.95)");
      ctx.fillStyle = grad;
      ctx.fill(core);

      // Variación tonal interna: manchas MUY desenfocadas de naranja
      // claro. Dan volumen sin leerse como partículas sueltas.
      ctx.clip(core);
      ctx.filter = `blur(${base * 0.28}px)`;
      for (let i = 0; i < 3; i += 1) {
        const a = time * (0.13 + i * 0.047) + i * 2.4;
        ctx.fillStyle = `rgba(198, 236, 250, ${0.16 + level * 0.14})`;
        ctx.beginPath();
        ctx.ellipse(
          Math.cos(a) * base * 0.34,
          Math.sin(a * 1.31) * base * 0.3,
          base * 0.5,
          base * 0.3,
          a * 0.4,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.filter = "none";
      ctx.restore();

      // ── Aro guía ──────────────────────────────────────────────────
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = "rgba(120, 116, 110, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke(blobPath(Math.min(width, height) * 0.47, SHELL, time * 0.3, 0.12, 0.3));
      ctx.restore();
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const start = performance.now();
    const loop = (now: number) => {
      draw((now - start) / 1000);
      frame = window.requestAnimationFrame(loop);
    };

    const run = () => {
      window.cancelAnimationFrame(frame);
      resize();
      if (reduced.matches) draw(0);
      else frame = window.requestAnimationFrame(loop);
    };

    run();

    const observer = new ResizeObserver(() => {
      resize();
      if (reduced.matches) draw(0);
    });
    observer.observe(wrap);
    reduced.addEventListener("change", run);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      reduced.removeEventListener("change", run);
    };
  }, [energyRef]);

  return (
    <div ref={wrapRef} className={className} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
