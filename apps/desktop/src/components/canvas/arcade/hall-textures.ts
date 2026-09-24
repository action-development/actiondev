import * as THREE from "three";
import {
  canvasTexture,
  fitFont,
  fontFamily,
  mix,
  mulberry32,
  remember,
  roundedRect,
  whenDisplayFontReady,
} from "./arcade-textures";

/**
 * Texturas de la SALA (paredes y techo), pintadas en runtime como el resto:
 * cero assets. Comparten la caché de `arcade-textures` y con ella el
 * `disposeArcadeTextures` al salir de la página.
 *
 * Las de superficie (yeso, friso, forjado) se pintan en claro y se tiñen con
 * el `color` del material, que pone la paleta de día o de noche.
 */

function repeating(tex: THREE.Texture): THREE.Texture {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function blankCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D | null] {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return [canvas, canvas.getContext("2d")];
}

/** Yeso pintado: moteado fino y alguna mancha grande, casi imperceptible. */
export function getPlasterTexture(): THREE.Texture {
  return remember("plaster", () => {
    const [canvas, ctx] = blankCanvas(512, 512);
    if (ctx) {
      ctx.fillStyle = "#e9e9e9";
      ctx.fillRect(0, 0, 512, 512);
      const rand = mulberry32(11);
      for (let i = 0; i < 40; i++) {
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 60 + rand() * 80);
        const tone = rand() > 0.5 ? "255,255,255" : "0,0,0";
        g.addColorStop(0, `rgba(${tone},0.05)`);
        g.addColorStop(1, `rgba(${tone},0)`);
        const x = rand() * 512;
        const y = rand() * 512;
        for (const dx of [-512, 0, 512]) {
          for (const dy of [-512, 0, 512]) {
            ctx.save();
            ctx.translate(x + dx, y + dy);
            ctx.fillStyle = g;
            ctx.fillRect(-150, -150, 300, 300);
            ctx.restore();
          }
        }
      }
      for (let i = 0; i < 9000; i++) {
        ctx.fillStyle = rand() > 0.5 ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)";
        ctx.fillRect(rand() * 512, rand() * 512, 1.5, 1.5);
      }
    }
    return repeating(canvasTexture(canvas));
  });
}

/**
 * Friso de paneles ranurados (la parte baja de la pared). Una teja = un panel
 * de 60 cm con cuatro ranuras verticales y el canto en sombra.
 */
export function getWainscotTexture(): THREE.Texture {
  return remember("wainscot", () => {
    const [canvas, ctx] = blankCanvas(256, 256);
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, "#f2f2f2");
      g.addColorStop(1, "#d6d6d6");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 1; i < 5; i++) {
        const x = i * 51;
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(x - 2, 0, 3, 256);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(x + 1, 0, 1, 256);
      }
      // Junta entre paneles, más marcada.
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, 4, 256);
    }
    return repeating(canvasTexture(canvas));
  });
}

/**
 * Forjado de chapa grecada del techo: nervios perpendiculares al pasillo con
 * luz en una cara y sombra en la otra. Una teja = 20 cm.
 */
export function getDeckTexture(): THREE.Texture {
  return remember("deck", () => {
    // Degradado en VERTICAL: en el plano del techo, la V de la textura va a lo
    // largo del pasillo, que es donde se suceden los nervios.
    const [canvas, ctx] = blankCanvas(64, 128);
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0, "#9a9a9a");
      g.addColorStop(0.2, "#ffffff");
      g.addColorStop(0.45, "#dcdcdc");
      g.addColorStop(0.55, "#6f6f6f");
      g.addColorStop(0.7, "#bdbdbd");
      g.addColorStop(1, "#9a9a9a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 128);
    }
    return repeating(canvasTexture(canvas));
  });
}

/**
 * Mural de luz negra: trazos de neón (zigzags, triángulos, aros, rayos) sobre
 * transparente. De noche brilla como pintura fluorescente; de día queda como
 * un estampado apagado. Teja de 4 m de largo por 1,2 de alto.
 */
