import { resolvePlazaMode } from "../plaza/plaza-mode";

/**
 * Día y noche en la sala recreativa de /projects.
 *
 * Mismo interruptor que el puerto y la plaza: la hora LOCAL del visitante,
 * forzable con `/projects?hora=dia|noche` (amanecer y atardecer caen del lado
 * del día, como en la plaza). Se resuelve una vez al cargar.
 *
 * Es un interior, así que el día no es "cielo azul": es la sala con los
 * lucernarios del techo dejando pasar luz, paredes que se ven y los neones
 * apagados. De noche mandan los neones y el brillo de las pantallas. Las
 * máquinas están encendidas en los dos modos — una recreativa abierta no apaga
 * sus pantallas porque sea de día.
 */

export type ArcadeMode = "dia" | "noche";

export interface ArcadePalette {
  /** Fondo del canvas y color de la niebla: lo que se ve "al fondo". */
  background: string;
  fog: { near: number; far: number };
  /** Moqueta: base y motas del estampado. */
  carpet: string;
  carpetInk: [string, string, string];
  wall: string;
  ceiling: string;
  /** Mueble de las máquinas (frente y techo). */
  cabinet: string;
  hemi: { sky: string; ground: string; intensity: number };
  key: { color: string; intensity: number };
  /** Neón del techo: color e intensidad (0 = apagado, se ve el tubo gris). */
  neon: { color: string; on: boolean };
  /** Lucernarios del techo: blanco de día, casi negro de noche. */
  skylight: string;
  /** Resplandor de cada pantalla sobre la moqueta (0-1). */
  screenGlow: number;
  /** Friso de paneles ranurados de la parte baja de las paredes. */
  wainscot: string;
  /** Acero del techo: vigas, conducto, bandeja de cables. */
  steel: string;
  /** Opacidad del mural de luz negra de la parte alta de las paredes. */
  mural: number;
  /** Letreros de neón de las paredes encendidos (de día, tubos apagados). */
  signsOn: boolean;
  /** Bombillas del riel sobre las máquinas: encendida y apagada. */
  bulbs: { on: string; off: string };
  /** Haz visible de los focos del techo (opacidad del cono aditivo). */
  beam: number;
  /** Cristal de los focos del techo. */
  lens: string;
  /** Bañado de la luz de la moldura del techo sobre la pared (opacidad). */
  cove: number;
  /** Pantallas de las máquinas no enfocadas: el tubo en modo demo, más
   * apagado; la enfocada sube a blanco. */
  screenIdle: string;
}

export const ARCADE_PALETTES: Record<ArcadeMode, ArcadePalette> = {
  dia: {
    background: "#8f8c86",
    fog: { near: 16, far: 48 },
    carpet: "#28305a",
    carpetInk: ["#e3b341", "#3fa7a3", "#e0674f"],
    wall: "#a9a49b",
    ceiling: "#c9c5bd",
    cabinet: "#23232a",
    hemi: { sky: "#fffaf0", ground: "#6d6a78", intensity: 2.1 },
    key: { color: "#fff4df", intensity: 1.6 },
    neon: { color: "#c8ff00", on: false },
    skylight: "#f4f8ff",
    screenGlow: 0.12,
    wainscot: "#3b3542",
    steel: "#8e9298",
    mural: 0.3,
    signsOn: false,
    bulbs: { on: "#ffe2a0", off: "#6b5a3a" },
    beam: 0.025,
    lens: "#fff6e0",
    cove: 0.1,
    screenIdle: "#b4b4b4",
  },
  noche: {
    background: "#070709",
    fog: { near: 9, far: 34 },
    carpet: "#0d0f1f",
    carpetInk: ["#c8ff00", "#3fa7a3", "#8a6fd1"],
    wall: "#16161c",
    ceiling: "#0b0b0e",
    cabinet: "#15151a",
    hemi: { sky: "#9aa3c7", ground: "#1a1822", intensity: 0.9 },
    key: { color: "#c9d3ff", intensity: 0.55 },
    neon: { color: "#c8ff00", on: true },
    skylight: "#101218",
    screenGlow: 0.3,
    wainscot: "#17151d",
    steel: "#2c2e35",
    mural: 0.6,
    signsOn: true,
    bulbs: { on: "#ffcf6e", off: "#2a2012" },
    beam: 0.075,
    lens: "#ffe9c4",
    cove: 0.32,
    screenIdle: "#8c8c8c",
  },
};

/** Modo activo leyendo `?hora=` de la URL. Solo en cliente. */
export function currentArcadeMode(): ArcadeMode {
  if (typeof window === "undefined") return "noche";
  return resolvePlazaMode(new Date(), new URLSearchParams(window.location.search).get("hora"));
}
