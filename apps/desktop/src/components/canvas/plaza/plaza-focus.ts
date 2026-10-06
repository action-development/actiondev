import * as THREE from "three";
import { FOUNTAIN_KEEP_OUT, type DecorKind } from "./plaza-config";
import { FOCUS, ORBIT } from "./plaza-camera";

/**
 * Plano de foco: desde dónde se mira al muñeco seleccionado y quién tiene que
 * apartarse para que se le vea.
 *
 * Funciones puras (sin React ni escena) para poder medirlas fuera del
 * navegador. Las usa `PlazaWorld` UNA vez por selección.
 *
 * Por qué hace falta: con más de veinte muñecos en una plaza de radio ~6, a
 * 3,5 de distancia casi siempre hay alguien entre la cámara y el enfocado, o
 * pegado a la cámara saliendo como una cabeza gigante cortada por el borde.
 * Ni plantar la cámara siempre por `ORBIT.center` (antes: con el muñeco detrás
 * de la fuente caía dentro del pilón) ni elegir el mejor azimut basta por sí
 * solo. Se hace en dos pasos:
 * 1. `planFocus` prueba un abanico de azimuts alrededor del lado abierto y se
 *    queda con el de menor penalización (fuente y mobiliario pesan mucho: no
 *    se pueden mover).
 * 2. Los muñecos que aún estorban en ese plano (`intruders`) se APARTAN
 *    andando (`stepAsideTarget`): le hacen sitio al enfocado, que en una
 *    plaza de juguete se lee como cortesía, no como un truco de cámara.
 */

/** Holgura (unidades) que pide cada pieza de mobiliario alrededor de la
 * cámara de foco. Lo bajo y fino (farola, papelera) estorba poco; lo ancho
 * (banco, seto) y las copas, mucho. */
export const DECOR_CLEARANCE: Record<DecorKind, number> = {
  lamp: 0.45,
  bin: 0.45,
  bench: 1.0,
  hedge: 1.1,
  palm: 0.9,
  tree: 1.6,
};
/** Fracción de la holgura que se exige a la LÍNEA de visión (la cámara pasa
 * por encima de lo bajo). */
const SIGHT_FACTOR = 0.6;
/** Medio ancho de un muñeco visto de frente (cabeza 0,34 + margen). */
const DOLL_HALF_WIDTH = 0.42;
/** Ningún muñeco a menos de esto de la cámara: se le vería por dentro. */
const DOLL_CAMERA_CLEARANCE = 1.05;
/** Un muñeco dentro del encuadre más cerca que esta fracción de la distancia
 * al enfocado sale como una cabeza gigante en primer plano. */
const FOREGROUND_FRACTION = 0.82;
/** La línea de visión no puede pasar más cerca del eje de la fuente: el
 * pilón (1,22) más margen — dentro está el surtidor, que tapa al muñeco. */
const FOUNTAIN_SIGHT_CLEARANCE = 1.35;
/** La cámara no puede caer dentro del pilón ni rozar su murete. */
const FOUNTAIN_CAMERA_CLEARANCE = FOUNTAIN_KEEP_OUT + 0.4;
/** Con la cámara a menos de esto del centro, el pilón entra en primer plano. */
const FOUNTAIN_FOREGROUND = 3.4;
/** Hasta dónde se puede apartar un muñeco (radio desde el centro): la zona
 * de paseo, por dentro del anillo de bancos (7) y farolas (7,6). Más allá
 * acabaría sentado encima de un banco. */
const ASIDE_MAX_RADIUS = 6.6;
/** Más allá de esto la cámara de foco se mete entre palmeras (r ≈ 14,6). */
const CAMERA_MAX_RADIUS = 11.7;

/** Óptica con la que se va a encuadrar: tangente del medio FOV horizontal y
 * dónde cae el enfocado en pantalla (NDC x). */
export interface FocusView {
  tanHalfH: number;
  screenX: number;
}

export interface FocusObstacle {
  pos: THREE.Vector2;
  clearance: number;
}

export interface FocusPlan {
  /** Azimut de la cámara alrededor del enfocado (rad). */
  azimuth: number;
  /** Índices (en `others`) de los muñecos que tienen que apartarse. */
  intruders: number[];
  /** Penalización que queda tras apartarlos (0 = plano limpio). Diagnóstico. */
  residual: number;
}

/** Distancia de `p` al segmento `a`→`b` en planta (XZ como Vector2). */
function segmentDistance(p: THREE.Vector2, a: THREE.Vector2, b: THREE.Vector2): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const len2 = abx * abx + aby * aby || 1;
  const t = THREE.MathUtils.clamp(((p.x - a.x) * abx + (p.y - a.y) * aby) / len2, 0, 1);
  return Math.hypot(a.x + abx * t - p.x, a.y + aby * t - p.y);
}

