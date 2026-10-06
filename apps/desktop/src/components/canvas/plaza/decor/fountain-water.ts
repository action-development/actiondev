import * as THREE from "three";
import { merge } from "./decor-kit";
import {
  BASIN,
  FALLS,
  LOWER_BOWL,
  UPPER_BOWL,
  impactRadius,
  type FountainLook,
} from "./fountain-config";

/**
 * Agua OPACA con shader, en vez de un disco translúcido.
 *
 * Es un `MeshStandardMaterial` con `onBeforeCompile`: así conserva lo que ya
 * resuelve three (sombra del sol sobre el agua, destellos del sol, niebla,
 * tone mapping) y solo se sustituye lo que aquí importa. Al ser opaca no hay
 * problemas de orden con muñecos ni con la piedra, y recorta el z-buffer de los
 * chorros y las gotas que caen: lo que queda bajo la lámina simplemente no se
 * dibuja.
 *
 * - PROFUNDIDAD FINGIDA: el rayo de la cámara se refracta en la lámina y se
 *   interseca con el fondo (plano), el murete (cilindro exterior) y el
 *   pedestal (cilindro interior). Parallax real sin geometría debajo.
 * - Color por camino recorrido (ley de Beer): cerca del murete se ve la piedra
 *   mojada, en el centro el agua se vuelve profunda.
 * - Ondas concéntricas desde la corona de impacto de cada cortina + 2 octavas
 *   de ruido, y espuma en el murete y en esa corona.
 * - Cáusticas procedurales sobre el fondo fingido.
 * - Reflejo Schlick (F0 = 0.02) del degradado del cielo de la paleta + la
 *   banda oscura del arbolado + destellos del sol y de las farolas. Va DESPUÉS
 *   del tone mapping: el cielo del sitio se pinta `toneMapped: false`, y así
 *   el agua reproduce el mismo color que se ve en el fondo.
 */

/** Hasta cuántas farolas reflejan (las de `buildDecor()`; sobran dos). */
export const MAX_LAMPS = 8;

/** Un disco de agua: anillo plano con sus datos de profundidad en el vértice. */
function disc(rIn: number, rOut: number, y: number, depth: number, rRefractIn: number, impact: number): THREE.BufferGeometry {
  const g = new THREE.RingGeometry(rIn, rOut, 96, 1);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  const count = g.getAttribute("position").count;
  const data = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    data[i * 4] = rOut;
    data[i * 4 + 1] = depth;
    data[i * 4 + 2] = rRefractIn;
    data[i * 4 + 3] = impact;
  }
  g.setAttribute("aDisc", new THREE.BufferAttribute(data, 4));
  g.deleteAttribute("uv");
  return g;
}

/** Las tres láminas: pilón, taza baja y taza alta. */
export function buildFountainWaterGeometry(): THREE.BufferGeometry {
  return merge(
    [
      disc(0.2, BASIN.waterR, BASIN.waterY, (BASIN.waterY - BASIN.floorY) * 1.05, BASIN.pedestalR, impactRadius(FALLS.lower)),
      disc(0.1, LOWER_BOWL.waterR, LOWER_BOWL.water, (LOWER_BOWL.water - LOWER_BOWL.floor) * 0.85, 0.2, impactRadius(FALLS.upper)),
      disc(0.05, UPPER_BOWL.waterR, UPPER_BOWL.water, (UPPER_BOWL.water - UPPER_BOWL.floor) * 0.85, 0.07, 0),
    ],
    "fountainWater",
  );
}

const col = (hex: string) => new THREE.Color(hex);

