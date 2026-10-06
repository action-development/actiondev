import type { PlazaMode } from "./plaza-mode";

/**
 * Paleta LOCAL del suelo y el cielo de la plaza.
 *
 * `plaza-mode.ts` es de la luz (colores de cielo, niebla, hemisférica...) y
 * aquí no se toca. Lo que solo le importa al pavimento, al césped, a la
 * sombra del suelo y al cielo nocturno vive en este módulo, por modo. Los
 * colores base (losa, césped, horizonte) se siguen leyendo de la paleta del
 * modo para no duplicar la fuente de verdad: aquí solo van los DERIVADOS.
 *
 * Todos los colores son hex sRGB; los multiplicadores son "perceptuales"
 * (relativos al valor sRGB de la losa), no lineales.
 */
export interface GroundPalette {
  /** Junta del pavimento: más oscura y más fría que la losa, para que se lea
   * como un surco con sombra y no como una raya beis dibujada. */
  joint: string;
  /** Fuerza del biselado de las losas (filo claro del lado del sol, oscuro
   * del contrario). 0 = sin bisel. */
  bevel: number;
  /** Variación de luminancia pieza a pieza (± fracción sRGB). */
  variance: number;
  /** Amplitud del grano de granito (por hash en mundo, no por teja). */
  grain: number;
  /** Oscurecimiento de la junta por oclusión (0-1). */
  jointAO: number;
  /** Suciedad junto al bordillo: multiplicador lineal RGB. */
  dirt: [number, number, number];
  /** Multiplicador del borde del pavimento (viñeteado hacia el bordillo). */
  edgeDim: number;
  /** Medallón: campo de la rosa, punta clara, punta oscura (× losa) y las dos
   * dovelas de la cenefa (granito oscuro). */
  medallion: { field: number; roseLight: number; roseDark: number; cenefaA: number; cenefaB: number };
  /** Opacidad del aro lima de la junta del medallón (el guiño de marca). */
  accentAlpha: number;
  /** Bordillo: × losa (cara superior) y ambiente de las caras laterales. */
  curb: { top: number; ambient: number };
  /** Capa que recibe la sombra del sol: color (frío de día, casi negro de
   * noche) y opacidad PROPIA — la luz ya no la atenúa por segunda vez. */
  shadow: { color: string; opacity: number };
  /** Oclusión de contacto del bordillo sobre el césped. */
  contactAO: { color: string; alpha: number };
  /** Césped: tinte multiplicativo (la luna es fría y vuelve el verde nocturno
   * un azul-turquesa; un toque cálido en el albedo lo devuelve a olivo), peso de
   * la segunda escala de manchas y brillo rasante. */
  grass: { tint: string; second: number; sheenColor: string; sheen: number };
  /** Resplandor de ciudad sobre las copas (solo noche). */
  skyGlow: string | null;
}

export const GROUND_PALETTES: Record<PlazaMode, GroundPalette> = {
  dia: {
    joint: "#6a6e72",
    bevel: 0.32,
    variance: 0.085,
    grain: 0.075,
    jointAO: 0.1,
    dirt: [0.8, 0.82, 0.72],
    edgeDim: 0.97,
    medallion: { field: 0.74, roseLight: 1.14, roseDark: 0.9, cenefaA: 0.56, cenefaB: 0.67 },
    accentAlpha: 0.2,
    curb: { top: 1.1, ambient: 0.62 },
    shadow: { color: "#1a2433", opacity: 0.4 },
    contactAO: { color: "#16230f", alpha: 0.34 },
    grass: { tint: "#dce8e2", second: 0.8, sheenColor: "#a2bf9e", sheen: 0.26 },
    skyGlow: null,
  },
  noche: {
    joint: "#0b0c0f",
    bevel: 0.12,
    variance: 0.16,
    grain: 0.09,
    jointAO: 0.18,
    dirt: [0.72, 0.76, 0.7],
    edgeDim: 0.72,
    medallion: { field: 0.74, roseLight: 1.22, roseDark: 0.94, cenefaA: 0.55, cenefaB: 0.68 },
    accentAlpha: 0.16,
    curb: { top: 1.12, ambient: 0.78 },
    shadow: { color: "#020203", opacity: 0.22 },
    contactAO: { color: "#000000", alpha: 0.5 },
    grass: { tint: "#f4ffcf", second: 0.6, sheenColor: "#25351f", sheen: 0.18 },
    skyGlow: "#0c0d10",
  },
};
