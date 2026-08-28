"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Análisis de audio en vivo para alimentar animaciones.
 *
 * Decisión clave: la energía NO vive en estado de React. Se escribe en un
 * ref que el render loop del canvas lee en cada frame. Meter esto en
 * useState provocaría 60 renders/s de todo el árbol — inaceptable, y más
 * en móvil, que es la prioridad de esta versión.
 *
 * El AudioContext se crea de forma perezosa dentro del gesto del usuario:
 * iOS y Chrome bloquean la reproducción automática, por eso la referencia
 * tiene un botón "PRESS PLAY" y nosotros un "DALE AL PLAY".
 */

export type AudioEnergy = {
  /** 20–250 Hz — el golpe del bombo. 0..1 */
  bass: number;
  /** 250–2000 Hz — cuerpo de la mezcla. 0..1 */
  mid: number;
  /** Media de todo el espectro. 0..1 */
  level: number;
};

const BANDS = { bassHz: 250, midHz: 2000 };
/** Suavizado exponencial: sin esto el blob tiembla en vez de latir. */
const ATTACK = 0.45;
const RELEASE = 0.09;

export function useAudioAnalyser() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const energyRef = useRef<AudioEnergy>({ bass: 0, mid: 0, level: 0 });

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const rafRef = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  const sample = useCallback(() => {
    const analyser = analyserRef.current;
    const data = dataRef.current;
    const ctx = ctxRef.current;
    if (!analyser || !data || !ctx) return;

    analyser.getByteFrequencyData(data);

    const nyquist = ctx.sampleRate / 2;
    const binHz = nyquist / data.length;
    const bassEnd = Math.max(1, Math.floor(BANDS.bassHz / binHz));
    const midEnd = Math.max(bassEnd + 1, Math.floor(BANDS.midHz / binHz));

    let bass = 0;
    let mid = 0;
    let total = 0;
    for (let i = 0; i < data.length; i += 1) {
      const v = data[i] / 255;
      total += v;
      if (i < bassEnd) bass += v;
      else if (i < midEnd) mid += v;
    }

    const next = {
      bass: bass / bassEnd,
      mid: mid / (midEnd - bassEnd),
      level: total / data.length,
    };

    // Sube rápido (pega el golpe), baja lento (deja la cola).
    const prev = energyRef.current;
    const smooth = (p: number, n: number) => p + (n - p) * (n > p ? ATTACK : RELEASE);
    energyRef.current = {
      bass: smooth(prev.bass, next.bass),
      mid: smooth(prev.mid, next.mid),
      level: smooth(prev.level, next.level),
    };

    rafRef.current = requestAnimationFrame(sample);
  }, []);

  const connect = useCallback(() => {
    if (ctxRef.current || !audioRef.current) return;

    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const source = ctx.createMediaElementSource(audioRef.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256; // 128 bins — de sobra para 3 bandas y barato en móvil
    analyser.smoothingTimeConstant = 0.72;

    source.connect(analyser);
    analyser.connect(ctx.destination);

    ctxRef.current = ctx;
    analyserRef.current = analyser;
    dataRef.current = new Uint8Array(analyser.frequencyBinCount);
    setReady(true);
  }, []);

  const toggle = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;

    connect();
    await ctxRef.current?.resume();

    if (el.paused) {
      try {
        await el.play();
        setPlaying(true);
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(sample);
      } catch {
        setPlaying(false);
      }
    } else {
      el.pause();
      setPlaying(false);
      cancelAnimationFrame(rafRef.current);
    }
  }, [connect, sample]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      void ctxRef.current?.close();
    };
  }, []);

  return { audioRef, energyRef, playing, ready, toggle };
}
