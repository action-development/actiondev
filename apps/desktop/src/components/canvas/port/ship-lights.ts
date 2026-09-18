/**
 * Vida dentro del barco: las ventanas de los camarotes se encienden y apagan
 * por su cuenta. No es un ciclo fijo — hay gente ahí dentro, y la gente no
 * sigue un patrón: a veces se encienden dos y se apagan otras dos, a veces se
 * enciende todo de golpe, a veces se va apagando el pasillo una a una.
 *
 * Lógica pura y testeable; el render vive en `PaintedShip.tsx`.
 */

export type LightAction = "hold" | "pair" | "blink" | "sweep-on" | "sweep-off" | "all-on" | "all-off";

/** Segundos entre ventana y ventana en las secuencias. */
export const SWEEP_STEP = 0.32;

/**
 * Tope de tiempo con TODO apagado. Apagarlo todo es de las cosas que se piden
 * al barco, pero un "all-off" seguido de un "sweep-off" deja el barco muerto
 * seis o siete segundos y se nota demasiado.
 */
export const MAX_DARK = 3;

interface Plan {
  action: LightAction;
  weight: number;
  /** Duración mínima y máxima de la acción, en segundos. */
  seconds: [number, number];
}

/**
 * "hold" pesa lo más: la mayor parte del tiempo un barco está quieto. Apagarlo
 * todo pesa poco y dura poco — si no, el barco desaparece del encuadre.
 */
export const PLAN: Plan[] = [
  { action: "hold", weight: 6, seconds: [3, 9] },
  { action: "pair", weight: 4, seconds: [2, 5] },
  { action: "blink", weight: 3, seconds: [1, 2.5] },
  { action: "sweep-on", weight: 2, seconds: [2.5, 4] },
  { action: "sweep-off", weight: 2, seconds: [2.5, 4] },
  { action: "all-on", weight: 1, seconds: [2, 5] },
  { action: "all-off", weight: 1, seconds: [1.5, 3] },
];

const TOTAL_WEIGHT = PLAN.reduce((sum, p) => sum + p.weight, 0);

/** xorshift32. Con semilla != 0 nunca cae en 0, así que no se queda clavada. */
export function nextSeed(seed: number): number {
  let s = seed | 0;
  s ^= s << 13;
  s ^= s >>> 17;
  s ^= s << 5;
  return s | 0;
}

/** Semilla → 0..1. */
export function unit(seed: number): number {
  return ((seed >>> 0) % 1000003) / 1000003;
}

export function chooseAction(r: number): LightAction {
  let acc = 0;
  const x = Math.min(0.999999, Math.max(0, r)) * TOTAL_WEIGHT;
  for (const p of PLAN) {
    acc += p.weight;
    if (x < acc) return p.action;
  }
  return "hold";
}

export function actionSeconds(action: LightAction, r: number): number {
  const p = PLAN.find((q) => q.action === action)!;
  return p.seconds[0] + r * (p.seconds[1] - p.seconds[0]);
}

export interface LightsState {
  /** 0 o 1 por ventana: a dónde tiene que ir cada una (el fundido es del render). */
  target: number[];
  action: LightAction;
  /** Momento en que se elige otra acción. */
  until: number;
  /** Ventana por la que va la secuencia. */
  cursor: number;
  /** Momento del siguiente paso de la secuencia. */
  nextTick: number;
  /** Desde cuándo está todo apagado, o -1 si hay alguna encendida. */
  darkSince: number;
  seed: number;
}

export function createLights(count: number, seed = 0x5eed1234): LightsState {
  // Arranca con unas cuantas encendidas, no todas: parece habitado.
  const target = Array.from({ length: count }, (_, i) => (i % 3 === 0 ? 1 : 0));
  return {
    target,
    action: "hold",
    until: 0,
    cursor: count,
    nextTick: 0,
    darkSince: -1,
    seed: seed | 0 || 1,
  };
}

/** Índice de ventana al azar, avanzando la semilla. */
function pickIndex(s: LightsState): number {
  s.seed = nextSeed(s.seed);
  return Math.floor(unit(s.seed) * s.target.length) % s.target.length;
}

function applyAction(s: LightsState, time: number, action: LightAction) {
  switch (action) {
    case "pair":
      // Dos que se encienden y dos que se apagan: el relevo de guardia.
      s.target[pickIndex(s)] = 1;
      s.target[pickIndex(s)] = 1;
      s.target[pickIndex(s)] = 0;
      s.target[pickIndex(s)] = 0;
      break;
    case "blink": {
      const i = pickIndex(s);
      s.target[i] = s.target[i] > 0 ? 0 : 1;
      break;
    }
    case "all-on":
      s.target.fill(1);
      break;
    case "all-off":
      s.target.fill(0);
      break;
    case "sweep-on":
    case "sweep-off":
      s.cursor = 0;
      s.nextTick = time;
      break;
    case "hold":
      break;
  }
}

/**
 * Lleva la máquina hasta `time`. Muta el estado en sitio a propósito: esto se
 * llama desde un `useFrame` y no interesa generar basura cada fotograma.
 */
export function advanceLights(s: LightsState, time: number): LightsState {
  if (time >= s.until) {
    s.seed = nextSeed(s.seed);
    const action = chooseAction(unit(s.seed));
    s.seed = nextSeed(s.seed);
    s.action = action;
    s.until = time + actionSeconds(action, unit(s.seed));
    applyAction(s, time, action);
  }

  const dark = !s.target.some((v) => v > 0);
  if (!dark) {
    s.darkSince = -1;
  } else if (s.action === "hold") {
    // Un barco a oscuras y "en reposo" no tiene sentido: alguien enciende.
    s.target[pickIndex(s)] = 1;
    s.target[pickIndex(s)] = 1;
    s.darkSince = -1;
  } else if (s.darkSince < 0) {
    s.darkSince = time;
  } else if (time - s.darkSince > MAX_DARK) {
    s.target[pickIndex(s)] = 1;
    s.target[pickIndex(s)] = 1;
    s.darkSince = -1;
    // Y que elija otra acción ya, no vaya a apagarlas otra vez.
    s.until = time;
  }

  if (s.action === "sweep-on" || s.action === "sweep-off") {
    const on = s.action === "sweep-on" ? 1 : 0;
    while (s.cursor < s.target.length && time >= s.nextTick) {
      s.target[s.cursor] = on;
      s.cursor++;
      s.nextTick += SWEEP_STEP;
    }
  }

  return s;
}
