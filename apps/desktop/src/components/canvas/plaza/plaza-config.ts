/**
 * Contrato compartido de la plaza de reseñas (`/resenas`).
 *
 * TODO lo que necesiten a la vez el entorno (`PlazaRoom`), los muñecos
 * (`PlazaCharacter`) y el mundo (`PlazaWorld`) vive aquí: paleta, medidas,
 * tipos y layout. Regla dura del proyecto: CERO assets remotos — la sala y las
 * caras se generan con `CanvasTexture` en runtime, nunca con HDR ni GLB.
 *
 * Referencia visual: las salas de personajes de Wii (plaza blanca infinita,
 * muñecos de cabeza grande y cuerpo cápsula). Copiamos el LENGUAJE visual
 * —proporciones, shading plano, comportamiento— nunca marcas, tipografías ni
 * assets de Nintendo.
 */

/** Paleta "sala blanca". Blanco Wii literal: no usa los tokens dark del sitio. */
export const PLAZA_PALETTE = {
  /** Degradado del cielo/cyclorama, de arriba a abajo. */
  skyTop: "#8FC7E8",
  skyMid: "#CFE6F5",
  skyBottom: "#F5F7FA",
  /** Suelo: blanco bajo los muñecos que se funde con `skyBottom` en el horizonte. */
  floorNear: "#FFFFFF",
  /** Sombra de blob bajo cada muñeco. */
  shadow: "#9FB4C4",
  /** Acento de interacción (highlight del muñeco enfocado). */
  accent: "#3FA9F5",
} as const;

/**
 * Distancias de niebla (color = `skyBottom`): la sala se funde con el cielo,
 * no tiene paredes. `near` deja a los muñecos sin velo; `far` < `FLOOR_RADIUS`
 * garantiza que el borde del disco ya es 100 % horizonte.
 */
export const PLAZA_FOG = { near: 19, far: 50 } as const;

/** Radio del disco de suelo. Más allá solo hay fog. */
export const FLOOR_RADIUS = 60;

/**
 * Medidas del muñeco, en unidades de mundo. Altura total ~1.
 *
 * El ratio cabeza/cuerpo es el rasgo que define el estilo: la cabeza ocupa
 * casi la mitad del personaje. Tocar `HEAD.radius` sin tocar el resto rompe
 * la silueta — son medidas relativas entre sí, no valores sueltos.
 */
export const DOLL = {
  /** Esferoide achatado. `scale` es [x, y, z] sobre la esfera unidad. */
  head: { radius: 0.34, scale: [1, 0.92, 0.94] as [number, number, number], y: 0.96 },
  /** Cápsula tipo kokeshi: sin cintura, sin cuello. */
  body: { radius: 0.24, length: 0.34, y: 0.5 },
  /** Cilindro corto + mano esférica; sin dedos. */
  arm: { radius: 0.058, length: 0.22, x: 0.26, y: 0.58 },
  hand: { radius: 0.088 },
  /** Cápsulas cortas sin rodilla. */
  leg: { radius: 0.075, length: 0.16, x: 0.11, y: 0.17 },
  foot: { radius: 0.085 },
  /** Único rasgo facial con volumen — el resto de la cara es plano. */
  nose: { radius: 0.042, z: 0.3, y: 0.94 },
  /** Disco de sombra proyectada (no hay sombras reales). */
  shadowRadius: 0.32,
} as const;

/** Tonos de piel planos, sin subsurface. Se eligen de forma determinista. */
export const SKIN_TONES = ["#FFDBAC", "#F1C27D", "#E0AC69", "#C68642", "#A5693F", "#8D5524"] as const;

/** Colores de ropa: pasteles saturados como en la referencia. */
export const SHIRT_COLORS = ["#E8544A", "#3FA9F5", "#F5C542", "#57C785", "#9B6FD8", "#F58F42", "#EDEDED", "#2B3A45"] as const;