const PARS = /* glsl */ `
  uniform float uTime;
  uniform float uNight;
  uniform float uAbsorb;
  uniform float uSunOn;
  uniform float uLampOn;
  uniform vec3 uDeep;
  uniform vec3 uBed;
  uniform vec3 uWall;
  uniform vec3 uFoam;
  uniform vec3 uGlow;
  uniform vec3 uSkyH;
  uniform vec3 uSkyM;
  uniform vec3 uSkyT;
  uniform vec3 uTree;
  uniform vec3 uSunDir;
  uniform vec3 uLampCol;
  uniform vec3 uLamps[${MAX_LAMPS}];
  uniform vec2 uFocos[6];
  varying vec3 vWPos;
  varying vec4 vDisc;

  float wHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float wNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(wHash(i), wHash(i + vec2(1.0, 0.0)), f.x), mix(wHash(i + vec2(0.0, 1.0)), wHash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  vec2 wNoiseGrad(vec2 p) {
    const float e = 0.07;
    return vec2(wNoise(p + vec2(e, 0.0)) - wNoise(p - vec2(e, 0.0)), wNoise(p + vec2(0.0, e)) - wNoise(p - vec2(0.0, e))) / (2.0 * e);
  }

  // Pendiente de la superficie (d altura / d xz): ondas concéntricas desde la
  // corona de impacto, rebote en el murete y dos octavas de ruido a la deriva.
  vec2 wRipple(vec2 p, float rho, float R, float ri) {
    vec2 dir = p / max(rho, 1e-3);
    float slope = 0.0;
    if (ri > 0.0) {
      float x = rho - ri;
      slope += exp(-abs(x) * 2.6) * cos(x * 34.0 - uTime * 4.2) * 0.075;
      slope += exp(-abs(x) * 4.0) * cos(x * 58.0 - uTime * 6.1 + 1.3) * 0.03;
    }
    float xw = rho - R;
    slope += exp(-abs(xw) * 5.0) * cos(xw * 30.0 + uTime * 3.0) * 0.03;
    vec2 g = dir * slope;
    g += wNoiseGrad(p * 3.3 + vec2(uTime * 0.09, uTime * 0.06)) * 0.035;
    g += wNoiseGrad(p * 8.1 - vec2(uTime * 0.12, -uTime * 0.1)) * 0.016;
    return g;
  }

  // Cáusticas teselables (variante del clásico de Shadertoy), 4 iteraciones.
  float wCaustic(vec2 uv, float t) {
    vec2 p = mod(uv * 6.2831853, 6.2831853) - 250.0;
    vec2 i = p;
    float c = 1.0;
    const float inten = 0.005;
    for (int n = 0; n < 4; n++) {
      float tt = t * (1.0 - (3.5 / float(n + 1)));
      i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
      c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
    }
    c /= 4.0;
    c = 1.17 - pow(c, 1.4);
    return pow(abs(c), 8.0);
  }
`;

const BODY = /* glsl */ `
  #include <color_fragment>
  vec3 wP = vWPos;
  float wR = vDisc.x;
  float wDepth = vDisc.y;
  float wRin = vDisc.z;
  float wRi = vDisc.w;
  float wRho = length(wP.xz);
  vec3 wV = normalize(wP - cameraPosition);
  vec2 wG = wRipple(wP.xz, wRho, wR, wRi);
  vec3 wN = normalize(vec3(-wG.x, 1.0, -wG.y));

  // Rayo refractado (aire → agua) contra fondo, murete y pedestal.
  vec3 wRf = refract(wV, wN, 0.7519);
  wRf.y = min(wRf.y, -0.05);
  float wTBed = wDepth / -wRf.y;
  vec2 wO = wP.xz;
  vec2 wD = wRf.xz;
  float wA = max(dot(wD, wD), 1e-5);
  float wB = dot(wO, wD);
  float wC = dot(wO, wO) - (wR + 0.01) * (wR + 0.01);
  float wTWall = (-wB + sqrt(max(wB * wB - wA * wC, 0.0))) / wA;
  float wC2 = dot(wO, wO) - wRin * wRin;
  float wDisc2 = wB * wB - wA * wC2;
  float wTIn = (wDisc2 > 0.0 && wB < 0.0 && wC2 > 0.0) ? (-wB - sqrt(wDisc2)) / wA : 1e5;
  float wTSide = min(wTWall, wTIn);
  float wT = min(wTBed, wTSide);
  vec3 wH = wP + wRf * wT;
  float wIsBed = step(wTBed, wTSide);

  float wCaus = wCaustic(wH.xz * 0.9, uTime * 0.8);
  vec3 wBedCol = uBed * (0.8 + 1.0 * wCaus);
  float wWallV = clamp((wP.y - wH.y) / max(wDepth, 0.01), 0.0, 1.0);
  vec3 wWallCol = uWall * (1.0 - 0.55 * wWallV);
  vec3 wHit = mix(wWallCol, wBedCol, wIsBed);
  float wTrans = exp(-wT * uAbsorb);
  vec3 wBody = mix(uDeep, wHit, wTrans);

  // Espuma: contra el murete y en la corona donde cae la cortina.
  float wFn = wNoise(wP.xz * 14.0 + uTime * 0.35);
  float wFoamWall = smoothstep(wR - 0.085, wR - 0.008, wRho) * (0.45 + 0.55 * wFn);
  float wFoamImp = 0.0;
  if (wRi > 0.0) {
    float dx = (wRho - wRi) / 0.075;
    wFoamImp = exp(-dx * dx) * (0.35 + 0.65 * wNoise(vec2(atan(wP.x, wP.z) * 9.0, wRho * 20.0 - uTime * 1.5)));
  }
  float wFoam = clamp(wFoamWall * 0.7 + wFoamImp, 0.0, 1.0);
  wBody = mix(wBody, uFoam, wFoam * 0.85);
  diffuseColor.rgb = wBody;

  // Focos subacuáticos (solo de noche, y solo en el pilón).
  float wGlow = 0.0;
  for (int k = 0; k < 6; k++) {
    vec2 dd = wH.xz - uFocos[k];
    wGlow += 1.0 / (1.0 + dot(dd, dd) * 38.0);
  }
  float wPool = step(1.0, wR);
  vec3 wEmit = uNight * uGlow * (wGlow * 0.55 * wTrans * wIsBed * wPool + (1.0 - wTrans) * 0.2 + wFoam * 0.22);
`;

