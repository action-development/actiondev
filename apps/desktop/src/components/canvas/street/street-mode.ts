import { resolveTimeOfDay } from "../port/time-of-day";

/**
 * Día y noche en C/ Colón. Mismo interruptor que el puerto, la plaza y la
 * recreativa: la hora LOCAL del visitante, forzable con `/contact?hora=`.
 * Amanecer y atardecer caen del lado del día.
 *
 * Como en la plaza, los materiales no cambian de color con el modo: cambia la
 * LUZ que les llega. De día manda el sol y el soportal queda en sombra; de
 * noche el portal se enciende (focos, vestíbulo, cabina) y la calle la alumbra
 * una farola que queda fuera de plano.
 */

export type StreetMode = "dia" | "noche";

export interface StreetPalette {
  /** Fondo del canvas y del contenedor mientras carga. */
  background: string;
  /** Cielo sobre la coronación: cenit y horizonte (= `background`). */
  sky: { top: string; horizon: string };
  /** Peso del entorno procedural (`RoomEnvironment`) en los reflejos: es lo
   * que hace que el acero, el vidrio y el granito pulido parezcan lo que son. */
  envIntensity: number;
  /** Niebla hacia `background`: disuelve los extremos del edificio. */
  fog: { near: number; far: number };
  hemi: { sky: string; ground: string; intensity: number };
  /** Sol (día) o luna (noche). Es la única luz que proyecta sombra. */
  key: { color: string; intensity: number; position: [number, number, number] };
  /** Opacidad de la sombra del sol. */
  shadow: number;
  /** Farola fuera de plano, a la derecha y por delante. Solo de noche. */
  streetLamp: { color: string; intensity: number } | null;
  /** Luz cálida del soportal (una sola real; los focos son discos y conos). */
  portalLight: { color: string; intensity: number };
  /** Focos del techo, vestíbulo y rótulo de la cabina encendidos. */
  lightsOn: boolean;
  /** Brillo del vestíbulo tras las puertas de vidrio (0-1). */
  lobbyGlow: number;
  /** Proporción de ventanas encendidas en los pisos. */
  windowsLit: number;
}

export const STREET_PALETTES: Record<StreetMode, StreetPalette> = {
  dia: {
    background: "#c9d3db",
    sky: { top: "#6f9bc8", horizon: "#c9d3db" },
    envIntensity: 0.32,
    fog: { near: 20, far: 42 },
    hemi: { sky: "#dfe9f5", ground: "#a8977c", intensity: 0.55 },
    // Sol alto por la izquierda: el techo del soportal echa su sombra sobre el
    // portal, que es lo que hace que se lea hundido y no pintado.
    key: { color: "#fff0d6", intensity: 2.4, position: [-9, 14, 10] },
    shadow: 0.8,
    streetLamp: null,
    portalLight: { color: "#ffd9a8", intensity: 3 },
    lightsOn: false,
    lobbyGlow: 0.55,
    windowsLit: 0,
  },
  noche: {
    background: "#080808",
    sky: { top: "#04050a", horizon: "#0d1016" },
    envIntensity: 0.12,
    fog: { near: 16, far: 34 },
    hemi: { sky: "#7d8fb3", ground: "#221d18", intensity: 0.55 },
    key: { color: "#a9bce0", intensity: 0.45, position: [-9, 14, 10] },
    shadow: 0.3,
    streetLamp: { color: "#ffb867", intensity: 90 },
    portalLight: { color: "#ffc98a", intensity: 26 },
    lightsOn: true,
    lobbyGlow: 1,
    windowsLit: 0.3,
  },
};

function resolveStreetMode(date: Date = new Date(), override?: string | null): StreetMode {
  return resolveTimeOfDay(date, override) === "noche" ? "noche" : "dia";
}

/** Modo activo leyendo `?hora=` de la URL. Solo en cliente. */
export function currentStreetMode(): StreetMode {
  if (typeof window === "undefined") return "noche";
  return resolveStreetMode(new Date(), new URLSearchParams(window.location.search).get("hora"));
}
