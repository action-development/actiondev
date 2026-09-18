/**
 * Secuencia de las balizas de la pluma. Lógica pura (testeable): dado el
 * tiempo, devuelve la intensidad 0..1 de cada baliza.
 *
 * El show recorre patrones en bucle, cada uno `PATTERN_SECONDS`:
 *  - chase     una a una, de la cabina a la punta
 *  - together  todas a la vez, doble destello
 *  - alternate pares / impares
 *  - fill      se van encendiendo hasta quedar todas y se apagan de golpe
 *  - bounce    una luz que va y vuelve
 *  - steady    fijas con respiración suave (descanso visual)
 */

export const BEACON_PATTERNS = ["chase", "together", "alternate", "fill", "bounce", "steady"] as const;
export type BeaconPattern = (typeof BEACON_PATTERNS)[number];

export const PATTERN_SECONDS = 4;
/** Intensidad mínima: una baliza "apagada" sigue viéndose como bombilla. */
export const BEACON_OFF = 0.12;

export function patternAt(time: number): { pattern: BeaconPattern; local: number } {
  const t = Math.max(0, time);
  const idx = Math.floor(t / PATTERN_SECONDS) % BEACON_PATTERNS.length;
  return { pattern: BEACON_PATTERNS[idx], local: t % PATTERN_SECONDS };
}

const on = (v: boolean) => (v ? 1 : BEACON_OFF);

export function beaconLevel(pattern: BeaconPattern, local: number, index: number, count: number): number {
  switch (pattern) {
    case "chase": {
      const step = Math.floor(local / 0.22) % (count + 1);
      return on(step === index);
    }
    case "together": {
      const p = local % 1;
      return on(p < 0.12 || (p > 0.24 && p < 0.36));
    }
    case "alternate":
      return on(Math.floor(local / 0.5) % 2 === index % 2);
    case "fill": {
      const lit = Math.floor(local / 0.45);
      return on(lit < count + 3 && index < lit);
    }
    case "bounce": {
      const span = Math.max(1, count - 1);
      const pos = Math.floor(local / 0.18) % (span * 2);
      const at = pos <= span ? pos : span * 2 - pos;
      return on(at === index);
    }
    case "steady":
      return 0.75 + 0.25 * Math.sin(local * Math.PI);
  }
}