export function getMuralTexture(): THREE.Texture {
  return remember("mural", () => {
    const w = 1024;
    const h = 307;
    const [canvas, ctx] = blankCanvas(w, h);
    if (ctx) {
      const inks = ["#4fe3ff", "#ff4fd8", "#c8ff00", "#ffb347"];
      const rand = mulberry32(23);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // Cordillera en zigzag de lado a lado: el motivo que da continuidad.
      ctx.strokeStyle = inks[0];
      ctx.lineWidth = 5;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 64) {
        const y = (x / 64) % 2 === 0 ? h * 0.72 : h * 0.4;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      for (let i = 0; i < 26; i++) {
        const x = rand() * w;
        const y = 30 + rand() * (h - 60);
        const r = 10 + rand() * 18;
        ctx.strokeStyle = inks[Math.floor(rand() * inks.length)];
        ctx.lineWidth = 4;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rand() * Math.PI * 2);
        ctx.beginPath();
        const kind = Math.floor(rand() * 4);
        if (kind === 0) {
          ctx.moveTo(0, -r);
          ctx.lineTo(r * 0.87, r * 0.5);
          ctx.lineTo(-r * 0.87, r * 0.5);
          ctx.closePath();
        } else if (kind === 1) {
          ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
        } else if (kind === 2) {
          ctx.moveTo(-r, -r / 2);
          ctx.lineTo(0, r / 2);
          ctx.lineTo(-r / 3, r / 2);
          ctx.lineTo(r, r);
        } else {
          for (let k = 0; k < 4; k++) ctx.rect(k * 9 - 18, -2, 5, 4);
        }
        ctx.stroke();
        ctx.restore();
      }
    }
    const tex = canvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  });
}

// ─── Pósters ─────────────────────────────────────────────────────────────────

/**
 * Juegos inventados para los pósters de la pared, con guiños al resto de la
 * web (la grúa de la home, el parque de las reseñas) y a Vigo. Son decorado:
 * no son proyectos ni se pueden pulsar.
 */
export const POSTERS = [
  { title: "GRÚA PANIC", tag: "¡CARGA ANTES DEL ATARDECER!", sky: ["#1b1446", "#ff5e7a"], ink: "#c8ff00", motif: "crane" },
  { title: "CÍES INVADERS", tag: "DEFIENDE LA RÍA", sky: ["#040b1e", "#1c4c7a"], ink: "#4fe3ff", motif: "invaders" },
  { title: "RÍA RACER", tag: "TURBO EDITION", sky: ["#2a0c3e", "#ff9a3c"], ink: "#ffb347", motif: "sunset" },
  { title: "BATEA BLASTER", tag: "2 PLAYERS", sky: ["#061a1a", "#1f8a82"], ink: "#ff4fd8", motif: "waves" },
  { title: "CASTRELOS BRAWL", tag: "LA PLAZA ES TUYA", sky: ["#1d0b0b", "#b8322a"], ink: "#f1ead6", motif: "stars" },
  { title: "PIXEL KNIGHT", tag: "INSERT COIN", sky: ["#0f0f14", "#5a3fb0"], ink: "#c8ff00", motif: "sunset" },
] as const;

/** Rejilla del atlas: celdas de 300×420 (proporción del póster), 3 columnas. */
export const POSTER_CELL = { w: 300, h: 420, cols: 3 } as const;

