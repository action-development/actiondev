import { PLACEHOLDER_IMAGE, type Project } from "@actiondev/shared";

/**
 * Contrato compartido de la sala recreativa de /projects.
 *
 * Un pasillo RECTO hacia -Z: una fila de máquinas a cada lado, el camino en
 * medio y, al fondo del todo, la puerta de "TRABAJEMOS JUNTOS" que lleva a
 * /contact. La cámara es el visitante (primera persona) y va sobre raíles: solo
 * avanza o retrocede por el eje del pasillo y gira la cabeza a un lado o al
 * otro. Sin colisiones ni navegación libre: no hay forma de perderse.
 *
 * Unidades en metros. Las máquinas miran al pasillo: su frente es +Z en local
 * y se giran ±90° al colocarlas.
 */

/** Medidas del pasillo. */
export const HALL = {
  /** Semiancho hasta la pared que hay detrás de las máquinas. */
  halfWidth: 2.55,
  /** Altura del techo. */
  height: 3.7,
  /** Pared de la entrada (a la espalda de la cámara al empezar). */
  entranceZ: 4,
  /** Pared del fondo, la de la puerta. */
  endZ: -25,
} as const;

/**
 * Perfil lateral del mueble — la silueta clásica de una recreativa vertical de
 * los 80, vista de lado. Puntos `[z, y]` en metros (z = hacia el jugador), en
 * sentido ANTIHORARIO: de atrás-abajo hacia delante, sube por el frontal y
 * vuelve por el techo. De él salen el cuerpo, los laterales, el perfil de goma
 * y la posición de TODO lo que va montado en el frontal, así que retocar la
 * silueta aquí recoloca pantalla, marquesina y mandos a la vez.
 */
export const PROFILE = {
  /** Trasera, suelo. */
  A: [-0.42, 0],
  /** Zócalo frontal: suelo y arriba (aquí va el monedero). */
  B: [0.28, 0],
  C: [0.28, 0.86],
  /** Panel de mandos: vuela sobre el zócalo, labio frontal y tablero que sube hacia la pantalla. */
  D: [0.42, 0.92],
  E: [0.42, 0.99],
  F: [0.16, 1.07],
  /** Pantalla hundida e inclinada hacia atrás. */
  G: [0.12, 1.08],
  H: [0.0, 1.62],
  /** Voladizo de la marquesina: por debajo, la rejilla del altavoz. */
  I: [-0.02, 1.64],
  J: [0.18, 1.72],
  /** Marquesina, ligeramente inclinada hacia el jugador. */
  K: [0.22, 1.98],
  L: [0.2, 2.03],
  /** Techo, trasera. */
  M: [-0.42, 2.03],
} as const satisfies Record<string, readonly [number, number]>;

export type ProfilePoint = keyof typeof PROFILE;
export const PROFILE_ORDER: readonly ProfilePoint[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];

/**
 * Marco de un tramo del perfil, para montar algo plano sobre él: centro,
 * longitud, giro en X que lleva la normal +Z de un plano a la normal exterior
 * del tramo (y su +Y a lo largo del tramo) y esa normal.
 */
export interface SegmentFrame {
  z: number;
  y: number;
  length: number;
  angle: number;
  normal: { z: number; y: number };
}

export function segmentFrame(from: ProfilePoint, to: ProfilePoint, offset = 0): SegmentFrame {
  const [z0, y0] = PROFILE[from];
  const [z1, y1] = PROFILE[to];
  const length = Math.hypot(z1 - z0, y1 - y0);
  const dz = (z1 - z0) / length;
  const dy = (y1 - y0) / length;
  // Perfil antihorario → la normal exterior es la dirección girada -90°.
  const normal = { z: dy, y: -dz };
  return {
    z: (z0 + z1) / 2 + normal.z * offset,
    y: (y0 + y1) / 2 + normal.y * offset,
    length,
    angle: Math.atan2(dz, dy),
    normal,
  };
}

