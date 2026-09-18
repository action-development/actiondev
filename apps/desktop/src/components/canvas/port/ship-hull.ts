import { HOLD_MAX_X, HOLD_MIN_X } from "./crane-logic";

/**
 * Casco del portacontenedores como lo haría un astillero: una CUADERNA que
 * barre la eslora. Nada de cubos ni de extrusión plana — la manga se cierra
 * en la proa, el pantoque va redondeado, el costado tiene astilla (flare) y la
 * línea de cubierta lleva su arrufo (sheer), más alta a proa que al medio.
 *
 * Lógica pura y testeable; el render vive en `PaintedShip.tsx`.
 *
 * Ojo con los nombres: en pantalla la PROA queda a la IZQUIERDA (x pequeña) y
 * el puente a la derecha, igual que en el fondo pintado.
 */

/** Punta del tajamar, a la altura de la cubierta. El muelle acaba en x = 4.5: no pasar de ahí. */
export const BOW_X = 4.8;
/** Espejo de popa. */
export const STERN_X = 22;
/** Semimanga máxima. */
export const HALF_BEAM = 2.3;
/** Cota de la quilla en el cuerpo cilíndrico. */
export const KEEL_Y = -10;
/** Alto de la amurada sobre la cubierta. */
export const BULWARK = 0.74;
/**
 * Sobre la bodega el costado se REBAJA a esta cota: si subiese hasta la
 * amurada, el casco taparía entero el contenedor que la grúa mete dentro.
 * Es lo mismo que hace el dibujo del fondo.
 */
export const CUT_Y = -5.5;
/**
 * Longitud de las rampas que bajan de la amurada al rebaje. Cortas dan un
 * escalón en la silueta; largas dibujan una curva limpia.
 */
const RAMP = 1.3;
/**
 * Eslora hasta la que la amurada se mantiene ALTA por proa, y largo de su
 * rampa. No sale de `HOLD_MIN_X`: sale del fondo pintado. El barco del dibujo
 * tiene un castillo de proa alto hasta aquí, así que si el casco 3D baja
 * antes, el castillo pintado asoma por encima del canto y se ven DOS proas
 * superpuestas — que es lo que parecía una proa rota.
 */
