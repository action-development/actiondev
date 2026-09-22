/**
 * Contrato compartido de la plaza de reseñas (`/resenas`).
 *
 * TODO lo que necesiten a la vez el entorno (`PlazaRoom`), los muñecos
 * (`PlazaCharacter`) y el mundo (`PlazaWorld`) vive aquí: paleta, medidas,
 * tipos y layout. Regla dura del proyecto: CERO assets remotos — la sala y las
 * caras se generan con `CanvasTexture` en runtime, nunca con HDR ni GLB.
 *
 * Referencia visual: las salas de personajes de Wii (plaza infinita, muñecos
 * de cabeza grande y cuerpo cápsula), aquí sobre el fondo oscuro del sitio. Copiamos el LENGUAJE visual
 * —proporciones, shading plano, comportamiento— nunca marcas, tipografías ni
 * assets de Nintendo.
 */

/**
 * Lo INVARIANTE de la paleta de la plaza: el acento lima del sitio y los dos
 * grises que no dependen de la hora.
 *
 * Todo lo que cambia entre día y noche (cielo, suelo, pavimento, césped,
 * niebla y luces) vive en `plaza-mode.ts` — ver `PLAZA_PALETTES`.
 */
export const PLAZA_PALETTE = {
  /** Sombra de blob bajo cada muñeco. */
  shadow: "#000000",
  /** Retícula del suelo y guías de arrastre: referencias de profundidad sobre
   * un fondo plano. Lima muy apagado, no compite con el muñeco. */
  guide: "#c8ff00",
  /** Acento de interacción (highlight del muñeco enfocado) = `--accent`. */
  accent: "#c8ff00",
} as const;

/**
 * Radio del disco de suelo. Más allá solo hay fog.
 *
 * Grande a propósito, MUCHO más allá de `fog.far`: no es superficie útil, es
 * lo que impide que se vea el borde del mundo. Con 60, el canto del disco caía
 * a 3,4° por debajo del horizonte —justo en el hueco que la franja de arbolado
 * pintada deja entre las copas y los troncos— y por ahí se colaba una banda de
 * cielo dentada bajo los árboles. A 150 ese canto sube a 1,4°, dentro de la
 * masa opaca de las copas, y el hueco desaparece pase lo que pase con la
 * cámara. Cuesta los mismos triángulos: solo cambia el radio.
 */
export const FLOOR_RADIUS = 150;

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

/**
 * Peinados leídos como masculinos/femeninos, para que el muñeco de la plaza
 * coincida con el género del nombre en `testimonials.ts`. "bald" vale para
 * ambos sets (a nadie le choca una cabeza rapada) — el resto sí está marcado.
 */
const MASCULINE_HAIR: readonly HairStyle[] = ["short", "spiky", "bald"];
const FEMININE_HAIR: readonly HairStyle[] = ["bob", "bun", "ponytail", "bald"];

/** Género detectado del cliente, o `undefined` para alias/empresas: en ese
 * caso el peinado sale de TODO el set, sin sesgo (pedido del cliente). */
export type DollGender = "male" | "female" | undefined;

/**
 * Color de iris. Antes sorteaba un 30% de ojos verdes (#4A7C3F) que quedaba
 * raro sobre la cara plana del muñeco — ahora siempre marrón oscuro. Se sigue
 * pidiendo el `draw` (0-1) para no desplazar el resto de la secuencia
 * determinista de `buildDolls` (eyeSpacing, blush...) si se reintroduce la
 * variación más adelante.
 */
function eyeColorFor(_draw: number): string {
  return "#2B2018";
}

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

/**
 * Radio (mín/máx) del área en la que se esparcen los muñecos. Sustituye al
 * antiguo anillo: con ángulo Y radio a la vez en manos del azar, la plaza deja
 * de leerse como una formación y pasa a leerse como gente parada donde le
 * apeteció pararse.
 *
 * El máximo deja libre el anillo del mobiliario: sumando `WANDER_RADIUS`
 * (1.15, en `PlazaWorld`) un muñeco llega a ~6.4, justo por dentro de los
 * bancos (`DECOR_RINGS.bench`, 7).
 */
const LAYOUT_RADIUS = { min: 2.55, max: 5.4 } as const;

/**
 * Radio prohibido en el centro: la fuente. Ni se coloca ni se pasea dentro
 * (`PlazaWorld` recorta ahí el destino del paseo). Es el radio del pilón
 * (1.22) más el cuerpo del muñeco y un margen para que no roce el murete.
 */
export const FOUNTAIN_KEEP_OUT = 1.95;

/** Separación mínima entre dos muñecos (unidades de mundo): evita solapes sin
 * imponer ninguna formación geométrica. Con más de veinte reseñas, 1.05 los
 * dejaba amontonados en el centro — cabezas solapadas y ninguna silueta
 * legible. */
const MIN_DOLL_SPACING = 1.25;

/** Intentos de recolocación antes de aceptar el candidato menos malo — así el
 * layout sigue siendo determinista y sin bucles sin fin. */
const PLACEMENT_ATTEMPTS = 24;