function paintPoster(ctx: CanvasRenderingContext2D, p: (typeof POSTERS)[number], x: number, y: number) {
  const { w, h } = POSTER_CELL;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, p.sky[0]);
  sky.addColorStop(0.75, p.sky[1]);
  sky.addColorStop(1, mix(p.sky[1], "#000000", 0.4));
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);

  const cx = x + w / 2;
  const horizon = y + h * 0.66;

  if (p.motif === "sunset" || p.motif === "crane") {
    // Sol partido en franjas.
    const sun = ctx.createLinearGradient(0, horizon - 110, 0, horizon);
    sun.addColorStop(0, "#ffe46b");
    sun.addColorStop(1, "#ff3d7f");
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(cx, horizon, 92, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = p.sky[1];
    for (let i = 0; i < 5; i++) ctx.fillRect(x, horizon - 14 - i * 16, w, 3 + i);
  }
  if (p.motif === "crane") {
    // Silueta de la grúa del puerto.
    ctx.fillStyle = "#07070a";
    ctx.fillRect(cx - 70, horizon - 150, 10, 150);
    ctx.fillRect(cx - 120, horizon - 150, 230, 10);
    ctx.fillRect(cx + 40, horizon - 140, 3, 60);
    ctx.fillRect(cx + 25, horizon - 80, 34, 20);
  }
  if (p.motif === "invaders" || p.motif === "stars") {
    const rand = mulberry32(p.title.length * 97);
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 70; i++) ctx.fillRect(x + rand() * w, y + rand() * h * 0.6, 2, 2);
  }
  if (p.motif === "invaders") {
    ctx.fillStyle = p.ink;
    const shape = ["00100100", "00011000", "00111100", "01101110", "11111111", "10111101", "10100101", "00011000"];
    for (const [ox, oy, s] of [
      [cx - 60, y + 120, 7],
      [cx + 30, y + 90, 5],
      [cx - 10, y + 175, 6],
    ] as const) {
      shape.forEach((row, r) =>
        [...row].forEach((bit, c) => {
          if (bit === "1") ctx.fillRect(ox + c * s, oy + r * s, s, s);
        }),
      );
    }
  }
  if (p.motif === "waves") {
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 4;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      for (let t = 0; t <= w; t += 6) {
        const yy = y + 130 + k * 32 + Math.sin(t / 22 + k) * 10;
        if (t === 0) ctx.moveTo(x + t, yy);
        else ctx.lineTo(x + t, yy);
      }
      ctx.stroke();
    }
  }

  // Suelo en rejilla hacia el horizonte.
  ctx.fillStyle = "#07070a";
  ctx.fillRect(x, horizon, w, h - (horizon - y));
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.7;
  for (let i = -10; i <= 10; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 8, horizon);
    ctx.lineTo(cx + i * 60, y + h);
    ctx.stroke();
  }
  for (let j = 1; j <= 6; j++) {
    const ly = horizon + ((y + h - horizon) * j * j) / 36;
    ctx.beginPath();
    ctx.moveTo(x, ly);
    ctx.lineTo(x + w, ly);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Título con contorno, arriba, y lema en la franja inferior.
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const size = fitFont(ctx, p.title, w - 34, 44);
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(5, size * 0.18);
  ctx.strokeStyle = "#07070a";
  ctx.strokeText(p.title, cx, y + 50);
  ctx.fillStyle = p.ink;
  ctx.fillText(p.title, cx, y + 50);
  ctx.fillStyle = "#07070a";
  ctx.fillRect(x, y + h - 42, w, 42);
  ctx.font = `700 13px ${fontFamily()}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(p.tag, cx, y + h - 21);

  // Papel: bordes quemados y pliegue central, que un póster de verdad tiene.
  const edge = ctx.createRadialGradient(cx, y + h / 2, h * 0.3, cx, y + h / 2, h * 0.75);
  edge.addColorStop(0, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = edge;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(x, y + h / 2 - 1, w, 2);
  ctx.restore();
}

function paintPosters(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  POSTERS.forEach((p, i) => {
    paintPoster(ctx, p, (i % POSTER_CELL.cols) * POSTER_CELL.w, Math.floor(i / POSTER_CELL.cols) * POSTER_CELL.h);
  });
}

export function getPosterAtlas(): THREE.Texture {
  return remember("posters", () => {
    const rows = Math.ceil(POSTERS.length / POSTER_CELL.cols);
    const [canvas] = blankCanvas(POSTER_CELL.w * POSTER_CELL.cols, POSTER_CELL.h * rows);
    paintPosters(canvas);
    const tex = canvasTexture(canvas);
    void whenDisplayFontReady().then(() => {
      paintPosters(canvas);
      tex.needsUpdate = true;
    });
    return tex;
  });
}

/** Rectángulo UV del póster `index` en el atlas. */
export function posterUv(index: number): [number, number, number, number] {
  const rows = Math.ceil(POSTERS.length / POSTER_CELL.cols);
  const col = index % POSTER_CELL.cols;
  const row = Math.floor(index / POSTER_CELL.cols);
  return [col / POSTER_CELL.cols, 1 - (row + 1) / rows, (col + 1) / POSTER_CELL.cols, 1 - row / rows];
}

// ─── Luz ─────────────────────────────────────────────────────────────────────

/**
 * Haz de un foco del techo: vertical, denso arriba y desvanecido hacia el
 * suelo. Va sobre un cono abierto en aditivo — la "luz en el aire" que da el
 * polvo de una sala oscura.
 */
export function getBeamTexture(): THREE.Texture {
  return remember("beam", () => {
    const [canvas, ctx] = blankCanvas(8, 256);
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.35, "rgba(255,255,255,0.45)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 8, 256);
    }
    return canvasTexture(canvas);
  });
}

/** Bañado de la moldura de luz sobre la pared: intenso arriba, cae hacia abajo. */
export function getWashTexture(): THREE.Texture {
  return remember("wash", () => {
    const [canvas, ctx] = blankCanvas(8, 128);
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.25, "rgba(255,255,255,0.35)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 8, 128);
    }
    return canvasTexture(canvas);
  });
}

/** Rejilla de lamas de un lucernario: cristal claro con perfiles. */
export function getSkylightTexture(): THREE.Texture {
  return remember("skylight", () => {
    const [canvas, ctx] = blankCanvas(128, 256);
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 128, 256);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      for (let y = 0; y <= 256; y += 64) ctx.fillRect(0, y - 3, 128, 6);
      ctx.fillRect(61, 0, 6, 256);
      roundedRect(ctx, 0, 0, 128, 256, 0);
      ctx.lineWidth = 10;
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.stroke();
    }
    return canvasTexture(canvas);
  });
}

// ─── Suelo ───────────────────────────────────────────────────────────────────

/**
 * Relieve del pelo de la moqueta (`bumpMap`): ruido fino en gris. Con la luz
 * rasante de los focos es lo que deja ver que es tejido.
 */
export function getCarpetBump(): THREE.Texture {
  return remember("carpet-bump", () => {
    const [canvas, ctx] = blankCanvas(256, 256);
    if (ctx) {
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, 256, 256);
      const rand = mulberry32(5);
      for (let i = 0; i < 26000; i++) {
        const v = Math.floor(90 + rand() * 90);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(rand() * 256, rand() * 256, 1, 1 + rand());
      }
    }
    return repeating(canvasTexture(canvas));
  });
}

/**
 * Desgaste de la moqueta, a lo ancho del pasillo (u = x): polvo y sombra
 * pegados a las paredes y bajo las máquinas, el centro limpio y algo más claro
 * donde pisa la gente, y manchas sueltas. Se repite a lo largo (v).
 */
export function getFloorWearTexture(): THREE.Texture {
  return remember("floor-wear", () => {
    const w = 256;
    const h = 512;
    const [canvas, ctx] = blankCanvas(w, h);
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "rgba(0,0,0,0.6)");
      g.addColorStop(0.1, "rgba(0,0,0,0.35)");
      g.addColorStop(0.24, "rgba(0,0,0,0.12)");
      g.addColorStop(0.36, "rgba(0,0,0,0)");
      g.addColorStop(0.64, "rgba(0,0,0,0)");
      g.addColorStop(0.76, "rgba(0,0,0,0.12)");
      g.addColorStop(0.9, "rgba(0,0,0,0.35)");
      g.addColorStop(1, "rgba(0,0,0,0.6)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const rand = mulberry32(31);
      for (let i = 0; i < 14; i++) {
        const x = w * (0.3 + rand() * 0.4);
        const y = rand() * h;
        const r = 8 + rand() * 22;
        const s = ctx.createRadialGradient(x, y, 0, x, y, r);
        s.addColorStop(0, `rgba(0,0,0,${0.08 + rand() * 0.1})`);
        s.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = s;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
    }
    const tex = canvasTexture(canvas);
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  });
}

/**
 * Sombra de contacto: un rectángulo muy difuminado. Bajo cada máquina es lo
 * que la ASIENTA en la moqueta; sin ella los muebles parecen flotar.
 */
export function getContactShadowTexture(): THREE.Texture {
  return remember("contact-shadow", () => {
    const [canvas, ctx] = blankCanvas(128, 128);
    if (ctx) {
      ctx.filter = "blur(14px)";
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fillRect(30, 30, 68, 68);
      ctx.filter = "none";
    }
    return canvasTexture(canvas);
  });
}

/** Felpudo de fibra de coco delante de la puerta, con la marca estampada. */
export function getDoormatTexture(): THREE.Texture {
  return remember("doormat", () => {
    const w = 512;
    const h = 288;
    const [canvas, ctx] = blankCanvas(w, h);
    if (ctx) {
      ctx.fillStyle = "#1c1b1f";
      ctx.fillRect(0, 0, w, h);
      const rand = mulberry32(3);
      for (let i = 0; i < 40000; i++) {
        const v = Math.floor(20 + rand() * 45);
        ctx.fillStyle = `rgb(${v},${v - 2},${v - 4})`;
        ctx.fillRect(rand() * w, rand() * h, 1, 2);
      }
      // Ribete de goma.
      ctx.strokeStyle = "#0a0a0c";
      ctx.lineWidth = 22;
      roundedRect(ctx, 11, 11, w - 22, h - 22, 18);
      ctx.stroke();
      // Marca estampada, gastada.
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 92px ${fontFamily()}`;
      ctx.fillStyle = "rgba(200,255,0,0.55)";
      ctx.fillText("action", w / 2, h / 2 + 4);
      for (let i = 0; i < 4000; i++) {
        ctx.fillStyle = "rgba(28,27,31,0.8)";
        ctx.fillRect(rand() * w, rand() * h, 2, 2);
      }
    }
    return canvasTexture(canvas);
  });
}

