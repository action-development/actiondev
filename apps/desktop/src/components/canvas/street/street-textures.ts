import * as THREE from "three";
import { canvasTexture, fontFamily, whenDisplayFontReady } from "../arcade/arcade-textures";
import type { StreetMode } from "./street-mode";

/**
 * Texturas de C/ Colón, TODAS pintadas en runtime con canvas 2D: 0 assets de
 * red, como la plaza y la recreativa. La foto del portal fue la referencia de
 * medidas y materiales, no una textura — y no debe serlo: es de un directorio
 * de empresas y lleva su marca de agua.
 *
 * Singletons de módulo (sobreviven a un remonte del Canvas tras perder el
 * contexto WebGL), liberados al salir con `disposeStreetTextures`.
 */

const cache = new Map<string, THREE.Texture>();

function remember<T extends THREE.Texture>(key: string, make: () => T): T {
  const hit = cache.get(key);
  if (hit) return hit as T;
  const tex = make();
  cache.set(key, tex);
  return tex;
}

export function disposeStreetTextures(): void {
  for (const tex of cache.values()) tex.dispose();
  cache.clear();
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return [canvas, canvas.getContext("2d")!];
}

/** PRNG determinista: la misma fachada en cada visita (y en cada captura). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tiled(tex: THREE.Texture): THREE.Texture {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Pinta un rótulo ya y lo repinta cuando la Space Grotesk está lista: en una
 * primera visita en frío saldría en Helvetica (mismo caso que la recreativa). */
function paintWithFont(canvas: HTMLCanvasElement, paint: () => void): THREE.CanvasTexture {
  paint();
  const tex = canvasTexture(canvas);
  whenDisplayFontReady().then(() => {
    paint();
    tex.needsUpdate = true;
  });
  return tex;
}

/** Ruido de valor 2D suave (bilineal sobre una rejilla aleatoria), en [0, 1]. */
function valueNoise(seed: number, cells: number): (u: number, v: number) => number {
  const rand = rng(seed);
  const grid = Array.from({ length: cells * cells }, () => rand());
  const at = (i: number, j: number) => grid[((j + cells) % cells) * cells + ((i + cells) % cells)];
  return (u, v) => {
    const x = u * cells;
    const y = v * cells;
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * sx;
    const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * sx;
    return a + (b - a) * sy;
  };
}

