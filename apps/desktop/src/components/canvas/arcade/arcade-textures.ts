import * as THREE from "three";
import type { MachineSpec } from "./arcade-config";
import type { ArcadeMode, ArcadePalette } from "./arcade-mode";

/**
 * Texturas de la sala recreativa, TODAS pintadas en runtime con canvas 2D.
 *
 * Mismo criterio que la plaza: nada de lo que monta la escena descarga un
 * asset para pintar el decorado. Las únicas imágenes de red son las capturas de
 * cada proyecto (pantallas) y el logo de la puerta, y se cargan FUERA de
 * cualquier `<Suspense>`: mientras llegan, cada pantalla enseña su modo demo.
 *
 * Son singletons de módulo (sobreviven a un remonte del Canvas tras perder el
 * contexto WebGL) y se liberan al salir de la página con
 * `disposeArcadeTextures`.
 */

const cache = new Map<string, THREE.Texture>();

export function remember<T extends THREE.Texture>(key: string, make: () => T): T {
  const hit = cache.get(key);
  if (hit) return hit as T;
  const tex = make();
  cache.set(key, tex);
  return tex;
}

export function disposeArcadeTextures(): void {
  for (const tex of cache.values()) tex.dispose();
  cache.clear();
}

/** Familia real de Space Grotesk que inyecta next/font (nombre hasheado). */
export function fontFamily(): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-space-grotesk").trim();
  return v ? `${v}, "Helvetica Neue", Arial, sans-serif` : `"Helvetica Neue", Arial, sans-serif`;
}

/**
 * Promesa que se resuelve cuando la Space Grotesk 700 ya se puede usar en un
 * canvas. Los rótulos se pintan en seguida con lo que haya y se repintan al
 * resolverse: si no, la primera visita en frío los dejaba en Helvetica.
 */
export function whenDisplayFontReady(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return Promise.resolve();
  const first = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-space-grotesk")
    .split(",")[0]
    .trim();
  if (!first) return Promise.resolve();
  return document.fonts
    .load(`700 48px ${first}`)
    .then(() => undefined)
    .catch(() => undefined);
}

export function canvasTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Ajusta el cuerpo de letra para que `text` quepa en `maxWidth`. */
export function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number): number {
  let s = size;
  ctx.font = `700 ${s}px ${fontFamily()}`;
  while (s > 10 && ctx.measureText(text).width > maxWidth) {
    s -= 2;
    ctx.font = `700 ${s}px ${fontFamily()}`;
  }
  return s;
}

// ─── Marquesinas ─────────────────────────────────────────────────────────────

/** Rejilla del atlas de marquesinas: celdas 3:1 (como la marquesina), dos columnas. */
const MARQUEE_CELL = { w: 512, h: 170, cols: 2 } as const;

/** `color` llevado hacia `toward` en proporción `t`, como hex. */
export function mix(color: string, toward: string, t: number): string {
  return `#${new THREE.Color(color).lerp(new THREE.Color(toward), t).getHexString()}`;
}

/**
 * Una marquesina: metacrilato retroiluminado con el arte de los 80 — sol de
 * rayos, horizonte en rejilla, el nombre en letra gorda con contorno y brillo
 * del color de la máquina. Todo recortado a su celda.
 */
