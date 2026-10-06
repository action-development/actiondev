import * as THREE from "three";

/**
 * Viento de la vegetación: 0 draw calls extra.
 *
 * Los atributos `aSway` (0 en el suelo → 1 en la punta) y `aPhase` (por
 * planta) los pinta la propia geometría; aquí solo se inyecta en el vertex
 * shader del material estándar el desplazamiento
 * `xz += uWind · aSway · gust(uTime, aPhase, pos)`.
 *
 * LA SOMBRA TIENE QUE SEGUIR A LA COPA. El shadow map se dibuja con un
 * `MeshDepthMaterial` aparte, ajeno a este parche: sin su propia copia del
 * mismo código, la copa se mueve y su sombra se queda quieta. Por eso
 * `createWind` devuelve ambos materiales con el MISMO shader y el MISMO
 * uniforme de tiempo (el que avanza `onBeforeRender`, sin `useFrame` ni
 * estado de React).
 *
 * Congelado (`?quieto` / movimiento reducido): `createWind` no parchea nada y
 * devuelve materiales normales; no hay uniforme, ni coste, ni movimiento.
 */

const HEAD = /* glsl */ `
attribute float aSway;
attribute float aPhase;
uniform float uTime;
uniform float uWind;
`;

/** Ráfaga: dos senos con frecuencias no múltiplos y fase espacial, para que la
 * copa no se mueva al unísono con la de al lado. */
const BODY = /* glsl */ `
float vegGust = sin(uTime * 0.9 + aPhase + transformed.x * 0.35) * 0.65
              + sin(uTime * 2.3 + aPhase * 1.7 + transformed.z * 0.5) * 0.35;
transformed.x += uWind * aSway * vegGust;
transformed.z += uWind * aSway * vegGust * 0.55;
transformed.y -= uWind * aSway * abs(vegGust) * 0.12;
`;

/** Amplitud del viento en unidades de mundo, en la punta de la copa. */
const WIND_AMPLITUDE = 0.05;

function patch(material: THREE.Material, uniforms: { uTime: { value: number }; uWind: { value: number } }) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uWind = uniforms.uWind;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${HEAD}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${BODY}`);
  };
  // Mismo parche = mismo programa: la clave evita que three reutilice el
  // programa de un MeshStandardMaterial sin viento.
  material.customProgramCacheKey = () => "plaza-veg-wind";
  const tick = () => {
    uniforms.uTime.value = performance.now() / 1000;
  };
  material.onBeforeRender = tick;
}

export interface Wind {
  /** Material del follaje (con color por vértice). */
  foliage: THREE.MeshStandardMaterial;
  /** Material de profundidad para el shadow map, o `undefined` si no hay
   * viento (el de por defecto de three vale). */
  depth: THREE.MeshDepthMaterial | undefined;
}

export function createWind(frozen: boolean): Wind {
  const foliage = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
  if (frozen) return { foliage, depth: undefined };
  const uniforms = { uTime: { value: 0 }, uWind: { value: WIND_AMPLITUDE } };
  const depth = new THREE.MeshDepthMaterial();
  patch(foliage, uniforms);
  patch(depth, uniforms);
  return { foliage, depth };
}
