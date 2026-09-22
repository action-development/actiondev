import * as THREE from "three";
import { FLOOR_RADIUS, PLAZA_PALETTE, seededRandom } from "./plaza-config";
import { INK } from "./face-texture";
import { PLAZA_PALETTES, type PlazaMode } from "./plaza-mode";

/**
 * Texturas procedurales de la plaza (cielo + suelo), generadas con Canvas 2D
 * en runtime — cero assets remotos, cero HDR, coherente con la regla dura del
 * proyecto (ver cabecera de `plaza-config.ts`).
 *
 * Cacheadas a nivel de módulo: un único `CanvasTexture` por tipo para toda la
 * sesión, igual que `getToonGradient()` en `port/toon.ts`. `disposePlazaTextures()`
 * las libera si algún día la plaza se desmonta de verdad (hoy `PlazaRoom` vive
 * mientras exista `/resenas`, pero el contrato de limpieza es gratis y evita
 * fugas si el día de mañana la sala se monta/desmonta dentro de un modal).
 */

const SKY_SIZE = 2048;
const FLOOR_SIZE = 512;

/** Texturas que dependen del modo (día/noche): una por modo, generada la
 * primera vez que se pide. Cambiar de modo en la misma sesión (`?hora=`, o
 * cruzar la medianoche) reutiliza la del otro modo si ya se generó. */
const skyTextures = new Map<PlazaMode, THREE.CanvasTexture>();
const floorTextures = new Map<PlazaMode, THREE.CanvasTexture>();
const pavingTextures = new Map<PlazaMode, THREE.CanvasTexture>();
const grassTextures = new Map<PlazaMode, THREE.CanvasTexture>();
const cloudTextures = new Map<PlazaMode, THREE.CanvasTexture>();

let bubbleTexture: THREE.CanvasTexture | null = null;
let glowTexture: THREE.CanvasTexture | null = null;
let lightPoolTexture: THREE.CanvasTexture | null = null;

/** Textura 1x1 de color medio — fallback SSR (sin `document`, sin canvas). */
function fallbackTexture(color: string): THREE.CanvasTexture {
  const data = new Uint8Array([0, 0, 0, 255]);
  const rgb = new THREE.Color(color);
  data[0] = Math.round(rgb.r * 255);
  data[1] = Math.round(rgb.g * 255);
  data[2] = Math.round(rgb.b * 255);
  // CanvasTexture espera un `HTMLCanvasElement`/`OffscreenCanvas`; en SSR no
  // hay ninguno de los dos, así que envolvemos un `DataTexture` con la misma
  // interfaz pública que usan los consumidores (mapa de color plano).
  const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex as unknown as THREE.CanvasTexture;
}

/**
 * Color del horizonte: punto donde suelo, fog y cielo tienen que coincidir
 * EXACTAMENTE para que no se vea costura. Lo fija el modo (día/noche).
 *
 * Coincide en pantalla sin conversión porque en three 0.183 el fog se aplica
 * DESPUÉS del tone mapping y el `fogColor` se sube ya en el espacio de salida;
 * el cielo y el suelo usan `toneMapped={false}`, así que los tres llegan al
 * framebuffer con el mismo hex.
 */
export function plazaHorizon(mode: PlazaMode): string {
  return PLAZA_PALETTES[mode].skyHorizon;
}

/**
 * Paradas del cielo por ELEVACIÓN (grados sobre el horizonte), no por UV.
 *
 * Arranca EXACTAMENTE en el color del horizonte: cualquier otra cosa dibuja
 * una línea donde el suelo lejano (ya en ese color por el fog) se encuentra
 * con el cielo. De noche el salto es mínimo — un velo dos puntos por encima
 * del fondo, lo justo para que el arbolado no se recorte contra negro
 * absoluto; de día es el degradado atlántico de verdad.
 */
function skyStops(mode: PlazaMode): ReadonlyArray<readonly [elevationDeg: number, color: string]> {
  const p = PLAZA_PALETTES[mode];
  return [
    [-90, p.skyHorizon],
    [0.5, p.skyHorizon],
    [mode === "dia" ? 14 : 7, p.skyMid],
    [90, p.skyTop],
  ];
}

