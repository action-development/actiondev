"use client";

import { useEffect, useRef } from "react";

/** Keys whose browser default (page scroll) conflicts with gameplay. */
const GAME_KEYS = new Set([
  "Space",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Tracks held key codes in a ref (no re-renders).
 * Clears state on blur / tab hide to prevent keys getting stuck after Alt+Tab.
 * Calls preventDefault on gameplay keys (Space, Arrows) so Space doesn't scroll
 * the page — unless focus is in a form field.
 */
export function useKeyboard() {
  const keys = useRef(new Set<string>());

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if (GAME_KEYS.has(e.code) && !isTypingTarget(e.target)) e.preventDefault();
      keys.current.add(e.code);
    };
    const handleUp = (e: KeyboardEvent) => {
      if (GAME_KEYS.has(e.code) && !isTypingTarget(e.target)) e.preventDefault();
      keys.current.delete(e.code);
    };
    const clear        = () => { keys.current.clear(); };
    const onVisibility = () => { if (document.hidden) clear(); };

    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return keys;
}
