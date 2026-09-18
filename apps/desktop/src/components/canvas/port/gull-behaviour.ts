import { BOOM_Y } from "./Crane";
import { QUAY_TOP_Y } from "./crane-logic";

/**
 * Comportamiento de las gaviotas: se posan en la grúa y en los contenedores, y
 * levantan el vuelo cuando algo se les acerca (el carro, el spreader, un
 * contenedor que cae o el propio cursor).
 *
 * Lógica pura y testeable; el render vive en `Seagulls.tsx`.
 */

export interface Perch {
  /** Posición del ave posada. */
  pos: [number, number, number];
  /** Mirando a +x (1) o a -x (-1). */
  facing: 1 | -1;
}

/** Sitios donde una gaviota se posa: pluma, travesaño del pórtico, pilas de contenedores y bolardo. */
export const PERCHES: Perch[] = [
  { pos: [17.2, BOOM_Y + 0.68, -0.3], facing: -1 },
  { pos: [6.4, BOOM_Y + 0.68, -0.3], facing: -1 },
  { pos: [-8.2, BOOM_Y + 0.68, -0.3], facing: 1 },
  { pos: [-13.6, 1.35, -2], facing: 1 },
  // Encima de las pilas de atrezo: dos alturas (3,05) y una (1,5).
  { pos: [-21.6, QUAY_TOP_Y + 3.05, -3.4], facing: 1 },
  { pos: [-14.4, QUAY_TOP_Y + 3.05, -3.4], facing: -1 },
  { pos: [-6.1, QUAY_TOP_Y + 3.05, -3.4], facing: 1 },
  { pos: [-2.8, QUAY_TOP_Y + 1.5, -3.4], facing: -1 },
  { pos: [3.4, QUAY_TOP_Y + 0.75, 5], facing: -1 },
];

export interface Disturbance {
  /** x del carro de la grúa. */
  trolleyX: number;
  /** Posición del spreader. */
  hookX: number;
  hookY: number;
  /** Cursor en coordenadas de mundo (plano z = 0). */
  pointerX: number;
  pointerY: number;
  /** Sube en cada acción brusca (soltar un contenedor): asusta a todas. */
  pulse: number;
}

/** Radio de fuga: por debajo de esto, la gaviota se va. */
export const FLEE_RADIUS = 3.6;
/** El carro pasa por arriba: molesta en una franja más ancha en x. */
export const TROLLEY_FLEE_X = 3.2;

export function distance2(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

/** ¿Hay algo lo bastante cerca de este posadero para espantar al ave? */
export function isDisturbed(perch: Perch, d: Disturbance): boolean {
  const [px, py] = perch.pos;
  if (distance2(px, py, d.hookX, d.hookY) < FLEE_RADIUS * FLEE_RADIUS) return true;
  if (distance2(px, py, d.pointerX, d.pointerY) < FLEE_RADIUS * FLEE_RADIUS) return true;
  // El carro solo asusta a las que están en la pluma, por debajo de él.
  const onBoom = py > BOOM_Y - 0.5;
  if (onBoom && Math.abs(px - d.trolleyX) < TROLLEY_FLEE_X) return true;
  return false;
}

/**
 * Elige posadero libre más cercano a `fromX`, saltándose los ocupados y los
 * que ahora mismo tienen algo cerca. Devuelve -1 si no hay ninguno.
 */
export function pickPerch(
  taken: ReadonlySet<number>,
  d: Disturbance,
  fromX: number,
): number {
  let best = -1;
  let bestDist = Infinity;
  for (let i = 0; i < PERCHES.length; i++) {
    if (taken.has(i)) continue;
    if (isDisturbed(PERCHES[i], d)) continue;
    const dist = Math.abs(PERCHES[i].pos[0] - fromX);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

/** Curva de despegue: empuje fuerte al principio y luego se relaja. */
export function takeoffEase(t: number) {
  const k = Math.min(1, Math.max(0, t));
  return 1 - (1 - k) * (1 - k);
}