/**
 * Sitio para un muñeco: ángulo y radio aleatorios (no en formación), con
 * rechazo por distancia mínima a los ya colocados. Si en `PLACEMENT_ATTEMPTS`
 * intentos no aparece un hueco libre (plaza muy llena), se queda con el
 * candidato que más se alejó de sus vecinos.
 *
 * Solo para los muñecos: la decoración (`buildDecor`) va en anillos regulares
 * a propósito — el mobiliario urbano alineado es lo que hace que un espacio se
 * lea como diseñado y no como un descampado con cosas tiradas.
 */
function pickOrganicSpot(
  rnd: () => number,
  placed: ReadonlyArray<{ x: number; z: number }>,
): { x: number; z: number } {
  let best = { x: 0, z: 0 };
  let bestMinDist = -Infinity;
  for (let attempt = 0; attempt < PLACEMENT_ATTEMPTS; attempt++) {
    const angle = rnd() * Math.PI * 2;
    const radius = LAYOUT_RADIUS.min + rnd() * (LAYOUT_RADIUS.max - LAYOUT_RADIUS.min);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (placed.length === 0) return { x, z };
    let minDist = Infinity;
    for (const p of placed) minDist = Math.min(minDist, Math.hypot(x - p.x, z - p.z));
    if (minDist >= MIN_DOLL_SPACING) return { x, z };
    if (minDist > bestMinDist) {
      bestMinDist = minDist;
      best = { x, z };
    }
  }
  return best;
}

/**
 * Genera la ficha de cada muñeco a partir de los testimonios (id + género
 * opcional). Esparcidos por la plaza con `pickOrganicSpot`, no en anillo:
 * cada uno con su propio hueco, sin leerse como una formación geométrica.
 */
