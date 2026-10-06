import * as THREE from "three";
import { seededRandom } from "./plaza-config";
import { PLAZA_PALETTES, type PlazaMode } from "./plaza-mode";
import { GROUND_PALETTES } from "./ground-palette";

/**
 * Texturas procedurales de la plaza (cielo, nubes y césped; el pavimento es un
 * shader, ver `ground-paving.ts`), generadas con Canvas 2D
 * en runtime — cero assets remotos, cero HDR, coherente con la regla dura del
 * proyecto (ver cabecera de `plaza-config.ts`).
 *
 * Cacheadas a nivel de módulo: un único `CanvasTexture` por tipo para toda la
 * sesión, igual que `getToonGradient()` en `port/toon.ts`. `disposePlazaTextures()`
 * las libera si algún día la plaza se desmonta de verdad (hoy `PlazaRoom` vive
 * mientras exista `/resenas`, pero el contrato de limpieza es gratis y evita
 * fugas si el día de mañana la sala se monta/desmonta dentro de un modal).
 */

/** Texturas que dependen del modo (día/noche): una por modo, generada la
 * primera vez que se pide. Cambiar de modo en la misma sesión (`?hora=`, o
 * cruzar la medianoche) reutiliza la del otro modo si ya se generó. */
const skyTextures = new Map<PlazaMode, THREE.Texture>();
const grassTextures = new Map<PlazaMode, THREE.CanvasTexture>();
const cloudTextures = new Map<PlazaMode, THREE.CanvasTexture>();

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

/** Hex sRGB → componentes 0-1 (sRGB, sin convertir). */
function hexToSrgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Paradas del cielo por ELEVACIÓN (grados sobre el horizonte), no por UV.
 *
 * Arranca EXACTAMENTE en el color del horizonte: cualquier otra cosa dibuja
 * una línea donde el suelo lejano (ya en ese color por el fog) se encuentra
 * con el cielo. De día es el degradado atlántico de verdad. De noche el salto
 * es mínimo —un velo dos puntos por encima del fondo, lo justo para que el
 * arbolado no se recorte contra negro absoluto— con un resplandor de ciudad
 * (`skyGlow`) justo por encima de las copas que se funde antes de los 16°.
 */
function skyStops(mode: PlazaMode): ReadonlyArray<readonly [elevationDeg: number, color: string]> {
  const p = PLAZA_PALETTES[mode];
  const glow = GROUND_PALETTES[mode].skyGlow;
  if (glow) {
    return [
      [-90, p.skyHorizon],
      [0.5, p.skyHorizon],
      [3.5, glow],
      [16, p.skyMid],
      [90, p.skyTop],
    ];
  }
  return [
    [-90, p.skyHorizon],
    [0.5, p.skyHorizon],
    [14, p.skyMid],
    [90, p.skyTop],
  ];
}

/** Muestras del degradado del cielo: una tira vertical, no un lienzo. */
const SKY_SAMPLES = 2048;

/**
 * Cielo cyclorama: degradado vertical según `skyStops`.
 *
 * Es una tira 1×N en FLOAT de 16 bits (valores lineales) y no un canvas de 8
 * bits: un degradado oscuro en 8 bits tiene escalones de 1/255 que se ven como
 * bandas de noche; con la textura en half-float el filtrado de la GPU
 * interpola con precisión y el `dithering` del material rompe el último
 * escalón al cuantizar la salida. Las paradas se mezclan en sRGB (como hacía
 * el degradado del canvas) para que el aspecto no cambie, y se convierten a
 * lineal al escribir.
 *
 * Se aplica sobre una esfera invertida (`side: THREE.BackSide`) en vez de como
 * `scene.background` equirectangular: `scene.background` pasa por el mismo
 * pipeline de tone-mapping / color management que el resto y eso lava los
 * pasteles planos de la paleta. Una esfera con `MeshBasicMaterial` +
 * `toneMapped={false}` da control total del color final.
 */
export function getSkyTexture(mode: PlazaMode): THREE.Texture {
  const cached = skyTextures.get(mode);
  if (cached) return cached;

  const stops = skyStops(mode).map(([e, c]) => [e, hexToSrgb(c)] as const);
  const data = new Uint16Array(SKY_SAMPLES * 4);
  for (let j = 0; j < SKY_SAMPLES; j++) {
    // Fila 0 = polo sur (flipY desactivado en DataTexture): v = (j + .5) / N.
    const elevation = -90 + (180 * (j + 0.5)) / SKY_SAMPLES;
    let i = 0;
    while (i < stops.length - 2 && elevation > stops[i + 1][0]) i++;
    const [e0, c0] = stops[i];
    const [e1, c1] = stops[i + 1];
    const t = Math.min(1, Math.max(0, (elevation - e0) / (e1 - e0)));
    for (let k = 0; k < 3; k++) {
      const srgb = c0[k] + (c1[k] - c0[k]) * t;
      data[j * 4 + k] = THREE.DataUtils.toHalfFloat(srgbToLinear(srgb));
    }
    data[j * 4 + 3] = THREE.DataUtils.toHalfFloat(1);
  }

  const texture = new THREE.DataTexture(data, 1, SKY_SAMPLES, THREE.RGBAFormat, THREE.HalfFloatType);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  skyTextures.set(mode, texture);
  return texture;
}


