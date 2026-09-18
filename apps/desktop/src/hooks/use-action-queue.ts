"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

/** Teclas que disparan la acción principal del juego (bajar / soltar). */
export const ACTION_KEYS: ReadonlySet<string> = new Set(["Space", "KeyE", "KeyS", "ArrowDown"]);

/**
 * Cola de pulsaciones para el bucle de juego: devuelve un contador que el
 * `useFrame` consume (lee y pone a 0).
 *
 * POR QUÉ NO SE LEE EL ESTADO DEL BOTÓN: un click rápido o un toque de trackpad
 * mete `mousedown` y `mouseup` entre dos frames. Comparando "¿está pulsado
 * ahora?" frame a frame, esa pulsación no existe. Contando eventos, no se pierde.
 *
 * Solo cuenta clicks sobre `target` (el canvas): pinchar en el menú o en el
 * selector de idioma no debe mover la grúa. `e.repeat` se ignora para que
 * mantener Espacio no dispare en ráfaga.
 *
 * `intercept` (opcional) ve cada click ANTES de encolarlo: si devuelve `true`
 * el click se lo queda él y no cuenta como acción (así un disparo a una
 * gaviota no baja además el gancho). Va por ref para no re-suscribir.
 */
export function useActionQueue(
  target: HTMLElement | null,
  intercept?: MutableRefObject<((e: MouseEvent) => boolean) | null>,
): MutableRefObject<number> {
  const pending = useRef(0);

  useEffect(() => {
    if (!target) return;
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (intercept?.current?.(e)) return;
      pending.current++;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || !ACTION_KEYS.has(e.code)) return;
      const el = e.target;
      if (el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      pending.current++;
    };
    target.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      target.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [target, intercept]);

  return pending;
}