/** Rellena el canvas con un moteado tileable: `tone(n)` da el color por píxel. */
function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, cells: number, tone: (n: number, fine: number) => [number, number, number]) {
  const coarse = valueNoise(seed, cells);
  const fineRand = rng(seed + 1);
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = tone(coarse(x / w, y / h), fineRand());
      const k = (y * w + x) * 4;
      img.data[k] = r;
      img.data[k + 1] = g;
      img.data[k + 2] = b;
      img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

// ─── Madera ──────────────────────────────────────────────────────────────────

/**
 * Veta de UN listón (la textura se estira a lo largo de cada uno). Madera
 * tropical tipo iroko: fibra larga y fina, con algún nudo alargado. El tono
 * de cada listón lo pone el color de su instancia, no la textura.
 */
export function getSlatTexture(): THREE.Texture {
  return remember("slat", () => {
    const [canvas, ctx] = makeCanvas(64, 512);
    const rand = rng(7);
    ctx.fillStyle = "#94502e";
    ctx.fillRect(0, 0, 64, 512);
    for (let k = 0; k < 26; k++) {
      const x = rand() * 64;
      const drift = rand() * 6 - 3;
      ctx.strokeStyle = rand() < 0.5 ? `rgba(90,36,16,${0.18 + rand() * 0.22})` : `rgba(230,150,100,${0.1 + rand() * 0.12})`;
      ctx.lineWidth = 0.6 + rand() * 1.8;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + drift, 170, x - drift, 340, x + drift * 0.5, 512);
      ctx.stroke();
    }
    // Nudos alargados.
    for (let k = 0; k < 2; k++) {
      const y = 80 + rand() * 360;
      const x = 16 + rand() * 32;
      ctx.fillStyle = "rgba(80,30,12,0.35)";
      ctx.beginPath();
      ctx.ellipse(x, y, 3 + rand() * 3, 14 + rand() * 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    return canvasTexture(canvas);
  });
}

// ─── Piedra y muro ───────────────────────────────────────────────────────────

/** Metros que cubre una teja de sillería (4 × 2 piezas de 0,9 × 0,45 m). */
export const ASHLAR_TILE = 3.6;

/**
 * Sillería / aplacado de piedra caliza clara: piezas a matajunta con tono
 * propio, poro fino y la junta rehundida más oscura. `warm` = caliza del
 * zócalo y las pilastras; sin él, el gris más frío del aplacado de los pisos.
 */
export function getAshlarTexture(warm: boolean): THREE.Texture {
  return remember(`ashlar:${warm}`, () => {
    const size = 512;
    const [canvas, ctx] = makeCanvas(size, size);
    const base: [number, number, number] = warm ? [204, 190, 164] : [182, 175, 163];
    speckle(ctx, size, size, warm ? 3 : 4, 8, (n, f) => {
      const v = (n - 0.5) * 16 + (f - 0.5) * 10;
      return [base[0] + v, base[1] + v, base[2] + v * 0.9];
    });
    const rand = rng(warm ? 11 : 12);
    const cols = 4;
    const rows = 8;
    const cw = size / cols;
    const rh = size / rows;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? cw / 2 : 0;
      for (let c = -1; c <= cols; c++) {
        const x = c * cw + off;
        // Cada pieza con su tono: la cantera nunca da dos iguales.
        ctx.fillStyle = `rgba(${rand() < 0.5 ? "255,248,236" : "80,70,56"},${0.03 + rand() * 0.1})`;
        ctx.fillRect(x, r * rh, cw, rh);
        // Junta vertical: fina y apenas más oscura (es piedra, no azulejo).
        ctx.fillStyle = "rgba(90,80,66,0.32)";
        ctx.fillRect(x - 0.75, r * rh, 1.5, rh);
      }
      ctx.fillStyle = "rgba(90,80,66,0.32)";
      ctx.fillRect(0, r * rh - 0.75, size, 1.5);
    }
    return tiled(canvasTexture(canvas));
  });
}

/** Metros que cubre una teja de estuco. */
export const STUCCO_TILE = 2.4;

/** Enfoscado blanco del muro del rótulo: casi liso, con aguas muy suaves. */
export function getStuccoTexture(): THREE.Texture {
  return remember("stucco", () => {
    const [canvas, ctx] = makeCanvas(256, 256);
    speckle(ctx, 256, 256, 17, 6, (n, f) => {
      const v = 240 + (n - 0.5) * 10 + (f - 0.5) * 6;
      return [v, v - 1, v - 4];
    });
    return tiled(canvasTexture(canvas));
  });
}

/** Acero inoxidable cepillado en vertical: puertas del ascensor y perfiles. */
export function getBrushedSteelTexture(): THREE.Texture {
  return remember("steel", () => {
    const [canvas, ctx] = makeCanvas(256, 256);
    const rand = rng(31);
    ctx.fillStyle = "#b8bcc0";
    ctx.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x++) {
      const v = 150 + rand() * 70;
      ctx.fillStyle = `rgba(${v},${v + 3},${v + 6},0.35)`;
      ctx.fillRect(x, 0, 1, 256);
    }
    return tiled(canvasTexture(canvas));
  });
}

/** Metros que cubre una teja de ladrillo. */
export const BRICK_TILE = 1.2;

/** Ladrillo caravista del murete de la rampa del garaje. */
export function getBrickTexture(): THREE.Texture {
  return remember("brick", () => {
    const [canvas, ctx] = makeCanvas(256, 256);
    const rand = rng(41);
    ctx.fillStyle = "#b9aa98";
    ctx.fillRect(0, 0, 256, 256);
    const rows = 12;
    const h = 256 / rows;
    const w = h * 3.2;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? w / 2 : 0;
      for (let x = -w + off; x < 256; x += w) {
        const t = 0.85 + rand() * 0.25;
        ctx.fillStyle = `rgb(${Math.round(150 * t)},${Math.round(72 * t)},${Math.round(48 * t)})`;
        ctx.fillRect(x + 1.5, r * h + 1.5, w - 3, h - 3);
      }
    }
    return tiled(canvasTexture(canvas));
  });
}