/**
 * Cielo cyclorama: degradado vertical según `SKY_STOPS`.
 *
 * Se pinta en un canvas alto y se aplica sobre una esfera invertida
 * (`side: THREE.BackSide`) en vez de como `scene.background` equirectangular.
 * Motivo: `scene.background` pasa por el mismo pipeline de tone-mapping /
 * color management del renderer que el resto de la escena, y eso lava los
 * pasteles planos que pide la paleta Wii. Una esfera con `MeshBasicMaterial`
 * + `toneMapped={false}` (mismo patrón que `ComicClouds` en `port/PortSky.tsx`)
 * da control total del color final sin sorpresas.
 */
export function getSkyTexture(mode: PlazaMode): THREE.CanvasTexture {
  const cached = skyTextures.get(mode);
  if (cached) return cached;

  const palette = PLAZA_PALETTES[mode];
  const store = (tex: THREE.CanvasTexture) => {
    skyTextures.set(mode, tex);
    return tex;
  };
  if (typeof document === "undefined") return store(fallbackTexture(palette.skyMid));

  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = SKY_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return store(fallbackTexture(palette.skyMid));

  // Fila 0 del canvas = polo norte de la esfera (flipY + UV de SphereGeometry):
  // la elevación e cae en t = (90 - e) / 180.
  const stops = skyStops(mode);
  const gradient = ctx.createLinearGradient(0, 0, 0, SKY_SIZE);
  for (let i = stops.length - 1; i >= 0; i--) {
    const [elevation, color] = stops[i];
    gradient.addColorStop((90 - elevation) / 180, color);
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return store(texture);
}

/**
 * Suelo: charco de luz tenue (`floorNear`) con degradado radial.
 *
 * Los muñecos viven en r < ~5 de un disco de r = 60, es decir, en el 6-8 %
 * central de la textura: ahí va `floorNear` puro. Desde ahí baja MONÓTONO hasta
 * `PLAZA_HORIZON` y se queda ahí: cualquier tono que se aparte del horizonte
 * en el plano medio se comprime en perspectiva junto a la línea de fuga y se
 * lee como una banda (mismo motivo que en la versión clara).
 */
export function getFloorTexture(mode: PlazaMode): THREE.CanvasTexture {
  const cached = floorTextures.get(mode);
  if (cached) return cached;

  const palette = PLAZA_PALETTES[mode];
  const store = (tex: THREE.CanvasTexture) => {
    floorTextures.set(mode, tex);
    return tex;
  };
  if (typeof document === "undefined") return store(fallbackTexture(palette.floorNear));

  const canvas = document.createElement("canvas");
  canvas.width = FLOOR_SIZE;
  canvas.height = FLOOR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return store(fallbackTexture(palette.floorNear));

  const cx = FLOOR_SIZE / 2;
  const cy = FLOOR_SIZE / 2;
  const radius = FLOOR_SIZE / 2;
  // Las paradas se declaran en unidades de MUNDO y se normalizan con
  // `FLOOR_RADIUS`, no en fracciones del lienzo: el disco es enorme para tapar
  // el borde del mundo, y con fracciones fijas el charco claro del centro
  // crecía con él hasta comerse la mitad del parque.
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  const stop = (worldRadius: number) => Math.min(1, worldRadius / FLOOR_RADIUS);
  gradient.addColorStop(0, palette.floorNear);
  gradient.addColorStop(stop(3.6), palette.floorNear);
  gradient.addColorStop(stop(10.8), palette.floorMid);
  gradient.addColorStop(stop(21), palette.skyHorizon);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, FLOOR_SIZE, FLOOR_SIZE);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return store(texture);
}

/** Lado del lienzo del pavimento. 1024 px para un disco de radio
 * `PAVING_WORLD_RADIUS`: ~51 px por unidad de mundo, suficiente para juntas
 * de 3-4 cm sin que se vean pixeladas con la cámara a ras. */
const PAVING_SIZE = 1024;

