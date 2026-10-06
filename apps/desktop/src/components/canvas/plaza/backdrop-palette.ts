import type { PlazaMode } from "./plaza-mode";

/**
 * Grading atmosférico del horizonte (Pazo, arbolado, sotobosque, bruma).
 *
 * Vive aparte de `plaza-mode.ts` (que es de LUZ) porque son parámetros de
 * matte painting, no de iluminación: el horizonte va con `fog={false}` y
 * resuelve SU propia perspectiva atmosférica en el shader, así que no depende
 * de lo que haga la niebla de la escena (que se ajusta para el 3D cercano).
 *
 * Por capa: `sat` (1 = la imagen tal cual), `gain` (ganancia de valor), `tint`
 * (multiplicador RGB, para enfriar o calentar), `haze` (mezcla hacia el color
 * de horizonte, uniforme) y `hazeBase` (mezcla EXTRA creciente hacia la base:
 * lo lejano se ve a través de más aire cerca del suelo, y es lo que difumina
 * las puntas de los troncos).
 */
export interface LayerGrade {
  sat: number;
  gain: number;
  tint: [number, number, number];
  haze: number;
  hazeBase: number;
}

export interface BackdropGrade {
  pazo: LayerGrade & {
    /** Oscurecimiento de ambiente en el zócalo (0-1): lo asienta en el suelo. */
    baseAO: number;
    /** Intensidad de las ventanas encendidas (0 = apagadas, de día). */
    windows: number;
  };
  /** Fila de arbolado más cercana (r = 49) y la de detrás-delante (r = 45). */
  treelineFar: LayerGrade;
  treelineNear: LayerGrade;
  /** Cuánto del color de horizonte lleva el sotobosque (0 = su verde puro). */
  understoryHaze: number;
  /** Bruma de suelo: opacidad máxima en la base de los cilindros. */
  groundMist: number;
  /** Explanada de grava delante del Pazo. */
  gravel: string;
  /** Charco de luz de la puerta (solo noche). */
  doorPool: number;
}

export const BACKDROP_GRADES: Record<PlazaMode, BackdropGrade> = {
  /**
   * Día: el sol entra por detrás del Pazo (contraluz), así que la fachada
   * baja de valor ~15 % y se enfría hacia el cielo. Arbolado: más bruma cuanto
   * más lejos y más abajo, que es lo que devuelve la profundidad al derecho
   * (las copas pintadas eran más vivas que los árboles 3D de delante).
   */
  dia: {
    pazo: { sat: 0.92, gain: 0.86, tint: [0.93, 0.97, 1.03], haze: 0.11, hazeBase: 0.1, baseAO: 0.3, windows: 0 },
    treelineFar: { sat: 0.78, gain: 0.94, tint: [0.92, 1.0, 1.02], haze: 0.34, hazeBase: 0.2 },
    treelineNear: { sat: 0.88, gain: 0.96, tint: [0.96, 1.0, 1.0], haze: 0.17, hazeBase: 0.18 },
    understoryHaze: 0.45,
    groundMist: 0.8,
    gravel: "#cbc3b2",
    doorPool: 0,
  },
  /**
   * Noche: lo desaturado y bajo de valor, hacia el velo del cielo. El Pazo es
   * el MISMO edificio que de día (gradado), con las ventanas encendidas
   * aparte; antes era otra imagen con otra torre y otro tejado.
   */
  noche: {
    pazo: { sat: 0.42, gain: 0.36, tint: [0.8, 0.9, 1.1], haze: 0.28, hazeBase: 0.18, baseAO: 0.45, windows: 1 },
    treelineFar: { sat: 0.3, gain: 0.34, tint: [0.8, 0.95, 0.9], haze: 0.5, hazeBase: 0.3 },
    treelineNear: { sat: 0.3, gain: 0.3, tint: [0.78, 0.93, 0.88], haze: 0.3, hazeBase: 0.3 },
    understoryHaze: 0.2,
    groundMist: 0.75,
    gravel: "#34322f",
    doorPool: 0.6,
  },
};
