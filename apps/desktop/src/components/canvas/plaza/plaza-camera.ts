import * as THREE from "three";
import { PLAZA_FRONT_ANGLE } from "./plaza-config";

/**
 * Cámara en reposo: VAIVÉN lento delante del parque, no una órbita completa.
 *
 * Antes daba la vuelta entera (360°). Se acotó a un arco corto centrado
 * enfrente del telón (`PLAZA_FRONT_ANGLE` + 180°) por dos razones:
 * - Da igual sensación de espacio. El parallax entre fuente, muñecos, farolas
 *   y arbolado es lo que hace que la escena se lea como un sitio y no como una
 *   foto, y eso ya lo da un vaivén de ±22°.
 * - Permite decorar el fondo. Con la cámara dando la vuelta hay que resolver
 *   los 360° en 3D; acotada, el horizonte que se ve es siempre el mismo arco y
 *   ahí sí cabe un telón pintado (ver `PlazaBackdrop`).
 *
 * Óptica de "diorama": FOV más cerrado (`fovForAspect`) y la cámara un poco más
 * lejos que antes (11,5 → 12,8). A igual tamaño de plaza en pantalla, el
 * teleobjetivo suave aplana la perspectiva: los muñecos del primer plano dejan
 * de salir cabezones respecto a los del fondo y el Pazo gana peso. No puede
 * alejarse mucho más: las palmeras viven a r ≈ 14,6 y sus hojas, por encima de
 * la cámara, asomarían por arriba del encuadre.
 *
 * `lookAt` alto + cabeceo suave (~10°, antes ~14°): deja aire sobre la torre
 * del Pazo, que antes quedaba cortada justo bajo la cápsula del Header, sin
 * cortar los pies de los muñecos más cercanos (r ≈ 6 por el lado de la
 * cámara, que es hasta donde pasean).
 *
 * `period` es el ciclo completo de ida y vuelta, en segundos. Largo a
 * propósito: tiene que leerse como una respiración, no como un barrido.
 */
export const ORBIT = {
  radius: 12.8,
  height: 3.8,
  lookAt: 1.48,
  /** Centro del vaivén: enfrente del telón. */
  center: PLAZA_FRONT_ANGLE + Math.PI,
  /** Amplitud a cada lado, en radianes (±22°). */
  sweep: 0.384,
  period: 46,
} as const;

/**
 * FOV HORIZONTAL constante (grados), no vertical.
 *
 * Con el vertical fijo (38° antes), una pantalla más estrecha recortaba la
 * plaza por los lados y una ultrapanorámica enseñaba medio parque de más. Lo
 * que tiene que caber siempre es el ANCHO de la plaza; el vertical se deduce
 * del aspecto, acotado para que un móvil en vertical no acabe en ojo de pez
 * ni una 32:9 en una rendija.
 *
 * 60° horizontal = ~36° vertical en 16:9.
 */
export const LENS = { hfov: 60, minVfov: 30, maxVfov: 70 } as const;

/** FOV vertical (grados) que mantiene `LENS.hfov` en este aspecto. */
export function fovForAspect(aspect: number): number {
  const half = THREE.MathUtils.degToRad(LENS.hfov / 2);
  const v = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(half) / Math.max(aspect, 0.1)));
  return THREE.MathUtils.clamp(v, LENS.minVfov, LENS.maxVfov);
}

/**
 * Cámara enfocando a un muñeco.
 *
 * `distance` horizontal y `height` de la cámara; `pivotY` es el punto del
 * muñeco alrededor del que gira (el pecho: cabeza y pies entran en plano).
 * La cámara va algo por ENCIMA de las cabezas (1,75 frente a ~1,3 de alto
 * del muñeco): retrato un pelo picado, y sobre todo las cabezas de los que
 * quedan entre la cámara y el enfocado caen por debajo de la línea de visión
 * en vez de taparle la cara.
 * `screen` es dónde queda ese punto en pantalla (NDC): con la ficha a la
 * derecha (≥ md) el muñeco va a la izquierda del centro; con la ficha abajo
 * (móvil) va centrado y en la mitad de arriba.
 *
 * `azimuthSpan`/`azimuthStep` (grados): abanico de azimuts candidatos
 * alrededor de `ORBIT.center`. El primero que no choca con la fuente, otro
 * muñeco o el mobiliario gana (ver `pickFocusAzimuth` en `PlazaWorld`).
 */
