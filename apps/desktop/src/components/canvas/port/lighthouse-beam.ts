/**
 * Haz del faro como un faro de verdad: la óptica GIRA 360° en el plano
 * horizontal, y lo que vemos es su proyección.
 *
 *  - apuntando a un lado  → haz largo barriendo el cielo
 *  - apuntando al visitante → haz cortísimo + destello fuerte en la linterna
 *  - apuntando hacia el mar abierto (lejos) → haz tenue, casi oculto
 *
 * Lógica pura para poder testearla.
 */

/** Segundos por vuelta completa. */
export const BEAM_PERIOD = 9;

export interface BeamState {
  /** -1 izquierda … 1 derecha: hacia dónde se proyecta en pantalla. */
  side: number;
  /** 0..1 largo visible del haz. */
  length: number;
  /** 0..1 intensidad del haz. */
  intensity: number;
  /** 0..1 destello en la linterna (máximo cuando apunta a cámara). */
  flare: number;
}

export function beamAt(time: number): BeamState {
  const a = (time / BEAM_PERIOD) * Math.PI * 2;
  const side = Math.cos(a);
  const toward = Math.sin(a); // 1 = hacia la cámara, -1 = hacia el horizonte
  const length = Math.abs(side);
  // Hacia cámara se ve más; de espaldas queda un rastro tenue.
  const intensity = 0.35 + 0.65 * Math.max(0, toward * 0.5 + 0.5) ** 1.5;
  const flare = Math.max(0, toward) ** 8;
  return { side, length, intensity, flare };
}
