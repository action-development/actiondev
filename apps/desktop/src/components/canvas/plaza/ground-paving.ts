import * as THREE from "three";
import { PLAZA_PALETTE } from "./plaza-config";
import { PLAZA_PALETTES, type PlazaMode } from "./plaza-mode";
import { keyLightDirection } from "./lighting-rig";
import { GROUND_PALETTES } from "./ground-palette";

/**
 * Pavimento ANALÍTICO de la plaza.
 *
 * Antes era un lienzo de 1024 px para 20 m (51 px/m): a ~6 m de la cámara la
 * textura se ampliaba ×4-6 y los arcos de las juntas salían en escalera. Un
 * lienzo más grande solo retrasa el problema. Aquí el despiece se evalúa en el
 * fragment shader a partir del `xz` de MUNDO, con distancias exactas a la junta
 * (en unidades de mundo) y antialias por `fwidth`: el borde es limpio a
 * cualquier distancia y no cuesta ni un byte de VRAM.
 *
 * Sigue siendo un `MeshBasicMaterial` con `toneMapped={false}` (el color tiene
 * que llegar al píxel sin pasar por la luz para casar con el horizonte): el
 * relieve y la oclusión son falsos, un término multiplicativo que vale
 * EXACTAMENTE 1 sobre la losa plana.
 *
 * Polar y no tileable: anillos + sectores con medio sector de desfase entre
 * anillos consecutivos. El grano es un hash en mundo, nunca una teja visible.
 */

/** Radio del disco de pavimento: acaba POR DEBAJO del bordillo (8.2-8.6), que
 * lo tapa, así que el borde del disco nunca se ve y no hace falta alpha. */
export const PAVING_RADIUS = 8.3;

/** Radios de los anillos de losas fuera del medallón (el medallón acaba en
 * 2.0). El último par (8.2-8.6) es el bordillo, que es geometría 3D. */
export const PAVING_RINGS = [2, 2.7, 3.4, 4.2, 5, 6, 7, 8.2, 8.6] as const;

/** Radio del medallón visible: la fuente (≤ 1.30) tapa lo de dentro, así que el
 * dibujo vive en 1.30-2.0 (rosa de los vientos + cenefa). */
export const MEDALLION = { inner: 1.3, cenefa: 1.78, outer: 2 } as const;

/** Dirección HORIZONTAL (xz, normalizada) hacia la luz principal, leída del
 * rig de luz (`keyLightDirection`): el bisel de las losas y las caras del
 * bordillo se orientan con ella, así que si la luz se mueve el pavimento la
 * sigue. De noche es la luna: el bisel baja con `GroundPalette.bevel`. */
export function sunDirectionXZ(mode: PlazaMode): THREE.Vector2 {
  const dir = keyLightDirection(mode);
  const v = new THREE.Vector2(dir.x, dir.z);
  return v.lengthSq() > 1e-6 ? v.normalize() : new THREE.Vector2(0, 1);
}

/** Dirección 3D hacia la luz principal (unitaria), del mismo rig. */
export function sunDirection3(mode: PlazaMode): THREE.Vector3 {
  return keyLightDirection(mode).normalize();
}

const RINGS_GLSL = `float[${PAVING_RINGS.length}](${PAVING_RINGS.map((r) => r.toFixed(2)).join(", ")})`;

const FRAG_HEADER = /* glsl */ `
varying vec2 vPavXZ;
uniform vec3 uBase;
uniform vec3 uJoint;
uniform vec3 uDirt;
uniform vec3 uAccent;
uniform vec2 uSun;
uniform vec4 uTone;   // x bisel, y variación, z grano, w viñeteado
uniform vec4 uMed;    // x campo, y punta clara, z punta oscura, w opacidad del aro
uniform vec2 uCen;    // dovelas de la cenefa
uniform float uAO;

const float PV_PI = 3.14159265;
const float PV_TAU = 6.2831853;
const float RINGS[${PAVING_RINGS.length}] = ${RINGS_GLSL};

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x),
             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x), f.y);
}
`;