// ─── Elementos de pared ─────────────────────────────────────────────────────

/**
 * Halo de un neón sobre la pared: el mismo rótulo muy difuminado, del color del
 * tubo. Va detrás del letrero en aditivo y es lo que hace que el neón "luzca"
 * sobre el yeso en vez de ser una pegatina.
 */
export function getSignHaloTexture(text: string, color: string): THREE.Texture {
  return remember(`halo:${text}:${color}`, () => {
    const [canvas, ctx] = blankCanvas(512, 160);
    const paint = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, 512, 160);
      ctx.filter = "blur(18px)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      fitFont(ctx, text, 400, 70);
      ctx.fillStyle = color;
      ctx.fillText(text, 256, 80);
      ctx.fillText(text, 256, 80);
      ctx.filter = "none";
    };
    paint();
    const tex = canvasTexture(canvas);
    void whenDisplayFontReady().then(() => {
      paint();
      tex.needsUpdate = true;
    });
    return tex;
  });
}

/** Frontal de altavoz: tela negra con trama, cono de graves y tweeter. */
export function getSpeakerTexture(): THREE.Texture {
  return remember("speaker", () => {
    const w = 200;
    const h = 300;
    const [canvas, ctx] = blankCanvas(w, h);
    if (ctx) {
      ctx.fillStyle = "#17171b";
      ctx.fillRect(0, 0, w, h);
      // Trama de la tela.
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
      for (let x = 0; x < w; x += 3) ctx.fillRect(x, 0, 1, h);
      // Cono de graves y tweeter, que se transparentan.
      const cone = ctx.createRadialGradient(w / 2, h * 0.62, 6, w / 2, h * 0.62, 72);
      cone.addColorStop(0, "rgba(0,0,0,0.7)");
      cone.addColorStop(0.75, "rgba(0,0,0,0.35)");
      cone.addColorStop(0.8, "rgba(255,255,255,0.06)");
      cone.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.62, 72, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.2, 22, 0, Math.PI * 2);
      ctx.fill();
      // Chapita de la marca.
      ctx.fillStyle = "#9a9ca3";
      ctx.fillRect(w / 2 - 22, h - 26, 44, 9);
    }
    return canvasTexture(canvas);
  });
}
