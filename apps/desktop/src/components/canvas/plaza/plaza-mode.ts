import { resolveTimeOfDay } from "../port/time-of-day";

/**
 * Día y noche en la plaza de reseñas.
 *
 * La referencia es el parque de Castrelos (Vigo): jardín francés de parterres
 * recortados, césped, palmeras y granito claro. De día el parque se ve como
 * es; de noche manda el lenguaje oscuro del sitio y lo que ilumina son las
 * farolas.
 *
 * Aquí vive lo que cambia entre las dos versiones y comparten varias piezas:
 * cielo, niebla, luces, si las farolas están encendidas y unos pocos tonos de
 * referencia. Los detalles de cada pieza tienen paleta propia por modo — el
 * suelo en `ground-palette.ts`, la vegetación en `decor/vegetation-palette.ts`.
 * Medidas y layout son los mismos en ambas: lo que cambia es la LUZ.
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
  /** Losa del pavimento de granito (la junta vive en `ground-palette.ts`). */
  paving: string;
  /** Césped del perímetro. */
  grass: string;
  /** Verdes oscuros de referencia: seto (`leafDark`) y copa (`crownDark`).
   * Cambian con el modo porque un verde de sol bajo la luz de noche se lee
   * como plástico. La vegetación usa su propia paleta; estos dos los siguen
   * leyendo piezas que tienen que casar con ella (telón, reflejo de la fuente). */
  leafDark: string;
  crownDark: string;
  /** Granito del mobiliario pétreo (jardineras, fuente). Es lo único del
   * mobiliario que cambia de color con el modo: una piedra de noche
   * (gris azulado) a pleno sol se lee como hormigón sucio. */
  stone: string;
  /**
   * Niebla: color = `skyHorizon`, distancias en profundidad de VISTA (no
   * radio desde el centro). La monta `PlazaLighting` sobre `scene.fog`.
   *
   * Three la mezcla DESPUÉS del tone mapping y de pasar a sRGB, con el color
   * tal cual: a `far` el píxel es exactamente el hex del horizonte, el mismo
   * del `background` del div — ahí no hay costura posible, ni con ACES ni con
   * Neutral. `near` deja intacto todo lo cercano (plaza, muñecos, mobiliario y
   * el arbolado del anillo, a ~28 de la cámara por el lado lejano); el césped
   * del fondo se va lavando hasta el horizonte.
   */
  fog: { near: number; far: number };
  /** Rig de luz del modo. Ver `PlazaLighting.tsx` y `lighting-rig.ts`. */
  light: PlazaLightRig;
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
  /** Farolas encendidas: vidrio, halo y charco de luz en el suelo. */
  lampsOn: boolean;
  /**
   * Opacidad de la sombra del sol sobre el suelo (capas `ShadowMaterial` y
   * calcas falsas de las copas). La `shadow.intensity` de la luz va fija a 1
   * en `PlazaLighting`: un `ShadowMaterial` multiplica su opacidad por ella, y
   * con las dos por debajo de 1 la sombra del suelo se atenuaba dos veces. De
   * noche no hay sombra de luna (`light.key.castShadow`).
   */
  sunShadow: { ground: number };
  /** Retícula guía exterior y sombras de contacto. */
  guideOpacity: number;
  shadowOpacity: number;
}

/**
 * Rig de luz de un modo. Lo consume `PlazaLighting` (luces, IBL y exposición)
 * y `PlazaScene` (exposición).
 *
 * Las direcciones NO son posiciones a mano: son ángulos RELATIVOS a la cámara
 * en reposo (`ORBIT.center`, ver `lighting-rig.ts`). Si se mueve el telón y con
 * él la cámara, la luz la sigue y el sol nunca vuelve a quedar a contraluz —
 * que es lo que pasaba con el `[6, 10, 5]` de antes, ajustado con la cámara en
 * +Z cuando el vaivén ya vivía en ~279°.
 *
 * Intensidades en unidades físicas de three (≥ r155): una direccional de
 * intensidad π sobre una cara de frente devuelve el albedo tal cual; la
 * hemisférica igual (sin el ×π de antes); el IBL suma π·radiancia·intensidad.
 */
