"use client";

import { useRef, useCallback } from "react";
import type { GullRush } from "@/components/canvas/port/gull-rush";
import type { GullAlert } from "@/components/canvas/port/lighthouse-alert";

export type GameState = ReturnType<typeof useGameState>;

/** Contenedor tal y como lo cuenta la HUD: nombre visible y a dónde lleva. */
export interface CargoInfo {
  id: string;
  label: string;
  /** Ruta real ("/projects") o "#algo" = destino aún sin página. */
  href: string;
}

/**
 * Pista contextual mientras la grúa lleva carga (`overlays/HeroHud.tsx`).
 * - `row`: la carga está fuera de la fila del barco.
 * - `carry`: en la fila buena, pero aún no sobre la bodega.
 * - `release`: encima de la bodega — soltar ahora entra.
 */
export type CraneHint = "row" | "carry" | "release" | null;

/**
 * Central game state for the hero physics playground.
 *
 * Uses refs internally — no React re-renders on every frame.
 * Overlays subscribe via callback refs instead of polling.
 */
export function useGameState() {
  // Cube tracking sets (previously module-level exports split across files)
  const thrownIds = useRef(new Set<string>());
  const gatedIds  = useRef(new Set<string>());

  // UI state (previously uiState module-level object in GameScene)
  const powerRef    = useRef(0);
  const chargingRef = useRef(false);
  const holdingRef  = useRef(false);

  // Subscriber callbacks — overlays register here, game loop calls them
  const onPowerUpdate   = useRef<((power: number, charging: boolean) => void) | null>(null);
  const onHoldingUpdate = useRef<((holding: boolean) => void) | null>(null);
  const onThrow         = useRef<(() => void) | null>(null);
  /** Easter egg: una gaviota abatida. Lo escucha `GullTally`. */
  const onGullKill      = useRef<(() => void) | null>(null);
  /** Ronda de caza en curso (30 s desde la primera baja). La escribe `GullTally`, la leen las aves. */
  const gullRush        = useRef<GullRush>({ active: false });
  /** Oyentes DOM del cambio de `gullRush.active` (ver `use-gull-rush.ts`). */
  const rushListeners   = useRef(new Set<(active: boolean) => void>());

  // --- Easter egg: alerta del faro (ver `port/lighthouse-alert.ts`) ---
  /** Click sobre el faro. Lo escucha `GullTally`, dueño del reloj. */
  const onLighthouse    = useRef<(() => void) | null>(null);
  /** Alerta en curso. La escribe `GullTally`; la leen las aves y el haz del faro. */
  const gullAlert       = useRef<GullAlert>({ active: false, nextDiveAt: 0 });
  const alertListeners  = useRef(new Set<(active: boolean) => void>());
  /**
   * Gaviota estrellada contra la pantalla, en NDC (-1…1). Varios oyentes DOM
   * (grieta y sacudida), así que es un conjunto y no un único callback.
   */
  const screenHitListeners = useRef(new Set<(ndcX: number, ndcY: number) => void>());

  // --- HUD de ayuda (overlays DOM). GameWorld solo llama cuando CAMBIA algo. ---
  /** Contenedor bajo el puntero (o `null`). Lo escucha la etiqueta flotante. */
  const onHover = useRef<((info: CargoInfo | null) => void) | null>(null);
  /**
   * Nodo DOM de la etiqueta flotante: GameWorld le escribe el `transform` cada
   * frame mientras hay hover (proyección del techo del contenedor a pantalla).
   * Por ref y no por estado: seguir a un contenedor que se mueve a 60 fps con
   * `setState` re-renderizaría el overlay 60 veces por segundo.
   */
  const hoverTagEl = useRef<HTMLDivElement | null>(null);
  const onHint = useRef<((hint: CraneHint) => void) | null>(null);
  /** Fila del pórtico (índice de `QUAY_ROWS`). Lo escucha el mando. */
  const onRow = useRef<((row: number) => void) | null>(null);
  /**
   * Contenedor que entra en la bodega. Varios oyentes (aviso "rumbo a", objetivo
   * del tutorial), así que es un conjunto y no un único callback.
   */
  const cargoListeners = useRef(new Set<(info: CargoInfo) => void>());

  const setPower = useCallback((power: number, charging: boolean) => {
    powerRef.current    = power;
    chargingRef.current = charging;
    onPowerUpdate.current?.(power, charging);
  }, []);

  const setHolding = useCallback((holding: boolean) => {
    holdingRef.current = holding;
    onHoldingUpdate.current?.(holding);
  }, []);

  const notifyThrow = useCallback(() => {
    onThrow.current?.();
  }, []);

  const notifyGullKill = useCallback(() => {
    onGullKill.current?.();
  }, []);

  /** Abre/cierra la ronda de caza y avisa a los overlays. Solo notifica si CAMBIA. */
  const setRush = useCallback((active: boolean) => {
    if (gullRush.current.active === active) return;
    gullRush.current.active = active;
    for (const fn of rushListeners.current) fn(active);
  }, []);

  const subscribeRush = useCallback((fn: (active: boolean) => void) => {
    const set = rushListeners.current;
    set.add(fn);
    return () => {
      set.delete(fn);
    };
  }, []);

  const notifyLighthouse = useCallback(() => {
    onLighthouse.current?.();
  }, []);

  /** Abre/cierra la alerta del faro y avisa a los overlays. Solo notifica si CAMBIA. */
  const setAlert = useCallback((active: boolean) => {
    if (gullAlert.current.active === active) return;
    gullAlert.current.active = active;
    // Al abrir, la primera embestida no es inmediata: da tiempo a ver el cielo
    // llenarse. `claimDive` compara contra el reloj de escena, que lo pone la
    // primera gaviota que mire — 0 significa "en cuanto alguien lo reserve".
    if (!active) gullAlert.current.nextDiveAt = 0;
    for (const fn of alertListeners.current) fn(active);
  }, []);

  const subscribeAlert = useCallback((fn: (active: boolean) => void) => {
    const set = alertListeners.current;
    set.add(fn);
    return () => {
      set.delete(fn);
    };
  }, []);

  const notifyScreenHit = useCallback((ndcX: number, ndcY: number) => {
    for (const fn of screenHitListeners.current) fn(ndcX, ndcY);
  }, []);

  const subscribeScreenHit = useCallback((fn: (ndcX: number, ndcY: number) => void) => {
    const set = screenHitListeners.current;
    set.add(fn);
    return () => {
      set.delete(fn);
    };
  }, []);

  const subscribeCargo = useCallback((fn: (info: CargoInfo) => void) => {
    const set = cargoListeners.current;
    set.add(fn);
    return () => {
      set.delete(fn);
    };
  }, []);

  const notifyCargo = useCallback((info: CargoInfo) => {
    for (const fn of cargoListeners.current) fn(info);
  }, []);

  const reset = useCallback(() => {
    thrownIds.current.clear();
    gatedIds.current.clear();
    powerRef.current    = 0;
    chargingRef.current = false;
    holdingRef.current  = false;
  }, []);

  return {
    thrownIds,
    gatedIds,
    powerRef,
    chargingRef,
    holdingRef,
    setPower,
    setHolding,
    notifyThrow,
    notifyGullKill,
    onPowerUpdate,
    onHoldingUpdate,
    onThrow,
    onGullKill,
    gullRush,
    setRush,
    subscribeRush,
    onLighthouse,
    notifyLighthouse,
    gullAlert,
    setAlert,
    subscribeAlert,
    notifyScreenHit,
    subscribeScreenHit,
    onHover,
    hoverTagEl,
    onHint,
    onRow,
    subscribeCargo,
    notifyCargo,
    reset,
  };
}