/** Material del agua: se construye con el `look` del modo y la lista de farolas. */
export function createFountainWaterMaterial(
  look: FountainLook,
  sun: THREE.Vector3,
  lamps: THREE.Vector3[],
  lampsOn: boolean,
  time: { value: number },
): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.1, metalness: 0 });
  const lampList = Array.from({ length: MAX_LAMPS }, (_, i) => lamps[i]?.clone() ?? new THREE.Vector3(0, -100, 0));
  // Seis focos repartidos por el fondo del pilón.
  const focos = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    return new THREE.Vector2(Math.sin(a) * 0.82, Math.cos(a) * 0.82);
  });
  const uniforms = {
    uTime: time,
    uNight: { value: look.night },
    uAbsorb: { value: look.night ? 3.2 : 2.6 },
    uSunOn: { value: look.night ? 0.45 : 1 },
    uLampOn: { value: lampsOn ? 1 : 0 },
    uDeep: { value: col(look.waterDeep) },
    uBed: { value: col(look.waterBed) },
    uWall: { value: col(look.waterWall) },
    uFoam: { value: col(look.foam) },
    uGlow: { value: col(look.glow) },
    uSkyH: { value: col(look.skyH) },
    uSkyM: { value: col(look.skyM) },
    uSkyT: { value: col(look.skyT) },
    uTree: { value: col(look.tree) },
    uSunDir: { value: sun.clone().normalize() },
    uLampCol: { value: col("#ffd8a1") },
    uLamps: { value: lampList },
    uFocos: { value: focos },
  };

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
         attribute vec4 aDisc;
         varying vec4 vDisc;
         varying vec3 vWPos;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         vDisc = aDisc;
         vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${PARS}`)
      .replace("#include <color_fragment>", BODY)
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
         normal = normalize((viewMatrix * vec4(wN, 0.0)).xyz);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
         totalEmissiveRadiance += wEmit;`,
      )
      .replace(
        "#include <tonemapping_fragment>",
        `#include <tonemapping_fragment>
         {
           vec3 rR = reflect(wV, wN);
           float cosI = clamp(dot(-wV, wN), 0.0, 1.0);
           float F = 0.02 + 0.98 * pow(1.0 - cosI, 5.0);
           vec3 rr = rR;
           rr.y = abs(rr.y);
           vec3 skyC = mix(uSkyH, uSkyM, smoothstep(0.0, 0.35, rr.y));
           skyC = mix(skyC, uSkyT, smoothstep(0.3, 1.0, rr.y));
           // Banda del arbolado del fondo: se rompe con el ángulo.
           float band = smoothstep(0.0, 0.03, rr.y) * (1.0 - smoothstep(0.12, 0.24, rr.y));
           band *= 0.65 + 0.35 * wNoise(vec2(atan(rr.x, rr.z) * 7.0, 0.0));
           skyC = mix(skyC, uTree, band * 0.9);
           // Destellos: sol de día, farolas de noche (reflejadas en la lámina).
           float glint = pow(max(dot(rR, uSunDir), 0.0), 380.0) * 2.4 * uSunOn;
           vec3 glintCol = vec3(1.0, 0.97, 0.88) * glint;
           for (int li = 0; li < ${MAX_LAMPS}; li++) {
             vec3 ld = uLamps[li] - wP;
             float d2 = dot(ld, ld);
             float s = max(dot(rR, normalize(ld)), 0.0);
             glintCol += uLampCol * (pow(s, 700.0) * 1.6 * (0.4 + 0.9 * wNoise(wP.xz * 22.0 + uTime * 0.6)) + pow(s, 120.0) * 0.02) * uLampOn / (1.0 + d2 * 0.012);
           }
           // 0.8: el IBL real de la escena ya aporta su reflejo (no se doble).
           float k = clamp(F * 0.8 * (1.0 - wFoam), 0.0, 1.0);
           gl_FragColor.rgb = mix(gl_FragColor.rgb, skyC, k) + glintCol * (0.35 + 0.65 * k);
         }`,
      );
  };
  mat.customProgramCacheKey = () => `fountain-water-${look.night ? "n" : "d"}-${MAX_LAMPS}`;
  return mat;
}