export const FWD_CUT_X = 7.4;
const FWD_RAMP = 1.0;
/** Eslora a partir de la cual el costado ya está rebajado del todo. */
export const CUT_START_X = FWD_CUT_X + FWD_RAMP;

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const smooth = (t: number) => {
  const k = clamp01(t);
  return k * k * (3 - 2 * k);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Semimanga a una eslora dada: fina en la proa, llena al medio, afinada a popa. */
export function halfBeamAt(x: number): number {
  // Entrada CORTA a propósito. Con una entrada larga la manga tarda tanto en
  // abrirse que todo el costado de proa queda casi contenido en el plano x-y:
  // a esta cámara eso es una pared frontal, un cartón azul pegado al puerto.
  // Abriéndola rápido el costado gira y la proa se lee en escorzo.
  const ENTRANCE = 2.4;
  const RUN = 3.2;
  if (x <= BOW_X) return HALF_BEAM * 0.04;
  let f: number;
  if (x < BOW_X + ENTRANCE) f = 0.04 + 0.96 * smooth((x - BOW_X) / ENTRANCE);
  else if (x > STERN_X - RUN) f = 1 - 0.45 * smooth((x - (STERN_X - RUN)) / RUN);
  else f = 1;
  return HALF_BEAM * f;
}

/**
 * Cota del pie de roda. TIENE que quedar por debajo de la flotación
 * (`WATER_Y = -7.9`): si el fondo del casco arranca por encima del agua, la
 * proa se ve literalmente colgando en el aire, con el fondo cortado en
 * diagonal y sin nada que lo remate. Con la roda metida en el agua el barco
 * la corta y la traca roja envuelve la proa.
 */
const STEM_FOOT_Y = -8.35;

/**
 * Cota del fondo: el pie de roda sube hacia la proa (sin salir del agua) y el
 * codaste algo hacia la popa. Esto es lo que lanza el tajamar: el punto más a
 * proa de cada altura se va hacia atrás al bajar, así que la roda queda
 * inclinada en vez de ser una pared vertical.
 */
export function keelYAt(x: number): number {
  const FOREFOOT = 3.4;
  const AFT = 2.6;
  if (x < BOW_X + FOREFOOT) return lerp(STEM_FOOT_Y, KEEL_Y, smooth((x - BOW_X) / FOREFOOT));
  if (x > STERN_X - AFT) return lerp(KEEL_Y, -9.1, smooth((x - (STERN_X - AFT)) / AFT));
  return KEEL_Y;
}

/**
 * Línea de cubierta con arrufo: mínimo al medio, sube algo a proa y a popa.
 * Poco arrufo — pasarse hace que la proa se despegue del resto del casco y la
 * silueta se rompa.
 */
export function deckYAt(x: number): number {
  const MID = 12;
  if (x < MID) {
    const t = (MID - x) / 7;
    return -5.35 + 0.55 * t * t;
  }
  const t = (x - MID) / 10;
  return -5.35 + 0.3 * t * t;
}

/** Canto superior del costado de la banda que mira a cámara (con el rebaje de la bodega). */
export function nearTopAt(x: number): number {
  return topAt(x, CUT_Y);
}

/** Canto superior de un costado dado su cota de rebaje. */
function topAt(x: number, cut: number): number {
  const full = deckYAt(x) + BULWARK;
  if (x <= FWD_CUT_X) return full;
  if (x < FWD_CUT_X + FWD_RAMP) return lerp(full, cut, smooth((x - FWD_CUT_X) / FWD_RAMP));
  if (x <= HOLD_MAX_X) return cut;
  if (x < HOLD_MAX_X + RAMP) return lerp(cut, full, smooth((x - HOLD_MAX_X) / RAMP));
  return full;
}

/**
 * La banda opuesta también se rebaja sobre la bodega, pero menos: así hace de
 * fondo de la escotilla y, por encima, se sigue viendo la ría. Si la dejas a
 * la altura de la amurada, el barco vuelve a parecer un bloque macizo.
 */
export const FAR_CUT_Y = CUT_Y + 0.55;

export function farTopAt(x: number): number {
  return topAt(x, FAR_CUT_Y);
}

/** Fracción de la semimanga donde queda el mamparo interior de la escotilla. */
export const HATCH_INNER = 0.72;

/**
 * Media cuaderna, del canto de la amurada a la quilla. El punto de arriba sale
 * un 6 % más ancho: eso es la astilla del costado, lo que hace que el casco no
 * parezca una caja.
 */
export function sectionPoints(b: number, top: number, keel: number): [number, number][] {
  const t = top - keel;
  const bilge = Math.min(1, t * 0.26);
  return [
    [b * 1.06, top],
    [b * 1.0, keel + t * 0.62],
    [b * 0.99, keel + bilge],
    [b * 0.86, keel + bilge * 0.32],
    [b * 0.55, keel + 0.02],
    [b * 0.18, keel],
  ];
}

/** Puntos por media cuaderna. */
export const SECTION_N = 6;
/** Puntos del anillo completo: dos bandas + la quilla. */
export const RING_N = SECTION_N * 2 + 1;

/** Esloras donde cortar: muy juntas en la proa, que es donde está la curva. */
export function stations(): number[] {
  const xs: number[] = [];
  for (let x = BOW_X; x < BOW_X + 4.4; x += 0.4) xs.push(x);
  for (let x = BOW_X + 4.4; x < 17.2; x += 0.8) xs.push(x);
  for (let x = 17.2; x < STERN_X; x += 0.5) xs.push(x);
  xs.push(STERN_X);
  return xs;
}

export interface Surface {
  positions: number[];
  uvs: number[];
  indices: number[];
}

/**
 * Forro del casco. Las UV van en COORDENADAS DE MUNDO (u = x, v = y) para que
 * la línea de flotación de la textura caiga siempre en su cota real, sea cual
 * sea la forma de la cuaderna.
 */
export function buildHullSurface(): Surface {
  const xs = stations();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (const x of xs) {
    const b = halfBeamAt(x);
    const keel = keelYAt(x);
    const near = sectionPoints(b, nearTopAt(x), keel);
    const far = sectionPoints(b, farTopAt(x), keel);
    const ring: [number, number][] = [
      ...near,
      [0, keel],
      ...far.slice().reverse().map(([z, y]) => [-z, y] as [number, number]),
    ];
    for (const [z, y] of ring) {
      positions.push(x, y, z);
      uvs.push(x, y);
    }
  }

  for (let i = 0; i < xs.length - 1; i++) {
    const a = i * RING_N;
    const c = (i + 1) * RING_N;
    // El anillo va del canto de la banda de cámara, por debajo, hasta la banda
    // opuesta; con las esloras creciendo en +x eso da normal -z, así que el
    // giro va al revés para que la cara buena mire hacia fuera.
    for (let j = 0; j < RING_N - 1; j++) {
      indices.push(a + j, c + j + 1, c + j, a + j, a + j + 1, c + j + 1);
    }
  }

  // Espejo de popa: abanico desde el centro del último anillo.
  const last = (xs.length - 1) * RING_N;
  const cx = STERN_X;
  const keel = keelYAt(cx);
  const centre = positions.length / 3;
  positions.push(cx, (farTopAt(cx) + keel) / 2, 0);
  uvs.push(cx, (farTopAt(cx) + keel) / 2);
  for (let j = 0; j < RING_N - 1; j++) indices.push(centre, last + j, last + j + 1);

  return { positions, uvs, indices };
}

/**
 * Cubierta: rejilla a lo largo y a lo ancho a la cota del arrufo, saltándose
 * la boca de la escotilla y el margen de la banda rebajada (ahí no hay
 * cubierta, es lo que deja ver la bodega).
 */
export function buildDeckSurface(zSamples = 9): Surface {
  const xs = stations();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (const x of xs) {
    // Un poco por dentro del forro: si llega al canto, asoma por la roda.
    const b = halfBeamAt(x) * 0.92;
    const y = deckYAt(x);
    for (let j = 0; j < zSamples; j++) {
      const z = -b + (2 * b * j) / (zSamples - 1);
      positions.push(x, y, z);
      uvs.push(x, z);
    }
  }

  for (let i = 0; i < xs.length - 1; i++) {
    const xMid = (xs[i] + xs[i + 1]) / 2;
    const overHold = xMid > FWD_CUT_X - 0.1 && xMid < HOLD_MAX_X + 0.1;
    const a = i * zSamples;
    const c = (i + 1) * zSamples;
    for (let j = 0; j < zSamples - 1; j++) {
      // Sobre la bodega no hay cubierta NINGUNA: el margen de la banda opuesta
      // quedaba por encima del canto rebajado y asomaba como un alambre.
      if (overHold) continue;
      indices.push(a + j, a + j + 1, c + j + 1, a + j, c + j + 1, c + j);
    }
  }

  return { positions, uvs, indices };
}

/**
 * Trancanil: la banda clara que remata el canto del costado y dibuja el
 * arrufo. Sobre la bodega se convierte en la brazola de la escotilla.
 */
export function buildRail(near: boolean, width = 0.2): Surface {
  const xs = stations();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (const x of xs) {
    const b = halfBeamAt(x) * 1.06;
    const y = near ? nearTopAt(x) : farTopAt(x);
    // En la proa la manga es casi cero: si el trancanil mantuviese su ancho,
    // cruzaría la crujía y asomaría por la banda de enfrente.
    const w = Math.min(width, b * 0.9);
    const outer = near ? b : -b;
    const inner = near ? b - w : -(b - w);
    positions.push(x, y, outer, x, y, inner);
    uvs.push(x, 0, x, 1);
  }

  for (let i = 0; i < xs.length - 1; i++) {
    const a = i * 2;
    const c = (i + 1) * 2;
    if (near) indices.push(a, c, c + 1, a, c + 1, a + 1);
    else indices.push(a, a + 1, c + 1, a, c + 1, c);
  }

  return { positions, uvs, indices };
}

/**
 * Cinta del trancanil, VERTICAL, pegada por fuera al costado y colgando del
 * canto. El trancanil de `buildRail` es horizontal y a esta cámara se ve de
 * canto: por proa, donde no hay rebaje que lo enseñe, el casco se quedaba sin
 * remate — un plano azul cortado contra el cielo, sin la línea clara que
 * dibuja el arrufo. Esta cinta es la que da ese remate en toda la eslora.
 */
export function buildSheerStrake(near: boolean, height = 0.32): Surface {
  const xs = stations();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (const x of xs) {
    // Un pelo por fuera del forro (que ya sale a 1.06) para no pelearse con él.
    const b = halfBeamAt(x) * 1.075;
    const y = near ? nearTopAt(x) : farTopAt(x);
    const z = near ? b : -b;
    positions.push(x, y, z, x, y - height, z);
    uvs.push(x, 0, x, 1);
  }

  for (let i = 0; i < xs.length - 1; i++) {
    const a = i * 2;
    const c = (i + 1) * 2;
    if (near) indices.push(a, a + 1, c + 1, a, c + 1, c);
    else indices.push(a, c, c + 1, a, c + 1, a + 1);
  }

  return { positions, uvs, indices };
}

/** Caja de la superestructura (puente + chimenea + palo) para el hit-test. */
const HOUSE_MIN_X = 16.4;
const HOUSE_MAX_X = 19.6;
const HOUSE_TOP_Y = 0.7;
/** Cota superior del casco para el hit-test: amurada de proa + margen. */
const HULL_TOP_Y = -3.9;

/**
 * ¿El punto (x, y) del plano z = 0 cae sobre el barco? Casco de proa a popa
 * hasta la amurada, más la caja del puente. Sirve al click del easter egg de
 * la bocina; la bodega cuenta como barco (los contenedores se comprueban
 * ANTES en el interceptor, así que aquí ya no hay ninguno).
 */
export function pickShipAt(x: number, y: number): boolean {
  if (x < BOW_X || x > STERN_X) return false;
  if (y >= KEEL_Y && y <= HULL_TOP_Y) return true;
  return x >= HOUSE_MIN_X && x <= HOUSE_MAX_X && y > HULL_TOP_Y && y <= HOUSE_TOP_Y;
}
