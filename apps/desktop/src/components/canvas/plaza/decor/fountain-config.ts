import { PLAZA_PALETTES, type PlazaMode } from "../plaza-mode";

/**
 * Contrato de medidas de la fuente central. UNA sola fuente de verdad para la
 * piedra (`fountain-stone.ts`), el agua (`fountain-water.ts`) y los efectos
 * (`fountain-fx.ts`): si el pilón sube un centímetro, el agua, las cortinas y
 * las gotas se recolocan solos.
 *
 * Límites fijados con SUELO+CIELO: radio exterior total <= 1.30 (el medallón
 * del pavimento se repinta a la medida) y altura total <= 2.3 (no tapar el
 * Pazo ni a los muñecos del fondo). `FOUNTAIN_KEEP_OUT` (1.95) = 1.30 + 0.65.
 */

/** Segmentos de TODAS las piezas de revolución. 96 = múltiplo de 12 (gallones),
 * de 16 (sillares del murete) y de 24: así las facetas casan de una pieza a otra. */
export const FOUNTAIN_SEG = 96;

/** Gravedad "de escena". La real (9.8) con estas medidas lo haría caer como
 * una cascada de vídeo acelerado; 6 deja las parábolas legibles. */
export const FOUNTAIN_G = 6;

/** Valor de `uTime` con la animación congelada (`?quieto` / reduced motion). */
export const FOUNTAIN_FROZEN_TIME = 2.4;

/** Gallones del borde de las tazas = caños por taza. */
export const GADROONS = 12;
export const GADROON_AMP = 0.035;

/** Pilón (la piscina baja). */
export const BASIN = {
  /** Radio del zócalo: es el radio exterior total de la fuente. */
  outer: 1.3,
  plinthH: 0.07,
  /** Cara exterior del murete. */
  wallR: 1.255,
  /** Cara interior (grosor 0.155). */
  innerR: 1.1,
  /** Albardilla: vuela hacia fuera (0.03) y hacia dentro (0.045). */
  copingOut: 1.285,
  copingIn: 1.055,
  /** Dónde arranca por debajo y dónde acaba por arriba. */
  copingY0: 0.3,
  copingTop: 0.385,
  floorY: 0.06,
  waterY: 0.25,
  /** Radio de la lámina (algo menos que el murete: así no hay z-fighting). */
  waterR: 1.095,
  /** Radio del plinto del pedestal: tapa el centro del fondo. */
  pedestalR: 0.48,
} as const;

/** Una taza: pie, copa y nivel del agua. */
export interface BowlSpec {
  rRim: number;
  /** Y del arranque de la copa (cara inferior) y del borde. */
  yBase: number;
  yRim: number;
  /** Profundidad del hueco bajo el borde. */
  depth: number;
  /** Radio del pie sobre el que se asienta. */
  rStem: number;
}

function bowl(spec: BowlSpec): BowlSpec & {
  rimTop: number;
  water: number;
  waterR: number;
  floor: number;
  innerTop: number;
} {
  const rimTop = spec.yRim + 0.04;
  return {
    ...spec,
    rimTop,
    // Rebosantes: el agua casi a ras del borde, que es lo que hace que caiga.
    water: rimTop - 0.012,
    waterR: spec.rRim - 0.067,
    floor: spec.yRim - spec.depth,
    innerTop: rimTop - 0.02,
  };
}

export const LOWER_BOWL = bowl({ rRim: 0.75, yBase: 0.81, yRim: 0.99, depth: 0.14, rStem: 0.185 });
export const UPPER_BOWL = bowl({ rRim: 0.4, yBase: 1.3, yRim: 1.5, depth: 0.12, rStem: 0.1 });

/** Surtidor central. */
export const JET = {
  y0: UPPER_BOWL.floor + 0.2,
  apex: 2.1,
  r0: 0.022,
} as const;

/** Chorros de caída: de cada borde a la lámina de abajo. */
export const FALLS = {
  /** Taza alta → taza baja. */
  upper: { v0: 0.5, y0: UPPER_BOWL.rimTop, yEnd: LOWER_BOWL.water - 0.02, r0: UPPER_BOWL.rRim - 0.06 },
  /** Taza baja → pilón. */
  lower: { v0: 0.55, y0: LOWER_BOWL.rimTop, yEnd: BASIN.waterY - 0.02, r0: LOWER_BOWL.rRim - 0.06 },
} as const;

/** Radio al que cae una lámina: dónde está la corona de espuma. */
export function impactRadius(f: { v0: number; y0: number; yEnd: number; r0: number }): number {
  const t = Math.sqrt((2 * (f.y0 - (f.yEnd + 0.02))) / FOUNTAIN_G);
  return f.r0 + f.v0 * t;
}

/** Colores de la fuente por modo. Se derivan de la paleta de la plaza para que
 * el reflejo falso del cielo case con el cielo de verdad. */
export interface FountainLook {
  stone: string;
  waterDeep: string;
  waterBed: string;
  waterWall: string;
  foam: string;
  jetBody: string;
  jetHi: string;
  glow: string;
  night: number;
  skyH: string;
  skyM: string;
  skyT: string;
  tree: string;
}

export function fountainLook(mode: PlazaMode): FountainLook {
  const p = PLAZA_PALETTES[mode];
  if (mode === "dia") {
    return {
      // Más clara y cálida que el pavimento (#b6b0a5): sin este salto la
      // fuente se disolvía en el suelo.
      stone: "#e2dccd",
      waterDeep: "#2f7f9f",
      waterBed: "#5f8c93",
      waterWall: "#9a9c94",
      foam: "#f4fbff",
      jetBody: "#a9d9f0",
      jetHi: "#ffffff",
      glow: "#ffffff",
      night: 0,
      skyH: p.skyHorizon,
      skyM: p.skyMid,
      skyT: p.skyTop,
      tree: p.crownDark,
    };
  }
  return {
    stone: "#a4a6a8",
    waterDeep: "#0d2e40",
    waterBed: "#17475a",
    waterWall: "#2c3a40",
    foam: "#cfe9f4",
    jetBody: "#9fd4e8",
    jetHi: "#eaf9ff",
    // Blanco frío: el lima es el acento del sitio, no la luz de un foco.
    glow: "#a8e4ff",
    night: 1,
    skyH: p.skyHorizon,
    skyM: p.skyMid,
    skyT: p.skyTop,
    tree: "#050806",
  };
}