export const FOCUS = {
  distance: 3.5,
  height: 1.75,
  pivotY: 0.6,
  screen: { wide: { x: -0.3, y: -0.02 }, narrow: { x: 0, y: 0.32 } },
  /** Ancho de viewport (px) a partir del cual la ficha va a la derecha
   * (= breakpoint `md` de Tailwind, el que usa `ReviewCard`). */
  wideFrom: 768,
  azimuthSpan: 60,
  azimuthStep: 10,
} as const;

/**
 * Entrada al cargar: la cámara arranca más ALTA (y un poco más atrás) que la
 * pose de reposo y baja hasta ella con ease-out cúbico — una grúa que se posa
 * sobre la plaza. Más atrás no puede: a r ≈ 14,6 están las palmeras y a 16,8
 * el arbolado, y el plano arrancaría con un tronco delante. Ease-out cúbico
 * (mismo recurso que `introSeconds` de la calle): llega rápido y se posa, se
 * lee como "llegar a la plaza", no como un barrido. Sin entrada con `?quieto` o
 * `prefers-reduced-motion`.
 *
 * `delay`: la escena avisa de que está lista en su primer frame y la persiana
 * tarda ~0,9 s en recogerse de arriba abajo. Sin la espera, casi todo el
 * acercamiento ocurría detrás de las lamas.
 */
export const INTRO = { delay: 0.5, seconds: 1.8, extraRadius: 1, extraHeight: 2.4 } as const;

/**
 * Tiempos del muelle de la cámara (segundos ≈ lo que tarda en recorrer la
 * mayor parte del camino). `follow` sigue al vaivén (el destino ya se mueve
 * despacio); `focus` lleva al muñeco; `release` vuelve al parque, más lento
 * porque el viaje es más largo y no hay nada que leer al llegar.
 */
export const CAMERA_SPRING = { follow: 0.45, focus: 0.55, release: 0.8 } as const;

/**
 * Suavizado exponencial independiente del framerate.
 *
 * Un `lerp(a, b, 0.1)` por frame va al doble de rápido a 120 Hz que a 60 Hz; la
 * cámara se sentiría distinta en cada monitor. Esta forma fija el tiempo de
 * convergencia en segundos, no en frames. Para la cámara se usa `smoothDamp`:
 * este arranca a velocidad máxima, y en un cambio de destino eso es un tirón.
 */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/** Estado de un `smoothDamp`: el valor y su velocidad. */
export interface Spring {
  value: number;
  velocity: number;
}

/**
 * Muelle con amortiguamiento CRÍTICO hacia `target` (el `SmoothDamp` de los
 * motores de juego, aproximación de Padé de la exponencial).
 *
 * Al contrario que `damp`, conserva la velocidad entre frames: arranca desde
 * parado, acelera y se posa sin rebotar. Un cambio de destino a mitad de
 * camino no da tirón — la velocidad que llevaba se reconduce. Independiente
 * del framerate. `smoothTime` ≈ tiempo hasta cubrir la mayor parte del camino.
 */
export function smoothDamp(s: Spring, target: number, smoothTime: number, dt: number): number {
  if (dt <= 0) return s.value;
  const omega = 2 / Math.max(smoothTime, 1e-4);
  const x = omega * dt;
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = s.value - target;
  const temp = (s.velocity + omega * change) * dt;
  let next = target + (change + temp) * decay;
  s.velocity = (s.velocity - omega * temp) * decay;
  // Sin pasarse: con dt grandes (pestaña en segundo plano) la aproximación
  // podría cruzar el destino y volver, un rebote que un muelle crítico no tiene.
  if (target - s.value > 0 === next > target) {
    next = target;
    s.velocity = 0;
  }
  s.value = next;
  return next;
}

/** Diferencia angular mínima con signo, para girar siempre por el lado corto. */
export function shortestAngle(from: number, to: number): number {
  return ((((to - from) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
}
