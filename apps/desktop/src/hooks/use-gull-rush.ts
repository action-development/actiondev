"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { GameState } from "@/hooks/use-game-state";

/**
 * ¿Hay una ronda de caza de gaviotas en curso? Para overlays DOM que deben
 * apartarse mientras dura (tutorial, pistas). Las gaviotas y el bucle de juego
 * leen `gameState.gullRush.current.active` directamente, sin re-renders.
 */
export function useGullRush(gameState: GameState): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => gameState.subscribeRush(onChange),
    [gameState],
  );
  return useSyncExternalStore(
    subscribe,
    () => gameState.gullRush.current.active,
    () => false,
  );
}
