/**
 * 404 de escritorio (`components/ui/NotFoundView.tsx`): un «404» gigante cuyo
 * 0 es la mascota. Aquí va la parte pura (geometría y poses en función del
 * tiempo) para poder probarla sin navegador; el componente solo la pinta.
 *
 * Unidades: las del glifo de Space Grotesk Bold (1000 por em, altura de
 * mayúscula 700), con el eje Y hacia ABAJO y la línea base en y = 0. La pose
 * de la mascota va en radios de la bola (`MASCOT_R`), y = 0 = posada.
 */

/** «4» de Space Grotesk Bold (eje Y hacia arriba, como en la fuente). Avance 636. */
export const FOUR_D =
  "M370 0V142H26V290L268 700H498V256H614V142H498V0ZM148 256H370V618H352L148 272Z";

/** «0» de Space Grotesk Bold: el hueco que la mascota viene a tapar. Centro (324, 350). */
export const ZERO_D =
  "M324 -14Q200 -14 125.0 54.5Q50 123 50 262V438Q50 573 125.0 643.5Q200 714 324 714Q449 714 523.5 643.5Q598 573 598 438V262Q598 123 523.5 54.5Q449 -14 324 -14ZM324 100Q399 100 434.5 141.0Q470 182 470 258V444Q470 521 430.5 560.5Q391 600 324 600Q255 600 216.5 559.0Q178 518 178 444V258Q178 179 214.5 139.5Q251 100 324 100Z";

/** «?» de Space Grotesk Bold: la duda mientras busca la página. Centro x 285. */
export const QUESTION_D =
  "M209 230V254Q209 305 229.5 338.0Q250 371 296 393L313 401Q358 422 382.0 446.0Q406 470 406 510Q406 539 391.5 559.5Q377 580 351.0 591.0Q325 602 290 602Q254 602 225.5 590.0Q197 578 180.5 554.0Q164 530 164 494V472H34V492Q34 561 68.0 611.0Q102 661 160.0 687.5Q218 714 290 714Q361 714 416.5 688.0Q472 662 504.0 616.0Q536 570 536 510Q536 450 514.0 411.5Q492 373 458.5 349.5Q425 326 390 309L373 301Q355 293 348.0 281.5Q341 270 341 248V230ZM279 -14Q239 -14 211.5 12.5Q184 39 184 81Q184 123 211.5 149.5Q239 176 279 176Q320 176 347.0 149.5Q374 123 374 81Q374 39 347.0 12.5Q320 -14 279 -14Z";

/** Radio de la bola: cubre el 0 entero (de -14 a 714) con su sobrepaso. */
export const MASCOT_R = 364;
/** Hueco del 0: la bola es más ancha que el glifo, así que el 0 se ensancha. */
const SLOT = 848;
const FOUR_ADVANCE = 636;
/** Centro de la bola en reposo. */
export const MASCOT_CX = FOUR_ADVANCE + SLOT / 2;
export const MASCOT_CY = -350;
/** Dónde va el segundo 4 y dónde el 0 vacío (alineado con la bola). */
export const SECOND_FOUR_X = FOUR_ADVANCE + SLOT;
export const ZERO_X = MASCOT_CX - 324;

/** viewBox del número: del borde del primer 4 al del segundo, con sitio abajo para el halo. */
export const NUMERAL_VIEWBOX = `26 -730 ${SECOND_FOUR_X + 614 - 26} 790`;

/**
 * Ojos de `Marca/mascota-favicon/mascota-master.svg` (círculo de radio 800)
 * en radios: dos píldoras verticales arriba y un poco a la derecha, con su
 * brillo. Los mismos números que la intro «empuje».
 */
export const EYES = [
  { x: -0.195, shineX: -0.08 },
  { x: 0.15, shineX: 0.265 },
] as const;
export const EYE_W = 0.165;
export const EYE_H = 0.33;
export const EYE_Y = -0.83;
export const EYE_CY = EYE_Y + EYE_H / 2;
export const SHINE_Y = -0.745;
export const SHINE_R = 0.0375;

export type Pose = {
  /** Desplazamiento en radios (y negativo = arriba). */
  x: number;
  y: number;
  /** Grados, alrededor del centro de la bola. */
  rot: number;
  /** Aplastamiento con pivote en el punto de apoyo. */
  sx: number;
  sy: number;
  /** 1 = ojos abiertos; 0 = cerrados. */
  eyeOpen: number;
};

export const REST: Pose = { x: 0, y: 0, rot: 0, sx: 1, sy: 1, eyeOpen: 1 };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Contacto con el suelo: se aplasta y recupera en `d` segundos. */
function squash(u: number, amount: number): Pick<Pose, "sx" | "sy"> {
  const k = amount * Math.sin(Math.PI * clamp01(u));
  return { sx: 1 + k * 0.8, sy: 1 - k };
}

/**
 * Caída de entrada: baja desde fuera del número, se estampa en el hueco del 0
 * y da dos botes cada vez más bajos. Tramos: [tipo, duración, altura o aplastamiento].
 */