const SCREEN_FRAME = segmentFrame("G", "H", 0.012);
const MARQUEE_FRAME = segmentFrame("J", "K", 0.004);

/** Máquina recreativa — medidas del mueble (origen en el suelo, centro). */
export const CABINET = {
  /** Ancho total, laterales incluidos, y ancho del cuerpo entre laterales. */
  width: 0.78,
  innerWidth: 0.74,
  /** Fondo: de la trasera al labio del panel de mandos. */
  depth: PROFILE.E[0] - PROFILE.A[0],
  /** Frente de las máquinas: a esta distancia del eje del pasillo. */
  frontX: 1.5,
  /** Separación entre centros a lo largo del pasillo. */
  spacing: 1.15,
  /** Z del primer par (el más cercano a la entrada). */
  firstZ: -1.6,
  /** Pantalla: centro y tamaño en local (4:3, como un tubo de verdad). */
  screen: { y: SCREEN_FRAME.y, z: SCREEN_FRAME.z, width: 0.52, height: 0.39, tilt: SCREEN_FRAME.angle },
  /** Marquesina iluminada con el nombre. */
  marquee: { y: MARQUEE_FRAME.y, z: MARQUEE_FRAME.z, width: 0.72, height: 0.24, tilt: MARQUEE_FRAME.angle },
} as const;

/** Puerta del fondo. */
export const DOOR = {
  width: 1.9,
  height: 2.3,
  /** Rótulo "TRABAJEMOS JUNTOS" sobre el dintel. */
  signY: 2.56,
  signHeight: 0.3,
  /** Logo de Action encima del rótulo. */
  logoY: 3.16,
  logoHeight: 0.62,
  /** Fondo del vano (grosor de la pared): las hojas van a media profundidad. */
  reveal: 0.3,
  /** Grueso del marco que forra el vano (y del hueco en la pared a cada lado). */
  frame: 0.08,
  /** Giro de cada hoja abierta del todo (rad) y entreabierta al apuntarla. */
  openAngle: 1.75,
  ajarAngle: 0.14,
} as const;

/** Campo de visión vertical de la cámara del pasillo (grados). */
export const CAMERA_FOV = 58;

/**
 * La sala de neón tras la puerta. Su pared del fondo son las lamas de la
 * persiana del sitio (`ui/Blinds`): mide `2 · eyeHeight` de alto y la salida
 * deja la cámara, a la altura de los ojos y mirando de frente, justo a la
 * distancia en la que esa pared llena el alto del viewport. Ese último frame es
 * idéntico a la persiana cerrada, y ahí la persiana DOM toma el relevo.
 */
export const NEON_ROOM = {
  /** Del plano de la puerta a la pared de lamas. */
  depth: 6,
  /** Lamas: las mismas que `BLIND_COUNT`, con el mismo hueco en píxeles. */
  slats: 10,
  gapPx: 3,
} as const;

/** Salida por la puerta (s): las hojas se abren y, solapado, la cámara entra. */
export const EXIT = {
  open: 0.7,
  dollyDelay: 0.35,
  dolly: 1.45,
  /** Pico de apertura del `fov` a mitad de carrera: sensación de velocidad. */
  fovKick: 10,
} as const;