function paintMarquee(ctx: CanvasRenderingContext2D, m: MachineSpec, x: number, y: number) {
  const { w, h } = MARQUEE_CELL;
  const c = m.sideColor;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // Fondo: el color de la máquina muy oscuro en el centro, negro en los bordes.
  const bg = ctx.createRadialGradient(x + w / 2, y + h * 0.62, 10, x + w / 2, y + h * 0.62, w * 0.62);
  bg.addColorStop(0, mix(c, "#07070a", 0.45));
  bg.addColorStop(0.55, mix(c, "#07070a", 0.82));
  bg.addColorStop(1, "#050507");
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);

  // Sol de rayos desde el horizonte.
  const cx = x + w / 2;
  const cy = y + h * 0.72;
  ctx.fillStyle = c;
  ctx.globalAlpha = 0.14;
  const rays = 18;
  for (let i = 0; i < rays; i++) {
    const a0 = Math.PI + (i / rays) * Math.PI;
    const a1 = a0 + (Math.PI / rays) * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, w, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Horizonte en rejilla (suelo de neón en perspectiva).
  ctx.strokeStyle = c;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.35;
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 10, cy);
    ctx.lineTo(cx + i * 70, y + h);
    ctx.stroke();
  }
  for (let j = 0; j < 4; j++) {
    const ly = cy + ((y + h - cy) * (j + 1) ** 2) / 16;
    ctx.beginPath();
    ctx.moveTo(x, ly);
    ctx.lineTo(x + w, ly);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Nombre: contorno negro grueso, relleno con degradado y brillo del color.
  const title = m.project.title.toUpperCase();
  const size = fitFont(ctx, title, w - 60, 70);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const ty = y + h * 0.46;
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(6, size * 0.16);
  ctx.strokeStyle = "#07070a";
  ctx.strokeText(title, cx, ty);
  const fill = ctx.createLinearGradient(0, ty - size / 2, 0, ty + size / 2);
  fill.addColorStop(0, "#ffffff");
  fill.addColorStop(0.55, "#ffffff");
  fill.addColorStop(1, mix(c, "#ffffff", 0.35));
  ctx.shadowColor = c;
  ctx.shadowBlur = 16;
  ctx.fillStyle = fill;
  ctx.fillText(title, cx, ty);
  ctx.shadowBlur = 0;

  // Pie: año y marca, como el copyright de las marquesinas de la época.
  ctx.font = `700 13px ${fontFamily()}`;
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.fillText(`© ${m.project.year} ACTION DEVELOPMENT`, cx, y + h - 20);

  // Viñeteado lateral del tubo fluorescente de detrás.
  const edge = ctx.createLinearGradient(x, 0, x + w, 0);
  edge.addColorStop(0, "rgba(0,0,0,0.55)");
  edge.addColorStop(0.18, "rgba(0,0,0,0)");
  edge.addColorStop(0.82, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = edge;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function paintMarquees(canvas: HTMLCanvasElement, machines: readonly MachineSpec[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const m of machines) {
    const col = m.index % MARQUEE_CELL.cols;
    const row = Math.floor(m.index / MARQUEE_CELL.cols);
    paintMarquee(ctx, m, col * MARQUEE_CELL.w, row * MARQUEE_CELL.h);
  }
}

/**
 * Un solo atlas para las 32 marquesinas: se pintan todas en una textura y cada
 * marquesina recorta su celda por UV. Así es una única malla y un único draw
 * call (ver `ArcadeMachines`).
 */
export function getMarqueeAtlas(machines: readonly MachineSpec[]): THREE.CanvasTexture {
  return remember("marquees", () => {
    const canvas = document.createElement("canvas");
    canvas.width = MARQUEE_CELL.w * MARQUEE_CELL.cols;
    canvas.height = MARQUEE_CELL.h * Math.ceil(machines.length / MARQUEE_CELL.cols);
    paintMarquees(canvas, machines);
    const tex = canvasTexture(canvas);
    void whenDisplayFontReady().then(() => {
      paintMarquees(canvas, machines);
      tex.needsUpdate = true;
    });
    return tex;
  });
}

/** Rectángulo UV (u0, v0, u1, v1) de la marquesina `index` dentro del atlas. */
export function marqueeUv(index: number, count: number): [number, number, number, number] {
  const rows = Math.ceil(count / MARQUEE_CELL.cols);
  const col = index % MARQUEE_CELL.cols;
  const row = Math.floor(index / MARQUEE_CELL.cols);
  const u0 = col / MARQUEE_CELL.cols;
  const u1 = (col + 1) / MARQUEE_CELL.cols;
  // El canvas crece hacia abajo; la V de three, hacia arriba (`flipY`).
  const v1 = 1 - row / rows;
  const v0 = 1 - (row + 1) / rows;
  return [u0, v0, u1, v1];
}

// ─── Pantalla en modo demo ───────────────────────────────────────────────────

function paintAttract(canvas: HTMLCanvasElement, title: string, color: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width: w, height: h } = canvas;
  ctx.fillStyle = "#07070a";
  ctx.fillRect(0, 0, w, h);

  // Rejilla de fondo, como las demos de los juegos de la época.
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= w; gx += 16) {
    ctx.beginPath();
    ctx.moveTo(gx + 0.5, 0);
    ctx.lineTo(gx + 0.5, h);
    ctx.stroke();
  }
  for (let gy = 0; gy <= h; gy += 16) {
    ctx.beginPath();
    ctx.moveTo(0, gy + 0.5);
    ctx.lineTo(w, gy + 0.5);
    ctx.stroke();
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const text = title.toUpperCase();
  fitFont(ctx, text, w - 36, 40);
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, h * 0.45);
  ctx.shadowBlur = 0;

  ctx.font = `700 13px ${fontFamily()}`;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("INSERT COIN", w / 2, h * 0.72);
}

