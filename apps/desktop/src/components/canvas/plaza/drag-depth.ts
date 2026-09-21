/**
 * Profundidad del arrastre de la plaza (`/resenas`) — lógica pura.
 *
 * El arrastre tiene DOS ejes y los dos los da el puntero sobre el plano del
 * suelo: izquierda/derecha = lado, arriba/abajo = profundidad (más lejos / más
 * cerca). No hay eje de altura — los muñecos no se levantan del suelo.
 *
 * Lo que queda aquí es el tope de ese segundo eje: cuanto más sube el puntero,
 * más rasante corta su rayo el plano, y cerca del horizonte la distancia se
 * dispara a cientos de unidades. Sin acotar, un gesto corto manda al muñeco
 * fuera de la plaza.
 *
 * Vive fuera del componente para poder testearlo sin montar R3F.
 */

/** Punto en planta. Estructural a propósito: un `THREE.Vector3` vale. */
export interface XZ {
  x: number;
  z: number;
}

/** Distancia mínima y máxima a la cámara, medida en horizontal. */
export interface DepthRange {
  readonly min: number;
  readonly max: number;
}

/**
 * Deja `point` entre `range.min` y `range.max` respecto a `camera`, moviéndolo
 * a lo largo de `dir` (dirección de la cámara; su componente vertical se
 * ignora).
 *
 * Lo que se acota es la distancia CON SIGNO sobre el eje de vista, no el radio:
 * con un radio, un corte casi paralelo al suelo puede caer POR DETRÁS de la
 * cámara y `Math.hypot` ya no distingue delante de detrás — el muñeco
 * reaparecía a la espalda del visitante. Además es justo la magnitud que define
 * la profundidad en `PlazaWorld`: lo que sobra en lateral no pinta.
 *
 * Muta `point` y no aloca: se llama por frame.
 */
export function clampDepth<T extends XZ>(point: T, dir: XZ, camera: XZ, range: DepthRange): T {
  const len = Math.hypot(dir.x, dir.z);
  // Cámara mirando en vertical: no hay "lejos" al que empujar.
  if (len < 1e-6) return point;
  const ux = dir.x / len;
  const uz = dir.z / len;

  // Proyección sobre el eje de vista: negativa = a la espalda de la cámara.
  const axial = (point.x - camera.x) * ux + (point.z - camera.z) * uz;
  const correction = Math.min(Math.max(axial, range.min), range.max) - axial;
  if (correction !== 0) {
    point.x += ux * correction;
    point.z += uz * correction;
  }
  return point;
}
