import * as THREE from "three";
import { PLAZA_PALETTE } from "../plaza-config";
import type { PlazaMode } from "../plaza-mode";
import { registerPlazaDisposer } from "../plaza-textures";
import { applySkinShading } from "./face-material";

/**
 * Materiales COMPARTIDOS de los muñecos.
 *
 * Todo el cuerpo (tela, piel, pelo, suela) usa UN `MeshStandardMaterial` con
 * `vertexColors`: el color y la rugosidad de cada zona viajan en la geometría
 * (`color` + `aRough`, ver `doll-geometry.ts`), así que veinte muñecos no
 * compilan ni cambian de programa entre piezas.
 *
 * Nada de emisivo "para compensar la luz": el muñeco se ilumina con la luz de
 * la escena y se despega del fondo con un RIM (fresnel) suave y un contorno
 * propio, que es lo que de verdad hace falta para leer su silueta.
 */

/** Uniformes del rim, compartidos por los materiales parcheados. Se cambian
 * con `setDollRim` al cambiar el modo; todos los muñecos ven lo mismo. */
const rimUniforms = {
  uRimColor: { value: new THREE.Color("#ffffff") },
  uRimStrength: { value: 0.1 },
};

/** Rim por modo: de día un velo claro apenas perceptible; de noche un
 * contraluz frío que recorta la silueta contra el negro del parque. */
const RIM: Record<PlazaMode, { color: string; strength: number }> = {
  dia: { color: "#ffffff", strength: 0.07 },
  noche: { color: "#b8c8ff", strength: 0.2 },
};

export function setDollRim(mode: PlazaMode): void {
  const r = RIM[mode];
  rimUniforms.uRimColor.value.set(r.color);
  rimUniforms.uRimStrength.value = r.strength;
}

/**
 * Parche del material del CUERPO, encima del sombreado de piel de la cara
 * (`applySkinShading`: wrap + tinte cálido en el terminador + rim):
 * - rugosidad POR VÉRTICE (`aRough`);
 * - atributo `aSkin` (0 tela, 1 piel): el sombreado de piel solo actúa donde
 *   vale 1, así manos, orejas y nariz casan con la cara y la ropa no se tiñe;
 * - fresnel aditivo propio, solo en tela.
 *
 * `customProgramCacheKey` fija una sola clave: un programa para todos.
 */
function patchBodyMaterial(mat: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  applySkinShading(mat);
  const skinPatch = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    skinPatch.call(mat, shader, renderer);
    shader.uniforms.uRimColor = rimUniforms.uRimColor;
    shader.uniforms.uRimStrength = rimUniforms.uRimStrength;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aRough;\nattribute float aSkin;\nvarying float vRough;\nvarying float vSkin;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRough = aRough;\nvSkin = aSkin;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vRough;\nvarying float vSkin;\nuniform vec3 uRimColor;\nuniform float uRimStrength;",
      )
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = clamp(vRough, 0.04, 1.0);")
      .replace("skBand * uSkinA.y", "skBand * uSkinA.y * vSkin")
      .replace("skFres * uSkinA.z", "skFres * uSkinA.z * vSkin")
      .replace(
        "#include <opaque_fragment>",
        `{
  float rimF = pow(1.0 - saturate(dot(normalize(normal), normalize(vViewPosition))), 2.6);
  outgoingLight += uRimColor * rimF * uRimStrength * (0.35 + diffuseColor.rgb) * (1.0 - vSkin);
}
#include <opaque_fragment>`,
      );
  };
  mat.customProgramCacheKey = () => "plaza-doll-body-v2";
  return mat;
}

let bodyMat: THREE.MeshStandardMaterial | null = null;

/** Material del cuerpo (compartido por todos los muñecos). */
export function getBodyMaterial(): THREE.MeshStandardMaterial {
  if (!bodyMat) registerPlazaDisposer(disposeDollMaterials);
  bodyMat ??= patchBodyMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0 }));
  return bodyMat;
}

// ---------------------------------------------------------------------------
// Contorno
// ---------------------------------------------------------------------------

/** Resolución del buffer de dibujo en px. La actualiza cada muñeco por frame
 * (barato) para que el ancho del contorno sea constante en PÍXELES. */
export const outlineRes = { value: new THREE.Vector2(1600, 900) };

const OUTLINE_VERT = /* glsl */ `
uniform vec2 uRes;
uniform float uWidth;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 n = normalize(normalMatrix * normal);
  vec4 clip = projectionMatrix * mv;
  // Extrusión por la normal EN VISTA y en espacio de pantalla: el grosor es
  // el mismo en px de cerca que de lejos y en cualquier parte del muñeco.
  // (Las cáscaras escaladas de antes crecían desde el origen de cada malla:
  // gruesas en un sitio, con huecos en otro.)
  vec2 dir = n.xy;
  float l = length(dir);
  dir = l > 1e-4 ? dir / l : vec2(0.0);
  clip.xy += dir * (uWidth * 2.0 / uRes) * clip.w;
  gl_Position = clip;
}`;

const OUTLINE_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
void main() {
  gl_FragColor = vec4(uColor, uAlpha);
  #include <colorspace_fragment>
}`;

function makeOutline(width: number, alpha: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uRes: outlineRes,
      uWidth: { value: width },
      uColor: { value: new THREE.Color(PLAZA_PALETTE.accent) },
      uAlpha: { value: alpha },
    },
    vertexShader: OUTLINE_VERT,
    fragmentShader: OUTLINE_FRAG,
    side: THREE.BackSide,
    transparent: alpha < 1,
    depthWrite: alpha >= 1,
    toneMapped: false,
  });
}

let outlineStrong: THREE.ShaderMaterial | null = null;
let outlineSoft: THREE.ShaderMaterial | null = null;

/** Contorno de selección / agarre: lima sólido, ~3 px. */
export function getOutlineStrong(): THREE.ShaderMaterial {
  outlineStrong ??= makeOutline(3, 1);
  return outlineStrong;
}

/** Contorno de hover: el mismo lima pero fino y translúcido ("rim suave"). */
export function getOutlineSoft(): THREE.ShaderMaterial {
  outlineSoft ??= makeOutline(1.6, 0.6);
  return outlineSoft;
}

/** Anillo de selección en el suelo (compartido). */
let ringMat: THREE.MeshBasicMaterial | null = null;
let ringGeo: THREE.RingGeometry | null = null;

export function getSelectionRing(): { geometry: THREE.RingGeometry; material: THREE.MeshBasicMaterial } {
  ringGeo ??= new THREE.RingGeometry(0.49, 0.52, 64);
  ringMat ??= new THREE.MeshBasicMaterial({
    color: PLAZA_PALETTE.accent,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    toneMapped: false,
    // Pegado al suelo sin z-fighting con pavimento ni sombra de contacto.
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  return { geometry: ringGeo, material: ringMat };
}

function disposeDollMaterials(): void {
  ringMat?.dispose();
  ringGeo?.dispose();
  ringMat = null;
  ringGeo = null;
  bodyMat?.dispose();
  outlineStrong?.dispose();
  outlineSoft?.dispose();
  bodyMat = outlineStrong = outlineSoft = null;
}