const DROP_FROM = -4.2;
const DROP: readonly (readonly ["fall" | "hit" | "air", number, number])[] = [
  ["fall", 0.5, DROP_FROM],
  ["hit", 0.1, 0.32],
  ["air", 0.36, 0.45],
  ["hit", 0.08, 0.16],
  ["air", 0.2, 0.12],
  ["hit", 0.07, 0.07],
];
export const DROP_DURATION = DROP.reduce((s, [, d]) => s + d, 0);
/** Instante en que la bola toca el hueco por primera vez (los 4 dan un respingo). */
export const DROP_IMPACT = DROP[0][1];

export function dropPose(t: number): Pose {
  let start = 0;
  for (const [kind, d, v] of DROP) {
    if (t < start + d) {
      const u = (t - start) / d;
      if (kind === "fall") {
        // Gravedad: parte quieta y acelera; se estira al caer.
        const stretch = 0.16 * u * u;
        return { x: 0, y: v * (1 - u * u), rot: 0, sx: 1 - stretch * 0.6, sy: 1 + stretch, eyeOpen: 1 };
      }
      if (kind === "hit") {
        const s = squash(u, v);
        return { ...REST, ...s, eyeOpen: 1 - 2.2 * (1 - s.sy) };
      }
      return { ...REST, y: -4 * v * u * (1 - u) };
    }
    start += d;
  }
  return REST;
}

/** Respingo de los 4 cuando la bola se estampa: suben y vuelven, abriéndose hacia fuera. */
export function fourJolt(t: number): { y: number; rot: number } {
  const u = (t - DROP_IMPACT) / 0.3;
  if (u <= 0 || u >= 1) return { y: 0, rot: 0 };
  const k = Math.sin(Math.PI * u);
  return { y: -42 * k, rot: 5 * k };
}

/** Salto al pulsarla: agacharse, vuelo (con voltereta si `flip`) y aterrizaje. */
export const HOP_DURATION = 0.62;
export function hopPose(t: number, height: number, flip: boolean): Pose {
  if (t <= 0 || t >= HOP_DURATION) return REST;
  if (t < 0.08) return { ...REST, ...squash(t / 0.08, 0.2) };
  if (t < 0.54) {
    const u = (t - 0.08) / 0.46;
    // Voltereta con salida y llegada suaves (smoothstep).
    const turn = flip ? -360 * u * u * (3 - 2 * u) : 0;
    return { ...REST, y: -4 * height * u * (1 - u), rot: turn, sx: 0.94, sy: 1.06 };
  }
  return { ...REST, ...squash((t - 0.54) / 0.08, 0.16) };
}

/** Saltos que hacen voltereta: uno de cada tres clics. */
export const isFlipHop = (count: number) => count % 3 === 0;

/**
 * Mirada hacia el puntero, en radios de desplazamiento de los ojos. `dx`, `dy`
 * = puntero menos centro de la bola, en píxeles; `k` = radio de la bola en
 * píxeles (cerca de la bola satura menos, lejos apunta del todo). Los ojos
 * están arriba de la bola: pueden bajar bastante y subir poco sin salirse.
 */
export const GAZE = { x: 0.12, up: 0.05, down: 0.22 } as const;
export function gazeToward(dx: number, dy: number, k: number): { x: number; y: number } {
  const len = Math.hypot(dx, dy, k);
  const nx = dx / len;
  const ny = dy / len;
  return { x: GAZE.x * nx, y: ny < 0 ? GAZE.up * ny : GAZE.down * ny };
}

/**
 * Sin puntero que mirar, se pone a buscar la página: izquierda, derecha,
 * arriba, al suelo… con la cabeza ladeada y el «?» encima. Guion en bucle.
 */
const SEARCH = [
  { at: 0, x: -1, y: 0.2, tilt: -7 },
  { at: 1.3, x: 1, y: 0.2, tilt: 7 },
  { at: 2.6, x: 0.3, y: -1, tilt: 3 },
  { at: 3.7, x: -0.4, y: 1, tilt: -3 },
] as const;
export const SEARCH_LOOP = 4.8;

export function searchPose(t: number): { x: number; y: number; tilt: number } {
  const tt = ((t % SEARCH_LOOP) + SEARCH_LOOP) % SEARCH_LOOP;
  let step: (typeof SEARCH)[number] = SEARCH[0];
  for (const s of SEARCH) if (tt >= s.at) step = s;
  return {
    x: GAZE.x * step.x,
    y: step.y < 0 ? GAZE.up * step.y : GAZE.down * 0.6 * step.y,
    tilt: step.tilt,
  };
}

/** Parpadeo: cierra en 60 ms y abre en 80 ms. `t` = segundos desde que empezó. */
export const BLINK_DURATION = 0.14;
export function blinkOpen(t: number): number {
  if (t <= 0 || t >= BLINK_DURATION) return 1;
  return t < 0.06 ? 1 - t / 0.06 : (t - 0.06) / 0.08;
}

/** Acercamiento exponencial independiente de los fps. */
export const approach = (from: number, to: number, dt: number, rate: number) =>
  to + (from - to) * Math.exp(-rate * dt);