/** Lado del lienzo del césped. Es una teja que se repite: a 512 px (~73 px por
 * unidad de mundo) las manchas se leen nítidas a media distancia en vez del
 * fieltro borroso que daban 256 px. */
const GRASS_SIZE = 512;
/**
 * Lado de mundo que cubre una teja de césped.
 *
 * Siete unidades (~11 m). A tres, la teja se repetía cien veces de un lado al
 * otro del parque y en la distancia media esa regularidad se leía como un
 * rayado en diagonal sobre la pradera — sobre todo de noche, con el verde
 * oscuro y las motas claras destacando. Cuanto más grande la teja, más tarda
 * el ojo en encontrarle el patrón. (Además `ground-grass.ts` mezcla una
 * segunda escala no múltiplo, que rompe del todo el periodo.)
 */
export const GRASS_TILE_WORLD = 7;

/**
 * Césped: manchas suaves de tono sobre el verde de la paleta.
 *
 * No hay hierba dibujada (a esta distancia no se vería) sino lo que sí se ve
 * de lejos en una pradera: parches de sol y sombra, calvas, zonas más densas y
 * un poco de variación de tono (algo más seco aquí, más lustroso allá). Tres
 * escalas —manchas grandes de terreno, manchas medias y grano— a MENOS
 * contraste que antes: con una sola escala fuerte se leía a acuarela.
 *
 * Va como `map` de un `MeshStandardMaterial`, así que el tono base sigue
 * saliendo de la luz del modo: las manchas claras/oscuras son blanco y negro a
 * baja opacidad y las de tono son amarillo seco y verde lustroso a opacidad
 * aún menor, para que el mismo lienzo sirva de día y de noche.
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
  const blob = (x: number, y: number, r: number, rgb: string, alpha: number) => {
    tiled((ox, oy) => {
      const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      g.addColorStop(0, `rgba(${rgb},${alpha})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // Variación de tono, a gran escala: zonas más secas y más lustrosas.
  for (let i = 0; i < 16; i++) {
    const dry = rnd() > 0.5;
    blob(rnd() * GRASS_SIZE, rnd() * GRASS_SIZE, 110 + rnd() * 150, dry ? "196,186,70" : "30,118,66", (0.05 + rnd() * 0.035) * contrast);
  }
  // Manchas medias: el relieve del terreno (luz y sombra).
  for (let i = 0; i < 70; i++) {
    const light = rnd() > 0.45;
    blob(
      rnd() * GRASS_SIZE,
      rnd() * GRASS_SIZE,
      24 + rnd() * 88,
      light ? "255,255,255" : "0,0,0",
      (light ? 0.065 : 0.055) * (0.5 + rnd() * 0.5) * contrast,
    );
  }

  // Grano fino: rompe la mancha para que no se lea como acuarela. Flojo a
  // propósito — es lo primero que se convierte en muaré cuando la pradera se
  // ve casi de canto.
  const speck = (0.035 * contrast).toFixed(3);
  for (let i = 0; i < 7000; i++) {
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
  // en bandas de muaré antes de que la niebla la borre. `PlazaRoom` sube esto
  // al máximo de la GPU (`getMaxAnisotropy`) antes de la primera subida.
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return store(texture);
}

/** Lienzo de la franja de nubes/estrellas. Envuelve el cielo ENTERO (360°):
 * 4096 px = ~11,4 px por grado, igual en horizontal y en vertical (la franja
 * cubre ~22° en 256 px), así que las formas redondas no salen estiradas. */
export const CLOUD_SIZE = { width: 4096, height: 256 } as const;