// ─── Suelos ──────────────────────────────────────────────────────────────────

/** Metros de acera que cubre una teja de adoquín. */
export const COBBLE_TILE = 1.6;

/** Adoquín de granito gris a matajunta, con piezas de tono distinto. */
export function getCobbleTexture(): THREE.Texture {
  return remember("cobble", () => {
    const [canvas, ctx] = makeCanvas(512, 512);
    const rand = rng(21);
    ctx.fillStyle = "#5e5a55";
    ctx.fillRect(0, 0, 512, 512);
    const rows = 16;
    const h = 512 / rows;
    for (let r = 0; r < rows; r++) {
      let x = r % 2 ? 0 : -h * 0.7;
      while (x < 512) {
        const w = h * (1.25 + rand() * 0.45);
        const v = 150 + Math.round(rand() * 40);
        const warm = rand() * 8;
        const grd = ctx.createLinearGradient(0, r * h, 0, r * h + h);
        grd.addColorStop(0, `rgb(${v + 14 + warm},${v + 12},${v + 6})`);
        grd.addColorStop(1, `rgb(${v - 10 + warm},${v - 12},${v - 18})`);
        ctx.fillStyle = grd;
        ctx.fillRect(x + 2.5, r * h + 2.5, w - 5, h - 5);
        for (let k = 0; k < 10; k++) {
          ctx.fillStyle = `rgba(${rand() < 0.6 ? "30,28,26" : "240,236,228"},${0.08 + rand() * 0.14})`;
          ctx.fillRect(x + 3 + rand() * (w - 8), r * h + 3 + rand() * (h - 8), 1.5, 1.5);
        }
        x += w;
      }
    }
    return tiled(canvasTexture(canvas));
  });
}

/** Metros que cubre una teja del pulido del portal (baldosas de 80 cm). */
export const POLISH_TILE = 1.6;

/** Granito pulido del soportal: gris cálido, grano fino, junta casi invisible. */
export function getPolishTexture(): THREE.Texture {
  return remember("polish", () => {
    const [canvas, ctx] = makeCanvas(256, 256);
    speckle(ctx, 256, 256, 5, 5, (n, f) => {
      const v = 150 + (n - 0.5) * 18 + (f < 0.06 ? -60 : f > 0.96 ? 50 : (f - 0.5) * 16);
      return [v + 4, v + 1, v - 4];
    });
    ctx.fillStyle = "rgba(60,54,48,0.6)";
    ctx.fillRect(0, 127, 256, 1.5);
    ctx.fillRect(127, 0, 1.5, 256);
    return tiled(canvasTexture(canvas));
  });
}

// ─── Huecos de los pisos ─────────────────────────────────────────────────────

/**
 * Vidrio de las ventanas: lo que refleja una fachada desde la acera — cielo
 * arriba, el edificio de enfrente abajo y una diagonal de brillo. Con el mapa
 * de entorno encima, cada ventana cambia un poco con el paralaje.
 */
export function getGlassTexture(mode: StreetMode): THREE.Texture {
  return remember(`glass:${mode}`, () => {
    const [canvas, ctx] = makeCanvas(128, 256);
    const day = mode === "dia";
    const grd = ctx.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, day ? "#9fb9cf" : "#1b2230");
    grd.addColorStop(0.55, day ? "#5f7384" : "#10141b");
    grd.addColorStop(0.56, day ? "#3c464f" : "#0b0d11");
    grd.addColorStop(1, day ? "#2b3238" : "#07080a");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 128, 256);
    ctx.fillStyle = day ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)";
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(70, 0);
    ctx.lineTo(10, 256);
    ctx.lineTo(-40, 256);
    ctx.fill();
    return canvasTexture(canvas);
  });
}

