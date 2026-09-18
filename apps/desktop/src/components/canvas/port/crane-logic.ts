/**
 * Lógica pura de la grúa — sin Three ni Rapier, testeable en Vitest.
 * Todo en coordenadas de mundo sobre el plano de juego z = 0.
 */

/** Cota superior del suelo bajo una x: muelle, bodega del barco o agua. */
export const QUAY_EDGE_X = 4.5;
export const QUAY_TOP_Y = -6;
export const HOLD_MIN_X = 6.8;
export const HOLD_MAX_X = 16.2;
export const HOLD_FLOOR_Y = -6.6;
export const WATER_Y = -7.9;

/**
 * X sobre la que la grúa suelta la carga: la marca de la bodega. No es el
 * centro real de la bodega (11.5) porque a 16:10 el encuadre la corta — ver
 * `MARKER_X` en `Ship.tsx`, que lee de aquí.
 */
export const SHIP_DROP_X = 10.6;

export function groundTopAt(x: number): number {
  if (x <= QUAY_EDGE_X) return QUAY_TOP_Y;
  if (x >= HOLD_MIN_X && x <= HOLD_MAX_X) return HOLD_FLOOR_Y;
  return WATER_Y;
}

/**
 * Cota a la que un contenedor queda APOYADO sobre el suelo que hay en esa x
 * (muelle, bodega o agua). Con esto los contenedores pueden empezar la partida
 * ya puestos en el muelle en vez de caer del cielo.
 */
export function restingY(x: number, halfH: number): number {
  return groundTopAt(x) + halfH;
}

export interface GrabCandidate {
  id: string;
  x: number;
  y: number;
  halfW: number;
  halfH: number;
}

/**
 * Contenedor que el spreader engancharía bajando en `hookX`.
 * - Debe estar bajo el gancho con margen (85% del semiancho): enganchar de
 *   refilón un contenedor que apenas asoma se siente injusto.
 * - Con varios apilados gana el de arriba (techo más alto).
 * - Nunca uno cuyo techo ya está por encima del fondo del spreader.
 */
export function findGrabTarget<T extends GrabCandidate>(
  candidates: readonly T[],
  hookX: number,
  hookBottomY: number,
): T | null {
  let best: T | null = null;
  let bestTop = -Infinity;
  for (const c of candidates) {
    if (Math.abs(c.x - hookX) > c.halfW * 0.85) continue;
    const top = c.y + c.halfH;
    if (top > hookBottomY + 0.05) continue;
    if (top > bestTop) {
      bestTop = top;
      best = c;
    }
  }
  return best;
}

/**
 * Margen extra (unidades de mundo) alrededor de un contenedor para dar el
 * click por acertado. El público objetivo no apunta al píxel: es mejor pecar
 * de generoso que obligar a repetir el click.
 */
export const PICK_SLACK = 0.35;

/**
 * Contenedor sobre el que cae un click, en coordenadas del plano de juego.
 * Con una pila, gana el de arriba: es el único que la grúa puede enganchar.
 */
export function pickContainerAt<T extends GrabCandidate>(
  candidates: readonly T[],
  x: number,
  y: number,
): T | null {
  let best: T | null = null;
  let bestTop = -Infinity;
  for (const c of candidates) {
    if (Math.abs(c.x - x) > c.halfW + PICK_SLACK) continue;
    if (Math.abs(c.y - y) > c.halfH + PICK_SLACK) continue;
    const top = c.y + c.halfH;
    if (top > bestTop) {
      bestTop = top;
      best = c;
    }
  }
  return best;
}

/**
 * Péndulo del cable: el spreader se retrasa cuando el carro acelera y oscila
 * al frenar. Muelle amortiguado explícito — `dt` debe venir acotado por el
 * llamador (≤ 1/30) o el integrador diverge con frames lentos.
 */
export interface SwayState {
  offset: number;
  velocity: number;
}

const SWAY_STIFFNESS = 14;
const SWAY_DAMPING = 2.6;
const SWAY_GAIN = 0.09;
const SWAY_MAX = 1.6;

export function stepSway(state: SwayState, trolleyAccel: number, dt: number): void {
  const force = -SWAY_STIFFNESS * state.offset - SWAY_DAMPING * state.velocity - trolleyAccel * SWAY_GAIN;
  state.velocity += force * dt;
  state.offset += state.velocity * dt;
  if (state.offset > SWAY_MAX) { state.offset = SWAY_MAX; state.velocity = 0; }
  else if (state.offset < -SWAY_MAX) { state.offset = -SWAY_MAX; state.velocity = 0; }
}

/** Mueve `current` hacia `target` con velocidad máxima — la grúa pesa, no teletransporta. */
export function approach(current: number, target: number, maxStep: number): number {
  const d = target - current;
  if (Math.abs(d) <= maxStep) return target;
  return current + Math.sign(d) * maxStep;
}
