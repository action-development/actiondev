import * as THREE from "three";
import type { LayerGrade } from "./backdrop-palette";
import { registerPlazaDisposer } from "./plaza-textures";

/**
 * Material del horizonte con grading atmosférico propio.
 *
 * `MeshBasicMaterial` (sin luz, sin tone mapping, sin niebla de escena) al que
 * se le inyecta, justo antes de volcar el color, una corrección en espacio
 * LINEAL:
 *   1. saturación y ganancia (lo lejano pierde croma y valor),
 *   2. multiplicador de tinte (enfriar / calentar),
 *   3. mezcla hacia el color de horizonte: uniforme + extra hacia la base
 *      (`1 - v`), que es la perspectiva atmosférica pintada a mano,
 *   4. oclusión de ambiente en el pie (solo el Pazo),
 *   5. ventanas encendidas SUMADAS después de la bruma (la luz propia no se
 *      vela por el aire).
 *
 * Se usa en vez de la niebla de escena porque esa se ajusta para el 3D cercano
 * y, aplicada al telón, lo hacía desaparecer o ennegrecerse de más.
 */

export interface GradedOptions {
  map: THREE.Texture;
  grade: LayerGrade;
  /** Color de horizonte (sRGB hex): hacia él tiende la bruma. */
  haze: string;
  side?: THREE.Side;
  /** Oscurecimiento del pie (0-1). */
  baseAO?: number;
  /** Máscara de ventanas y su intensidad. */
  windowMask?: THREE.Texture | null;
  windowGain?: number;
}

export function createGradedMaterial(opts: GradedOptions): THREE.MeshBasicMaterial {
  const { map, grade, haze, side = THREE.BackSide, baseAO = 0, windowMask = null, windowGain = 0 } = opts;
  const material = new THREE.MeshBasicMaterial({
    map,
    side,
    alphaTest: 0.5,
    // Borde del recorte suavizado por MSAA en vez de dentado. Mantiene
    // `alphaTest`: el cubo de la prueba sigue descartando lo transparente.
    alphaToCoverage: true,
    toneMapped: false,
    fog: false,
  });

  const hasWindows = windowMask !== null;
  const hazeColor = new THREE.Color(haze); // ya en lineal

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSat = { value: grade.sat };
    shader.uniforms.uGain = { value: grade.gain };
    shader.uniforms.uTint = { value: new THREE.Vector3(...grade.tint) };
    shader.uniforms.uHaze = { value: hazeColor };
    shader.uniforms.uAmt = { value: grade.haze };
    shader.uniforms.uBase = { value: grade.hazeBase };
    shader.uniforms.uAO = { value: baseAO };
    if (hasWindows) {
      shader.uniforms.uWin = { value: windowMask };
      shader.uniforms.uWinGain = { value: windowGain };
    }

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uSat; uniform float uGain; uniform vec3 uTint; uniform vec3 uHaze;
uniform float uAmt; uniform float uBase; uniform float uAO;
${hasWindows ? "uniform sampler2D uWin; uniform float uWinGain;" : ""}`,
      )
      .replace(
        "#include <opaque_fragment>",
        `{
  float luma = dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722));
  vec3 c = mix(vec3(luma), outgoingLight, uSat) * uGain * uTint;
  float low = 1.0 - vMapUv.y;
  c = mix(c, uHaze, clamp(uAmt + uBase * low * low, 0.0, 1.0));
  // El webp trae un ribete claro de matte en el borde del recorte: se apaga
  // donde el alfa no es pleno, o el contorno brilla como una pegatina.
  c *= mix(0.74, 1.0, smoothstep(0.55, 0.97, diffuseColor.a));
  c *= 1.0 - uAO * (1.0 - smoothstep(0.0, 0.14, vMapUv.y));
  ${hasWindows ? "c += texture2D(uWin, vMapUv).rgb * uWinGain;" : ""}
  outgoingLight = c;
}
#include <opaque_fragment>`,
      );
  };
  // Dos variantes de programa (con y sin ventanas): sin esto three reutiliza
  // el primero compilado y el otro se queda sin uniforms.
  material.customProgramCacheKey = () => (hasWindows ? "backdrop-graded-win" : "backdrop-graded");
  return material;
}

/* ------------------------------------------------------------------ */
/* Texturas procedurales del Pazo (propias, cacheadas, con disposer)   */
/* ------------------------------------------------------------------ */

/** Tamaño de la imagen del Pazo de día: las coordenadas de las ventanas están
 * medidas sobre ella (1100 × 594 px). */
export const PAZO_IMAGE = { width: 1100, height: 594 } as const;

/** Ventanas del Pazo en píxeles de `pazo-dia.webp`: [x0, y0, x1, y1, encendida
 * 0-1]. Medidas a mano sobre la imagen. La intensidad desigual es lo que hace
 * creíble una casa habitada: no todas las luces están encendidas a la vez. */
