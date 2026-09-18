import type { TimeOfDay } from "./time-of-day";

/**
 * Fondos pintados (IA) — "todo lo que no se mueve" dibujado en una imagen y
 * solo las piezas móviles en 3D encima.
 *
 * Cada imagen se generó con la CAPTURA de la escena procedural como referencia
 * de composición (`/?hora=<fase>&plate`, 1920×1080, cámara fov 40), así que el
 * dibujo coincide con los colliders. Si se toca la cámara, el muelle, el barco
 * o la grúa, hay que regenerar la imagen.
 *
 * Las cuatro fases tienen imagen: `atardecer` es la original (Nano Banana 2,
 * job 26bdeaa5) y noche / amanecer / dia son EDICIONES de esa misma imagen
 * (misma referencia, "cambia solo la luz"), así que comparten composición al
 * píxel. Una fase sin imagen volvería a la escena 100 % procedural.
 */

export type SceneMode =
  /** Todo en 3D (fases sin fondo pintado). */
  | "procedural"
  /** Fondo pintado + piezas móviles en 3D; lo estático solo aporta física y oclusión. */
  | "painted"
  /** Solo lo estático, para capturar la referencia de un fondo nuevo. */
  | "plate";

export const PAINTED_BACKDROPS: Partial<Record<TimeOfDay, string>> = {
  noche: "/hero/port-noche-v1.webp",
  amanecer: "/hero/port-amanecer-v1.webp",
  dia: "/hero/port-dia-v1.webp",
  atardecer: "/hero/port-atardecer-v2.webp",
};

/** Proporción de la captura de referencia. */
export const BACKDROP_ASPECT = 16 / 9;
export const CAMERA_FOV = 40;
const THREE_DEG = Math.PI / 180;

export function resolveSceneMode(timeOfDay: TimeOfDay, search: URLSearchParams): SceneMode {
  if (search.has("plate")) return "plate";
  return PAINTED_BACKDROPS[timeOfDay] ? "painted" : "procedural";
}

/**
 * FOV vertical que mantiene el 3D alineado con una imagen en `object-cover`.
 *
 * Más estrecha que 16:9 → la imagen recorta laterales y el fov vertical fijo
 * hace lo mismo. Más ancha → la imagen recorta arriba/abajo, así que el fov
 * vertical se cierra en la misma proporción.
 */
export function fovForAspect(aspect: number): number {
  if (aspect <= BACKDROP_ASPECT) return CAMERA_FOV;
  const half = Math.tan(THREE_DEG * (CAMERA_FOV / 2)) * (BACKDROP_ASPECT / aspect);
  return (2 * Math.atan(half)) / THREE_DEG;
}
