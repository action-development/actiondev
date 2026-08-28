"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Inclinación del dispositivo normalizada a −1..1 en cada eje.
 *
 * ── El permiso de iOS ──────────────────────────────────────────────
 * Desde iOS 13, Safari exige `DeviceOrientationEvent.requestPermission()`
 * y SOLO lo concede si la llamada nace de un gesto del usuario. Sin
 * ese permiso no se dispara ni un evento: no hay error, simplemente
 * silencio. Por eso `request()` debe invocarse dentro de un handler de
 * toque, nunca en el montaje. Android y iOS antiguos no lo piden.
 *
 * ── Por qué se calibra ─────────────────────────────────────────────
 * `beta` vale 0 con el móvil plano sobre la mesa y ~90 en vertical.
 * Nadie mira el móvil a 0°, así que la primera lectura se toma como
 * centro neutro y a partir de ahí se miden desviaciones. Sin calibrar,
 * el efecto arrancaría siempre pegado a un extremo.
 *
 * ── Por qué un ref y no estado ─────────────────────────────────────
 * Esto se lee dentro de un rAF. En estado de React serían decenas de
 * renders por segundo de todo el árbol.
 */

export type Tilt = { x: number; y: number };
export type PermissionState = "idle" | "granted" | "denied" | "unsupported";

/**
 * Grados de inclinación que equivalen al recorrido COMPLETO del eje.
 * Cuanto menor, más descarado: con 9° basta un gesto de muñeca para
 * llevar la forma de un extremo al otro. Antes estaba en 22° y el
 * efecto no se apreciaba.
 */
const RANGE_DEG = 9;
/**
 * Suavizado exponencial. Se sube de 0.12 a 0.3: menos filtrado, más
 * respuesta inmediata. Por debajo de ~0.2 el movimiento se sentía
 * despegado del móvil.
 */
const SMOOTH = 0.3;

type PermissionCtor = { requestPermission?: () => Promise<"granted" | "denied"> };

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export function useDeviceTilt() {
  const tiltRef = useRef<Tilt>({ x: 0, y: 0 });
  const originRef = useRef<{ beta: number; gamma: number } | null>(null);
  const [state, setState] = useState<PermissionState>("idle");

  /**
   * IDENTIDAD ESTABLE (deps vacías) — no es un detalle de estilo.
   *
   * Antes dependía de un estado `active` que se actualizaba aquí
   * dentro. Al primer evento el estado cambiaba, `handle` se recreaba,
   * y el efecto de limpieza —que dependía de `handle`— retiraba el
   * listener. Resultado: pasaba UN solo evento (el de calibración) y
   * la inclinación se quedaba congelada en 0 para siempre.
   *
   * Sin dependencias, el listener registrado sigue siendo válido toda
   * la vida del componente. Los refs son estables, así que no hace
   * falta nada más.
   */
  const handle = useCallback((event: DeviceOrientationEvent) => {
    const { beta, gamma } = event;
    if (beta === null || gamma === null) return;

    // Primera lectura = punto neutro.
    if (!originRef.current) originRef.current = { beta, gamma };

    const target = {
      x: clamp((gamma - originRef.current.gamma) / RANGE_DEG, -1, 1),
      y: clamp((beta - originRef.current.beta) / RANGE_DEG, -1, 1),
    };

    const prev = tiltRef.current;
    tiltRef.current = {
      x: prev.x + (target.x - prev.x) * SMOOTH,
      y: prev.y + (target.y - prev.y) * SMOOTH,
    };
  }, []);

  /**
   * Debe llamarse DENTRO de un gesto del usuario.
   *
   * CRÍTICO: las dos llamadas a `requestPermission()` se lanzan de
   * forma SÍNCRONA y solo después se esperan juntas. iOS solo concede
   * el permiso si la llamada ocurre dentro del gesto; poner un `await`
   * entre ambas deja la segunda fuera de contexto y Safari la deniega
   * sin mostrar diálogo — que es exactamente lo que pasaba.
   */
  const request = useCallback(async (): Promise<PermissionState> => {
    if (typeof window === "undefined") return "unsupported";

    const gates = [
      (window as unknown as { DeviceMotionEvent?: PermissionCtor }).DeviceMotionEvent,
      (window as unknown as { DeviceOrientationEvent?: PermissionCtor }).DeviceOrientationEvent,
    ].filter((g): g is Required<PermissionCtor> => typeof g?.requestPermission === "function");

    let result: PermissionState = "granted";

    if (gates.length) {
      // Disparar TODAS antes de esperar ninguna.
      const pending = gates.map((g) => {
        try {
          return g.requestPermission();
        } catch {
          return Promise.resolve<"denied">("denied");
        }
      });
      const settled = await Promise.allSettled(pending);
      const anyGranted = settled.some(
        (r) => r.status === "fulfilled" && r.value === "granted",
      );
      result = anyGranted ? "granted" : "denied";
    } else if (!("DeviceOrientationEvent" in window)) {
      result = "unsupported";
    }

    if (result === "granted") window.addEventListener("deviceorientation", handle);
    setState(result);
    return result;
  }, [handle]);

  // Solo al desmontar. NO añadir `handle` a las dependencias: recrearía
  // el efecto y retiraría el listener en marcha (ver arriba).
  useEffect(() => {
    return () => window.removeEventListener("deviceorientation", handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Recalibra el centro a la postura actual. */
  const recenter = useCallback(() => {
    originRef.current = null;
  }, []);

  return { tiltRef, request, recenter, state };
}
