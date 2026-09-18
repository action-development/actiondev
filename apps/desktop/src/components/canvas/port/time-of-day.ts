/**
 * Fases del día del puerto de Vigo.
 *
 * El hero cambia de paleta según la hora LOCAL del visitante: toda la escena
 * (cielo, ría, Cíes, niebla, luces, farolas) lee de una única `PortPalette`,
 * así que añadir una fase o retocar un color es tocar SOLO este archivo.
 *
 * Forzar una fase para revisarla: `/?hora=noche|amanecer|dia|atardecer`.
 *
 * Franjas fijas, no astronómicas — en verano en Vigo anochece pasadas las 22h,
 * pero una web no necesita un almanaque: se prioriza que cada fase se vea.
 */

export type TimeOfDay = "noche" | "amanecer" | "dia" | "atardecer";

export const TIME_OF_DAY_VALUES: readonly TimeOfDay[] = ["noche", "amanecer", "dia", "atardecer"];

export interface PortPalette {
  skyTop: string;
  skyMid: string;
  skyHorizon: string;
  /** Sol o luna. */
  orb: string;
  /** Posición del astro: x en [-1,1] (izq→der), y en [0,1] (horizonte→cenit). */
  orbX: number;
  orbY: number;
  orbSize: number;
  /** 1 = luna (creciente recortada), 0 = sol. */
  isMoon: number;
  stars: number;
  /** Trama de medios tonos alrededor del astro y en el horizonte. */
  halftone: string;
  waterFar: string;
  waterNear: string;
  waterLine: string;
  /** Reflejo del astro en la ría (0..1). */
  glint: number;
  islandFar: string;
  islandNear: string;
  sand: string;
  cloud: string;
  cloudShade: string;
  fog: string;
  sunLight: string;
  sunIntensity: number;
  skyLight: string;
  groundLight: string;
  hemiIntensity: number;
  /** Contorno de cómic. Nunca negro puro de día: se come el dibujo. */
  outline: string;
  /** 0 = farolas y ventanas apagadas, 1 = encendidas. */
  lamps: number;
}

export const PALETTES: Record<TimeOfDay, PortPalette> = {
  noche: {
    skyTop: "#050818", skyMid: "#0f1b3d", skyHorizon: "#223566",
    orb: "#f3efcf", orbX: -0.42, orbY: 0.62, orbSize: 7, isMoon: 1, stars: 1,
    halftone: "#2c4380",
    waterFar: "#16254f", waterNear: "#0a1431", waterLine: "#4a6bb0", glint: 0.55,
    islandFar: "#0d1633", islandNear: "#0a1128", sand: "#2a3456",
    cloud: "#1a2750", cloudShade: "#101a3a",
    fog: "#15213f",
    sunLight: "#a9bcff", sunIntensity: 0.9, skyLight: "#4a5fa8", groundLight: "#0b0f22", hemiIntensity: 0.9,
    outline: "#03050d", lamps: 1,
  },
  amanecer: {
    skyTop: "#2a3677", skyMid: "#d7779b", skyHorizon: "#ffc47e",
    orb: "#fff0b8", orbX: -0.55, orbY: 0.1, orbSize: 9, isMoon: 0, stars: 0,
    halftone: "#ff9fa0",
    waterFar: "#8f7fb8", waterNear: "#3b4a8c", waterLine: "#ffd9ae", glint: 0.8,
    islandFar: "#5b4a86", islandNear: "#43386e", sand: "#f2c4a0",
    cloud: "#ffc2b0", cloudShade: "#b8709a",
    fog: "#c894ad",
    sunLight: "#ffc89c", sunIntensity: 1.6, skyLight: "#f3b3c4", groundLight: "#3a3060", hemiIntensity: 1.0,
    outline: "#1d1638", lamps: 0.35,
  },
  dia: {
    skyTop: "#1b62c4", skyMid: "#4fb0f5", skyHorizon: "#cdefff",
    orb: "#fff7cf", orbX: 0.38, orbY: 0.72, orbSize: 8, isMoon: 0, stars: 0,
    halftone: "#8fd4ff",
    waterFar: "#4aa7e0", waterNear: "#1261b3", waterLine: "#c9f0ff", glint: 0.45,
    islandFar: "#4c8f78", islandNear: "#2f6e5a", sand: "#f7e2b0",
    cloud: "#ffffff", cloudShade: "#c4dcf2",
    fog: "#b7dcf0",
    sunLight: "#ffffff", sunIntensity: 2.2, skyLight: "#cfe7ff", groundLight: "#5a6f8a", hemiIntensity: 1.1,
    outline: "#0c1a30", lamps: 0,
  },
  atardecer: {
    skyTop: "#1b1a4e", skyMid: "#b4467a", skyHorizon: "#ff9a3b",
    // El sol se pone DETRÁS de las Cíes — la puesta más icónica de Vigo.
    orb: "#ffd24a", orbX: 0.08, orbY: 0.14, orbSize: 12, isMoon: 0, stars: 0.25,
    halftone: "#ff6b5a",
    waterFar: "#c9606f", waterNear: "#3a2860", waterLine: "#ffb55e", glint: 1,
    islandFar: "#3a1f4f", islandNear: "#26153c", sand: "#e88a6a",
    cloud: "#ff8f6b", cloudShade: "#8a3a70",
    fog: "#8a4a74",
    sunLight: "#ffae6b", sunIntensity: 1.7, skyLight: "#ff9ab0", groundLight: "#2a1840", hemiIntensity: 0.95,
    outline: "#150a24", lamps: 0.8,
  },
};

/** Franja horaria → fase. `hour` admite decimales (18.5 = 18:30). */
export function timeOfDayForHour(hour: number): TimeOfDay {
  if (hour >= 6.5 && hour < 9) return "amanecer";
  if (hour >= 9 && hour < 19) return "dia";
  if (hour >= 19 && hour < 21.5) return "atardecer";
  return "noche";
}

function isTimeOfDay(value: string | null | undefined): value is TimeOfDay {
  return !!value && (TIME_OF_DAY_VALUES as readonly string[]).includes(value);
}

/** Resuelve la fase: override por query (`?hora=`) o, si no, la hora local. */
export function resolveTimeOfDay(date: Date, override?: string | null): TimeOfDay {
  if (isTimeOfDay(override)) return override;
  return timeOfDayForHour(date.getHours() + date.getMinutes() / 60);
}
