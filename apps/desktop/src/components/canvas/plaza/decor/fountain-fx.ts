import * as THREE from "three";
import { merge } from "./decor-kit";
import {
  BASIN,
  FALLS,
  FOUNTAIN_G,
  GADROONS,
  GADROON_AMP,
  JET,
  LOWER_BOWL,
  UPPER_BOWL,
  impactRadius,
  type FountainLook,
} from "./fountain-config";
import { latheProfile, pt, type ProfilePoint } from "./fountain-lathe";

/**
 * Agua en movimiento: surtidor, láminas que rebosan de cada taza, gotas y la
 * luz del suelo. Nada de esto son luces reales (cuestan por píxel en toda la
 * escena): son mallas aditivas / translúcidas con shader propio.
 *
 *   - `buildFountainFxGeometry`  surtidor + 2 láminas, UNA geometría (1 draw).
 *   - `buildDropsGeometry`       un `InstancedMesh` de quads: posición analítica
 *                                p0 + v0·t + ½g·t² calculada en el vertex shader.
 *   - `createGroundMaterial`     sombra de contacto + charco frío en UN quad.
 */

const SHEET_ROWS = 20;

/** Una lámina que rebosa: parábola real r(t) = r0 + v0·t, y(t) = y0 − ½g·t².
 * El agua sale del labio con velocidad horizontal v0 y cae por gravedad, es
 * decir, se ABRE hacia fuera al bajar (no se estrecha, como el cilindro de
 * antes). Termina por debajo de la lámina de abajo; el z-buffer del agua
 * opaca recorta lo que sobra. */
function sheetProfile(f: { v0: number; y0: number; yEnd: number; r0: number }): ProfilePoint[] {
  const T = Math.sqrt((2 * (f.y0 - f.yEnd)) / FOUNTAIN_G);
  const pts: ProfilePoint[] = [];
  for (let i = 0; i <= SHEET_ROWS; i++) {
    const t = (i / SHEET_ROWS) * T;
    pts.push(pt(f.r0 + f.v0 * t, f.y0 - 0.5 * FOUNTAIN_G * t * t));
  }
  return pts;
}

/** Surtidor central: tubo que se abre y se deshilacha hacia el vértice. */
function jetProfile(): ProfilePoint[] {
  const pts: ProfilePoint[] = [];
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    pts.push(pt(JET.r0 + 0.035 * s ** 1.6 + 0.03 * s ** 4, JET.y0 + (JET.apex - JET.y0) * s));
  }
  return pts;
}

/** Surtidor + lámina alta + lámina baja, en una sola geometría. */
export function buildFountainFxGeometry(): THREE.BufferGeometry {
  // La lámina sigue el contorno de los gallones al arrancar y se alisa al caer.
  const lobes = (y0: number) => (_r: number, y: number, phi: number) =>
    1 + GADROON_AMP * Math.cos(GADROONS * phi) * Math.exp(-6 * Math.max(0, y0 - y));
  return merge(
    [
      ...latheProfile(jetProfile(), { uv: true, kind: 0 }),
      ...latheProfile(sheetProfile(FALLS.upper), { uv: true, kind: 1, disp: lobes(FALLS.upper.y0) }),
      ...latheProfile(sheetProfile(FALLS.lower), { uv: true, kind: 2, disp: lobes(FALLS.lower.y0) }),
    ],
    "fountainFx",
  );
}

const NOISE = /* glsl */ `
  float fHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  // Ruido de valor PERIÓDICO en x (per = nº entero de celdas por vuelta): sin
  // esto la costura de la revolución (u = 0 / 1) se veía como una línea.
  float fNoise(vec2 p, float per) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float x0 = mod(i.x, per);
    float x1 = mod(i.x + 1.0, per);
    return mix(mix(fHash(vec2(x0, i.y)), fHash(vec2(x1, i.y)), f.x), mix(fHash(vec2(x0, i.y + 1.0)), fHash(vec2(x1, i.y + 1.0)), f.x), f.y);
  }
`;