/**
 * Pantalla en modo demo: el nombre del proyecto sobre la rejilla. Es lo que se
 * ve mientras llega la captura y, en los proyectos que aún no tienen captura,
 * lo que se queda.
 */
export function getAttractTexture(m: MachineSpec): THREE.CanvasTexture {
  return remember(`attract:${m.project.id}`, () => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 192;
    paintAttract(canvas, m.project.title, m.sideColor);
    const tex = canvasTexture(canvas);
    void whenDisplayFontReady().then(() => {
      paintAttract(canvas, m.project.title, m.sideColor);
      tex.needsUpdate = true;
    });
    return tex;
  });
}

/**
 * Recorte "cover" de una imagen o vídeo sobre la pantalla 4:3: rellena el
 * tubo entero y recorta lo que sobre por los lados, sin deformar.
 */
export function coverFit(tex: THREE.Texture, mediaAspect: number, screenAspect: number): void {
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  if (mediaAspect > screenAspect) {
    const r = screenAspect / mediaAspect;
    tex.repeat.set(r, 1);
    tex.offset.set((1 - r) / 2, 0);
  } else {
    const r = mediaAspect / screenAspect;
    tex.repeat.set(1, r);
    tex.offset.set(0, (1 - r) / 2);
  }
  tex.needsUpdate = true;
}

// ─── Moqueta ─────────────────────────────────────────────────────────────────

/** PRNG determinista (mulberry32): la moqueta es la misma en cada visita. */
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Moqueta de sala recreativa ("cosmic carpet"): fondo oscuro con confeti
 * geométrico denso — figuras rellenas y trazos, en dos tamaños — y encima la
 * FIBRA: miles de motas claras y oscuras de un píxel, que es lo que hace que se
 * lea como tejido y no como un plástico estampado. Teja repetible: lo que cruza
 * un borde se pinta también en el lado opuesto.
 */
export function getCarpetTexture(mode: ArcadeMode, palette: ArcadePalette): THREE.CanvasTexture {
  return remember(`carpet:${mode}`, () => {
    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = palette.carpet;
      ctx.fillRect(0, 0, size, size);
      const rand = mulberry32(7);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const figure = (big: boolean) => {
        const cx = rand() * size;
        const cy = rand() * size;
        const r = big ? 14 + rand() * 14 : 5 + rand() * 6;
        const kind = Math.floor(rand() * 5);
        const rot = rand() * Math.PI * 2;
        const ink = palette.carpetInk[Math.floor(rand() * 3)];
        const filled = !big || rand() > 0.6;
        for (const dx of [-size, 0, size]) {
          for (const dy of [-size, 0, size]) {
            ctx.save();
            ctx.translate(cx + dx, cy + dy);
            ctx.rotate(rot);
            ctx.beginPath();
            if (kind === 0) {
              ctx.moveTo(0, -r);
              ctx.lineTo(r * 0.87, r * 0.5);
              ctx.lineTo(-r * 0.87, r * 0.5);
              ctx.closePath();
            } else if (kind === 1) {
              ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
            } else if (kind === 2) {
              ctx.moveTo(-r, 0);
              ctx.lineTo(-r / 3, -r / 2);
              ctx.lineTo(r / 3, r / 2);
              ctx.lineTo(r, 0);
            } else if (kind === 3) {
              ctx.rect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2);
            } else {
              ctx.moveTo(-r, -r * 0.2);
              ctx.quadraticCurveTo(0, -r, r, -r * 0.2);
            }
            if (filled && kind !== 2 && kind !== 4) {
              ctx.fillStyle = ink;
              ctx.globalAlpha = 0.5;
              ctx.fill();
            } else {
              ctx.strokeStyle = ink;
              ctx.lineWidth = big ? 6 : 3;
              ctx.globalAlpha = 0.6;
              ctx.stroke();
            }
            ctx.restore();
          }
        }
      };
      for (let i = 0; i < 90; i++) figure(true);
      for (let i = 0; i < 260; i++) figure(false);
      ctx.globalAlpha = 1;

      // Fibra del pelo de la moqueta.
      for (let i = 0; i < 90000; i++) {
        ctx.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.16)";
        ctx.fillRect(rand() * size, rand() * size, 1, 1);
      }
    }
    const tex = canvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    return tex;
  });
}

