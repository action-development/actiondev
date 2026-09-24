/**
 * Contrato de la calle de /contact: el portal de C/ Colón 20 (Vigo), la
 * oficina real de Action (`BUSINESS` en `packages/shared/src/seo.ts`).
 *
 * Unidades ≈ metros. La fachada es el plano z = 0 y mira hacia +z; la cámara
 * está en la acera de enfrente, a ~11 m. Todo lo que se coloca sale de aquí,
 * así que retocar una medida recoloca la pieza y su baliza a la vez.
 *
 * Del portal real (ver la foto de referencia en la conversación de diseño):
 * muro blanco con el rótulo «Colon 20», zócalo de piedra con barandilla de
 * forja y árboles de bola; revestimiento de listones de madera; soportal con
 * techo de madera y focos; pilastras de piedra, hueco del ascensor, puertas de
 * vidrio con el vestíbulo iluminado; dos macetones grises con ficus trenzado;
 * bolardos y adoquinado. Lo que NO está en la foto y se añade a la acera son
 * los tres objetos de contacto: cabina, buzón y el portero automático (que en
 * el portal real es el directorio de placas).
 */

/** Los tres objetos que se pueden tocar. Cada uno es un canal de contacto. */
export type HotspotId = "whatsapp" | "email" | "callback";

/** Fachada: el muro del edificio, de lado a lado del encuadre. */
export const FACADE = {
  /** Borde izquierdo y derecho del edificio. Sobra por los lados a propósito:
   * con un monitor ultra ancho no debe verse dónde acaba. */
  left: -16,
  right: 16,
  /** Altura a la que termina el soportal y empieza la banda de madera. */
  canopyY: 3.5,
  /** Techo de la banda de madera; encima, los pisos. */
  bandTop: 5,
  /** Vuelo de la banda de madera sobre el plano de la fachada. */
  bandFront: 0.18,
} as const;

/**
 * Pisos de oficinas sobre el portal: aplacado de piedra con huecos de
 * verdad (jambas con fondo, alféizar, carpintería, persiana) y una línea de
 * cornisa en cada forjado. Las alturas son por planta, desde su forjado.
 */
export const UPPER = {
  floors: 4,
  floorH: 3.1,
  /** Paso entre ventanas y número de huecos por planta (centrados en x = 0). */
  pitch: 2.6,
  bays: 12,
  window: { w: 1.5, sill: 0.95, h: 1.7 },
  /** Grosor del muro: lo que se ve de jamba dentro del hueco. */
  depth: 0.24,
  /** Frente del aplacado (sobre el plano de la banda de madera no: detrás). */
  front: 0.08,
  /** Cornisa de coronación. */
  crown: { h: 0.55, projection: 0.34 },
} as const;

/** Altura total del edificio. */
export const BUILDING_TOP = FACADE.bandTop + UPPER.floors * UPPER.floorH;

/**
 * Listones del revestimiento de madera: paso, ancho visto y canto. El hueco
 * entre dos listones (paso − ancho) deja ver el rastrel oscuro de detrás, que
 * es lo que da el ritmo de la foto.
 */
export const SLAT = { pitch: 0.1, width: 0.072, depth: 0.035 } as const;

/** Tramo del muro blanco con el rótulo, a la izquierda del portal. */
export const WHITE_WALL = {
  x0: -16,
  x1: -2.4,
  /** Zócalo de piedra: alto y vuelo hacia la acera. */
  plinthH: 0.9,
  plinthDepth: 0.38,
  /** Rótulo «Colon 20»: centro y ancho. */
  sign: { x: -6.3, y: 3.02, w: 2.4 },
  /** Árboles de bola sobre el zócalo, detrás de la barandilla. */
  topiary: [-7.9, -6.8, -4.6, -3.5] as const,
} as const;

/** Soportal: el hueco retranqueado del portal, bajo el techo de madera. */
export const PORTAL = {
  x0: -2.4,
  x1: 16,
  /** Fondo del soportal (pared del portal). */
  backZ: -2.4,
  /** Pilastras de piedra y hueco del ascensor, sobre la pared del fondo. */
  pillars: [
    [-0.5, 0.15],
    [1.65, 2.3],
  ] as const,
  lobby: { x0: 0.15, x1: 1.65, h: 2.55 },
  /** Puertas de vidrio con el vestíbulo iluminado detrás. */
  glass: { x0: 3.4, x1: 6.8, h: 2.9 },
  /** Peldaño de piedra delante del ascensor. */
  step: { x0: -0.7, x1: 2.5, h: 0.12, depth: 0.5 },
  /** Focos empotrados del techo del soportal (x, z). */
  downlights: [
    [-1.3, -1.1],
    [0.9, -0.6],
    [3.0, -1.2],
    [5.2, -0.6],
    [7.4, -1.2],
  ] as const,
} as const;