/**
 * Franja de nubes (de día) o de estrellas (de noche) para el cilindro de cielo.
 *
 * Va en su propia franja y no en la textura del cyclorama por resolución (ver
 * `getSkyTexture`). Envuelta en un cilindro —el mismo truco que la franja de
 * arbolado de `PlazaBackdrop`— cada píxel cae donde se ve.
 *
 * Con la cámara a ras de la plaza el cielo visible es una franja baja, así que
 * las nubes son BANCOS achatados de base plana junto al horizonte (1,5-9°) y no
 * cúmulos altos que nunca entraban en cuadro. Nubes de cómic, a juego con el
 * resto: lóbulos blandos, panza algo más gris, sin contorno.
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
  /** px por grado (igual en los dos ejes). */
  const PPD = W / 360;

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

    const BANKS = 22;
    for (let i = 0; i < BANKS; i++) {
      // Reparto estratificado en horizontal: sin huecos de medio cielo ni
      // pelotones de bancos pegados.
      const x = ((i + 0.15 + rnd() * 0.7) / BANKS) * W;
      // Base del banco: entre 1,6° y 7° sobre el horizonte (y crece hacia
      // abajo en el lienzo). Con la cámara a ras el cielo enseña pocos grados
      // sobre las copas (~1,6°), así que las bases van BAJAS: así asoman las
      // cimas de los bancos, no solo su panza. Los más bajos, más pequeños y
      // planos.
      const elev = 1.6 + rnd() * 7.4;
      const baseY = H - elev * PPD;
      const near = (elev - 1.6) / 7.4; // 0 = pegado al horizonte
      const width = (80 + rnd() * 150) * (0.65 + near * 0.5);
      const squash = 0.3 + near * 0.12;
      const lobes = 5 + Math.floor(rnd() * 4);
      // Panza: el mismo banco en gris, desplazado hacia abajo.
      for (const [rgb, alpha, dy] of [
        ["186,203,220", 0.42, width * 0.05],
        ["250,252,255", 0.7, 0],
      ] as const) {
        for (let l = 0; l < lobes; l++) {
          const t = l / (lobes - 1) - 0.5;
          // Lóbulo central mayor: el banco abulta por el medio y es plano
          // por la base (los centros se apoyan en la línea de base).
          const r = width * (0.3 - Math.abs(t) * 0.16 + rnd() * 0.06);
          const cy = baseY + dy - r * squash * 0.55;
          for (const ox of [-W, 0, W]) lobe(x + ox + t * width * 1.45, cy, r, squash, rgb, alpha);
        }
      }
    }
    // Fundido de la base hacia el horizonte: la nube se pierde en la calima
    // en vez de cortarse contra las copas.
    const fade = ctx.createLinearGradient(0, H, 0, H - 1.2 * PPD);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(1, "rgba(0,0,0,1)");
    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, W, H - 1.2 * PPD);
    ctx.globalCompositeOperation = "source-over";
  } else {
    // De noche no hay nubes: el cielo es el fondo del sitio (#080808) y una
    // nube gris ahí dentro se lee como una mancha. Lo que sí cabe son
    // estrellas, entre 3° y 22° (por encima de las copas), más densas arriba:
    // cerca de la calima de la ciudad no se ven.
    for (let i = 0; i < 360; i++) {
      const x = rnd() * W;
      const u = rnd();
      const elev = 3.2 + (1 - u * u) * 18.5;
      const y = H - elev * PPD;
      const bright = rnd() > 0.93;
      const r = bright ? 0.9 + rnd() * 0.8 : 0.45 + rnd() * 0.6;
      const alpha = (bright ? 0.6 : 0.22) + rnd() * 0.35;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      g.addColorStop(0, `rgba(226,238,255,${alpha})`);
      g.addColorStop(0.35, `rgba(226,238,255,${alpha * 0.55})`);
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

/**
 * Halo de luz para las farolas: círculo blanco con caída radial suave, para
 * usar como `map` de un `Sprite` con `AdditiveBlending` y `color` = acento —
 * el mismo truco de "glow barato sin luces reales" que ya evita `Environment`
 * y `MeshReflectorMaterial` en este archivo (ver comentarios de `PlazaRoom`).
 */

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

/** Liberadores de texturas singleton que viven fuera de este archivo. */
const extraDisposers = new Set<() => void>();

/**
 * Registra la liberación de una textura singleton propia de otro módulo:
 * `disposePlazaTextures()` la llamará (una vez) junto al resto, sin que
 * `PlazaScene.tsx` tenga que conocerla.
 */
export function registerPlazaDisposer(fn: () => void): void {
  extraDisposers.add(fn);
}

/** Libera las texturas cacheadas. Llamar solo si la plaza se desmonta de verdad. */
export function disposePlazaTextures(): void {
  extraDisposers.forEach((fn) => fn());
  extraDisposers.clear();
  for (const cache of [skyTextures, grassTextures, cloudTextures]) {
    cache.forEach((tex) => tex.dispose());
    cache.clear();
  }
  glowTexture?.dispose();
  glowTexture = null;
  lightPoolTexture?.dispose();
  lightPoolTexture = null;
}