/** Ventana encendida de noche: interior cálido con el techo más claro. */
export function getLitWindowTexture(): THREE.Texture {
  return remember("lit-window", () => {
    const [canvas, ctx] = makeCanvas(128, 256);
    const grd = ctx.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, "#fff0cf");
    grd.addColorStop(0.35, "#f3c885");
    grd.addColorStop(1, "#8a5a2c");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 128, 256);
    // Luminaria y un mueble al fondo.
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(24, 14, 80, 7);
    ctx.fillStyle = "rgba(60,36,18,0.55)";
    ctx.fillRect(10, 190, 70, 66);
    return canvasTexture(canvas);
  });
}

/** Persiana enrollable: lamas horizontales con su sombra. Se repite en V. */
export function getBlindTexture(): THREE.Texture {
  return remember("blind", () => {
    const [canvas, ctx] = makeCanvas(32, 64);
    for (let i = 0; i < 8; i++) {
      const grd = ctx.createLinearGradient(0, i * 8, 0, i * 8 + 8);
      grd.addColorStop(0, "#e7e2d8");
      grd.addColorStop(0.8, "#c3bcae");
      grd.addColorStop(1, "#7d776d");
      ctx.fillStyle = grd;
      ctx.fillRect(0, i * 8, 32, 8);
    }
    return tiled(canvasTexture(canvas));
  });
}

// ─── Cielo ───────────────────────────────────────────────────────────────────

/** Degradado vertical del cielo (se mapea sobre una esfera por su V). */
export function getSkyTexture(top: string, horizon: string): THREE.Texture {
  return remember(`sky:${top}:${horizon}`, () => {
    const [canvas, ctx] = makeCanvas(4, 256);
    const grd = ctx.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, top);
    grd.addColorStop(0.45, horizon);
    grd.addColorStop(1, horizon);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 4, 256);
    return canvasTexture(canvas);
  });
}

// ─── Rótulos ─────────────────────────────────────────────────────────────────

/** Relación de aspecto del rótulo «Colon 20» (ancho / alto). */
export const SIGN_ASPECT = 4;

function paintSign(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, shadow: boolean) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = "middle";
  ctx.font = `700 170px ${fontFamily()}`;
  if (shadow) {
    ctx.filter = "blur(7px)";
    ctx.fillStyle = "rgba(0,0,0,0.5)";
  } else {
    ctx.filter = "none";
    ctx.fillStyle = "#141414";
  }
  ctx.fillText("Colon 20", 20, 128);
  ctx.filter = "none";
}

/**
 * «Colon 20» como en el muro: letras corpóreas negras separadas de la pared.
 * `shadow` = la sombra difusa que esas letras echan sobre el estuco; va en un
 * plano aparte, pegado al muro, y las letras un par de centímetros delante.
 */
export function getSignTexture(shadow = false): THREE.Texture {
  return remember(`sign:${shadow}`, () => {
    const [canvas, ctx] = makeCanvas(1024, 256);
    return paintWithFont(canvas, () => paintSign(ctx, canvas, shadow));
  });
}

// ─── Portal ──────────────────────────────────────────────────────────────────

/**
 * Vestíbulo tras las puertas de vidrio: pared cálida, arranque de la escalera
 * y los plafones del techo. Es un fondo: no se ve más que a través del vidrio.
 */
export function getLobbyTexture(): THREE.Texture {
  return remember("lobby", () => {
    const [canvas, ctx] = makeCanvas(512, 384);
    const grd = ctx.createLinearGradient(0, 0, 0, 384);
    grd.addColorStop(0, "#f6e7c9");
    grd.addColorStop(1, "#b99a70");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 512, 384);
    // Escalera: peldaños en diagonal.
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = i % 2 ? "#e9d8b8" : "#cdb28a";
      ctx.fillRect(250 + i * 26, 330 - i * 26, 262 - i * 26, 26);
    }
    // Barandilla de la escalera.
    ctx.strokeStyle = "rgba(70,60,50,0.7)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(250, 290);
    ctx.lineTo(490, 60);
    ctx.stroke();
    // Plafones.
    ctx.fillStyle = "#fffaf0";
    for (let i = 0; i < 3; i++) ctx.fillRect(60 + i * 150, 20, 90, 10);
    // Mostrador.
    ctx.fillStyle = "#6f5238";
    ctx.fillRect(40, 250, 160, 90);
    return canvasTexture(canvas);
  });
}

