import * as THREE from "three";
import { registerPlazaDisposer } from "../plaza-textures";

/**
 * Textura de la sombra falsa de una copa: manchas lobuladas con borde suave y
 * núcleo OPACO (el alfa lo escala la opacidad del material).
 *
 * La `getGlowTexture` de la sombra de contacto es un degradado radial que cae
 * desde el centro: pintada a la intensidad de una sombra de sol, sale una
 * mancha difusa que no se lee como sombra de copa. Aquí el borde es corto y
 * la silueta irregular, que es lo que se ve en la sombra proyectada de verdad.
 */
let texture: THREE.CanvasTexture | null = null;

export function getCanopyShadowTexture(): THREE.CanvasTexture {
  if (texture) return texture;
  if (typeof document === "undefined") throw new Error("getCanopyShadowTexture: solo en cliente");
  const tex = new THREE.CanvasTexture(document.createElement("canvas"));
  {
    const SIZE = 128;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Lóbulos fijos (centro y radio en fracción del lado): una copa de cinco
      // masas vista desde arriba.
      const lobes: ReadonlyArray<readonly [number, number, number]> = [
        [0.5, 0.5, 0.3],
        [0.3, 0.45, 0.2],
        [0.7, 0.47, 0.21],
        [0.46, 0.27, 0.19],
        [0.55, 0.72, 0.2],
        [0.33, 0.68, 0.16],
      ];
      for (const [x, y, r] of lobes) {
        const g = ctx.createRadialGradient(x * SIZE, y * SIZE, 0, x * SIZE, y * SIZE, r * SIZE);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.72, "rgba(255,255,255,1)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, SIZE, SIZE);
      }
      tex.image = canvas;
      tex.needsUpdate = true;
    }
  }
  tex.colorSpace = THREE.SRGBColorSpace;
  texture = tex;
  registerPlazaDisposer(() => {
    tex.dispose();
    texture = null;
  });
  return tex;
}