/** Posición de la cámara de foco para un azimut. */
export function focusCameraAt(target: THREE.Vector2, azimuth: number, out = new THREE.Vector2()): THREE.Vector2 {
  return out.set(target.x + Math.cos(azimuth) * FOCUS.distance, target.y + Math.sin(azimuth) * FOCUS.distance);
}

/**
 * Óptica angular del plano. El encuadre NO está centrado en el enfocado: la
 * cámara mira a un punto a su derecha para dejarlo en `screenX` (ver
 * `PlazaWorld`), o sea, el eje de la vista está girado `axis` respecto a la
 * línea cámara → enfocado. Medir en ángulos (no en NDC lineales) es exacto en
 * los bordes, donde la aproximación lineal fallaba por varios grados.
 */
function optics(view: FocusView) {
  return {
    half: Math.atan(view.tanHalfH),
    axis: Math.atan(-view.screenX * view.tanHalfH),
    targetHalf: Math.atan(DOLL_HALF_WIDTH / FOCUS.distance),
  };
}

/**
 * Coordenadas de vista de `o` para una cámara en `cam` mirando a lo largo de
 * `fwd`: profundidad `z`, desplazamiento lateral `x` (positivo = derecha; el
 * vector derecho de una cámara que mira hacia `f` en planta es (−f.z, f.x)) y
 * ángulo `theta` respecto a la línea al enfocado.
 */
function viewOf(o: THREE.Vector2, cam: THREE.Vector2, fwd: THREE.Vector2) {
  const vx = o.x - cam.x;
  const vz = o.y - cam.y;
  const z = vx * fwd.x + vz * fwd.y;
  const x = -vx * fwd.y + vz * fwd.x;
  return { z, x, dist: Math.hypot(vx, vz), theta: Math.atan2(x, z) };
}

/** Estorbo de un muñeco en un plano: 0 si no molesta. */
function dollPenalty(o: THREE.Vector2, cam: THREE.Vector2, fwd: THREE.Vector2, view: FocusView): number {
  const v = viewOf(o, cam, fwd);
  if (v.dist < DOLL_CAMERA_CLEARANCE) return 6;
  if (v.z < 0.2) return 0; // detrás de la cámara
  const { half, axis, targetHalf } = optics(view);
  const halfAng = Math.atan(DOLL_HALF_WIDTH / v.dist);
  const overlapsTarget = Math.abs(v.theta) < halfAng + targetHalf;
  // Delante del enfocado y tapándolo.
  if (v.z < FOCUS.distance - 0.25 && overlapsTarget) return 5;
  // Primer plano dentro del encuadre (aunque sea asomando por el borde):
  // cuanto más cerca, peor.
  const inFrame = Math.abs(v.theta - axis) - halfAng < half;
  if (inFrame && v.z < FOCUS.distance * FOREGROUND_FRACTION) return 1 + (FOCUS.distance * FOREGROUND_FRACTION - v.z);
  // Justo detrás del enfocado, asomando por encima de su cabeza: molesta poco.
  if (overlapsTarget && v.z < FOCUS.distance + 1.6) return 0.4;
  return 0;
}

/**
 * Elige azimut y lista de muñecos a apartar. `others` son las posiciones
 * actuales del resto; `decor`, el mobiliario como obstáculo.
 */