/** Colores de pelo. */
export const HAIR_COLORS = ["#2B2018", "#4A3222", "#7A5230", "#B8873F", "#D9D4CE", "#1A1A1A"] as const;

/** Formas de pelo soportadas por el generador procedural. */
export type HairStyle = "short" | "bob" | "bun" | "spiky" | "bald" | "ponytail";
export const HAIR_STYLES: readonly HairStyle[] = ["short", "bob", "bun", "spiky", "bald", "ponytail"];

/** Rasgos de la cara, dibujados como decal 2D plano sobre la esfera. */
export interface FaceSpec {
  /** 0-3: índice de forma de ojo. */
  eyes: number;
  /** 0-3: índice de forma de ceja. */
  brows: number;
  /** 0-3: índice de forma de boca. */
  mouth: number;
  /** Color de iris. */
  eyeColor: string;
  /** Separación horizontal de los ojos, 0-1 normalizado. */
  eyeSpacing: number;
  /** Colorete en las mejillas. */
  blush: boolean;
}

/** Ficha completa de un muñeco de la plaza. */
export interface DollSpec {
  /** Id del testimonio que representa. */
  id: string;
  skin: string;
  shirt: string;
  hairColor: string;
  hair: HairStyle;
  face: FaceSpec;
  /** Posición en el suelo (x, z). El muñeco siempre está apoyado en y = 0. */
  home: [number, number];
  /** Rotación inicial en radianes. */
  facing: number;
  /** Desfase de fase para que los idles no vayan sincronizados. */
  phase: number;
  /** Altura relativa (0.92–1.08) para que no midan todos igual. */
  scale: number;
}

/**
 * PRNG determinista (mulberry32) sembrado con el id del testimonio.
 *
 * Determinista a propósito: el mismo cliente tiene SIEMPRE el mismo muñeco
 * entre recargas y entre servidor y cliente. Con `Math.random()` el muñeco de
 * cada reseña cambiaría en cada visita y los snapshots visuales de e2e nunca
 * pasarían dos veces seguidas.
 */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Radio del anillo en el que se colocan los muñecos alrededor de la cámara. */
export const RING_RADIUS = 3.1;

/**
 * Genera la ficha de cada muñeco a partir de los ids de los testimonios.
 *
 * Se reparten en un anillo mirando hacia dentro, con jitter determinista para
 * que no se lea como una formación geométrica.
 */
export function buildDolls(ids: readonly string[]): DollSpec[] {
  return ids.map((id, i) => {
    const rnd = seededRandom(id);
    const angle = (i / ids.length) * Math.PI * 2 + rnd() * 0.25;
    const radius = RING_RADIUS + (rnd() - 0.5) * 0.9;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    return {
      id,
      skin: SKIN_TONES[Math.floor(rnd() * SKIN_TONES.length)],
      // Camiseta por índice, no por azar: con seis muñecos y ocho colores el
      // azar repetía rojo tres veces. Paso 3 (coprimo con 8) → nunca se repite
      // mientras haya menos muñecos que colores.
      shirt: SHIRT_COLORS[(i * 3 + 1) % SHIRT_COLORS.length],
      hairColor: HAIR_COLORS[Math.floor(rnd() * HAIR_COLORS.length)],
      // Peinado por índice por la misma razón que la camiseta: el azar dejaba
      // casi toda la plaza con moño.
      hair: HAIR_STYLES[(i * 5 + 2) % HAIR_STYLES.length],
      face: {
        eyes: Math.floor(rnd() * 4),
        brows: Math.floor(rnd() * 4),
        mouth: Math.floor(rnd() * 4),
        eyeColor: rnd() > 0.7 ? "#4A7C3F" : "#2B2018",
        eyeSpacing: 0.42 + rnd() * 0.16,
        blush: rnd() > 0.55,
      },
      home: [x, z],
      // Mirando hacia el centro del anillo (donde está la cámara).
      facing: Math.atan2(-x, -z),
      phase: rnd() * Math.PI * 2,
      scale: 0.92 + rnd() * 0.16,
    };
  });
}