export interface PlazaLightRig {
  /** `toneMappingExposure` (tone mapping Neutral, ver `PlazaScene`). */
  exposure: number;
  /**
   * Luz principal: sol de día, luna de noche. `azimuth` en grados desde el
   * eje de la cámara en reposo (positivo = a la IZQUIERDA de la cámara),
   * `elevation` en grados sobre el horizonte.
   */
  key: { color: string; intensity: number; azimuth: number; elevation: number; castShadow: boolean };
  /** Contraluz: por detrás de los muñecos, recorta la silueta contra el fondo. */
  rim: { color: string; intensity: number; azimuth: number; elevation: number };
  /** Hemisférica: relleno de cielo/suelo. Baja: el relleno de verdad es el IBL. */
  hemi: { sky: string; ground: string; intensity: number };
  /**
   * IBL procedural: cúpula con degradado (cenit → horizonte → suelo) y un
   * lóbulo de brillo hacia la luz principal, prefiltrada con PMREM.
   * `intensity` = `scene.environmentIntensity`; afecta a TODO
   * `MeshStandardMaterial` de la escena (difuso + especular).
   */
  env: { intensity: number; zenith: string; horizon: string; ground: string; glow: string };
  /** Luz real de las farolas (`pointLight` sin sombra), o `null` si están
   * apagadas. Posiciones: las farolas de `buildDecorLayout()`. */
  lamps: { color: string; intensity: number; distance: number } | null;
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
    paving: "#b6b0a5",
    grass: "#6f9a4e",
    leafDark: "#48702f",
    crownDark: "#3a5f2c",
    understory: "#4a6634",
    stone: "#b4aea2",
    fog: { near: 22, far: 105 },
    light: {
      exposure: 1,
      // Sol de media tarde: a la izquierda de la cámara y a ~45°, para que
      // las caras reciban luz principal y las sombras caigan hacia el fondo
      // (no hacia el espectador).
      key: { color: "#fff1dc", intensity: 5.0, azimuth: 40, elevation: 46, castShadow: true },
      // Contraluz cálido desde detrás a la derecha: el filo que separa al
      // muñeco del pavimento claro.
      rim: { color: "#ffe2b6", intensity: 1.6, azimuth: 155, elevation: 26 },
      // Cielo azul arriba, rebote cálido del granito abajo. Baja: el relleno
      // lo hace el IBL, que sí tiene dirección.
      hemi: { sky: "#cfe3ff", ground: "#c4b296", intensity: 0.75 },
      env: { intensity: 0.5, zenith: "#6f9fd0", horizon: "#dce8f2", ground: "#a59c8c", glow: "#fff0d8" },
      lamps: null,
    },
    lampsOn: false,
    sunShadow: { ground: 0.44 },
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
    paving: "#242424",
    grass: "#22301c",
    leafDark: "#35503c",
    crownDark: "#22352a",
    understory: "#16231a",
    stone: "#4a4e52",
    fog: { near: 18, far: 70 },
    light: {
      exposure: 1,
      // Luna: fría, tenue y alta. Sin sombra: de noche el ancla de cada pieza
      // al suelo son los discos de contacto, y así se ahorra el segundo pase
      // completo de la escena (el del mapa de sombras).
      key: { color: "#c3d0e8", intensity: 2.4, azimuth: 35, elevation: 58, castShadow: false },
      // Contraluz de luna: sin él, la silueta oscura del muñeco se funde con
      // el fondo #080808 y solo se ve la cara.
      rim: { color: "#93a7cc", intensity: 1.8, azimuth: 160, elevation: 30 },
      hemi: { sky: "#3d4759", ground: "#26221d", intensity: 1.5 },
      env: { intensity: 0.3, zenith: "#151b27", horizon: "#2b313d", ground: "#17150f", glow: "#4a5670" },
      // Farolas: luz cálida de verdad sobre muñecos, bancos y setos. El
      // charco y el halo del suelo siguen siendo decals aditivos (el pavimento
      // es MeshBasic y no recibe luz).
      lamps: { color: "#ffd8a1", intensity: 7, distance: 9 },
    },
    lampsOn: true,
    sunShadow: { ground: 0.28 },
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