export function planFocus(
  target: THREE.Vector2,
  others: readonly THREE.Vector2[],
  decor: readonly FocusObstacle[],
  view: FocusView,
): FocusPlan {
  const cam = new THREE.Vector2();
  const near = new THREE.Vector2();
  const fwd = new THREE.Vector2();
  const origin = new THREE.Vector2();
  let best: FocusPlan = { azimuth: ORBIT.center, intruders: [], residual: Infinity };
  let bestPenalty = Infinity;
  const steps = Math.round(FOCUS.azimuthSpan / FOCUS.azimuthStep);
  for (let k = 0; k <= steps * 2; k++) {
    // 0, +1, −1, +2, −2…: a igualdad, gana el más cercano al lado abierto.
    const n = k === 0 ? 0 : Math.ceil(k / 2) * (k % 2 ? 1 : -1);
    const az = ORBIT.center + THREE.MathUtils.degToRad(n * FOCUS.azimuthStep);
    focusCameraAt(target, az, cam);
    fwd.copy(target).sub(cam).normalize();
    // El tramo final de la línea (el propio enfocado) no cuenta: si está
    // pegado al pilón, cualquier línea "toca" la fuente en su extremo.
    near.copy(target).lerp(cam, 0.15);

    // Lo que no se puede mover pesa mucho más que un muñeco.
    let fixed = 0;
    if (cam.length() < FOUNTAIN_CAMERA_CLEARANCE) fixed += 20;
    // Pegada al pilón, la taza de la fuente ocupa medio primer plano.
    else if (cam.length() < FOUNTAIN_FOREGROUND) fixed += (FOUNTAIN_FOREGROUND - cam.length()) * 3;
    if (segmentDistance(origin, cam, near) < FOUNTAIN_SIGHT_CLEARANCE) fixed += 20;
    if (cam.length() > CAMERA_MAX_RADIUS) fixed += 4; // fuera del parque útil
    for (const d of decor) {
      if (d.pos.distanceTo(cam) < d.clearance) fixed += 20;
      else if (segmentDistance(d.pos, cam, near) < d.clearance * SIGHT_FACTOR) fixed += 6;
    }

    let movable = 0;
    const intruders: number[] = [];
    others.forEach((o, i) => {
      const p = dollPenalty(o, cam, fwd, view);
      if (p <= 0) return;
      movable += p;
      if (p >= 1) intruders.push(i);
    });
    // Apartar a alguien cuesta (se nota), pero mucho menos que dejarlo
    // delante: se prefiere el plano que obliga a mover a menos gente.
    const penalty = fixed + movable;
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      best = { azimuth: az, intruders, residual: fixed };
      if (penalty === 0) break;
    }
  }
  return best;
}

/**
 * Sitio al que se aparta un intruso para despejar el plano: el más cercano
 * entre (a) salir del encuadre por el lado más próximo a la misma
 * profundidad, o (b) retroceder hasta pasar de primer plano a segundo y,
 * si entonces tapa al enfocado, hacerse a un lado. Acotado a la plaza y
 * fuera de la fuente.
 */
export function stepAsideTarget(
  o: THREE.Vector2,
  target: THREE.Vector2,
  azimuth: number,
  view: FocusView,
): THREE.Vector2 {
  const cam = focusCameraAt(target, azimuth);
  const fwd = target.clone().sub(cam).normalize();
  const right = new THREE.Vector2(-fwd.y, fwd.x);
  const v = viewOf(o, cam, fwd);
  const { half, axis, targetHalf } = optics(view);
  /** Punto a profundidad `z` y ángulo `theta` respecto a la línea al enfocado. */
  const at = (z: number, theta: number) =>
    cam.clone().addScaledVector(fwd, z).addScaledVector(right, z * Math.tan(theta));
  const margin = THREE.MathUtils.degToRad(3);

  const candidates: THREE.Vector2[] = [];
  // (a) Fuera del encuadre por cada lado, a la misma profundidad (o a 1,2 si
  // estaba pegado a la cámara).
  const z = Math.max(v.z, 1.2);
  const halfA = Math.atan(DOLL_HALF_WIDTH / z);
  for (const side of [1, -1]) {
    const theta = axis + side * (half + halfA + margin);
    if (Math.abs(theta) < Math.PI / 2 - 0.1) candidates.push(at(z, theta));
  }
  // (b) Atrás, a segundo plano, y a un lado del enfocado si lo tapa.
  const zb = FOCUS.distance * FOREGROUND_FRACTION + 0.35;
  const clear = Math.atan(DOLL_HALF_WIDTH / zb) + targetHalf + margin;
  const thetaB = v.z > 0.2 ? v.theta : 0;
  const side = thetaB >= 0 ? 1 : -1;
  candidates.push(at(zb, Math.abs(thetaB) < clear ? side * clear : thetaB));

  let best = candidates[0];
  let bestCost = Infinity;
  for (const c of candidates) {
    // Dentro de la plaza y fuera de la fuente.
    const r = c.length();
    if (r > ASIDE_MAX_RADIUS) c.multiplyScalar(ASIDE_MAX_RADIUS / r);
    if (r < FOUNTAIN_KEEP_OUT + 0.1) c.multiplyScalar((FOUNTAIN_KEEP_OUT + 0.1) / Math.max(r, 1e-4));
    // Lo que de verdad cuenta: que ya no estorbe donde acaba. El recorte de
    // arriba puede haberlo devuelto al plano.
    const cost = c.distanceTo(o) + dollPenalty(c, cam, fwd, view) * 4;
    if (cost < bestCost) {
      bestCost = cost;
      best = c;
    }
  }
  return best;
}