const FRAG_BODY = /* glsl */ `
{
  vec2 P = vPavXZ;
  float r = length(P);
  float ang = atan(P.y, P.x);
  float d = 1.0;          // distancia (mundo) a la junta más cercana
  vec2 en = vec2(0.0);    // normal horizontal del chaflán de esa junta
  float shade = 1.0;      // tono perceptual de la pieza
  float h1 = 0.0; float h2 = 0.0; float h3 = 0.0;
  float jw = 0.012;       // semiancho de junta
  float bw = 0.032;       // ancho del chaflán
  bool slab = false;

  if (r < ${MEDALLION.outer.toFixed(2)}) {
    if (r >= ${MEDALLION.cenefa.toFixed(2)}) {
      // Cenefa: dovelas de granito oscuro alternas.
      float u = ang * 24.0 / PV_TAU;
      float ta = abs(fract(u + 0.5) - 0.5) * PV_TAU * r / 24.0;
      float dIn = r - ${MEDALLION.cenefa.toFixed(2)};
      float dOut = ${MEDALLION.outer.toFixed(2)} - r;
      float dr = min(dIn, dOut);
      d = min(dr, ta);
      float id = mod(floor(u), 24.0);
      shade = mod(id, 2.0) < 0.5 ? uCen.x : uCen.y;
      h1 = hash12(vec2(id, 3.7)); h2 = hash12(vec2(id, 9.1)); h3 = 1.0;
      if (dr < ta) en = (dIn < dOut ? -1.0 : 1.0) * (P / max(r, 1e-4));
      else en = (fract(u) < 0.5 ? -1.0 : 1.0) * vec2(-P.y, P.x) / max(r, 1e-4);
    } else {
      // Rosa de los vientos: 8 puntas (cardinales largas, intercardinales
      // cortas), cada una partida en una mitad clara y una oscura.
      float k = floor(ang / (PV_PI * 0.25) + 0.5);
      float phi = ang - k * PV_PI * 0.25;
      vec2 q = r * vec2(cos(phi), abs(sin(phi)));
      float tipR = mod(k, 2.0) < 0.5 ? 1.72 : 1.5;
      vec2 T = vec2(tipR, 0.0);
      vec2 V = ${MEDALLION.inner.toFixed(2)} * vec2(cos(PV_PI * 0.125), sin(PV_PI * 0.125));
      vec2 e = V - T;
      vec2 nr = normalize(vec2(e.y, -e.x));
      float dStar = dot(q - T, nr);
      bool inside = dStar < 0.0;
      // Las juntas de la taracea son más finas que las del pavimento.
      d = min(abs(dStar) + 0.0045, ${MEDALLION.cenefa.toFixed(2)} - r);
      if (inside) d = min(d, q.y + 0.0045);
      shade = inside ? (sin(phi) >= 0.0 ? uMed.y : uMed.z) : uMed.x;
      h1 = hash12(vec2(k, inside ? 11.0 : 5.0)); h2 = hash12(vec2(k, 23.0)); h3 = 1.0;
    }
  } else {
    slab = true;
    float r0 = ${PAVING_RINGS[0].toFixed(2)};
    float r1 = ${PAVING_RINGS[1].toFixed(2)};
    float idx = 0.0;
    for (int i = 0; i < ${PAVING_RINGS.length - 1}; i++) {
      float lo = RINGS[i];
      if (r >= lo) { r0 = lo; r1 = RINGS[i + 1]; idx = float(i); }
    }
    float n = r1 <= 2.71 ? 16.0 : (r1 <= 5.01 ? 32.0 : 48.0);
    float u = ang * n / PV_TAU + 0.5 * mod(idx, 2.0);
    float ta = abs(fract(u + 0.5) - 0.5) * PV_TAU * r / n;
    float dIn = r - r0;
    float dOut = r1 - r;
    float dr = min(dIn, dOut);
    d = min(dr, ta);
    float id = mod(floor(u), n);
    vec2 hid = vec2(id + idx * 61.0, idx * 7.3 + 1.7);
    h1 = hash12(hid); h2 = hash12(hid + 17.3); h3 = hash12(hid + 41.9);
    if (dr < ta) en = (dIn < dOut ? -1.0 : 1.0) * (P / max(r, 1e-4));
    else en = (fract(u) < 0.5 ? -1.0 : 1.0) * vec2(-P.y, P.x) / max(r, 1e-4);
  }

  // Tamaño de píxel en unidades de mundo sobre el suelo: gobierna el
  // antialias de la junta y apaga el detalle que ya no se resuelve.
  float w = max(fwidth(d), 1e-5);

  // --- Tono de la pieza: luminancia ±variance y un leve tinte cálido/frío.
  float lum = (h1 - 0.5) * 2.0 * uTone.y;
  vec3 tint = mix(vec3(0.965, 0.99, 1.035), vec3(1.035, 1.0, 0.955), h2);
  // ~5 % de losas "repuestas": más nuevas, más claras y más cálidas.
  if (slab && h3 < 0.05) { lum += 0.07; tint *= vec3(1.05, 1.01, 0.93); }
  // Desgaste de baja frecuencia (mancha de uso y de suciedad).
  float n1 = vnoise(P * 0.9) * 0.6 + vnoise(P * 2.7 + 7.0) * 0.4;
  lum += (n1 - 0.5) * 0.08;
  // Anillo más pisado (2,5-5,4): el paso pule la piedra y la aclara.
  lum += smoothstep(2.5, 3.4, r) * (1.0 - smoothstep(5.0, 5.8, r)) * 0.025;
  // Grano de granito: hash en mundo a dos escalas, apagado cuando el píxel
  // ya es mayor que el grano (si no, sería ruido de alta frecuencia).
  float g = 0.0;
  g += (vnoise(P / 0.02) - 0.5) * 2.0 * (1.0 - smoothstep(0.25, 0.9, w / 0.02));
  g += (vnoise(P / 0.075 + 31.0) - 0.5) * 1.6 * (1.0 - smoothstep(0.25, 0.9, w / 0.075));
  lum += g * uTone.z;

  vec3 col = uBase * tint * pow(max(shade * (1.0 + lum), 0.02), 2.2);

  // Suciedad junto al bordillo y viñeteado hacia el borde.
  float dirt = smoothstep(6.6, 8.2, r) * (0.55 + 0.45 * n1);
  col = mix(col, col * uDirt, 0.5 * dirt);
  col *= mix(1.0, uTone.w, smoothstep(5.0, 8.2, r));

  // Chaflán de la losa: el filo que mira al sol se aclara y el contrario se
  // oscurece. Vale exactamente 1 lejos de la junta; se desvanece solo cuando
  // el chaflán mide menos que un píxel.
  float bev = (1.0 - smoothstep(jw, jw + bw, d)) * smoothstep(0.35, 1.0, bw / w);
  col *= 1.0 + dot(en, uSun) * uTone.x * bev;
  // Oclusión de la junta: la losa se oscurece al acercarse al surco.
  float ao = (1.0 - smoothstep(jw, jw + 0.07, d)) * smoothstep(0.3, 1.0, 0.07 / w);
  col *= 1.0 - uAO * ao;

  // Junta: cobertura exacta del píxel (conserva la energía cuando la junta
  // es más fina que el píxel en vez de desaparecer o parpadear).
  float cov = clamp((jw - d) / w + 0.5, 0.0, 1.0) * min(1.0, 2.0 * jw / w);
  vec3 jc = uJoint * (0.85 + 0.3 * hash12(floor(P / 0.03)));
  col = mix(col, jc, cov);

  // Aro de acento en la junta del medallón: el único guiño de color.
  float wr = max(fwidth(r), 1e-5);
  float acov = clamp((0.009 - abs(r - ${MEDALLION.outer.toFixed(2)})) / wr + 0.5, 0.0, 1.0) * min(1.0, 0.018 / wr);
  col = mix(col, uAccent, acov * uMed.w);

  diffuseColor.rgb = col;
}
`;

