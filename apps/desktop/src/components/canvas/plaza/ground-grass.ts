import * as THREE from "three";
import { PLAZA_PALETTES, type PlazaMode } from "./plaza-mode";
import { GROUND_PALETTES } from "./ground-palette";

/**
 * Material del césped: `MeshStandardMaterial` blanco × teja procedural, con
 * dos añadidos en el shader (sin postprocesado, sin texturas nuevas):
 *
 * 1. SEGUNDA ESCALA de manchas. La teja se repite cada `GRASS_TILE_WORLD`; una
 *    sola escala delata el patrón a media distancia. Se vuelve a muestrear la
 *    MISMA textura a una escala no múltiplo (×0,29) y desfasada, y solo se
 *    aplica su MODULACIÓN (el color de la muestra dividido por el verde base),
 *    así que no cambia el tono medio: el periodo conjunto ya no es visible.
 * 2. Brillo rasante: hacia el horizonte (1 − N·V)³ el césped se aclara hacia
 *    un verde desaturado, como el de una pradera vista casi de canto. Sin él
 *    la pradera lejana era una masa plana que solo se apagaba con la niebla.
 */
export function createGrassMaterial(mode: PlazaMode, map: THREE.Texture): THREE.MeshStandardMaterial {
  const palette = PLAZA_PALETTES[mode];
  const ground = GROUND_PALETTES[mode].grass;
  const material = new THREE.MeshStandardMaterial({
    // Casi blanco × mapa: el verde lo pone la teja (que ya lleva el tono del
    // modo); `tint` solo corrige la deriva fría de la luz de noche.
    color: ground.tint,
    map,
    roughness: 1,
    metalness: 0,
    dithering: true,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uGrassBase = { value: new THREE.Color(palette.grass) };
    shader.uniforms.uSecond = { value: ground.second };
    shader.uniforms.uSheenCol = { value: new THREE.Color(ground.sheenColor) };
    shader.uniforms.uSheenK = { value: ground.sheen };

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform vec3 uGrassBase;
uniform float uSecond;
uniform vec3 uSheenCol;
uniform float uSheenK;`,
      )
      .replace(
        "#include <map_fragment>",
        `#ifdef USE_MAP
  vec4 grassA = texture2D( map, vMapUv );
  vec4 grassB = texture2D( map, vMapUv * 0.29 + vec2( 0.37, 0.11 ) );
  vec3 grassMod = clamp( grassB.rgb / max( uGrassBase, vec3( 0.002 ) ), 0.55, 1.6 );
  diffuseColor.rgb *= grassA.rgb * mix( vec3( 1.0 ), grassMod, uSecond );
#endif`,
      )
      .replace(
        "#include <opaque_fragment>",
        `{
  float grazing = pow( 1.0 - saturate( dot( normalize( normal ), normalize( vViewPosition ) ) ), 3.0 );
  outgoingLight = mix( outgoingLight, outgoingLight * 0.55 + uSheenCol, grazing * uSheenK );
}
#include <opaque_fragment>`,
      );
  };
  material.customProgramCacheKey = () => `plaza-grass-${mode}`;
  return material;
}
