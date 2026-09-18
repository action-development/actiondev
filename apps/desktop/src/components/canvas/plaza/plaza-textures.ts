import * as THREE from "three";
import { PLAZA_PALETTE } from "./plaza-config";

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

let skyTexture: THREE.CanvasTexture | null = null;
let floorTexture: THREE.CanvasTexture | null = null;

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
 * EXACTAMENTE para que no se vea costura. Es el blanco azulado de `skyBottom`,
 * el "blanco de estudio" de la referencia (un azul más marcado desentonaba
 * frente al blanco del suelo).
 *
 * Coincide en pantalla sin conversión porque en three 0.183 el fog se aplica
 * DESPUÉS del tone mapping y el `fogColor` se sube ya en el espacio de salida;
 * el cielo y el suelo usan `toneMapped={false}`, así que los tres llegan al
 * framebuffer con el mismo hex.
 */
export const PLAZA_HORIZON = PLAZA_PALETTE.skyBottom;

/**
 * Paradas del cielo por ELEVACIÓN (grados sobre el horizonte), no por UV.
 *
 * La cámara de la plaza mira ligeramente hacia abajo con FOV 38: en el plano
 * general solo se ven ~8° de cielo, y al enfocar un muñeco ~18°. Un degradado
 * repartido por toda la esfera (0-90°) dejaba en pantalla una franja casi
 * plana de `skyMid` que cortaba contra el suelo. Aquí el degradado vive en los
 * primeros grados: horizonte blanco → blanco luminoso → azul pastel arriba.
 */
const SKY_STOPS: ReadonlyArray<readonly [elevationDeg: number, color: string]> = [
  [-90, PLAZA_HORIZON],
  // Por debajo del ecuador todo es horizonte: la esfera está centrada en el
  // origen y la cámara a ~2.35 de altura, así que el ecuador se ve ~1.5° por
  // debajo de la línea de los ojos.
  [0.5, PLAZA_HORIZON],
  [3, "#EEF5FB"],
  [7, "#C9E3F4"],
  [13, "#B8DAF0"],
  [30, "#A6D2EE"],
  [90, PLAZA_PALETTE.skyTop],
];

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
export function getSkyTexture(): THREE.CanvasTexture {
  if (skyTexture) return skyTexture;
  if (typeof document === "undefined") {
    skyTexture = fallbackTexture(PLAZA_PALETTE.skyMid);
    return skyTexture;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = SKY_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    skyTexture = fallbackTexture(PLAZA_PALETTE.skyMid);
    return skyTexture;
  }

  // Fila 0 del canvas = polo norte de la esfera (flipY + UV de SphereGeometry):
  // la elevación e cae en t = (90 - e) / 180.
  const gradient = ctx.createLinearGradient(0, 0, 0, SKY_SIZE);
  for (let i = SKY_STOPS.length - 1; i >= 0; i--) {
    const [elevation, color] = SKY_STOPS[i];
    gradient.addColorStop((90 - elevation) / 180, color);
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  skyTexture = texture;
  return skyTexture;
}

/**
 * Suelo: blanco casi puro con un degradado radial muy leve.
 *
 * Los muñecos viven en r < ~5 de un disco de r = 60, es decir, en el 6-8 %
 * central de la textura: ahí va blanco puro. Desde ahí baja MONÓTONO hasta
 * `PLAZA_HORIZON` y se queda ahí: cualquier tono más oscuro que el horizonte
 * en el plano medio se comprime en perspectiva junto a la línea de fuga y se
 * lee como una banda gris (probado: #EEF1F5 a r≈15-27 marcaba el horizonte).
 */
export function getFloorTexture(): THREE.CanvasTexture {
  if (floorTexture) return floorTexture;
  if (typeof document === "undefined") {
    floorTexture = fallbackTexture(PLAZA_PALETTE.floorNear);
    return floorTexture;
  }

  const canvas = document.createElement("canvas");
  canvas.width = FLOOR_SIZE;
  canvas.height = FLOOR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    floorTexture = fallbackTexture(PLAZA_PALETTE.floorNear);
    return floorTexture;
  }

  const cx = FLOOR_SIZE / 2;
  const cy = FLOOR_SIZE / 2;
  const radius = FLOOR_SIZE / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, PLAZA_PALETTE.floorNear);
  gradient.addColorStop(0.06, PLAZA_PALETTE.floorNear);
  gradient.addColorStop(0.18, "#F9FAFC");
  gradient.addColorStop(0.35, PLAZA_HORIZON);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, FLOOR_SIZE, FLOOR_SIZE);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  floorTexture = texture;
  return floorTexture;
}

/** Libera las texturas cacheadas. Llamar solo si la plaza se desmonta de verdad. */
export function disposePlazaTextures(): void {
  skyTexture?.dispose();
  skyTexture = null;
  floorTexture?.dispose();
  floorTexture = null;
}