/** Radio en unidades de mundo que representa la textura del pavimento. El
 * mesh que la usa (`PlazaRoom`) tiene exactamente este radio: la textura NO
 * se tilea, cubre el disco entero en coordenadas polares. */
export const PAVING_WORLD_RADIUS = 10;

/**
 * Radios (unidades de mundo) de los anillos del despiece, de dentro a fuera.
 * El primero es el medallón central; el último par (8.2-8.6) es el bordillo
 * perimetral, que cierra la plaza.
 *
 * Los anillos crecen hacia fuera porque en perspectiva las piezas lejanas se
 * comprimen: con anillos de ancho constante el fondo se convertía en una
 * banda rayada. Varios radios (2, 3.4, 5, 7) coinciden A PROPÓSITO con
 * `GRID_RINGS` de `PlazaRoom`: así la guía lima cae sobre una junta y se lee
 * como una línea de luz en el pavimento, no como una segunda retícula.
 */
const PAVING_RINGS = [1.25, 2, 2.7, 3.4, 4.2, 5, 6, 7, 8.2, 8.6] as const;

/** Radio a partir del cual empieza el bordillo (pieza larga, sin subdividir). */
const CURB_RADIUS = 8.2;

/**
 * Nº de sectores de un anillo según su radio exterior. Se duplica al crecer el
 * radio, como en un pavimento radial real: mantiene la longitud de arco de
 * cada pieza dentro de un rango razonable (0.5-1 unidad ≈ 80-160 cm) en vez
 * de dejar lajas enormes fuera y astillas dentro.
 */
function sectorsFor(radius: number): number {
  if (radius <= 2.7) return 16;
  if (radius <= 5) return 32;
  return 48;
}

/**
 * Nivel de gris (0-255) del color base del pavimento.
 *
 * Se parsea el hex a mano en vez de leer `new THREE.Color(hex).r`: desde el
 * color management de three, `Color` guarda el valor en espacio LINEAL, así
 * que `.r * 255` de un #242424 da 5, no 36 — las losas salían casi negras y
 * las juntas parecían más claras que las piezas. Canvas 2D trabaja en sRGB,
 * que es justo lo que dice el hex.
 */
function grayOf(hex: string): number {
  return parseInt(hex.slice(1, 3), 16);
}

/** Color de una pieza: gris base del pavimento con una variación determinista
 * de luminancia, para que no se lea como un plano de color liso pero sin
 * introducir ningún tono nuevo. */
function slabColor(baseGray: number, shift: number): string {
  const c = Math.max(0, Math.min(255, Math.round(baseGray + shift)));
  return `rgb(${c}, ${c}, ${c})`;
}

/**
 * Pavimento de la plaza: despiece RADIAL (anillos concéntricos subdivididos en
 * sectores) con medallón central, juntas finas y bordillo perimetral.
 *
 * Capa aparte, NO mezclada en `getFloorTexture`: el degradado radial de esa
 * función está afinado para casar el horizonte con el fog sin banda visible
 * (ver comentario ahí) — tocarlo para meter el despiece lo rompería. Aquí el
 * alpha va BAKEADO en el propio lienzo (opaco hasta el bordillo, a 0 en el
 * borde del disco), así que el mesh se funde con el suelo base sin costura y
 * sin necesidad de un `alphaMap` aparte.
 *
 * Polar y no tileable a propósito: un patrón cuadrado repetido delata su
 * rejilla en cuanto la cámara orbita, y no hay forma de darle centro a la
 * plaza. El despiece radial gira con la cámara sin costuras y pone el foco
 * donde están los muñecos.
 */