// ─── Objetos de contacto ─────────────────────────────────────────────────────

/**
 * Caja de luz de la cabina: `label` blanco sobre azul con el pictograma del
 * auricular. Sin marca de operadora: dice lo que es, no de quién.
 */
export function getBoothSignTexture(label: string): THREE.Texture {
  return remember(`booth-sign:${label}`, () => {
    const [canvas, ctx] = makeCanvas(512, 128);
    return paintWithFont(canvas, () => {
      const grd = ctx.createLinearGradient(0, 0, 0, 128);
      grd.addColorStop(0, "#2a6cc0");
      grd.addColorStop(1, "#1a4f98");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, 512, 128);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(0, 6, 512, 3);
      // Pictograma: auricular en un círculo blanco.
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(62, 64, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(62, 64);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = "#1f5aa6";
      ctx.fillRect(-7, -22, 14, 44);
      ctx.fillRect(-15, -26, 30, 12);
      ctx.fillRect(-15, 14, 30, 12);
      ctx.restore();
      ctx.fillStyle = "#ffffff";
      ctx.font = `700 60px ${fontFamily()}`;
      ctx.textBaseline = "middle";
      ctx.fillText(label, 118, 68);
    });
  });
}

/** Chapa lagrimada del suelo de la cabina. */
export function getTreadPlateTexture(): THREE.Texture {
  return remember("tread", () => {
    const [canvas, ctx] = makeCanvas(128, 128);
    ctx.fillStyle = "#8d9296";
    ctx.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const cx = x * 16 + (y % 2 ? 8 : 0);
        ctx.save();
        ctx.translate(cx, y * 16 + 8);
        ctx.rotate(y % 2 ? Math.PI / 4 : -Math.PI / 4);
        ctx.fillStyle = "#b3b8bc";
        ctx.fillRect(-5, -1.5, 10, 3);
        ctx.fillStyle = "#5d6266";
        ctx.fillRect(-5, 1.5, 10, 1);
        ctx.restore();
      }
    }
    return tiled(canvasTexture(canvas));
  });
}

/** Atlas del teclado: 12 teclas en rejilla 3 × 4 (1-9, *, 0, #). */
export const KEYPAD_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"] as const;