/** Cámara en primera persona. */
export const WALK = {
  eyeHeight: 1.6,
  /** Z de salida y, a la vez, lo más atrás que se puede ir: a unos pasos del
   * primer par, con sus laterales ya enmarcando el pasillo (decisión del
   * cliente — antes era 2,6 y se veía demasiado hueco antes de las máquinas). */
  startZ: 1.65,
  /** Z a la que se llega a la puerta y se pasa a /contact. */
  doorZ: HALL.endZ + 2.4,
  /** Aceleración y velocidad máxima al andar (m/s², m/s). */
  accel: 9,
  maxSpeed: 4.2,
  /** Frenado exponencial cuando no se pulsa nada (1/s). */
  friction: 5.5,
  /** Impulso de la rueda del ratón por píxel de `deltaY`. */
  wheelImpulse: 0.012,
  /** Giro de cabeza hacia un lado cuando no hay máquina que mirar (rad). */
  sideYaw: 1.05,
  /** Distancia por delante de la cámara donde cae la mirada a 60° sobre el
   * frente de las máquinas: la máquina "de enfrente" es la más cercana a ese z. */
  lookAhead: CABINET.frontX / Math.tan(1.05),
  /** Mirada libre con el ratón (rad a cada lado): da vida sin marear. */
  mouseYaw: 0.12,
  mousePitch: 0.06,
  /**
   * Franjas laterales del ratón: llevar el puntero al borde de la pantalla
   * equivale a pulsar ← / →. Coordenadas NDC (-1…1). Se dispara al entrar más
   * allá de `edgeEnter` y se rearma al volver por dentro de `edgeExit`
   * (histéresis: quieto en el borde no repite). `edgeDwell` = segundos que hay
   * que quedarse, para que cruzar el borde de paso no gire la cabeza.
   * `edgeMaxY` deja fuera las bandas de arriba y abajo, donde están el Header y
   * «Ver lista»: ir a pulsarlos no debe mirar a una fila.
   */
  edgeEnter: 0.88,
  edgeExit: 0.72,
  edgeDwell: 0.18,
  edgeMaxY: 0.72,
} as const;

/** Alto de la sala de neón: centrada en los ojos para que el encuadre final sea simétrico. */
export const NEON_ROOM_HEIGHT = WALK.eyeHeight * 2;

/** Z de la pared de lamas. */
export const NEON_WALL_Z = HALL.endZ - NEON_ROOM.depth;

/** Distancia a la que la pared de lamas llena exactamente el alto del viewport. */
function neonFillDistance(fovDeg: number): number {
  return NEON_ROOM_HEIGHT / (2 * Math.tan((fovDeg * Math.PI) / 360));
}

/** Z final de la cámara en la salida. */
export const EXIT_CAMERA_Z = NEON_WALL_Z + neonFillDistance(CAMERA_FOV);

/** Semiancho de la sala de neón para que sus paredes no asomen en el encuadre final. */
export function neonRoomHalfWidth(aspect: number): number {
  const visible = neonFillDistance(CAMERA_FOV) * Math.tan((CAMERA_FOV * Math.PI) / 360) * aspect;
  return Math.max(4.2, visible + 0.4);
}

/** Lado del pasillo: -1 izquierda, 1 derecha. */
export type HallSide = -1 | 1;

export interface MachineSpec {
  index: number;
  project: Project;
  side: HallSide;
  /** Posición del centro del mueble en el suelo. */
  x: number;
  z: number;
  /** Giro Y: el frente mira al eje del pasillo. */
  rotationY: number;
  /** Color del lateral: por categoría del proyecto. */
  sideColor: string;
  /** Imagen real para la pantalla, o `null` si solo hay placeholder (entonces
   * la pantalla se queda en su modo demo con el nombre). */
  image: string | null;
}

/**
 * Color del lateral por categoría. Tonos de sala recreativa de los 80 pero
 * apagados: el único color que grita en la web es el lima, y aquí lo llevan
 * solo las aplicaciones web, que son el núcleo del negocio.
 */
const CATEGORY_COLOR: Record<string, string> = {
  "Web Application": "#c8ff00",
  "Mobile App": "#e0674f",
  Website: "#4a86c8",
  "E-commerce": "#e3b341",
  "Landing Page": "#8a6fd1",
  "Desktop App": "#3fa7a3",
};
const FALLBACK_COLOR = "#7e7e7e";

/**
 * Coloca los proyectos en el pasillo. Orden: los destacados primero, que son
 * los que quedan junto a la entrada; alternando lado (izquierda, derecha) para
 * que cada par se lea de un vistazo.
 */