export function getPavingTexture(mode: PlazaMode): THREE.CanvasTexture {
  const cached = pavingTextures.get(mode);
  if (cached) return cached;

  const palette = PLAZA_PALETTES[mode];
  const store = (tex: THREE.CanvasTexture) => {
    pavingTextures.set(mode, tex);
    return tex;
  };
  if (typeof document === "undefined") return store(fallbackTexture(palette.paving));

  const canvas = document.createElement("canvas");
  canvas.width = PAVING_SIZE;
  canvas.height = PAVING_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return store(fallbackTexture(palette.paving));

  const c = PAVING_SIZE / 2;
  /** px por unidad de mundo. */
  const px = c / PAVING_WORLD_RADIUS;
  const base = grayOf(palette.paving);

  // PRNG local (mulberry-lite): variación determinista pieza a pieza, para
  // que el pavimento sea idéntico en cada carga y en cada snapshot de e2e.
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Fondo = color de junta. Cada pieza se pinta encima dejando ver la junta.
  ctx.fillStyle = palette.joint;
  ctx.fillRect(0, 0, PAVING_SIZE, PAVING_SIZE);

  /** Ancho de junta, en px de textura (~3 cm de mundo). */
  const JOINT = 2;

  /** Pinta una pieza de anillo (sector) dejando la junta alrededor. */
  const slab = (r0: number, r1: number, a0: number, a1: number, shift: number) => {
    const inner = r0 * px + JOINT / 2;
    const outer = r1 * px - JOINT / 2;
    // La junta angular se descuenta en ángulo, no en px: a igual arco, un
    // margen fijo en radianes se estrecharía hacia fuera y ensancharía hacia
    // dentro. Con `JOINT / radio` la junta mide lo mismo en todo el anillo.
    const padIn = JOINT / 2 / Math.max(inner, 1);
    const padOut = JOINT / 2 / Math.max(outer, 1);
    ctx.beginPath();
    ctx.arc(c, c, outer, a0 + padOut, a1 - padOut);
    ctx.arc(c, c, inner, a1 - padIn, a0 + padIn, true);
    ctx.closePath();
    ctx.fillStyle = slabColor(base, shift);
    ctx.fill();
  };

  // --- Medallón central: cenefa de dovelas + rosa de ocho puntas + ojo liso.
  // Es el centro de la composición: la cámara orbita mirando justo aquí, así
  // que se lo trabaja un poco más que al resto del pavimento.
  const medallion = PAVING_RINGS[0];
  const CENEFA = 24;
  for (let i = 0; i < CENEFA; i++) {
    const a0 = (i / CENEFA) * Math.PI * 2;
    const a1 = ((i + 1) / CENEFA) * Math.PI * 2;
    slab(0.95, medallion, a0, a1, i % 2 === 0 ? 9 : 1);
  }

  // Rosa de los vientos: ocho puntas alternas desde el ojo hasta la cenefa.
  const POINTS = 8;
  const eye = 0.26 * px;
  const tip = 0.92 * px;
  for (let i = 0; i < POINTS; i++) {
    const a = (i / POINTS) * Math.PI * 2;
    const half = Math.PI / POINTS;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * tip, c + Math.sin(a) * tip);
    ctx.lineTo(c + Math.cos(a + half) * eye, c + Math.sin(a + half) * eye);
    ctx.lineTo(c + Math.cos(a - half) * eye, c + Math.sin(a - half) * eye);
    ctx.closePath();
    ctx.fillStyle = slabColor(base, i % 2 === 0 ? 12 : 3);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(c, c, eye, 0, Math.PI * 2);
  ctx.fillStyle = slabColor(base, 16);
  ctx.fill();

  // Aro de acento en el borde del medallón: el único guiño de color del
  // pavimento — marca el centro de la plaza sin competir con nada.
  ctx.beginPath();
  ctx.arc(c, c, medallion * px, 0, Math.PI * 2);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = PLAZA_PALETTE.accent;
  ctx.globalAlpha = mode === "dia" ? 0.22 : 0.16;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // --- Anillos de losas. Cada anillo arranca con medio sector de desfase
  // respecto al anterior: las juntas radiales quedan trabadas en vez de
  // formar una estrella continua del centro al borde.
  for (let i = 0; i < PAVING_RINGS.length - 1; i++) {
    const r0 = PAVING_RINGS[i];
    const r1 = PAVING_RINGS[i + 1];
    const isCurb = r0 >= CURB_RADIUS;
    const sectors = isCurb ? 64 : sectorsFor(r1);
    const twist = (i % 2) * (Math.PI / sectors);
    for (let j = 0; j < sectors; j++) {
      const a0 = (j / sectors) * Math.PI * 2 + twist;
      const a1 = ((j + 1) / sectors) * Math.PI * 2 + twist;
      // El bordillo va un punto más claro y uniforme: es una pieza de remate,
      // no pavimento.
      slab(r0, r1, a0, a1, isCurb ? 14 : (rnd() - 0.5) * 16);
    }
  }

  // --- Caída de luz: el pavimento se apaga del centro hacia el bordillo.
  // Sin esto, el disco se lee plano como una moqueta y su borde exterior
  // aparece de golpe; con la caída, la plaza tiene un foco (donde está la
  // gente) y el perímetro entra en penumbra antes de acabarse.
  // De noche la caída es fuerte (la plaza solo la alumbran las farolas); de
  // día el sol llega a todo y apenas hay más que el degradado de aire.
  const dim = mode === "dia" ? 0.26 : 1;
  const falloff = ctx.createRadialGradient(c, c, 0, c, c, c);
  falloff.addColorStop(0, "rgba(0,0,0,0)");
  falloff.addColorStop(0.32, `rgba(0,0,0,${0.06 * dim})`);
  falloff.addColorStop(0.62, `rgba(0,0,0,${0.3 * dim})`);
  falloff.addColorStop(0.86, `rgba(0,0,0,${0.58 * dim})`);
  falloff.addColorStop(1, `rgba(0,0,0,${0.68 * dim})`);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = falloff;
  ctx.fillRect(0, 0, PAVING_SIZE, PAVING_SIZE);
  ctx.globalCompositeOperation = "source-over";

  // --- Alpha bakeado: opaco hasta el bordillo, a 0 en el borde del disco.
  // `destination-in` recorta además el cuadrado sobrante del lienzo, así que
  // el mesh no necesita ni máscara aparte ni geometría de recorte.
  const fade = ctx.createRadialGradient(c, c, 0, c, c, c);
  fade.addColorStop(0, "rgba(0,0,0,1)");
  fade.addColorStop(PAVING_RINGS[PAVING_RINGS.length - 1] / PAVING_WORLD_RADIUS, "rgba(0,0,0,1)");
  fade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, PAVING_SIZE, PAVING_SIZE);
  ctx.globalCompositeOperation = "source-over";

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return store(texture);
}

