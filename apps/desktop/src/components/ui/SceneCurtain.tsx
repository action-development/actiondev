"use client";

import { useEffect, useState } from "react";
import { Blinds, blindsDuration } from "./Blinds";

/**
 * Escotilla: si `ready` no llega nunca (WebGL caído, chunk que no baja) la
 * escena se quedaría tapada para siempre. Mismo criterio que el `STALL_TIMEOUT`
 * de `LoadingScreen`, más corto porque aquí no hay física ni shaders que
 * precompilar: se abre igual y la escena entrará tarde, pero la página queda
 * utilizable.
 */
const CURTAIN_STUCK_MS = 12_000;

interface SceneCurtainProps {
  /** La escena ya ha pintado su primer frame. */
  ready: boolean;
  /** Rótulo para lectores de pantalla ("Preparando la plaza…"). */
  label: string;
  /** `plaza-curtain` en /resenas, `arcade-curtain` en /projects. */
  testId: string;
}

/**
 * Telón de las escenas 3D a pantalla completa (/resenas, /projects) — la MISMA
 * persiana del resto del sitio (`ui/Blinds`).
 *
 * Al ser la misma pieza no hay costura ni doble barrido visible: la persiana de
 * `PageTransition` se recoge SOBRE esta, idéntica y cerrada, así que el
 * visitante ve una sola cortina que sigue bajada hasta que la escena pinta su
 * primer frame. Va por encima del Header (`z-[60]`), como la de la transición:
 * media cápsula flotando sobre las lamas delataría que hay dos telones.
 *
 * Sin contador ni logo, igual que `LoadingScreen`; el rótulo sigue existiendo
 * para lectores de pantalla.
 */
export function SceneCurtain({ ready, label, testId }: SceneCurtainProps) {
  const [stuck, setStuck] = useState(false);
  const [gone, setGone] = useState(false);
  const open = ready || stuck;

  useEffect(() => {
    const id = window.setTimeout(() => setStuck(true), CURTAIN_STUCK_MS);
    return () => window.clearTimeout(id);
  }, []);

  // Se desmonta tras el barrido: son diez lamas con `will-change: transform`
  // que ya no pintan nada una vez recogidas.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => setGone(true), blindsDuration() + 50);
    return () => window.clearTimeout(id);
  }, [open]);

  if (gone) return null;

  return (
    <div
      data-testid={testId}
      data-state={open ? "opening" : "closed"}
      className="fixed inset-0 z-[60]"
      style={{
        pointerEvents: open ? "none" : "auto",
        // Fondo del sitio DETRÁS de las lamas mientras está bajada: por los
        // huecos de 3px de la persiana se vería la escena sin pintar (de día,
        // casi blanca). Se retira al abrir, para que por esos mismos huecos
        // asome ya la escena mientras se recoge.
        background: open ? undefined : "var(--background)",
      }}
    >
      <Blinds closed={!open} />
      <span className="sr-only" aria-live="polite">
        {label}
      </span>
    </div>
  );
}
