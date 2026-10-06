/**
 * `prefers-reduced-motion` de la plaza. SSR-safe: en servidor (sin `window`) o
 * sin `matchMedia` devuelve `false`.
 *
 * Mismo criterio que `street/StreetWorld.tsx`: junto a `?quieto` decide si una
 * pieza de la escena puede animarse. Se evalúa una vez por montaje.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
