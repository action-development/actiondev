import { BOOM_TOP_Y, BOOM_Z, LEG_Z } from "./Crane";
import type { GrabCandidate } from "./crane-logic";

/**
 * Comportamiento de las gaviotas: se posan en la grúa y en los contenedores, y
 * levantan el vuelo cuando algo se les acerca (el carro, el spreader, el
 * pórtico en marcha, el contenedor que se mueve bajo sus patas o el cursor).
 *
 * Lógica pura y testeable; el render vive en `Seagulls.tsx`.
 *
 * POSADEROS = SUPERFICIES REALES. Un posadero no es un punto fijo del mundo
 * sino un sitio SOBRE algo que existe en 3D en todas las fases (el fondo
 * pintado no cuenta: su atrezo no tiene coordenadas fiables):
 *
 * - `crane`: cara de arriba de la pluma o del travesaño del pórtico. Su z es
 *   RELATIVA al pórtico, que viaja entre filas — con z fija la gaviota se
 *   quedaba flotando en el aire en cuanto la grúa cambiaba de fila.
 * - `container`: techo de un contenedor del juego, leído de la física cada
 *   frame. Deja de valer si lo enganchan o si le ponen otro encima.
 *
 * `resolvePerch` devuelve el punto de la SUPERFICIE (donde apoyan las patas);
 * quien pinta el ave le suma la altura de sus patas según su escala.
 */

/** Cara superior del travesaño del pórtico pintado (y = 0.8, canto 0.55 — `PaintedCraneStructure`). */
export const PORTAL_BEAM_TOP_Y = 0.8 + 0.55 / 2;

export type Perch =
  | {
      kind: "crane";
      /** x del apoyo (mundo — la grúa no se mueve en x). */
      x: number;
      /** y de la SUPERFICIE. */
      y: number;
      /** z relativa al pórtico (se le suma `gantryZ`). */
      z: number;
      /** Mirando a +x (1) o a -x (-1). */
      facing: 1 | -1;
    }
  | {
      kind: "container";
      /** Id del contenedor (`data/port-containers.ts`). */
      id: string;
      /** Desplazamiento en x como fracción del semiancho (-1 … 1). */
      dx: number;
      facing: 1 | -1;
    };

/**
 * Sitios donde una gaviota se posa. Los tres primeros (pluma) valen SIEMPRE:
 * son los posaderos de salida de las que nacen posadas.
 */
export const PERCHES: Perch[] = [
  // Pluma: sobre el agua junto al barco, sobre el cantil y sobre el muelle.
  { kind: "crane", x: 12.2, y: BOOM_TOP_Y, z: BOOM_Z, facing: -1 },
  { kind: "crane", x: 2.8, y: BOOM_TOP_Y, z: BOOM_Z, facing: -1 },
  { kind: "crane", x: -6.8, y: BOOM_TOP_Y, z: BOOM_Z, facing: 1 },
  // Travesaño del pórtico, la parte que asoma por la izquierda del encuadre.
  { kind: "crane", x: -12.6, y: PORTAL_BEAM_TOP_Y, z: LEG_Z, facing: 1 },
  // Techos de contenedores del juego.
  { kind: "container", id: "contact", dx: 0.35, facing: -1 },
  { kind: "container", id: "testimonials", dx: -0.3, facing: 1 },
  { kind: "container", id: "p-fase", dx: 0.2, facing: 1 },
  { kind: "container", id: "d-vigo", dx: -0.25, facing: -1 },
  { kind: "container", id: "team", dx: 0.3, facing: 1 },
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
  /** Sube en cada acción brusca (un disparo): asusta a todas. */
  pulse: number;
  /** Profundidad del pórtico (fila). Sin ella se asume 0. */
  gantryZ?: number;
  /** Velocidad del pórtico en z: en marcha, la grúa entera vibra. */
  gantryVel?: number;
  /** Contenedores con su posición física actual (los de GameWorld). */
  containers?: readonly GrabCandidate[];
  /** Id del contenedor que cuelga del spreader, si hay. */
  heldId?: string | null;
}