/** Macetones con ficus de tronco trenzado. */
export const PLANTERS: readonly [number, number][] = [
  // Pegado al lateral: más al centro, su copa tapaba el portero al enfocarlo.
  [-1.95, -0.55],
  [2.9, -0.95],
];

/** Bolardos de la acera, a la derecha (junto a la rampa del garaje). */
export const BOLLARDS: readonly [number, number][] = [
  [7.2, 0.55],
  [8.1, 0.4],
  [9.0, 0.25],
];

/** Acera: de la fachada hasta detrás de la cámara. */
export const SIDEWALK = { z0: 0, z1: 16, halfWidth: 22 } as const;

/**
 * Posición de cada objeto de contacto: `x`, `z` en el suelo, `rotY` para que
 * mire un poco a la cámara y `beacon` = altura de su baliza.
 *
 * La cabina y el buzón van en la acera, a los dos lados y DELANTE de la
 * fachada: son lo primero que se ve y equilibran el encuadre. El portero va
 * en su sitio de verdad, en la pared del soportal, junto al ascensor.
 */
export const HOTSPOTS: Record<HotspotId, { x: number; z: number; rotY: number; beacon: number }> = {
  whatsapp: { x: -3.7, z: 2.9, rotY: 0.3, beacon: 2.95 },
  email: { x: 4.0, z: 2.7, rotY: -0.3, beacon: 1.95 },
  callback: { x: -0.98, z: PORTAL.backZ + 0.04, rotY: 0, beacon: 2.35 },
};

/**
 * Encuadre al apuntar cada objeto: la cámara se planta delante de él, sobre
 * su normal, a `distance` y a la altura `eye`, mirando a `target` (altura de
 * lo que importa: el teléfono, la boca del buzón, la placa del portero).
 */
export const FOCUS: Record<HotspotId, { distance: number; eye: number; target: number }> = {
  whatsapp: { distance: 3.7, eye: 1.8, target: 1.55 },
  email: { distance: 3.1, eye: 1.5, target: 1.2 },
  callback: { distance: 2.6, eye: 1.62, target: 1.52 },
};

/** Cabina de teléfono: medidas del cuerpo. */
export const BOOTH = { w: 1.05, d: 0.85, h: 2.35 } as const;

/** Buzón: cuerpo sobre pie. */
export const POSTBOX = { w: 0.62, d: 0.5, bodyH: 0.78, footH: 0.62 } as const;

/** Portero automático / directorio de placas. */
export const INTERCOM = { w: 0.5, h: 0.84, y: 1.5 } as const;

/**
 * Cámara: en la acera de enfrente, a la altura de los ojos, mirando un poco
 * por encima del portal para que la banda de madera y el arranque de los
 * pisos entren en plano bajo la cápsula del Header.
 */
export const CAMERA = {
  fov: 42,
  /** Distancia a la fachada con pantalla 16:9. */
  distance: 13.5,
  eyeY: 1.9,
  target: [0.4, 1.85, 0] as const,
  /** Semiancho que TIENE que entrar a la profundidad de la acera donde están
   * la cabina y el buzón: con pantallas estrechas la cámara retrocede. */
  mustFitHalfWidth: 5.3,
  mustFitZ: 2.8,
  /** Paralaje del ratón: desplazamiento lateral y vertical de la cámara. */
  parallax: { x: 0.7, y: 0.28 },
  /** Entrada: la cámara llega desde más lejos. */
  introExtra: 2.4,
  introSeconds: 1.8,
  /** Velocidad del acercamiento a un objeto (suavizado exponencial, 1/s). */
  focusLambda: 3.2,
  /** Paralaje que queda con un objeto enfocado (fracción del normal). */
  focusParallax: 0.25,
} as const;

/**
 * Dónde queda el objeto enfocado en pantalla, en NDC vertical: por encima del
 * centro, porque el HUD tapa el tercio de abajo (y en móvil, la mitad).
 */
export function focusScreenY(aspect: number): number {
  return aspect < 1 ? 0.5 : 0.3;
}

/** Distancia de la cámara a la fachada para que la cabina y el buzón quepan
 * con el aspecto de la pantalla. Nunca más cerca que `CAMERA.distance`. */
export function cameraDistance(aspect: number): number {
  const halfTan = Math.tan(((CAMERA.fov / 2) * Math.PI) / 180);
  const needed = CAMERA.mustFitHalfWidth / (halfTan * aspect) + CAMERA.mustFitZ;
  return Math.max(CAMERA.distance, needed);
}

/**
 * Cuánto baja el punto de mira con pantallas en vertical. El HUD ocupa la
 * mitad de abajo del móvil: bajando la mirada, el portal sube a la mitad de
 * arriba y queda a la vista en lugar de debajo del panel.
 */
export function targetDrop(aspect: number): number {
  return clamp((1.2 - aspect) * 5, 0, 4);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** ¿`?quieto`? Congela paralaje, entrada y balizas (capturas deterministas). */
export function isStill(): boolean {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).has("quieto");
}
