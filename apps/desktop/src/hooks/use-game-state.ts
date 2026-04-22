"use client";

import { useRef, useCallback } from "react";

export type GameState = ReturnType<typeof useGameState>;

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
    onPowerUpdate,
    onHoldingUpdate,
    onThrow,
    reset,
  };
}