function srgb(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

/**
 * Material del pavimento. Uno por modo (los uniforms dependen de la paleta).
 * `toneMapped: false` y `fog` por defecto: llega al píxel sin pasar por la luz
 * pero sí se funde con la niebla hacia el horizonte.
 */
export function createPavingMaterial(mode: PlazaMode): THREE.MeshBasicMaterial {
  const palette = PLAZA_PALETTES[mode];
  const ground = GROUND_PALETTES[mode];
  const material = new THREE.MeshBasicMaterial({ toneMapped: false, dithering: true });
  const sun = sunDirectionXZ(mode);

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBase = { value: srgb(palette.paving) };
    shader.uniforms.uJoint = { value: srgb(ground.joint) };
    shader.uniforms.uDirt = { value: new THREE.Vector3(...ground.dirt) };
    shader.uniforms.uAccent = { value: srgb(PLAZA_PALETTE.accent) };
    shader.uniforms.uSun = { value: sun };
    shader.uniforms.uTone = {
      value: new THREE.Vector4(ground.bevel, ground.variance, ground.grain, ground.edgeDim),
    };
    const m = ground.medallion;
    shader.uniforms.uMed = { value: new THREE.Vector4(m.field, m.roseLight, m.roseDark, ground.accentAlpha) };
    shader.uniforms.uCen = { value: new THREE.Vector2(m.cenefaA, m.cenefaB) };
    shader.uniforms.uAO = { value: ground.jointAO };

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vPavXZ;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\n  vPavXZ = (modelMatrix * vec4(position, 1.0)).xz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAG_HEADER}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${FRAG_BODY}`);
  };
  // Dos modos = dos programas distintos aunque el código sea el mismo: la
  // clave evita que three reutilice el del otro modo con sus uniforms.
  material.customProgramCacheKey = () => `plaza-paving-${mode}`;
  return material;
}