export function buildMachines(projects: readonly Project[]): MachineSpec[] {
  const ordered = [...projects.filter((p) => p.featured), ...projects.filter((p) => !p.featured)];
  return ordered.map((project, index) => {
    const side: HallSide = index % 2 === 0 ? -1 : 1;
    const row = Math.floor(index / 2);
    return {
      index,
      project,
      side,
      x: side * (CABINET.frontX + CABINET.depth / 2),
      z: CABINET.firstZ - row * CABINET.spacing,
      // Frente local = +Z. Izquierda (x < 0) mira a +X, derecha a -X.
      rotationY: side === -1 ? Math.PI / 2 : -Math.PI / 2,
      sideColor: CATEGORY_COLOR[project.category] ?? FALLBACK_COLOR,
      image: project.image && project.image !== PLACEHOLDER_IMAGE ? project.image : null,
    };
  });
}

/** Z de la última fila: el pasillo de máquinas acaba ahí. */
export function lastRowZ(count: number): number {
  return CABINET.firstZ - (Math.ceil(count / 2) - 1) * CABINET.spacing;
}

/** Centro de la pantalla de una máquina, en mundo. */
export function screenCenter(m: MachineSpec): { x: number; y: number; z: number } {
  // El frente local (+Z) apunta al eje: en mundo, hacia -side en X.
  return { x: m.x - m.side * CABINET.screen.z, y: CABINET.screen.y, z: m.z };
}

/**
 * Acople a una máquina: la cámara se planta delante de su pantalla, de frente
 * a la normal del tubo, a la distancia justa para que la pantalla ocupe `fill`
 * del viewport. El DOM de la ficha (`arcade/ArcadeScreen`) se dimensiona con
 * la MISMA fracción y el mismo 4:3, así que cae encima del tubo al píxel sin
 * tener que proyectar esquinas cada frame.
 */
export const DOCK = {
  /** Fracción del viewport (en el eje que limite) que ocupa la pantalla. */
  /** Por debajo de ~0,6 el texto se queda pequeño; por encima, el tubo tapa
   * la máquina y se pierde la sensación de estar delante de una recreativa. */
  fill: 0.6,
  /** Tolerancia (m) para dar la cámara por llegada y encender la ficha. */
  arrive: 0.012,
} as const;

/** Normal de la pantalla (hacia el jugador), en mundo. */
const SCREEN_NORMAL = segmentFrame("G", "H").normal;

/** Posición de la cámara acoplada a `m` para un viewport de ese aspecto. */
export function dockPosition(m: MachineSpec, aspect: number, fovDeg: number): { x: number; y: number; z: number } {
  const sc = screenCenter(m);
  const tan = Math.tan((fovDeg * Math.PI) / 360);
  // Alto visible a distancia d = 2·d·tan; ancho = eso × aspecto. Manda el eje
  // que primero se llena.
  const byHeight = CABINET.screen.height / (DOCK.fill * 2 * tan);
  const byWidth = CABINET.screen.width / (DOCK.fill * 2 * tan * aspect);
  const d = Math.max(byHeight, byWidth);
  return {
    x: sc.x - m.side * SCREEN_NORMAL.z * d,
    y: sc.y + SCREEN_NORMAL.y * d,
    z: sc.z,
  };
}

/**
 * Máquina de al lado en la MISMA fila, según la mano del visitante acoplado:
 * `hand` = 1 la de su derecha, -1 la de su izquierda. Mirando a la fila
 * izquierda la derecha es el fondo del pasillo; mirando a la derecha, la
 * entrada. Las filas alternan índice, así que el vecino está a ±2.
 */
export function neighborMachine(machines: readonly MachineSpec[], index: number, hand: -1 | 1): number | null {
  const m = machines[index];
  if (!m) return null;
  const next = index + (m.side === -1 ? 2 : -2) * hand;
  return machines[next] ? next : null;
}

/** ¿`?quieto`? Congela la mirada libre del ratón (capturas deterministas). */
export function isStill(): boolean {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).has("quieto");
}
