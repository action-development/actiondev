"use client";

import { useRef, useEffect, type MutableRefObject } from "react";

/**
 * Track left mouse button state via window events. Returns stable ref — no re-renders.
 * Clears state on blur / tab hide / right-click menu so aim doesn't stay locked on.
 */
export function useMouseButton(): MutableRefObject<boolean> {
  const down = useRef(false);
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (e.button === 0) down.current = true; };
    const onUp   = (e: MouseEvent) => { if (e.button === 0) down.current = false; };
    const clear  = () => { down.current = false; };
    const onVisibility = () => { if (document.hidden) clear(); };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("blur",      clear);
    window.addEventListener("contextmenu", clear);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("blur",      clear);
      window.removeEventListener("contextmenu", clear);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return down;
}