/** Surtidor y láminas: ShaderMaterial translúcido (día) o aditivo (noche). */
export function createFxMaterial(look: FountainLook, time: { value: number }): THREE.ShaderMaterial {
  const night = look.night > 0;
  return new THREE.ShaderMaterial({
    uniforms: {
      ...THREE.UniformsLib.fog,
      uTime: time,
      uCol: { value: new THREE.Color(look.jetBody) },
      uHi: { value: new THREE.Color(look.jetHi) },
      uOpacity: { value: night ? 0.7 : 1.0 },
      uNight: { value: look.night },
    },
    vertexShader: /* glsl */ `
      #include <common>
      #include <fog_pars_vertex>
      attribute float aKind;
      varying vec2 vUv;
      varying float vKind;
      varying vec3 vNormal;
      varying vec3 vView;
      varying float vY;
      void main() {
        vUv = uv;
        vKind = aKind;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = -mvPosition.xyz;
        vY = position.y;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime;
      uniform float uOpacity;
      uniform float uNight;
      uniform vec3 uCol;
      uniform vec3 uHi;
      varying vec2 vUv;
      varying float vKind;
      varying vec3 vNormal;
      varying vec3 vView;
      varying float vY;
      ${NOISE}
      void main() {
        // Cuanto más de canto se ve la lámina, más fina: es lo que le da
        // volumen sin geometría (patrón de los haces de ArcadeCeiling).
        float facing = abs(dot(normalize(vNormal), normalize(vView)));
        float s = vUv.y;
        float a;
        float streak;
        if (vKind < 0.5) {
          float st = fNoise(vec2(vUv.x * 18.0, s * 4.0 - uTime * 2.6), 18.0);
          float st2 = fNoise(vec2(vUv.x * 34.0, s * 9.0 - uTime * 4.1), 34.0);
          streak = 0.55 * st + 0.45 * st2;
          float fray = s + (streak - 0.5) * 0.55;
          a = pow(facing, 1.1) * (0.4 + 0.9 * streak) * (1.0 - smoothstep(0.72, 1.0, fray)) * smoothstep(0.0, 0.05, s);
        } else {
          float lobe = pow(0.5 + 0.5 * cos(vUv.x * 75.39822), 2.0);
          float st = fNoise(vec2(vUv.x * 72.0, s * 5.0 - uTime * 3.2), 72.0);
          float st2 = fNoise(vec2(vUv.x * 120.0, s * 11.0 - uTime * 5.0), 120.0);
          streak = 0.6 * st + 0.4 * st2;
          a = mix(0.24, 1.0, lobe) * (0.45 + 0.75 * streak) * pow(facing, 0.75);
          a *= mix(1.0, 0.6, smoothstep(0.35, 1.0, s)) * smoothstep(0.0, 0.05, s);
        }
        vec3 c = mix(uCol, uHi, streak);
        // De noche el agua se ilumina desde abajo (focos del pilón): más
        // brillo cerca de la lámina que de la boca del surtidor.
        float low = exp(-max(vY - 0.25, 0.0) * 0.9);
        c *= mix(1.0, 0.55 + 1.1 * low, uNight);
        float alpha = clamp(a * uOpacity, 0.0, 1.0);
        #ifdef USE_FOG
          alpha *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
        #endif
        gl_FragColor = vec4(c, alpha);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: night ? THREE.AdditiveBlending : THREE.NormalBlending,
    fog: true,
    toneMapped: false,
  });
}

/** Gotas por tipo: ver `drops` en el vertex shader. */
const DROP_COUNTS = [22, 16, 20, 34, 20] as const;
export const DROP_TOTAL = DROP_COUNTS.reduce((a, b) => a + b, 0);
/** Instancias extra de halo (solo de noche). */
export const HALO_COUNT = 2;

/** Quad unidad + atributo instanciado `aSeed` (fase, azar, azar, tipo). */
export function buildDropsGeometry(): THREE.InstancedBufferGeometry {
  const base = new THREE.PlaneGeometry(1, 1);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index;
  g.setAttribute("position", base.getAttribute("position"));
  g.setAttribute("uv", base.getAttribute("uv"));
  const seeds = new Float32Array((DROP_TOTAL + HALO_COUNT) * 4);
  const rnd = (n: number) => {
    const s = Math.sin(n * 12.9898 + 4.1414) * 43758.5453;
    return s - Math.floor(s);
  };
  let k = 0;
  DROP_COUNTS.forEach((count, kind) => {
    for (let i = 0; i < count; i++) {
      seeds[k * 4] = (i + rnd(k * 3.7)) / count;
      seeds[k * 4 + 1] = rnd(k * 7.3 + 1);
      seeds[k * 4 + 2] = rnd(k * 11.1 + 2);
      seeds[k * 4 + 3] = kind;
      k++;
    }
  });
  for (let h = 0; h < HALO_COUNT; h++) {
    seeds[k * 4 + 3] = 5 + h;
    k++;
  }
  g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 4));
  g.instanceCount = DROP_TOTAL + HALO_COUNT;
  return g;
}

/** Gotas y halos. La posición se calcula entera en el vertex shader. */
export function createDropsMaterial(look: FountainLook, time: { value: number }): THREE.ShaderMaterial {
  const night = look.night > 0;
  const f = (n: number) => n.toFixed(4);
  const upper = FALLS.upper;
  const lower = FALLS.lower;
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: time,
      uCol: { value: new THREE.Color(night ? look.jetHi : "#e4f4ff") },
      uGlow: { value: new THREE.Color(look.glow) },
      uOpacity: { value: night ? 0.7 : 0.85 },
    },
    vertexShader: /* glsl */ `
      #define G ${f(FOUNTAIN_G)}
      attribute vec4 aSeed;
      uniform float uTime;
      varying vec2 vUv;
      varying float vA;
      varying float vKind;
      float h1(float n) { return fract(sin(n * 91.345 + 17.1) * 43758.5453); }
      void main() {
        float kind = aSeed.w;
        vUv = uv;
        vKind = kind;
        vA = 1.0;
        float ang = aSeed.y * 6.2831853;
        float r1 = aSeed.z;
        float r2 = h1(aSeed.x * 13.7 + aSeed.y);
        vec3 p0 = vec3(0.0);
        vec3 v0 = vec3(0.0);
        float yEnd = 0.0;
        float gap = 0.0;
        float size = 0.024;
        if (kind < 0.5) {
          // Corona del surtidor: gotas que se sueltan del vértice y caen a la taza alta.
          p0 = vec3(0.0, ${f(JET.apex - 0.3)} + r1 * 0.2, 0.0);
          float spd = 0.05 + 0.3 * r2;
          v0 = vec3(sin(ang) * spd, 0.2 * r1 - 0.1, cos(ang) * spd);
          yEnd = ${f(UPPER_BOWL.water)};
          size = 0.022;
        } else if (kind < 1.5) {
          // Del labio de la taza alta, en los caños (uno por gallón), a la taza baja.
          float lobe = floor(aSeed.y * 12.0) / 12.0 * 6.2831853 + (r2 - 0.5) * 0.08;
          p0 = vec3(sin(lobe), 0.0, cos(lobe)) * ${f(upper.r0 + 0.06)};
          p0.y = ${f(upper.y0)};
          v0 = vec3(sin(lobe), 0.0, cos(lobe)) * ${f(upper.v0)} * (0.85 + 0.3 * r1);
          yEnd = ${f(LOWER_BOWL.water)};
        } else if (kind < 2.5) {
          float lobe = floor(aSeed.y * 12.0) / 12.0 * 6.2831853 + (r2 - 0.5) * 0.08;
          p0 = vec3(sin(lobe), 0.0, cos(lobe)) * ${f(lower.r0 + 0.06)};
          p0.y = ${f(lower.y0)};
          v0 = vec3(sin(lobe), 0.0, cos(lobe)) * ${f(lower.v0)} * (0.85 + 0.3 * r1);
          yEnd = ${f(BASIN.waterY)};
          size = 0.026;
        } else if (kind < 3.5) {
          // Salpicadura de la corona del pilón: rebota y vuelve a caer.
          p0 = vec3(sin(ang), 0.0, cos(ang)) * (${f(impactRadius(lower))} + (r2 - 0.5) * 0.12);
          p0.y = ${f(BASIN.waterY)};
          v0 = vec3(sin(ang), 0.0, cos(ang)) * (r1 - 0.5) * 0.35 + vec3(0.0, 0.7 + 0.8 * r2, 0.0);
          yEnd = ${f(BASIN.waterY)};
          gap = 1.4;
          size = 0.02;
        } else if (kind < 4.5) {
          p0 = vec3(sin(ang), 0.0, cos(ang)) * (${f(impactRadius(upper))} + (r2 - 0.5) * 0.08);
          p0.y = ${f(LOWER_BOWL.water)};
          v0 = vec3(sin(ang), 0.0, cos(ang)) * (r1 - 0.5) * 0.25 + vec3(0.0, 0.55 + 0.6 * r2, 0.0);
          yEnd = ${f(LOWER_BOWL.water)};
          gap = 1.4;
          size = 0.018;
        }
        float T = (v0.y + sqrt(max(v0.y * v0.y + 2.0 * G * (p0.y - yEnd), 0.0))) / G;
        float period = T * (1.0 + gap);
        float t = fract(uTime / max(period, 0.05) + aSeed.x) * period;
        vec3 p = p0 + v0 * t - vec3(0.0, 0.5 * G * t * t, 0.0);
        vec3 vel = v0 - vec3(0.0, G * t, 0.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        if (kind > 4.5) {
          // Halos (noche): un velo frío alrededor del surtidor y otro, ancho, sobre el pilón.
          float big = kind - 5.0;
          mv = modelViewMatrix * vec4(0.0, mix(${f(JET.y0 + 0.2)}, 0.5, big), 0.0, 1.0);
          mv.xy += position.xy * mix(2.6, 4.4, big);
          vA = mix(0.22, 0.07, big);
        } else {
          if (t > T) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          vec2 dir = (modelViewMatrix * vec4(vel, 0.0)).xy;
          float sp = length(dir);
          dir = sp > 1e-4 ? dir / sp : vec2(0.0, -1.0);
          // (dy, -dx) y no (-dy, dx): con esa base la quad queda reflejada y el
          // culling de caras traseras la descarta entera.
          vec2 perp = vec2(dir.y, -dir.x);
          float len = size * 1.4 + min(sp, 2.5) * 0.02;
          mv.xy += dir * position.y * len + perp * position.x * size;
          vA = 1.0 - pow(t / T, 6.0) * 0.5;
        }
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uCol;
      uniform vec3 uGlow;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vA;
      varying float vKind;
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        if (vKind > 4.5) {
          float d = length(p);
          float g = exp(-d * d * 3.2) * (1.0 - smoothstep(0.85, 1.0, d));
          gl_FragColor = vec4(uGlow, g * vA);
        } else {
          // Cápsula: redonda en los extremos, alargada con la velocidad.
          float d = length(vec2(p.x, max(abs(p.y) - 0.45, 0.0)));
          gl_FragColor = vec4(uCol, (1.0 - smoothstep(0.55, 1.0, d)) * vA * uOpacity);
        }
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: night ? THREE.AdditiveBlending : THREE.NormalBlending,
    toneMapped: false,
  });
}

/**
 * Suelo de la fuente: sombra de contacto (el pilón asienta en el pavimento) y,
 * de noche, el charco de luz fría de los focos subacuáticos. Un solo quad con
 * alfa premultiplicado: `rgb` SUMA luz y `a` OSCURECE lo de debajo.
 */
export function createGroundMaterial(look: FountainLook, shadowOpacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uShadow: { value: Math.min(1, shadowOpacity * 1.9) },
      uNight: { value: look.night },
      uLight: { value: new THREE.Color(look.glow) },
      uOuter: { value: BASIN.outer },
    },
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() {
        vP = position.xy * 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uShadow;
      uniform float uNight;
      uniform vec3 uLight;
      uniform float uOuter;
      varying vec2 vP;
      void main() {
        float rho = length(vP);
        float a = uShadow * pow(1.0 - smoothstep(uOuter - 0.02, uOuter + 0.42, rho), 1.6);
        float l = pow(1.0 - smoothstep(uOuter, uOuter + 1.2, rho), 2.4);
        vec3 rgb = uLight * l * 0.11 * uNight;
        gl_FragColor = vec4(rgb, a);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    toneMapped: false,
  });
}

/** Radio del quad del suelo. */
export const GROUND_RADIUS = BASIN.outer + 1.5;