export function buildDolls(
  entries: readonly { id: string; gender?: DollGender }[]
): DollSpec[] {
  const placed: { x: number; z: number }[] = [];
  return entries.map(({ id, gender }, i) => {
    const posRnd = seededRandom(`${id}:layout`);
    const { x, z } = pickOrganicSpot(posRnd, placed);
    placed.push({ x, z });

    const rnd = seededRandom(id);
    // Peinado del set masculino/femenino que toque por nombre; sin género
    // (alias, handles, empresas) sale de TODO el set, sin sesgo — a azar.
    const hairPool = gender === "male" ? MASCULINE_HAIR : gender === "female" ? FEMININE_HAIR : HAIR_STYLES;
    return {
      id,
      skin: SKIN_TONES[Math.floor(rnd() * SKIN_TONES.length)],
      // Camiseta por índice, no por azar: con seis muñecos y ocho colores el
      // azar repetía rojo tres veces. Paso 3 (coprimo con 8) → nunca se repite
      // mientras haya menos muñecos que colores.
      shirt: SHIRT_COLORS[(i * 3 + 1) % SHIRT_COLORS.length],
      hairColor: HAIR_COLORS[Math.floor(rnd() * HAIR_COLORS.length)],
      hair: hairPool[Math.floor(rnd() * hairPool.length)],
      face: {
        eyes: Math.floor(rnd() * 4),
        brows: Math.floor(rnd() * 4),
        mouth: Math.floor(rnd() * 4),
        eyeColor: eyeColorFor(rnd()),
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

/**
 * Paleta del mobiliario (farolas, bancos, setos). Separada de
 * `PLAZA_PALETTE` porque es mobiliario, no personajes: tonos apagados de
 * metal/madera/hoja, coherentes con el resto del sitio (nada de colores
 * saturados salvo el acento, reservado a la luz de las farolas).
 *
 * Todos varios puntos MÁS CLAROS de lo que pide el papel: sobre un fondo
 * #080808 un gris "realista" (#3a3a3a) con `metalness` alto se va a negro y
 * el mueble desaparece. Aquí no hay environment map — sin IBL, `metalness`
 * solo resta luz — así que el mobiliario es todo dieléctrico y se apoya en el
 * color base para tener presencia.
 */
export const PLAZA_DECOR_PALETTE = {
  /** Poste de la farola, patas del banco y aro del alcorque. */
  metal: "#5b6066",
  /** Listones del banco. */
  wood: "#7a6047",
  /** Tronco del arbolado perimetral. */
  bark: "#3d3228",
  /** Estípite de la palmera: mucho más claro y gris que un tronco de árbol
   * — es fibra seca, no corteza. */
  palm: "#6c5c46",
  /** Vidrio del farol apagado (de día): cristal sucio, no fuente de luz. */
  glassOff: "#cfd6cd",
  /** Luz de la farola: lima del sitio blanqueado. En aditivo, el acento puro
   * se lee como un verde chillón; con blanco dentro parece luz. */
  glow: "#e9ffc0",
} as const;

/**
 * Ángulo (rad) donde se planta el telón del fondo — el Pazo y la arboleda
 * pintados (`PlazaBackdrop`).
 *
 * Es el "frente" de la plaza: la cámara vive enfrente, mirando hacia aquí
 * (`PlazaWorld`), y por eso todo lo pintado puede concentrarse en este arco.
 * Lo comparten telón y cámara a propósito: si se mueve uno sin el otro, la
 * cámara acaba encuadrando el lado sin decorado.
 */
export const PLAZA_FRONT_ANGLE = Math.PI * 0.55;

/** Tipo de pieza de mobiliario. */
export type DecorKind = "lamp" | "bench" | "bin" | "hedge" | "tree" | "palm";

/** Piezas cuya posición y tamaño llevan un respiro aleatorio: la vegetación.
 * El mobiliario de catálogo (farolas, bancos) va clavado en su anillo. */
const ORGANIC_KINDS: ReadonlyArray<DecorKind> = ["hedge", "tree", "palm"];

/** Ficha de una pieza: sitio fijo + variación determinista. */
export interface DecorSpec {
  kind: DecorKind;
  pos: [number, number];
  /** Rotación en Y, radianes. El mobiliario mira siempre al centro. */
  rotation: number;
  /** Variación de tamaño. 1 en farolas y bancos (mobiliario de catálogo:
   * todas las piezas son iguales); solo varía la vegetación. */
  scale: number;
}

/**
 * Anillos del mobiliario: radio, nº de piezas y desfase angular.
 *
 * REGULARES a propósito, al contrario que los muñecos: una plaza se lee como
 * diseñada porque las farolas están equiespaciadas y los bancos alineados.
 * Con el mismo reparto orgánico de la gente, el mobiliario parecía tirado por
 * ahí. Los desfases evitan que farola, banco y seto caigan en el mismo radio
 * angular y se tapen entre ellos.
 *
 * Los radios dejan libre la zona de paseo (`LAYOUT_RADIUS.max` 5.25 +
 * `WANDER_RADIUS` 1.15 ⇒ ~6.4) y caen dentro del pavimento
 * (`PAVING_WORLD_RADIUS` 10, bordillo a 8.2-8.6): bancos y farolas sobre las
 * losas, setos justo fuera del bordillo.
 */
const DECOR_RINGS: Readonly<
  Record<
    DecorKind,
    { radius: number; count: number; offset: number; jitter?: number; scale?: [number, number] }
  >
> = {
  bench: { radius: 7, count: 4, offset: Math.PI / 4 },
  lamp: { radius: 7.6, count: 6, offset: 0 },
  // Papelera: al lado de cada banco, ligeramente desfasada en ángulo. Es el
  // detalle que delata una plaza de verdad — un banco solo en mitad de la nada
  // parece atrezzo.
  bin: { radius: 7.15, count: 4, offset: Math.PI / 4 + 0.2 },
  hedge: { radius: 9.2, count: 6, offset: Math.PI / 6, jitter: 0.4, scale: [0.85, 1.15] },
  // Arbolado: telón de fondo. Va MUY fuera del anillo de la cámara (11.5)
  // para no barrer el encuadre al pasar por delante, y lo bastante alto para
  // asomar por encima de las farolas desde el otro lado de la plaza. Sin él,
  // la plaza flotaba recortada sobre un fondo negro sin nada detrás.
  tree: { radius: 16.8, count: 11, offset: Math.PI / 11, jitter: 1.8, scale: [0.76, 1.04] },
  // Palmeras: por dentro del arbolado y por fuera de la órbita de la cámara
  // (11.5), que no puede atravesar un tronco. Son la silueta que hace que el
  // parque se reconozca como Castrelos y no como un jardín cualquiera.
  palm: { radius: 14.6, count: 6, offset: Math.PI / 6 + 0.35, jitter: 1.1, scale: [0.82, 1.12] },
};

/**
 * Genera el mobiliario de la plaza. Determinista y ajeno a los testimonios:
 * no cambia al añadir o quitar una reseña, así que no rompe los snapshots de
 * e2e por un cliente nuevo.
 */
export function buildDecor(): DecorSpec[] {
  const out: DecorSpec[] = [];
  for (const kind of ["bench", "lamp", "bin", "hedge", "tree", "palm"] as const) {
    const { radius, count, offset, jitter = 0, scale } = DECOR_RINGS[kind];
    const organic = ORGANIC_KINDS.includes(kind);
    for (let i = 0; i < count; i++) {
      const rnd = seededRandom(`decor:${kind}:${i}`);
      // Un seto (o un árbol) clonado diez veces exactas canta tanto como una
      // farola torcida: la vegetación lleva respiro de radio, giro y tamaño.
      const r = radius + (rnd() - 0.5) * jitter;
      const angle = offset + (i / count) * Math.PI * 2 + (organic ? (rnd() - 0.5) * 0.12 : 0);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      out.push({
        kind,
        pos: [x, z],
        // Mirando al centro, igual que los muñecos (`facing`). En los árboles
        // solo sirve para que no se repita la misma silueta.
        rotation: Math.atan2(-x, -z) + (kind === "tree" || kind === "palm" ? rnd() * Math.PI : 0),
        scale: scale ? scale[0] + rnd() * (scale[1] - scale[0]) : 1,
      });
    }
  }
  return out;
}
