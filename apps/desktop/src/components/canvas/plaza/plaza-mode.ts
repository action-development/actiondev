import { resolveTimeOfDay } from "../port/time-of-day";

/**
 * Día y noche en la plaza de reseñas.
 *
 * La referencia es el parque de Castrelos (Vigo): jardín francés de parterres
 * recortados, césped, palmeras y granito claro. De día el parque se ve como
 * es; de noche manda el lenguaje oscuro del sitio y lo que ilumina son las
 * farolas.
 *
 * TODO lo que cambia entre las dos versiones vive en este archivo: cielo,
 * suelo, pavimento, césped, niebla, luces y si las farolas están encendidas.
 * El resto de la plaza (materiales del mobiliario, medidas, layout) es el
 * mismo en ambas — lo que cambia es la LUZ que les da, no su color.
 *
 * Mismo criterio que el hero del puerto (`port/time-of-day.ts`) y mismo
 * interruptor: la hora LOCAL del visitante, forzable con
 * `/resenas?hora=dia|noche` (también valen `amanecer` y `atardecer`, que caen
 * del lado del día, para que el parámetro signifique lo mismo en toda la web).
 */

export type PlazaMode = "dia" | "noche";

export const PLAZA_MODES: readonly PlazaMode[] = ["dia", "noche"];

export interface PlazaModePalette {
  /** Cyclorama por elevación: horizonte → media altura → cenit. */
  skyHorizon: string;
  skyMid: string;
  skyTop: string;
  /** Suelo base fuera del pavimento: tono cercano y tono intermedio (el borde
   * siempre acaba en `skyHorizon`, que es lo que hace que no haya costura). */
  floorNear: string;
  floorMid: string;
  /** Pavimento de granito: losa y junta. */
  paving: string;
  joint: string;
  /** Césped del perímetro. */
  grass: string;
  /** Vegetación: seto (dos tonos) y copa del arbolado (dos tonos). Cambian
   * con el modo porque un verde de sol bajo la luz de noche se lee como
   * plástico, y uno de noche a pleno día parece pintado de negro. */
  leaf: string;
  leafDark: string;
  crown: string;
  crownDark: string;
  /** Granito del mobiliario pétreo (jardineras, fuente). Es lo único del
   * mobiliario que cambia de color con el modo: una piedra de noche
   * (gris azulado) a pleno sol se lee como hormigón sucio. */
  stone: string;
  /** Lámina de agua de la fuente y chorro del surtidor. */
  water: string;
  waterJet: string;
  /** Niebla: color = `skyHorizon`. De día se ve mucho más lejos. */
  fog: { near: number; far: number };
  /** Hemisférica: la luz de relleno que baña toda la escena. */
  hemi: { sky: string; ground: string; intensity: number };
  /** Luz principal (sol de tarde / cielo nocturno). */
  key: { color: string; intensity: number; position: [number, number, number] };
  /** Contraluz flojo para separar siluetas del fondo. */
  fill: { color: string; intensity: number };
  /** Tinte del telón del Pazo (`PlazaBackdrop`). Multiplica la imagen: de
   * noche hay que bajarle la luz, porque una fachada pintada compite con una
   * plaza que solo alumbran seis farolas. */
  backdropTint: string;
  /**
   * Sotobosque: la masa en sombra bajo la franja de arbolado
   * (`PlazaBackdrop`). Tapa el suelo lejano justo donde la niebla ya lo ha
   * llevado a color de horizonte pero las copas todavía no lo cubren — sin
   * él, entre los troncos pintados se abrían unas calvas blancas con el borde
   * dentado. Verde de la pradera oscurecido: al pasar por la misma niebla que
   * el césped de delante, los dos llegan al mismo gris verdoso y la costura
   * desaparece.
   */
  understory: string;
  /** Tinte de la franja de arbolado pintada. Va aparte del Pazo: la misma
   * imagen sirve de día y de noche, pero de noche hay que apagarla MUCHO más
   * que la fachada, que tiene las ventanas encendidas y debe seguir brillando. */
  treelineTint: string;
  /** Farolas encendidas: vidrio, halo y charco de luz en el suelo. */
  lampsOn: boolean;
  /**
   * Sombra proyectada del sol (`PlazaRoom`). `ground` es la opacidad de la
   * capa `ShadowMaterial` que la recibe en el suelo; `objects` es la
   * `shadow.intensity` de la luz, que gradúa la sombra que una pieza echa
   * sobre otra. De noche las dos bajan: sin sol, una sombra dura delata que
   * la luz principal es un truco de relleno, no la luna.
   */
  sunShadow: { ground: number; objects: number };
  /** Retícula guía exterior y sombras de contacto. */
  guideOpacity: number;
  shadowOpacity: number;
}

