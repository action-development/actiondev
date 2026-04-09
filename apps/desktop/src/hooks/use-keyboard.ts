"use client";

import { useEffect, useRef } from "react";

/**
 * useKeyboard — Tracks which keys are currently held down.
 *
 * Returns a stable ref to a Set<string> of active key codes.
 * Using a ref (not state) avoids re-renders on every keypress —
 * the physics loop reads from the ref directly in useFrame.
 *
 * Key codes tracked: ArrowLeft, ArrowRight, ArrowUp, KeyA, KeyD,
 * KeyW, Space, KeyE (pickup/throw).
 */

export function useKeyboard() {
  const keys = useRef(new Set<string>());

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      keys.current.add(e.code);
    };
    const handleUp = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
    };

    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);

    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
    };
  }, []);

  return keys;
}
