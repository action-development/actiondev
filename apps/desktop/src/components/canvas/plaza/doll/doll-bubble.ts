import * as THREE from "three";
import { registerPlazaDisposer } from "../plaza-textures";

/**
 * Bocadillo de "charlando": atlas de 3 fotogramas (uno, dos y tres puntos) en
 * lienzos de 256 px — a 128 px el trazo se veía escalonado de cerca. La punta
 * de la cola cae EXACTAMENTE en el centro del borde inferior de cada
 * fotograma: el sprite se ancla ahí (`center = (0.5, 0)`) y la cola toca la
 * coronilla sin tener que ajustar a ojo.
 */

/** Tinta de cómic del sitio (la misma que usa la cara). */
const INK = "#1d1a1c";
const FRAME = 256;
export const BUBBLE_FRAMES = 3;

let atlas: THREE.CanvasTexture | null = null;

function drawFrame(ctx: CanvasRenderingContext2D, ox: number, lit: number) {
  const pad = 14; // margen transparente: los mipmaps no sangran entre fotogramas
  const x0 = ox + pad;
  const x1 = ox + FRAME - pad;
  const y0 = pad;
  const y1 = FRAME - 58;
  const r = 44;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineWidth = 9;
  ctx.strokeStyle = INK;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(x0 + r, y0);
  ctx.lineTo(x1 - r, y0);
  ctx.quadraticCurveTo(x1, y0, x1, y0 + r);
  ctx.lineTo(x1, y1 - r);
  ctx.quadraticCurveTo(x1, y1, x1 - r, y1);
  // Cola: baja hasta el centro del borde inferior.
  ctx.lineTo(ox + FRAME / 2 + 22, y1);
  ctx.lineTo(ox + FRAME / 2, FRAME - 8);
  ctx.lineTo(ox + FRAME / 2 - 22, y1);
  ctx.lineTo(x0 + r, y1);
  ctx.quadraticCurveTo(x0, y1, x0, y1 - r);
  ctx.lineTo(x0, y0 + r);
  ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Puntos: los encendidos en tinta, los demás en gris.
  const cy = (y0 + y1) / 2;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < lit ? INK : "#c9c9cf";
    ctx.beginPath();
    ctx.arc(ox + FRAME / 2 + (i - 1) * 46, cy, 13, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Textura base del atlas (compartida). Cada muñeco la `clone()`a para mover
 * su propio `offset` sin tocar la de los demás: el clon comparte la imagen. */
export function getBubbleAtlas(): THREE.CanvasTexture {
  if (atlas) return atlas;
  const canvas = document.createElement("canvas");
  canvas.width = FRAME * BUBBLE_FRAMES;
  canvas.height = FRAME;
  const ctx = canvas.getContext("2d");
  if (ctx) for (let i = 0; i < BUBBLE_FRAMES; i++) drawFrame(ctx, i * FRAME, i + 1);
  atlas = new THREE.CanvasTexture(canvas);
  atlas.colorSpace = THREE.SRGBColorSpace;
  atlas.anisotropy = 4;
  atlas.needsUpdate = true;
  registerPlazaDisposer(() => {
    atlas?.dispose();
    atlas = null;
  });
  return atlas;
}
