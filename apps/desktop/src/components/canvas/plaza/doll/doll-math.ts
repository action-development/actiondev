/**
 * Matemática de animación del muñeco: suavizado exponencial, muelles y ondas.
 *
 * Todo independiente del framerate (se integra con `dt`), para que el muñeco
 * se sienta igual a 60 y a 144 Hz.
 */

/** Acerca `current` a `target` con una constante de tiempo `1/lambda` segundos.
 * Es la forma exacta (no un lerp por frame): converge igual con cualquier dt. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return target + (current - target) * Math.exp(-lambda * dt);
}

export function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

export function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Diferencia angular mínima con signo (-π, π]. */
export function wrapAngle(a: number): number {
  return ((((a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
}

/** Muelle amortiguado de un grado de libertad. Mutable a propósito: vive en un
 * ref y se integra por frame sin alocar. */
export interface Spring {
  x: number;
  v: number;
}

/** Integración semi-implícita (estable con dt ≤ 1/20 y k ≲ 400). */
export function stepSpring(s: Spring, target: number, k: number, c: number, dt: number): void {
  s.v += (k * (target - s.x) - c * s.v) * dt;
  s.x += s.v * dt;
}

/** Onda triangular suave en [-1, 1]: lineal en el tramo de apoyo (el pie barre
 * el suelo a velocidad casi constante → sin patinaje) y redondeada en los
 * extremos para que el cambio de sentido no se note mecánico. */
export function softTriangle(phase: number): number {
  const tri = (2 / Math.PI) * Math.asin(Math.sin(phase));
  return tri * 0.65 + Math.sin(phase) * 0.35;
}