const PAZO_WINDOWS: ReadonlyArray<readonly [number, number, number, number, number]> = [
  // Planta alta
  [197, 289, 258, 348, 1],
  [357, 289, 418, 348, 0.55],
  [535, 287, 598, 345, 0.9],
  [704, 289, 765, 348, 0],
  [859, 289, 918, 348, 0.8],
  // Planta baja
  [197, 441, 258, 503, 0.65],
  [357, 441, 418, 503, 0],
  [704, 441, 765, 503, 1],
  [859, 441, 918, 503, 0.5],
  // Tronera de la torre
  [136, 101, 162, 127, 0.7],
];

const WARM = ["#ffc982", "#ffb866", "#ffd9a0", "#ffc07a"];

let windowMask: THREE.CanvasTexture | null = null;

/**
 * Máscara de ventanas encendidas: cada hueco son 4 cristales (la carpintería
 * queda oscura entre ellos) con su halo suave alrededor. Se SUMA en el shader,
 * así que el negro no aporta nada. Mitad de resolución: son manchas de luz.
 */
export function getPazoWindowMask(): THREE.CanvasTexture {
  if (windowMask) return windowMask;
  const S = 0.5;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(PAZO_IMAGE.width * S);
  canvas.height = Math.round(PAZO_IMAGE.height * S);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    PAZO_WINDOWS.forEach(([x0, y0, x1, y1, lit], i) => {
      if (lit <= 0) return;
      const w = (x1 - x0) * S;
      const h = (y1 - y0) * S;
      const cx = (x0 + x1) * 0.5 * S;
      const cy = (y0 + y1) * 0.5 * S;
      const color = WARM[i % WARM.length];
      // Halo: dentro de la fachada se lee como luz que se derrama sobre la sillería.
      const r = Math.max(w, h) * 1.3;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "rgba(255,170,90,0.34)");
      g.addColorStop(1, "rgba(255,170,90,0)");
      ctx.globalAlpha = lit;
      ctx.fillStyle = g;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      // Cristales.
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.5 + 0.5 * lit;
      const gap = 1.6;
      const pw = (w - gap * 3) / 2;
      const ph = (h - gap * 3) / 2;
      for (let cxI = 0; cxI < 2; cxI++) {
        for (let cyI = 0; cyI < 2; cyI++) {
          ctx.fillRect(x0 * S + gap + cxI * (pw + gap), y0 * S + gap + cyI * (ph + gap), pw, ph);
        }
      }
    });
    ctx.globalAlpha = 1;
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  windowMask = tex;
  registerPlazaDisposer(() => {
    windowMask?.dispose();
    windowMask = null;
  });
  return tex;
}

let softShadow: THREE.CanvasTexture | null = null;

/** Mancha elíptica negra de bordes suaves: sombra difusa del edificio. */
export function getSoftShadowTexture(): THREE.CanvasTexture {
  if (softShadow) return softShadow;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.translate(64, 32);
    ctx.scale(1, 0.5);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 64);
    g.addColorStop(0, "rgba(0,0,0,0.85)");
    g.addColorStop(0.55, "rgba(0,0,0,0.5)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-64, -64, 128, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  softShadow = tex;
  registerPlazaDisposer(() => {
    softShadow?.dispose();
    softShadow = null;
  });
  return tex;
}

let gravel: THREE.CanvasTexture | null = null;

/** Grava: grano claro/oscuro sobre blanco y borde elíptico que se disuelve en
 * el césped (el tono lo pone el `color` del material, no la textura). */
export function getGravelTexture(): THREE.CanvasTexture {
  if (gravel) return gravel;
  const W = 256;
  const H = 128;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#e9e9e9";
    ctx.fillRect(0, 0, W, H);
    // PRNG determinista: mismo grano en cada carga.
    let s = 1337;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 2600; i++) {
      const v = 150 + Math.floor(rnd() * 105);
      ctx.fillStyle = `rgba(${v},${v},${v},0.55)`;
      ctx.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1 + rnd() * 1.5);
    }
    ctx.globalCompositeOperation = "destination-in";
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(1, H / W);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, W / 2);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.8, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-W / 2, -W / 2, W, W);
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  gravel = tex;
  registerPlazaDisposer(() => {
    gravel?.dispose();
    gravel = null;
  });
  return tex;
}

let mistGradient: THREE.CanvasTexture | null = null;

/** Degradado vertical blanco: opaco abajo, transparente arriba (alfa). */
export function getMistTexture(): THREE.CanvasTexture {
  if (mistGradient) return mistGradient;
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.55, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 64);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  mistGradient = tex;
  registerPlazaDisposer(() => {
    mistGradient?.dispose();
    mistGradient = null;
  });
  return tex;
}
