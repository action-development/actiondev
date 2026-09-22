import * as THREE from "three";
import type { FaceSpec } from "./plaza-config";

/**
 * Generador procedural de la "piel" de la cabeza del muñeco como `CanvasTexture`.
 *
 * La textura es EQUIRECTANGULAR y se aplica como `map` de la propia esfera de
 * la cabeza (UVs nativas de `SphereGeometry`), no como un parche aparte: un
 * segundo mesh pegado a la esfera producía z-fighting y una costura diagonal
 * visible donde sus facetas cruzaban las de la cabeza. Con una sola malla no
 * hay costura posible, y el fondo del lienzo es exactamente el color de piel
 * (misma conversión sRGB que el `color` de las manos), así que tampoco hay
 * parche visible.
 *
 * Ojos, cejas y boca son un DECAL 2D; solo la nariz (en `PlazaDoll.tsx`) tiene
 * volumen real.
 */

/** 2:1 → 360° x 180°: mismos px por grado en ambos ejes, los rasgos pintados
 * cerca del ecuador no salen estirados. */
const W = 1024;
const H = 512;
const PX = W / 360;

/** Frente del muñeco: `SphereGeometry` pone phi = π/2 (u = 0.25) en +z. */
const FRONT_X = W * 0.25;
/** Ecuador (theta = 90°). */
const EQUATOR_Y = H / 2;

/** Alturas de los rasgos en grados desde el ecuador (negativo = arriba).
 * Casan con `DOLL.nose.y` (la nariz queda a ~+4°) y con el borde del pelo
 * (~55° desde el polo por delante), que no debe tapar las cejas. */
const EYE_DY = -10;
const BROW_DY = -22.5;
const MOUTH_DY = 17;
const BLUSH_DY = 6;

/** Negro de cómic: ojos, cejas y todo contorno entintado de la plaza
 * (también el bocadillo de `plaza-textures.ts`). No es #000: el negro puro
 * sobre estos colores planos se lee como agujero. */
export const INK = "#1d1a1c";
const BROW = "#2b2018";

/** Cache de módulo: la textura de una cara nunca cambia entre renders. */
const cache = new Map<string, THREE.CanvasTexture>();

function cacheKey(face: FaceSpec, skin: string, closed: boolean): string {
  return `${skin}|${closed ? 1 : 0}|${face.eyes}|${face.brows}|${face.mouth}|${face.eyeColor}|${face.eyeSpacing}|${face.blush}`;
}

/** Ojo tipo muñeco: óvalo vertical oscuro con un brillo blanco pequeño. */
function drawEye(ctx: CanvasRenderingContext2D, cx: number, cy: number, shape: number, color: string, mirror: boolean) {
  ctx.save();
  ctx.translate(cx, cy);
  if (mirror) ctx.scale(-1, 1);

  // Variaciones sutiles: todas siguen siendo óvalos verticales.
  const rx = [5.2, 5.6, 4.7, 5.4][shape] * PX;
  const ry = [7.8, 7.4, 7.0, 8.2][shape] * PX;
  const tilt = [0, 0.08, 0, -0.06][shape];

  ctx.rotate(tilt);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // Brillo: arriba y hacia fuera en ambos ojos (el `mirror` lo refleja).
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(-rx * 0.32, -ry * 0.4, rx * 0.34, ry * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();

  // Forma 3: pestaña corta en el extremo exterior.
  if (shape === 3) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.7 * PX;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-rx * 0.7, -ry * 0.8);
    ctx.lineTo(-rx * 1.35, -ry * 1.05);
    ctx.stroke();
  }
  ctx.restore();
}

/** Ojo cerrado (parpadeo): arco fino. */
function drawClosedEye(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.9 * PX;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-3.4 * PX, 0);
  ctx.quadraticCurveTo(0, 1.6 * PX, 3.4 * PX, 0);
  ctx.stroke();
  ctx.restore();
}

function drawBrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, shape: number, mirror: boolean) {
  ctx.save();
  ctx.translate(cx, cy);
  if (mirror) ctx.scale(-1, 1);
  ctx.strokeStyle = BROW;
  ctx.lineCap = "round";
  ctx.lineWidth = (shape === 2 ? 1.25 : 0.95) * PX;
  ctx.beginPath();

  // x negativo = lado interior (hacia la nariz) en el ojo izquierdo.
  switch (shape) {
    case 0: // Recta
      ctx.moveTo(-4.2 * PX, 0.3 * PX);
      ctx.lineTo(4.2 * PX, -0.3 * PX);
      break;
    case 1: // Arqueada suave
      ctx.moveTo(-4.2 * PX, 0.6 * PX);
      ctx.quadraticCurveTo(0, -1.8 * PX, 4.2 * PX, 0.4 * PX);
      break;
    case 2: // Algo más gruesa, bajando hacia dentro
      ctx.moveTo(-4 * PX, 0.9 * PX);
      ctx.lineTo(4 * PX, -0.6 * PX);
      break;
    default: // Fina, levantada hacia dentro (gesto amable)
      ctx.moveTo(-4 * PX, -0.6 * PX);
      ctx.quadraticCurveTo(0.5 * PX, -1.2 * PX, 4 * PX, 0.6 * PX);
  }
  ctx.stroke();
  ctx.restore();
}