/**
 * Halo de luz para las farolas: círculo blanco con caída radial suave, para
 * usar como `map` de un `Sprite` con `AdditiveBlending` y `color` = acento —
 * el mismo truco de "glow barato sin luces reales" que ya evita `Environment`
 * y `MeshReflectorMaterial` en este archivo (ver comentarios de `PlazaRoom`).
 */
/** Lado del lienzo del césped. Es una teja que se repite: 256 px sobran para
 * un grano que nunca se mira de cerca, y baja el coste de generarlo. */
const GRASS_SIZE = 256;
/**
 * Lado de mundo que cubre una teja de césped.
 *
 * Siete unidades (~11 m). A tres, la teja se repetía cien veces de un lado al
 * otro del parque y en la distancia media esa regularidad se leía como un
 * rayado en diagonal sobre la pradera — sobre todo de noche, con el verde
 * oscuro y las motas claras destacando. Cuanto más grande la teja, más tarda
 * el ojo en encontrarle el patrón.
 */
export const GRASS_TILE_WORLD = 7;

/**
 * Césped: manchas suaves de tono sobre el verde de la paleta.
 *
 * El anillo de césped es lo segundo que más ocupa el encuadre después del
 * pavimento, y pintado de un color plano se leía como fieltro: una masa verde
 * sin una sola variación en veinte metros. Aquí no hay hierba dibujada (a esta
 * distancia no se vería) sino lo que sí se ve de lejos en una pradera —
 * parches de sol y sombra, calvas y zonas más densas.
 *
 * Va como `map` de un `MeshStandardMaterial`, así que el tono base sigue
 * saliendo de la luz del modo: esta teja solo MODULA. Por eso las manchas son
 * blanco y negro a muy baja opacidad en vez de verdes propios — así el mismo
 * lienzo sirve de día y de noche sin desafinar con la paleta.
 *
 * Sin costura: cada mancha se pinta también en las ocho copias desplazadas del
 * lienzo, de modo que lo que sale por un borde entra por el contrario.
 */