export function getKeypadTexture(): THREE.Texture {
  return remember("keypad", () => {
    const [canvas, ctx] = makeCanvas(192, 256);
    return paintWithFont(canvas, () => {
      KEYPAD_LABELS.forEach((label, i) => {
        const x = (i % 3) * 64;
        const y = Math.floor(i / 3) * 64;
        const grd = ctx.createLinearGradient(0, y, 0, y + 64);
        grd.addColorStop(0, "#e9ecee");
        grd.addColorStop(1, "#aeb4b9");
        ctx.fillStyle = grd;
        ctx.fillRect(x, y, 64, 64);
        ctx.fillStyle = "#1c1e21";
        ctx.font = `700 34px ${fontFamily()}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, x + 32, y + 35);
      });
    });
  });
}

/** Pantalla LCD del teléfono: segmentos lima sobre verde oscuro. */
export function getLcdTexture(line1: string, line2: string): THREE.Texture {
  return remember(`lcd:${line1}:${line2}`, () => {
    const [canvas, ctx] = makeCanvas(256, 80);
    return paintWithFont(canvas, () => {
      ctx.fillStyle = "#0f1a06";
      ctx.fillRect(0, 0, 256, 80);
      ctx.fillStyle = "rgba(200,255,0,0.06)";
      for (let y = 0; y < 80; y += 3) ctx.fillRect(0, y, 256, 1);
      ctx.fillStyle = "#c8ff00";
      ctx.shadowColor = "#c8ff00";
      ctx.shadowBlur = 8;
      ctx.font = `700 24px ${fontFamily()}`;
      ctx.textBaseline = "middle";
      ctx.fillText(line1, 14, 26);
      ctx.font = `500 18px ${fontFamily()}`;
      ctx.fillText(line2, 14, 58);
      ctx.shadowBlur = 0;
    });
  });
}

/** Placa de horarios de recogida del buzón: líneas de texto genéricas. */
export function getCollectionPlateTexture(title: string): THREE.Texture {
  return remember(`collection:${title}`, () => {
    const [canvas, ctx] = makeCanvas(128, 160);
    return paintWithFont(canvas, () => {
      ctx.fillStyle = "#f4f2ec";
      ctx.fillRect(0, 0, 128, 160);
      ctx.fillStyle = "#1f3f86";
      ctx.fillRect(0, 0, 128, 30);
      ctx.fillStyle = "#ffffff";
      ctx.font = `700 15px ${fontFamily()}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(title, 64, 16);
      ctx.fillStyle = "#39414a";
      ctx.font = `600 13px ${fontFamily()}`;
      ["L–V   09:30", "L–V   18:00", "S       11:00"].forEach((row, i) => ctx.fillText(row, 64, 56 + i * 26));
      ctx.fillStyle = "rgba(57,65,74,0.3)";
      ctx.fillRect(14, 136, 100, 3);
    });
  });
}

/** Atlas de tarjetas del portero: 7 filas; la de Action, en lima. */
export const INTERCOM_ROWS = 7;
export const INTERCOM_ACTION_ROW = 2;

export function getNameCardsTexture(): THREE.Texture {
  return remember("name-cards", () => {
    const [canvas, ctx] = makeCanvas(256, INTERCOM_ROWS * 64);
    return paintWithFont(canvas, () => {
      const rand = rng(8);
      for (let i = 0; i < INTERCOM_ROWS; i++) {
        const y = i * 64;
        const ours = i === INTERCOM_ACTION_ROW;
        ctx.fillStyle = ours ? "#c8ff00" : "#f3f1ea";
        ctx.fillRect(0, y, 256, 64);
        if (ours) {
          ctx.fillStyle = "#0a0a0a";
          ctx.font = `700 34px ${fontFamily()}`;
          ctx.textBaseline = "middle";
          ctx.fillText("ACTION", 18, y + 34);
          ctx.font = `600 16px ${fontFamily()}`;
          ctx.fillText("2º", 212, y + 34);
        } else {
          // Los otros inquilinos, sin nombre legible: solo el gris de un rótulo.
          ctx.fillStyle = "rgba(40,44,50,0.35)";
          ctx.fillRect(18, y + 26, 70 + rand() * 90, 12);
        }
      }
    });
  });
}

/** Placa «CARTAS» del buzón: letras azules en relieve sobre chapa amarilla. */
export function getPostboxPlateTexture(label: string): THREE.Texture {
  return remember(`postbox:${label}`, () => {
    const [canvas, ctx] = makeCanvas(256, 112);
    return paintWithFont(canvas, () => {
      ctx.fillStyle = "#f2c200";
      ctx.fillRect(0, 0, 256, 112);
      ctx.strokeStyle = "#1f3f86";
      ctx.lineWidth = 5;
      ctx.strokeRect(8, 8, 240, 96);
      ctx.font = `700 48px ${fontFamily()}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Relieve: luz arriba-izquierda, sombra abajo-derecha, cara encima.
      ctx.fillStyle = "rgba(255,240,170,0.9)";
      ctx.fillText(label, 127, 58);
      ctx.fillStyle = "rgba(60,45,0,0.45)";
      ctx.fillText(label, 130, 61);
      ctx.fillStyle = "#1f3f86";
      ctx.fillText(label, 128, 59);
    });
  });
}