function drawMouth(ctx: CanvasRenderingContext2D, cx: number, cy: number, shape: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = INK;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (shape) {
    case 0: // Sonrisa
      ctx.lineWidth = 0.9 * PX;
      ctx.beginPath();
      ctx.moveTo(-4.6 * PX, -0.6 * PX);
      ctx.quadraticCurveTo(0, 3 * PX, 4.6 * PX, -0.6 * PX);
      ctx.stroke();
      break;
    case 1: // Sonrisa abierta (media luna rellena, sin dientes)
      ctx.fillStyle = "#6b2a2a";
      ctx.beginPath();
      ctx.moveTo(-4.4 * PX, -0.6 * PX);
      ctx.quadraticCurveTo(0, 0.4 * PX, 4.4 * PX, -0.6 * PX);
      ctx.quadraticCurveTo(0, 5 * PX, -4.4 * PX, -0.6 * PX);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 0.6 * PX;
      ctx.stroke();
      break;
    case 2: // Neutra con comisuras levemente arriba
      ctx.lineWidth = 0.85 * PX;
      ctx.beginPath();
      ctx.moveTo(-3.6 * PX, -0.3 * PX);
      ctx.quadraticCurveTo(0, 0.9 * PX, 3.6 * PX, -0.3 * PX);
      ctx.stroke();
      break;
    default: // Sonrisa pequeña
      ctx.lineWidth = 0.85 * PX;
      ctx.beginPath();
      ctx.moveTo(-2.8 * PX, -0.4 * PX);
      ctx.quadraticCurveTo(0, 2 * PX, 2.8 * PX, -0.4 * PX);
      ctx.stroke();
  }
  ctx.restore();
}

function drawBlush(ctx: CanvasRenderingContext2D, dx: number) {
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#f08a7e";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(FRONT_X + side * dx, EQUATOR_Y + BLUSH_DY * PX, 4.2 * PX, 2.6 * PX, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function paint(canvas: HTMLCanvasElement, face: FaceSpec, skin: string, closed: boolean) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Fondo = piel exacta: el material de la cabeza va en blanco y toma el color
  // SOLO de este mapa, así cabeza y manos (color = skin) salen idénticas.
  ctx.fillStyle = skin;
  ctx.fillRect(0, 0, W, H);

  // eyeSpacing 0-1 → separación en grados desde el eje de la cara.
  const eyeDx = (12 + face.eyeSpacing * 5) * PX;
  const eyeY = EQUATOR_Y + EYE_DY * PX;

  for (const side of [-1, 1]) {
    const cx = FRONT_X + side * eyeDx;
    if (closed) drawClosedEye(ctx, cx, eyeY);
    else drawEye(ctx, cx, eyeY, face.eyes, face.eyeColor, side === 1);
    drawBrow(ctx, FRONT_X + side * (eyeDx + 0.6 * PX), EQUATOR_Y + BROW_DY * PX, face.brows, side === -1);
  }
  drawMouth(ctx, FRONT_X, EQUATOR_Y + MOUTH_DY * PX, face.mouth);
  if (face.blush) drawBlush(ctx, eyeDx + 6 * PX);
}

/**
 * Devuelve (o genera y cachea) la textura de cabeza para esta combinación.
 * `closed` = variante con ojos cerrados para el parpadeo (se intercambia el
 * `map`, nunca se repinta el lienzo).
 *
 * Guard SSR: sin `document` no hay Canvas 2D — devolvemos una textura 1x1
 * inerte (en Node no hay renderer que la suba a GPU).
 */
export function getFaceTexture(face: FaceSpec, skin: string, closed = false): THREE.CanvasTexture {
  const key = cacheKey(face, skin, closed);
  const hit = cache.get(key);
  if (hit) return hit;

  if (typeof document === "undefined") {
    const fallback = { width: 1, height: 1 } as unknown as HTMLCanvasElement;
    const tex = new THREE.CanvasTexture(fallback);
    tex.colorSpace = THREE.SRGBColorSpace;
    cache.set(key, tex);
    return tex;
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  paint(canvas, face, skin, closed);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  cache.set(key, texture);
  return texture;
}

/** Vacía la cache y libera GPU. Llamar al desmontar la escena de la plaza. */
export function disposeFaceTextures(): void {
  for (const tex of cache.values()) tex.dispose();
  cache.clear();
}