/** Radio de fuga: por debajo de esto, la gaviota se va. */
export const FLEE_RADIUS = 3.6;
/**
 * El cursor espanta más de cerca que el spreader: la etiqueta de hover invita
 * a pasar el ratón por los contenedores y con 3,6 las de sus techos no
 * aguantaban posadas ni un segundo.
 */
export const POINTER_FLEE_RADIUS = 2;
/** El carro pasa por arriba: molesta en una franja más ancha en x. */
export const TROLLEY_FLEE_X = 3.2;
/** Pórtico en marcha por encima de esto (u/s): las de la grúa se van. */
export const GANTRY_FLEE_VEL = 0.4;
/** El spreader solo asusta en su propia fila (± esto en z). */
export const HOOK_FLEE_Z = 2;

export function distance2(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export interface PerchPoint {
  x: number;
  y: number;
  z: number;
}

/**
 * Punto de APOYO del posadero ahora mismo (superficie, mundo). `false` si ya
 * no existe: el contenedor no está, cuelga del gancho o tiene otro encima.
 * Escribe en `out` (sin reservas: se llama por frame y por gaviota).
 */
export function resolvePerch(perch: Perch, d: Disturbance, out: PerchPoint): boolean {
  if (perch.kind === "crane") {
    out.x = perch.x;
    out.y = perch.y;
    out.z = perch.z + (d.gantryZ ?? 0);
    return true;
  }
  if (d.heldId === perch.id) return false;
  const list = d.containers;
  if (!list) return false;
  let box: GrabCandidate | null = null;
  for (const c of list) {
    if (c.id === perch.id) {
      box = c;
      break;
    }
  }
  if (!box) return false;
  const bz = box.z ?? 0;
  const top = box.y + box.halfH;
  // Con otro contenedor encima el techo ya no es aire libre.
  for (const c of list) {
    if (c === box) continue;
    if (Math.abs((c.z ?? 0) - bz) > 0.8) continue;
    if (Math.abs(c.x - box.x) > c.halfW + box.halfW - 0.1) continue;
    if (c.y - c.halfH >= top - 0.2) return false;
  }
  out.x = box.x + perch.dx * box.halfW;
  out.y = top;
  out.z = bz;
  return true;
}

const _p: PerchPoint = { x: 0, y: 0, z: 0 };

/** ¿Hay algo lo bastante cerca de este posadero para espantar al ave? */
export function isDisturbed(perch: Perch, d: Disturbance): boolean {
  // Sin suelo bajo las patas no hay quien se quede.
  if (!resolvePerch(perch, d, _p)) return true;
  const { x: px, y: py, z: pz } = _p;
  const sameRow = perch.kind === "crane" || Math.abs(pz - (d.gantryZ ?? 0)) < HOOK_FLEE_Z;
  if (sameRow && distance2(px, py, d.hookX, d.hookY) < FLEE_RADIUS * FLEE_RADIUS) return true;
  if (distance2(px, py, d.pointerX, d.pointerY) < POINTER_FLEE_RADIUS * POINTER_FLEE_RADIUS) return true;
  if (perch.kind === "crane") {
    // El pórtico en marcha hace vibrar toda la estructura.
    if (Math.abs(d.gantryVel ?? 0) > GANTRY_FLEE_VEL) return true;
    // El carro solo asusta a las que están en la pluma, por donde pasa él.
    const onBoom = py >= BOOM_TOP_Y - 0.01;
    if (onBoom && Math.abs(px - d.trolleyX) < TROLLEY_FLEE_X) return true;
  }
  return false;
}

/**
 * Elige el posadero libre más cercano a `fromX`, saltándose los ocupados, los
 * que no existen ahora mismo y los que tienen algo cerca. -1 si no hay ninguno.
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
    resolvePerch(PERCHES[i], d, _p);
    const dist = Math.abs(_p.x - fromX);
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