export function getGrassTexture(mode: PlazaMode): THREE.CanvasTexture {
  const cached = grassTextures.get(mode);
  if (cached) return cached;

  const palette = PLAZA_PALETTES[mode];
  const store = (tex: THREE.CanvasTexture) => {
    grassTextures.set(mode, tex);
    return tex;
  };
  if (typeof document === "undefined") return store(fallbackTexture(palette.grass));

  const canvas = document.createElement("canvas");
  canvas.width = GRASS_SIZE;
  canvas.height = GRASS_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return store(fallbackTexture(palette.grass));

  ctx.fillStyle = palette.grass;
  ctx.fillRect(0, 0, GRASS_SIZE, GRASS_SIZE);

  const rnd = seededRandom("plaza:grass");
  // De noche el verde es mucho más oscuro y la misma mota clara salta cuatro
  // veces más: la misma teja, con la mitad de fuerza.
  const contrast = mode === "noche" ? 0.5 : 1;
  /** Pinta algo en las nueve posiciones del lienzo: la del medio y las ocho
   * que lo rodean. Es lo que hace la teja repetible sin costura. */
  const tiled = (draw: (ox: number, oy: number) => void) => {
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) draw(ox * GRASS_SIZE, oy * GRASS_SIZE);
  };

  // Manchas grandes: el relieve del terreno.
  for (let i = 0; i < 90; i++) {
    const x = rnd() * GRASS_SIZE;
    const y = rnd() * GRASS_SIZE;
    const r = 12 + rnd() * 46;
    const light = rnd() > 0.45;
    const alpha = (light ? 0.1 : 0.085) * (0.5 + rnd() * 0.5) * contrast;
    tiled((ox, oy) => {
      const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      g.addColorStop(0, `rgba(${light ? "255,255,255" : "0,0,0"},${alpha})`);
      g.addColorStop(1, `rgba(${light ? "255,255,255" : "0,0,0"},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Grano fino: rompe la mancha para que no se lea como acuarela. Flojo a
  // propósito — es lo primero que se convierte en muaré cuando la pradera se
  // ve casi de canto.
  const speck = (0.04 * contrast).toFixed(3);
  for (let i = 0; i < 1800; i++) {
    const x = rnd() * GRASS_SIZE;
    const y = rnd() * GRASS_SIZE;
    ctx.fillStyle = rnd() > 0.5 ? `rgba(255,255,255,${speck})` : `rgba(0,0,0,${speck})`;
    ctx.fillRect(x, y, 1, 1 + Math.round(rnd()));
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // La teja se ve casi de canto en el horizonte: sin anisotropía se convierte
  // en bandas de muaré antes de que la niebla la borre.
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return store(texture);
}

/** Lienzo de la franja de nubes. Ancho: se envuelve alrededor del cielo, así
 * que aquí es donde hace falta resolución. */
const CLOUD_SIZE = { width: 2048, height: 512 } as const;

/**
 * Franja de nubes (de día) o de estrellas (de noche) para el cilindro de cielo.
 *
 * Va en su propia franja y no en la textura del cyclorama por resolución: el
 * degradado del cielo se pinta en un lienzo de 8 px de ancho porque solo varía
 * en vertical, y meterle nubes obligaría a un lienzo de 8192 px para que no
 * salieran borrosas. Envuelta en un cilindro —el mismo truco que la franja de
 * arbolado de `PlazaBackdrop`— cada píxel cae donde se ve.
 *
 * Nubes de cómic, a juego con el resto: cúmulos de lóbulos blandos, con la
 * panza algo más gris, planos y sin contorno. Nada de volumen: el parque
 * entero es mate.
 */
export function getCloudTexture(mode: PlazaMode): THREE.CanvasTexture {
  const cached = cloudTextures.get(mode);
  if (cached) return cached;

  const store = (tex: THREE.CanvasTexture) => {
    cloudTextures.set(mode, tex);
    return tex;
  };
  if (typeof document === "undefined") return store(fallbackTexture("#00000000"));

  const canvas = document.createElement("canvas");
  canvas.width = CLOUD_SIZE.width;
  canvas.height = CLOUD_SIZE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return store(fallbackTexture("#00000000"));

  const rnd = seededRandom(`plaza:clouds:${mode}`);
  const { width: W, height: H } = CLOUD_SIZE;

  if (mode === "dia") {
    /** Un lóbulo: degradado radial achatado. Sin `filter: blur`, que no está
     * garantizado en todos los navegadores — el degradado da el mismo borde
     * blando y es Canvas 2D de toda la vida. */
    const lobe = (x: number, y: number, r: number, squash: number, rgb: string, alpha: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, squash);
      const g = ctx.createRadialGradient(0, 0, r * 0.25, 0, 0, r);
      g.addColorStop(0, `rgba(${rgb},${alpha})`);
      g.addColorStop(0.72, `rgba(${rgb},${alpha * 0.82})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    for (let i = 0; i < 26; i++) {
      const x = rnd() * W;
      // v = 0 abajo (cerca del horizonte) en el cilindro. Las nubes bajas
      // salen más pequeñas y más aplastadas: es la perspectiva de un cielo
      // real, donde lo que está cerca del horizonte se ve de canto.
      const v = 0.08 + rnd() * 0.72;
      const y = H - v * H;
      const scale = 0.45 + v * 1.1;
      const width = (70 + rnd() * 130) * scale;
      const squash = 0.34 + v * 0.22;
      const lobes = 4 + Math.floor(rnd() * 4);
      // Panza: el mismo cúmulo en gris, desplazado hacia abajo.
      for (const [rgb, alpha, dy] of [
        ["197,212,226", 0.55, width * 0.1],
        ["255,255,255", 0.9, 0],
      ] as const) {
        for (let l = 0; l < lobes; l++) {
          const t = l / (lobes - 1) - 0.5;
          const r = width * (0.42 - Math.abs(t) * 0.2 + rnd() * 0.08);
          // El lienzo se envuelve: lo que asoma por un canto entra por el otro.
          for (const ox of [-W, 0, W]) lobe(x + ox + t * width * 1.5, y + dy - Math.abs(t) * width * 0.12, r, squash, rgb, alpha);
        }
      }
    }
  } else {
    // De noche no hay nubes: el cielo es el fondo del sitio (#080808) y una
    // nube gris ahí dentro se lee como una mancha. Lo que sí cabe son cuatro
    // estrellas, y solo en la mitad alta de la franja — abajo las taparía el
    // arbolado.
    for (let i = 0; i < 220; i++) {
      const x = rnd() * W;
      const y = rnd() * H * 0.72;
      const r = 0.6 + rnd() * 1.5;
      const alpha = 0.18 + rnd() * 0.42;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      g.addColorStop(0, `rgba(226,238,255,${alpha})`);
      g.addColorStop(1, "rgba(226,238,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return store(texture);
}

export function getGlowTexture(): THREE.CanvasTexture {
  if (glowTexture) return glowTexture;
  if (typeof document === "undefined") {
    glowTexture = fallbackTexture("#ffffff");
    return glowTexture;
  }

  const SIZE = 128;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    glowTexture = fallbackTexture("#ffffff");
    return glowTexture;
  }

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, SIZE / 2);
  gradient.addColorStop(0, "rgba(255,255,255,0.9)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.35)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  glowTexture = texture;
  return glowTexture;
}

/**
 * Charco de luz de una farola: disco con MESETA central y caída larga.
 *
 * No vale la textura del halo (`getGlowTexture`): esa cae desde el primer
 * píxel, que es lo que hace creíble un resplandor en el aire, pero sobre el
 * suelo deja un manchurrón difuso que no se lee como luz. Un charco real tiene
 * una zona claramente iluminada bajo el punto de luz y un borde largo que se
 * disuelve; eso es la meseta + la caída suave de aquí.
 */
export function getLightPoolTexture(): THREE.CanvasTexture {
  if (lightPoolTexture) return lightPoolTexture;
  if (typeof document === "undefined") {
    lightPoolTexture = fallbackTexture("#ffffff");
    return lightPoolTexture;
  }

  const SIZE = 256;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    lightPoolTexture = fallbackTexture("#ffffff");
    return lightPoolTexture;
  }

  const c = SIZE / 2;
  const gradient = ctx.createRadialGradient(c, c, 0, c, c, c);
  gradient.addColorStop(0, "rgba(255,255,255,0.62)");
  gradient.addColorStop(0.22, "rgba(255,255,255,0.5)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.26)");
  gradient.addColorStop(0.72, "rgba(255,255,255,0.08)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  lightPoolTexture = texture;
  return lightPoolTexture;
}

/**
 * Icono de "hablando": el bocadillo de cómic de toda la vida — relleno BLANCO
 * y contorno de tinta, igual que los ojos y las cejas de las caras. Antes iba
 * en lenguaje holográfico (fondo negro translúcido, borde y puntos lima) y
 * desentonaba: la plaza no es UI proyectada, es una viñeta.
 *
 * Cuerpo y cola son UN SOLO trazo continuo (arcos explícitos, no `arcTo`, para
 * poder meter la cola en el borde inferior). Con el relleno oscuro de antes
 * daba igual, pero sobre blanco un triángulo como subtrazo aparte deja una
 * costura de tinta cruzando el bocadillo por donde nace la cola.
 *
 * Se dibuja una vez y se reutiliza como `map` de un `Sprite` por muñeco — el
 * sprite (no la textura) es quien anima opacidad/escala.
 */
export function getSpeechBubbleTexture(): THREE.CanvasTexture {
  if (bubbleTexture) return bubbleTexture;
  if (typeof document === "undefined") {
    bubbleTexture = fallbackTexture("#ffffff");
    return bubbleTexture;
  }

  const SIZE = 128;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bubbleTexture = fallbackTexture("#ffffff");
    return bubbleTexture;
  }

  const w = 100;
  const h = 62;
  // Cuerpo corrido un pelín a la derecha del centro del sprite: así la cola
  // (que nace de su borde inferior izquierdo) cae justo en el centro, que es
  // donde el sprite se ancla sobre la cabeza del muñeco.
  const x = (SIZE - w) / 2 + 6;
  const y = 14;
  const r = 20;
  // Cola: nace del borde inferior y apunta hacia abajo, al centro del sprite.
  const tailRight = x + w * 0.46;
  const tailLeft = x + w * 0.28;
  const tipX = SIZE / 2;
  const tipY = y + h + 22;

  // Recorrido en sentido horario. El borde inferior se recorre de derecha a
  // izquierda y la cola se intercala ahí, así el contorno es uno solo.
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
  ctx.lineTo(x + w, y + h - r);
  ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  ctx.lineTo(tailRight, y + h);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(tailLeft, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
  ctx.closePath();

  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineJoin = "round";
  ctx.lineWidth = 5;
  ctx.strokeStyle = INK;
  ctx.stroke();

  // Tres puntos "hablando".
  ctx.fillStyle = INK;
  const dotY = y + h / 2;
  for (const i of [-1, 0, 1]) {
    ctx.beginPath();
    ctx.arc(x + w / 2 + i * 17, dotY, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  bubbleTexture = texture;
  return bubbleTexture;
}

/** Libera las texturas cacheadas. Llamar solo si la plaza se desmonta de verdad. */
export function disposePlazaTextures(): void {
  for (const cache of [skyTextures, floorTextures, pavingTextures, grassTextures, cloudTextures]) {
    cache.forEach((tex) => tex.dispose());
    cache.clear();
  }
  bubbleTexture?.dispose();
  bubbleTexture = null;
  glowTexture?.dispose();
  glowTexture = null;
  lightPoolTexture?.dispose();
  lightPoolTexture = null;
}