export const PLAZA_PALETTES: Record<PlazaMode, PlazaModePalette> = {
  /**
   * Castrelos a mediodía: granito claro, césped vivo y cielo atlántico. Es la
   * única pantalla del sitio que no es dark-mode, y lo es a propósito: un
   * parque de noche cuenta una cosa y de día otra.
   */
  dia: {
    skyHorizon: "#d3e2ee",
    skyMid: "#9cc0e0",
    skyTop: "#6296c9",
    floorNear: "#b3aca0",
    floorMid: "#c3bdb2",
    paving: "#b6b0a5",
    joint: "#928c82",
    grass: "#6f9a4e",
    leaf: "#5f8f42",
    leafDark: "#48702f",
    crown: "#4d7c3a",
    crownDark: "#3a5f2c",
    understory: "#4a6634",
    stone: "#b4aea2",
    water: "#8fc4dd",
    waterJet: "#eaf7ff",
    fog: { near: 26, far: 66 },
    // Cielo azul arriba, rebote cálido de la grava abajo.
    hemi: { sky: "#cfe6ff", ground: "#c2ab8c", intensity: 1.75 },
    key: { color: "#fff4df", intensity: 2.3, position: [6, 10, 5] },
    fill: { color: "#cfe0f5", intensity: 0.35 },
    backdropTint: "#ffffff",
    treelineTint: "#ffffff",
    lampsOn: false,
    sunShadow: { ground: 0.44, objects: 0.6 },
    guideOpacity: 0.07,
    // Las sombras proyectadas ya anclan las piezas al suelo: el disco de
    // contacto pasa de ser el ancla a ser el oclusión de contacto que la
    // sombra proyectada no resuelve (el hueco justo bajo el pie).
    shadowOpacity: 0.24,
  },

  /**
   * El parque cerrado: fondo `--background` del sitio, granito apagado y las
   * farolas haciendo todo el trabajo.
   */
  noche: {
    skyHorizon: "#080808",
    // Velo bajo, apenas dos puntos por encima del fondo y con una pizca de
    // frío: es lo que separa la silueta del arbolado del negro absoluto.
    skyMid: "#0e0e11",
    skyTop: "#080808",
    floorNear: "#242424",
    floorMid: "#101010",
    paving: "#242424",
    joint: "#151515",
    grass: "#22301c",
    leaf: "#4c6b52",
    leafDark: "#35503c",
    crown: "#2f4838",
    crownDark: "#22352a",
    understory: "#16231a",
    stone: "#4a4e52",
    water: "#1b3442",
    waterJet: "#9fd4e8",
    fog: { near: 19, far: 50 },
    hemi: { sky: "#F4F9FF", ground: "#FFF8EE", intensity: 2.2 },
    key: { color: "#ffffff", intensity: 1.5, position: [3, 8, 7] },
    fill: { color: "#ffffff", intensity: 0.5 },
    backdropTint: "#9d9d9d",
    treelineTint: "#4f5a52",
    lampsOn: true,
    sunShadow: { ground: 0.28, objects: 0.36 },
    guideOpacity: 0.055,
    shadowOpacity: 0.3,
  },
};

/**
 * Modo activo: `?hora=` si viene, y si no la hora local del visitante.
 *
 * Se apoya en `resolveTimeOfDay` del hero para que el parámetro signifique lo
 * mismo en todo el sitio; aquí solo hay dos versiones, así que amanecer y
 * atardecer caen del lado del día (con el parque abierto, no de noche).
 */
export function resolvePlazaMode(date: Date = new Date(), override?: string | null): PlazaMode {
  return resolveTimeOfDay(date, override) === "noche" ? "noche" : "dia";
}

/** Modo activo leyendo `?hora=` de la URL. Solo en cliente. */
export function currentPlazaMode(): PlazaMode {
  if (typeof window === "undefined") return "noche";
  return resolvePlazaMode(new Date(), new URLSearchParams(window.location.search).get("hora"));
}