// ─── Brillos ─────────────────────────────────────────────────────────────────

/** Mancha radial blanca → transparente. Charcos de luz y halos (aditivo). */
export function getGlowTexture(): THREE.CanvasTexture {
  return remember("glow", () => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.4, "rgba(255,255,255,0.45)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    return canvasTexture(canvas);
  });
}

/** Líneas de barrido del tubo, encima de la imagen de cada pantalla. */
export function getScanlineTexture(): THREE.CanvasTexture {
  return remember("scanlines", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 4;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, 4, 2);
    }
    const tex = canvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.repeat.set(1, 60);
    return tex;
  });
}

// ─── Mueble: bisel, panel de mandos, rejilla ─────────────────────────────────
//
// Bisel y panel se pintan en BLANCO sobre negro y se tiñen por instancia con el
// color de la máquina (`instanceColor` multiplica el mapa): una sola textura
// para las 32 máquinas y cada una sale con su color. Escala: 1 px = 1 mm.

/** Recuadro redondeado (trazado, sin pintar). */
export function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Medidas del bisel en mm: el tramo de pantalla del perfil y el tubo en su centro. */
export const BEZEL_MM = { w: 740, h: 553, screenW: 520, screenH: 390 } as const;

function paintBezel(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { w, h, screenW, screenH } = BEZEL_MM;
  const sx = (w - screenW) / 2;
  const sy = (h - screenH) / 2;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  // Doble filete alrededor del tubo.
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  roundedRect(ctx, sx - 16, sy - 16, screenW + 32, screenH + 32, 22);
  ctx.stroke();
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  roundedRect(ctx, sx - 30, sy - 30, screenW + 60, screenH + 60, 30);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Barras verticales en los márgenes, que se apagan hacia fuera.
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.9 - i * 0.28;
    ctx.fillStyle = "#fff";
    ctx.fillRect(sx - 52 - i * 14, sy + 40, 6, screenH - 80);
    ctx.fillRect(sx + screenW + 46 + i * 14, sy + 40, 6, screenH - 80);
  }
  ctx.globalAlpha = 1;

  // Esquinas en flecha.
  const corner = (x: number, y: number, dx: number, dy: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx * 26, y);
    ctx.lineTo(x, y + dy * 26);
    ctx.closePath();
    ctx.fill();
  };
  ctx.fillStyle = "#fff";
  corner(sx - 40, sy - 40, 1, 1);
  corner(sx + screenW + 40, sy - 40, -1, 1);
  corner(sx - 40, sy + screenH + 40, 1, -1);
  corner(sx + screenW + 40, sy + screenH + 40, -1, -1);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 22px ${fontFamily()}`;
  ctx.fillText("★  ACTION ARCADE  ★", w / 2, sy / 2 - 4);
  ctx.font = `700 15px ${fontFamily()}`;
  ctx.fillText("1 PLAYER", sx + 70, h - sy / 2 + 4);
  ctx.fillText("2 PLAYERS", sx + screenW - 70, h - sy / 2 + 4);
  ctx.globalAlpha = 0.6;
  ctx.fillText("INSERT COIN", w / 2, h - sy / 2 + 4);
  ctx.globalAlpha = 1;
}

export function getBezelTexture(): THREE.CanvasTexture {
  return remember("bezel", () => {
    const canvas = document.createElement("canvas");
    canvas.width = BEZEL_MM.w;
    canvas.height = BEZEL_MM.h;
    paintBezel(canvas);
    const tex = canvasTexture(canvas);
    void whenDisplayFontReady().then(() => {
      paintBezel(canvas);
      tex.needsUpdate = true;
    });
    return tex;
  });
}

/**
 * Mandos del panel, en metros sobre el tablero (x a la derecha, y hacia la
 * pantalla, origen en el centro del tablero). Los usa la serigrafía para
 * dibujar los aros y `cabinet-geometry` para colocar las piezas: una sola
 * fuente, o los botones acabarían fuera de sus aros.
 */
export const PANEL_CONTROLS = {
  joystick: [-0.2, -0.005],
  buttons: [
    [0.04, -0.03],
    [0.12, -0.005],
    [0.2, -0.03],
  ],
  starts: [
    [-0.05, 0.085],
    [0.05, 0.085],
  ],
} as const;

/** Serigrafía del panel de mandos. Canvas arriba = lado de la pantalla. */
export const PANEL_MM = { w: 740, h: 272 } as const;

function paintPanel(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { w, h } = PANEL_MM;
  const px = (x: number) => (x + w / 2000) * 1000;
  const py = (y: number) => (h / 2000 - y) * 1000;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  // Rayas de velocidad en diagonal.
  ctx.fillStyle = "#fff";
  ctx.globalAlpha = 0.13;
  for (let i = 0; i < 5; i++) {
    const x0 = 360 + i * 44;
    ctx.beginPath();
    ctx.moveTo(x0, h);
    ctx.lineTo(x0 + 18, h);
    ctx.lineTo(x0 + 18 + 160, 0);
    ctx.lineTo(x0 + 160, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Filete perimetral.
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  // Aros bajo el joystick (con las ocho direcciones) y bajo cada botón.
  const [jx, jy] = PANEL_CONTROLS.joystick;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(px(jx), py(jy), 62, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(px(jx) + Math.cos(a) * 70, py(jy) + Math.sin(a) * 70);
    ctx.lineTo(px(jx) + Math.cos(a) * 84, py(jy) + Math.sin(a) * 84);
    ctx.stroke();
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const labels = ["A", "B", "C"];
  PANEL_CONTROLS.buttons.forEach(([bx, by], i) => {
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(px(bx), py(by), 38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = `700 16px ${fontFamily()}`;
    ctx.fillText(labels[i], px(bx), py(by) + 54);
  });
  ctx.font = `700 12px ${fontFamily()}`;
  PANEL_CONTROLS.starts.forEach(([sx, sy], i) => {
    ctx.fillText(`${i + 1}P START`, px(sx), py(sy) + 28);
  });
  ctx.fillText("8-WAY", px(jx), py(jy) + 100);
}

export function getPanelTexture(): THREE.CanvasTexture {
  return remember("panel", () => {
    const canvas = document.createElement("canvas");
    canvas.width = PANEL_MM.w;
    canvas.height = PANEL_MM.h;
    paintPanel(canvas);
    const tex = canvasTexture(canvas);
    void whenDisplayFontReady().then(() => {
      paintPanel(canvas);
      tex.needsUpdate = true;
    });
    return tex;
  });
}

/** Rejilla del altavoz, bajo el voladizo de la marquesina: dos conos perforados. */
export function getGrilleTexture(): THREE.CanvasTexture {
  return remember("grille", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 740;
    canvas.height = 216;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#26262d";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const cx of [185, 555]) {
        const cy = canvas.height / 2;
        ctx.fillStyle = "#1a1a1f";
        ctx.beginPath();
        ctx.arc(cx, cy, 84, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#050507";
        for (let x = -80; x <= 80; x += 11) {
          for (let y = -80; y <= 80; y += 11) {
            if (x * x + y * y > 76 * 76) continue;
            ctx.beginPath();
            ctx.arc(cx + x, cy + y, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.strokeStyle = "#3a3a44";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, 86, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    return canvasTexture(canvas);
  });
}

// ─── Tubo: viñeteado y reflejo del cristal ───────────────────────────────────

/** Esquinas y bordes del tubo oscurecidos: sin esto la pantalla parece un monitor plano. */
export function getVignetteTexture(): THREE.CanvasTexture {
  return remember("vignette", () => {
    const w = 256;
    const h = 192;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.62);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.7, "rgba(0,0,0,0.3)");
      g.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // Esquinas redondeadas del tubo: todo lo que queda fuera del recuadro
      // redondeado, negro (relleno par-impar entre el rectángulo y el recuadro).
      roundedRect(ctx, 3, 3, w - 6, h - 6, 22);
      ctx.rect(0, 0, w, h);
      ctx.fillStyle = "#000";
      ctx.fill("evenodd");
    }
    return canvasTexture(canvas);
  });
}

/** Reflejo del cristal: un barrido diagonal suave, en aditivo. */
export function getGlassTexture(): THREE.CanvasTexture {
  return remember("glass", () => {
    const w = 256;
    const h = 192;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, w * 0.7, h);
      g.addColorStop(0, "rgba(255,255,255,0.16)");
      g.addColorStop(0.35, "rgba(255,255,255,0.03)");
      g.addColorStop(0.36, "rgba(255,255,255,0)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // Brillo de la luz del techo sobre la curva del tubo.
      const s = ctx.createRadialGradient(w * 0.3, h * 0.18, 2, w * 0.3, h * 0.18, 60);
      s.addColorStop(0, "rgba(255,255,255,0.22)");
      s.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = s;
      ctx.fillRect(0, 0, w, h);
    }
    return canvasTexture(canvas);
  });
}

// ─── Puerta ──────────────────────────────────────────────────────────────────

function paintSign(canvas: HTMLCanvasElement, text: string, color: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitFont(ctx, text, canvas.width - 60, 104);
  // Dos pasadas: el halo del tubo y el tubo en sí, más claro que el color.
  ctx.shadowColor = color;
  ctx.shadowBlur = 28;
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#f4ffd6";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  ctx.shadowBlur = 0;
}

/** Rótulo de neón "TRABAJEMOS JUNTOS" del dintel. Transparente fuera del texto. */
export function getSignTexture(text: string, color: string): THREE.CanvasTexture {
  return remember(`sign:${text}:${color}`, () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 160;
    paintSign(canvas, text, color);
    const tex = canvasTexture(canvas);
    void whenDisplayFontReady().then(() => {
      paintSign(canvas, text, color);
      tex.needsUpdate = true;
    });
    return tex;
  });
}

/**
 * Logo de Action teñido del color del neón.
 *
 * `logo.webp` es tinta negra sobre blanco, sin canal alfa: se pasa por un
 * canvas y la LUMINANCIA invertida se convierte en alfa (negro = opaco,
 * blanco = transparente). El color lo pone `color`. Asíncrono: llega cuando
 * llega y hasta entonces la puerta va sin logo.
 */
export function loadLogoTexture(src: string, color: string): Promise<THREE.CanvasTexture> {
  const key = `logo:${src}:${color}`;
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit as THREE.CanvasTexture);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return reject(new Error("2d context"));
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const tint = new THREE.Color(color);
      const r = Math.round(tint.r * 255);
      const g = Math.round(tint.g * 255);
      const b = Math.round(tint.b * 255);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const lum = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) / 255;
        px[i] = r;
        px[i + 1] = g;
        px[i + 2] = b;
        px[i + 3] = Math.round((1 - lum) * 255 * (px[i + 3] / 255));
      }
      ctx.putImageData(data, 0, 0);
      const tex = canvasTexture(canvas);
      cache.set(key, tex);
      resolve(tex);
    };
    img.onerror = () => reject(new Error(`logo ${src}`));
    img.src = src;
  });
}
