import * as THREE from "three";

/**
 * Rampa de sombreado de cómic compartida por todos los `MeshToonMaterial`.
 *
 * 3 bandas (sombra, medio, luz) con filtro NEAREST: es lo que da el corte seco
 * de color en lugar del degradado suave del PBR. Con LINEAR la rampa se
 * interpola y el efecto cómic desaparece.
 *
 * Singleton de módulo: una sola textura de 3 px para toda la escena.
 */
let gradient: THREE.DataTexture | null = null;

export function getToonGradient(): THREE.DataTexture {
  if (gradient) return gradient;
  const data = new Uint8Array([70, 160, 255]);
  gradient = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

/** Grosor del contorno (unidades de mundo) — primer plano de juego. */
export const OUTLINE = 0.06;
/** Contorno de decorado cercano (grúa, barco). */
export const OUTLINE_THIN = 0.04;
