import * as THREE from "three";
import type { FaceSpec } from "../plaza-config";

/**
 * Cara y piel del muñeco EN SHADER (0 texturas).
 *
 * Por qué no un `CanvasTexture`: la cara de antes eran 1024x512 px por
 * variante (abierta/cerrada) y por muñeco: ~46 texturas, ~120 MB de VRAM con
 * mips, y la de ojos cerrados se subía a la GPU en el primer parpadeo (tirón).
 * Además cada trazo medía 2,5-3,5 texels: a la distancia de la plaza, donde la
 * cabeza ocupa ~55 px, cejas y boca se perdían en el mipmapping.
 *
 * Aquí los rasgos son SDF analíticos evaluados por píxel sobre las MISMAS UV de
 * la esfera de la cabeza (frente en u = 0,25, ecuador en v = 0,5; la misma
 * convención que usaba la antigua textura equirectangular de la cara). Eso da
 * tres cosas que una textura no:
 *  - Resolución infinita de cerca y cero pérdida de contraste de lejos: todo
 *    trazo tiene un GROSOR MÍNIMO EN PÍXELES de pantalla (FC_MIN_PX), medido
 *    con derivadas, así que ni desaparece ni engorda de cerca.
 *  - Un rig real: párpado que baja, pupilas que miran, boca que habla. Son
 *    uniforms; mover uno no recompila nada.
 *  - UN SOLO PROGRAMA para todas las cabezas (`customProgramCacheKey`
 *    constante): los parámetros de cada cara viajan en uniforms por material.
 *
 * Como `MeshStandardMaterial` + `onBeforeCompile` conserva sombras, niebla,
 * luces y tone mapping de la escena sin reimplementarlos.
 */

/** Tinta de cómic (la de toda la plaza): no es #000, el negro puro
 * sobre colores planos se lee como un agujero. */
export const FACE_INK = "#1d1a1c";

/** Grosor mínimo de un trazo en píxeles de pantalla. Por debajo de ~1,5 px un
 * filete se deshace en una trama que parpadea al moverse la cámara. */
const FC_MIN_PX = 1.5;

/** Clave del programa compartido (cabeza con cara / piel sin cara). */
export const FACE_PROGRAM_KEY = "plaza-face-v1";
const SKIN_PROGRAM_KEY = "plaza-skin-v1";

// ───────────────────────────── API pública ────────────────────────────────

/** Estado del rig facial. Todo en 0..1 salvo `lookX/lookY` (-1..1). */
export interface FaceRig {
  /** 0 = ojos abiertos, 1 = cerrados. Es un párpado que baja, no un swap. */
  blink: number;
  /** Mirada en la pantalla: +x = hacia la derecha del espectador, +y = arriba. */
  lookX: number;
  lookY: number;
  /** Apertura de la boca al hablar. */
  talk: number;
  /** Sonrisa extra sobre la forma de boca base (comisuras arriba, cejas suben). */
  smile: number;
}

/** Parámetros del sombreado de piel (subsurface falso + rim). */
export interface SkinShadingOptions {
  /** Wrap lighting: cuánto "da la vuelta" la luz al terminador (0 = Lambert). */
  wrap: number;
  /** Fuerza del tinte cálido en el terminador, 0..1. */
  sss: number;
  /** Tinte multiplicativo del albedo en el terminador (rojo cálido). */
  sssColor: THREE.ColorRepresentation;
  /** Fuerza del rim, relativa a la luz ambiente. */
  rim: number;
  /** Exponente del fresnel del rim (más alto = más fino). */
  rimPower: number;
  /** Desaturación del albedo de piel, 0..1: las pieles oscuras (B ~ 0x24) con luz
   * cálida se quemaban a naranja puro; esto las deja ricas pero no saturadas. */
  soften: number;
}

export interface HeadMaterialOptions {
  roughness?: number;
  /** Autoiluminación (fracción del color de piel que se suma como emisivo).
   * Antes 0,16; LUZ pide <= 0,04 con Neutral + IBL. */
  selfLight?: number;
  /** Color de cejas; por defecto, un tono muy oscuro derivado de la piel. */
  browColor?: THREE.ColorRepresentation;
  skin?: Partial<SkinShadingOptions>;
}

export const SKIN_SHADING_DEFAULTS: SkinShadingOptions = {
  wrap: 0.26,
  sss: 0.5,
  sssColor: new THREE.Color(1.0, 0.85, 0.79),
  rim: 0.55,
  rimPower: 3,
  soften: 0.16,
};

/**
 * Crea el material de la cabeza de UN muñeco: piel `skin`, rasgos de `face`.
 * Un material por muñeco (sus uniforms son suyos); el programa de GPU es uno.
 * Se libera con `material.dispose()` — no hay texturas que liberar.
 */
export function createHeadMaterial(face: FaceSpec, skin: string, opts: HeadMaterialOptions = {}): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ color: skin, roughness: opts.roughness ?? 0.62, metalness: 0 });
  const fu = makeFaceUniforms(face, skin, opts);
  patch(mat, fu, makeSkinUniforms(opts.skin));
  faceRigs.set(mat, fu);
  return mat;
}

/** Conduce el rig de una cabeza creada con `createHeadMaterial`. Solo escribe
 * floats en uniforms: llamarlo cada frame no cuesta ni recompila nada. */
export function setFaceRig(material: THREE.Material, rig: Partial<FaceRig>): void {
  const fu = faceRigs.get(material);
  if (!fu) return;
  const r = fu.uFRig.value;
  if (rig.blink !== undefined) r.x = clamp01(rig.blink);
  if (rig.lookX !== undefined) r.y = clampSym(rig.lookX);
  if (rig.lookY !== undefined) r.z = clampSym(rig.lookY);
  if (rig.talk !== undefined) r.w = clamp01(rig.talk);
  if (rig.smile !== undefined) fu.uFRig2.value.x = clamp01(rig.smile);
}

/**
 * Sombreado de piel para cualquier `MeshStandardMaterial` (manos, orejas...):
 * wrap lighting + tinte cálido en el terminador (subsurface falso de coste
 * casi nulo) y un rim sutil que sube con la luz ambiente de cada modo. Es el
 * MISMO que lleva la cabeza, así que la piel casa. Llamarlo ANTES del primer
 * render del material. Un único programa para todos los materiales de piel.
 */
export function applySkinShading(material: THREE.MeshStandardMaterial, opts?: Partial<SkinShadingOptions>): void {
  patch(material, null, makeSkinUniforms(opts));
}

/**
 * Curva de un parpadeo: `t` = segundos desde que empezó. Cierra rápido (~35 %
 * del tiempo) y abre más despacio, que es como parpadea una persona. Devuelve
 * 0..1 y 0 fuera de [0, duration].
 */
export function blinkCurve(t: number, duration = 0.17): number {
  if (t <= 0 || t >= duration) return 0;
  const x = t / duration;
  const k = 0.35;
  return x < k ? easeOut(x / k) : 1 - easeInOut((x - k) / (1 - k));
}

// ──────────────────────────── uniforms de cara ───────────────────────────

interface Uni<T> {
  value: T;
}
interface FaceUniforms {
  uFEye: Uni<THREE.Vector4>;
  uFLay: Uni<THREE.Vector4>;
  uFBrow: Uni<THREE.Vector4>;
  uFMouth: Uni<THREE.Vector4>;
  uFExtra: Uni<THREE.Vector4>;
  uFRig: Uni<THREE.Vector4>;
  uFRig2: Uni<THREE.Vector4>;
  uFIris: Uni<THREE.Color>;
  uFBrowCol: Uni<THREE.Color>;
  uFInk: Uni<THREE.Color>;
}
interface SkinUniforms {
  uSkinA: Uni<THREE.Vector4>;
  uSkinSss: Uni<THREE.Color>;
  uSkinSoft: Uni<number>;
}

const faceRigs = new WeakMap<THREE.Material, FaceUniforms>();

/** Forma de ojo: [rx, ry, inclinación (rad), pestaña]. Grados de arco. ~30 %
 * mayores que los de la textura (5,2x7,8 → 6,4x9,4) para que se lean a 55 px. */
const EYE_SHAPES: readonly (readonly [number, number, number, number])[] = [
  [6.4, 9.4, 0, 0],
  [6.9, 9.0, 0.08, 0],
  [5.7, 8.6, 0, 0],
  [6.6, 10.0, -0.06, 1],
];

/** Ceja: [semilargo, arco, inclinación (+ = extremo interior más alto), semigrosor]. */
const BROW_SHAPES: readonly (readonly [number, number, number, number])[] = [
  [5.6, 0.6, 0.0, 0.85], // recta
  [5.6, 1.7, 0.15, 0.82], // arqueada suave
  [5.2, 0.3, -1.1, 1.05], // más gruesa, bajando hacia dentro
  [5.4, 1.0, 1.0, 0.72], // fina, levantada hacia dentro (gesto amable)
];

/** Boca: [semilargo, comisuras sobre el centro, semigrosor, apertura base]. */
const MOUTH_SHAPES: readonly (readonly [number, number, number, number])[] = [
  [6.0, 2.2, 0.8, 0], // sonrisa
  [5.8, 1.3, 0.62, 0.85], // sonrisa abierta
  [4.6, 0.5, 0.8, 0], // neutra con comisuras levemente arriba
  [3.8, 1.6, 0.8, 0], // sonrisa pequeña
];

/** Alturas en grados de latitud sobre el ecuador (+ = arriba). Casan con
 * `DOLL.nose.y` (nariz a ~-3,4°) y con el borde del pelo (~35°). */
const EYE_Y = 9.0;
const BROW_Y = 24.0;
const MOUTH_Y = -17.0;

function makeFaceUniforms(face: FaceSpec, skin: string, opts: HeadMaterialOptions): FaceUniforms {
  const eye = EYE_SHAPES[face.eyes % 4];
  const brow = BROW_SHAPES[face.brows % 4];
  const mouth = MOUTH_SHAPES[face.mouth % 4];
  // eyeSpacing 0-1 → separación del centro del ojo al eje de la cara. Más que
  // los 12-17° de antes: con ojos mayores, el hueco de la nariz se respeta.
  const eyeDx = 14.2 + face.eyeSpacing * 5.5;

  const skinLin = new THREE.Color(skin);
  const browCol = opts.browColor !== undefined ? new THREE.Color(opts.browColor) : skinLin.clone().multiplyScalar(0.04);

  return {
    uFEye: { value: new THREE.Vector4(eye[0], eye[1], eye[2], eye[3]) },
    uFLay: { value: new THREE.Vector4(eyeDx, EYE_Y, BROW_Y, MOUTH_Y) },
    uFBrow: { value: new THREE.Vector4(brow[0], brow[1], brow[2], brow[3]) },
    uFMouth: { value: new THREE.Vector4(mouth[0], mouth[1], mouth[2], mouth[3]) },
    // blush, separación del colorete, sombra de la nariz, lado del brillo (+1 = derecha)
    uFExtra: { value: new THREE.Vector4(face.blush ? 1 : 0, eyeDx + 5.5, 0.16, 1) },
    uFRig: { value: new THREE.Vector4(0, 0, 0, 0) },
    uFRig2: { value: new THREE.Vector4(0, opts.selfLight ?? 0.03, 0, 0) },
    uFIris: { value: new THREE.Color(face.eyeColor) },
    uFBrowCol: { value: browCol },
    uFInk: { value: new THREE.Color(FACE_INK) },
  };
}

function makeSkinUniforms(o?: Partial<SkinShadingOptions>): SkinUniforms {
  const s = { ...SKIN_SHADING_DEFAULTS, ...o };
  return {
    uSkinA: { value: new THREE.Vector4(s.wrap, s.sss, s.rim, s.rimPower) },
    uSkinSss: { value: new THREE.Color(s.sssColor) },
    uSkinSoft: { value: s.soften },
  };
}

// ───────────────────────────────── GLSL ───────────────────────────────────

const SKIN_PARS = /* glsl */ `
uniform vec4 uSkinA;   // wrap, sss, rim, rimPower
uniform vec3 uSkinSss; // tinte multiplicativo del terminador
uniform float uSkinSoft; // desaturación del albedo
vec3 skinSoften( vec3 c ) { return mix( c, vec3( dot( c, vec3( 0.2126, 0.7152, 0.0722 ) ) ), uSkinSoft ); }
`;

const FACE_PARS = /* glsl */ `
#define FC_MIN_PX ${FC_MIN_PX.toFixed(2)}
varying vec2 vFaceUv;
uniform vec4 uFEye;    // rx, ry, inclinación, pestaña
uniform vec4 uFLay;    // separación de ojos, y ojos, y cejas, y boca
uniform vec4 uFBrow;   // semilargo, arco, inclinación, semigrosor
uniform vec4 uFMouth;  // semilargo, comisuras, semigrosor, apertura base
uniform vec4 uFExtra;  // colorete, sep. colorete, sombra nariz, lado del brillo
uniform vec4 uFRig;    // blink, lookX, lookY, talk
uniform vec4 uFRig2;   // smile, autoiluminación
uniform vec3 uFIris;
uniform vec3 uFBrowCol;
uniform vec3 uFInk;

// Cobertura 0..1 a partir de una distancia con signo YA en píxeles.
float fcCov(float dPx) { return clamp(0.5 - dPx, 0.0, 1.0); }

// Trazo: d = distancia (grados) a la línea central, hw = semigrosor (grados),
// px = grados por píxel de pantalla. El semigrosor nunca baja de FC_MIN_PX/2 px.
float fcStroke(float d, float hw, float px) {
  float hwPx = max(hw / px, FC_MIN_PX * 0.5);
  return clamp(hwPx - d / px + 0.5, 0.0, 1.0);
}

// Distancia aproximada a una elipse (iq): exacta en el borde, monótona fuera.
float fcEllipse(vec2 p, vec2 r) {
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  return k0 * (k0 - 1.0) / max(k1, 1e-4);
}

// Distancia a un arco y = a*x^2 + b*x acotado a |x| <= L, con tapas redondas.
float fcArc(vec2 p, float L, float a, float b) {
  float xc = clamp(p.x, -L, L);
  float slope = 2.0 * a * xc + b;
  float dy = (p.y - (a * xc * xc + b * xc)) * inversesqrt(1.0 + slope * slope);
  return length(vec2(p.x - xc, dy));
}

// Pinta la cara sobre 'col' (piel). 'hi' = máscara de los brillos de los ojos
// (se suma como emisivo para que sean blancos también a la sombra).
void faceShade(vec2 uv, inout vec3 col, out float hi, out float inkMask) {
  hi = 0.0;
  inkMask = 0.0;
  // Coordenadas en GRADOS de arco sobre la esfera, con la frente en (0,0):
  // compensar cos(lat) mantiene los óvalos redondos al subir hacia las cejas.
  float lon = (uv.x - 0.25) * 360.0;
  float lat = (uv.y - 0.5) * 180.0;
  vec2 p = vec2(lon * cos(radians(lat)), lat);
  // Tamaño de un píxel en grados. SIN salida anticipada ni rama por zona: el
  // compilador de Metal/ANGLE hundía este cálculo dentro del 'if' y las
  // derivadas, indefinidas en flujo no uniforme, daban un px basura en el borde
  // de la máscara (un hilo de tinta discontinuo a 75° de la frente). Los rasgos
  // valen 0 lejos de su sitio por construcción, así que no hace falta máscara.
  // Acotado: en el polo y en la silueta un píxel abarca decenas de grados y,
  // sin tope, d/px ≈ 0 pintaba tinta en esos píxeles sueltos.
  float px = clamp(max(length(dFdx(p)), length(dFdy(p))), 1e-4, 4.0);

  float blink = uFRig.x;
  vec2 look = uFRig.yz;
  float talk = uFRig.w;
  float smile = uFRig2.x;
  vec3 ink = uFInk;
  float side = p.x < 0.0 ? -1.0 : 1.0;
  float ax = abs(p.x);

  // ── Colorete: multiplicativo, para que se lea también en pieles oscuras.
  if (uFExtra.x > 0.5) {
    vec2 bq = vec2(ax - uFExtra.y, lat + 6.5) / vec2(5.4, 3.4);
    float ba = (1.0 - smoothstep(0.3, 1.0, length(bq))) * 0.36;
    col = mix(col, col * vec3(1.15, 0.70, 0.68) + vec3(0.05, 0.0, 0.0), ba);
  }

  // ── Sombra de contacto de la nariz (la nariz es una esfera real aparte).
  vec2 nq = vec2(p.x, lat + 5.8) / vec2(7.0, 4.6);
  col *= 1.0 - uFExtra.z * (1.0 - smoothstep(0.2, 1.0, length(nq)));

  // ── Boca. Línea curva y = c·t² (comisuras arriba); al hablar se abre una
  // cavidad parabólica por debajo, con lengua. Una sola SDF para las dos cosas.
  {
    vec2 m = vec2(p.x, lat - uFLay.w);
    float L = uFMouth.x * (1.0 - 0.12 * talk);
    float cc = uFMouth.y + smile * 2.0;
    float open = max(uFMouth.w, talk * 0.9);
    float t = clamp(m.x / L, -1.0, 1.0);
    float f = cc * t * t;
    float kinv = inversesqrt(1.0 + pow2(2.0 * cc * t / L));
    float hOpen = open * L * 0.8 * (1.0 - t * t);
    float dM = max((m.y - f) * kinv, (f - hOpen - m.y) * kinv);
    float ex = max(abs(m.x) - L, 0.0);
    if (ex > 0.0) dM = length(vec2(ex, max(dM, 0.0)));

    float inside = fcCov(dM / px);
    float hc = open * L * 0.8;
    float tongue = fcCov(fcEllipse(m - vec2(0.0, -hc * 0.78), vec2(L * 0.42, max(hc * 0.34, 1e-3))) / px);
    vec3 cav = mix(vec3(0.07, 0.01, 0.015), vec3(0.42, 0.07, 0.09), tongue * smoothstep(0.2, 0.5, open));
    col = mix(col, cav, inside);
    float mouthInk = fcStroke(abs(dM), uFMouth.z, px);
    col = mix(col, ink, mouthInk);
    inkMask = max(inkMask, mouthInk);
  }

  // ── Ceja: arco con grosor que se afina hacia fuera.
  {
    vec2 bq = vec2(ax - (uFLay.x + 0.4), lat - uFLay.z - smile * 0.8);
    float L = uFBrow.x;
    float u = clamp(bq.x / L, -1.0, 1.0);
    float d = fcArc(vec2(bq.x, bq.y - uFBrow.y), L, -uFBrow.y / (L * L), -uFBrow.z / L);
    float hw = uFBrow.w * (1.12 - 0.55 * (u * 0.5 + 0.5));
    float browInk = fcStroke(d, hw, px);
    col = mix(col, uFBrowCol, browInk);
    inkMask = max(inkMask, browInk);
  }

  // ── Ojo. q: x > 0 hacia fuera de la cara, y > 0 arriba, ya inclinado.
  {
    vec2 pe = vec2(ax - uFLay.x, lat - uFLay.y);
    float ca = cos(uFEye.z), sa = sin(uFEye.z);
    vec2 q = vec2(ca * pe.x - sa * pe.y, sa * pe.x + ca * pe.y);
    vec2 r = uFEye.xy;
    float dE = fcEllipse(q, r);

    // Párpados: el superior baja y el inferior sube hasta cerrarse en yc, con
    // las comisuras algo más altas (el arco "‿" del ojo cerrado).
    float yc = -0.30 * r.y;
    float sag = 0.32 * r.y * blink * pow2(q.x / r.x);
    float yTop = mix(r.y * 1.25, yc, blink) + sag;
    float yBot = mix(-r.y * 1.05, yc, blink * blink) + sag;
    float aper = fcCov(dE / px)
      * clamp((yTop - q.y) / px + 0.5, 0.0, 1.0)
      * clamp((q.y - yBot) / px + 0.5, 0.0, 1.0);

    // Iris grande (llena casi todo el ojo, estilo muñeco) que se desplaza con
    // la mirada y queda recortado por la apertura: al mirar de lado asoma
    // esclera por el lado contrario.
    vec2 ic = vec2(look.x * side * 0.30 * r.x, look.y * 0.26 * r.y);
    vec2 iR = vec2(0.97 * r.x, 1.08 * r.y);
    vec2 vi = (q - ic) / iR;
    float irisA = fcCov(fcEllipse(q - ic, iR) / px);
    vec3 sclera = vec3(0.86, 0.82, 0.78) * (1.0 - 0.28 * smoothstep(0.1, 1.0, q.y / r.y));
    vec3 iris = uFIris + vec3(0.20, 0.11, 0.05) * 0.6 * smoothstep(-0.05, -0.95, vi.y);
    iris = mix(iris, ink, smoothstep(0.78, 1.0, length(vi)));
    iris = mix(iris, ink * 0.6, fcCov(fcEllipse(q - ic, iR * 0.50) / px));
    col = mix(col, mix(sclera, iris, irisA), aper);

    // Brillos pintados: uno grande arriba (hacia la luz) y uno pequeño opuesto.
    // Siguen a la mirada a medias: son un reflejo, no parte del iris.
    float hs = side * uFExtra.w;
    vec2 h1 = ic * 0.5 + vec2(hs * 0.30 * r.x, 0.36 * r.y);
    vec2 h2 = ic * 0.4 + vec2(-hs * 0.26 * r.x, -0.40 * r.y);
    float h1a = fcCov((length(q - h1) - max(0.21 * r.y, px * 0.8)) / px);
    float h2a = 0.65 * fcCov((length(q - h2) - max(0.09 * r.y, px * 0.6)) / px);
    hi = max(h1a, h2a) * aper;
    col = mix(col, vec3(1.0), hi);

    // Línea de pestañas: contorno del ojo recortado por los párpados, solo en
    // el tramo de arriba (abierto) o entero (cerrado: es el ojo cerrado).
    float R = max(max(dE, q.y - yTop), yBot - q.y);
    float lashHw = mix(0.40, 0.85, clamp(q.y / r.y * 0.7 + 0.4, 0.0, 1.0)) * (1.0 + 0.35 * blink);
    float lashMask = clamp((q.y - (min(yTop, 0.0) - 0.35 * r.y)) / px + 0.5, 0.0, 1.0);
    float lash = fcStroke(abs(R), lashHw, px) * lashMask;
    if (uFEye.w > 0.5) {
      vec2 a = vec2(r.x * 0.72, r.y * 0.62);
      vec2 b = vec2(r.x * 1.42, r.y * 1.05);
      vec2 pa = q - a, ba = b - a;
      float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      lash = max(lash, fcStroke(length(pa - ba * h), 0.45 * (1.0 - h * 0.5), px) * (1.0 - blink));
    }
    col = mix(col, ink, lash);
    // Tinta e iris no reflejan: un velo especular gris sobre el negro lo
    // convertía en marrón lavado a pleno sol.
    inkMask = max(inkMask, max(lash, aper * irisA));
  }
}
`;

/** Wrap + tinte del terminador, sustituyendo la línea difusa de RE_Direct_Physical. */
const SKIN_DIRECT_FROM = "reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );";
const SKIN_DIRECT_TO = /* glsl */ `
	{
		float skNdl = dot( geometryNormal, directLight.direction );
		float skWrap = saturate( ( skNdl + uSkinA.x ) / ( 1.0 + uSkinA.x ) );
		float skBand = exp( - pow2( ( skNdl - 0.06 ) * 3.4 ) );
		vec3 skTint = mix( vec3( 1.0 ), uSkinSss, skBand * uSkinA.y );
		reflectedLight.directDiffuse += directLight.color * skWrap * BRDF_Lambert( material.diffuseContribution * skTint );
	}`;

const SKIN_RIM = /* glsl */ `
	{
		float skFres = pow( 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) ), uSkinA.w );
		outgoingLight += reflectedLight.indirectDiffuse * uSkinSss * skFres * uSkinA.z;
	}
	#include <opaque_fragment>`;

// ─────────────────────────────── parcheo ──────────────────────────────────

function patch(material: THREE.MeshStandardMaterial, face: FaceUniforms | null, skin: SkinUniforms): void {
  const key = face ? FACE_PROGRAM_KEY : SKIN_PROGRAM_KEY;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, skin, face ?? {});

    let vs = shader.vertexShader;
    let fs = shader.fragmentShader;

    if (face) {
      vs = vs
        .replace("#include <common>", "#include <common>\nvarying vec2 vFaceUv;")
        // `uv` existe en el prefijo del vértice aunque no haya `map`.
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvFaceUv = uv;");
    }

    fs = fs.replace("#include <common>", `#include <common>\n${SKIN_PARS}${face ? FACE_PARS : ""}`);

    if (!face) {
      fs = fs.replace("#include <color_fragment>", `#include <color_fragment>\n\tdiffuseColor.rgb = skinSoften( diffuseColor.rgb );`);
    }
    if (face) {
      fs = fs.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
	diffuseColor.rgb = skinSoften( diffuseColor.rgb );
	float faceHi = 0.0;
	float faceInk = 0.0;
	{
		vec3 faceCol = diffuseColor.rgb;
		faceShade( vFaceUv, faceCol, faceHi, faceInk );
		diffuseColor.rgb = faceCol;
	}`
      );
      // Sin brillo especular sobre tinta/iris (ver faceShade).
      fs = fs.replace(
        "#include <lights_fragment_end>",
        `#include <lights_fragment_end>
	reflectedLight.directSpecular *= 1.0 - faceInk;
	reflectedLight.indirectSpecular *= 1.0 - faceInk;`
      );
      // Autoiluminación tras el color pintado (cara y piel suben igual) y los
      // brillos de los ojos siempre blancos.
      fs = fs.replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
	totalEmissiveRadiance += diffuseColor.rgb * uFRig2.y + vec3( faceHi * 0.9 );`
      );
    }

    const chunk = THREE.ShaderChunk.lights_physical_pars_fragment;
    if (!chunk.includes(SKIN_DIRECT_FROM) && process.env.NODE_ENV !== "production") {
      console.warn("[face-material] three cambió RE_Direct_Physical: el wrap de piel no se aplica.");
    }
    fs = fs
      .replace("#include <lights_physical_pars_fragment>", () => chunk.replace(SKIN_DIRECT_FROM, () => SKIN_DIRECT_TO))
      .replace("#include <opaque_fragment>", () => SKIN_RIM);

    shader.vertexShader = vs;
    shader.fragmentShader = fs;
  };
  // Constante: todas las cabezas (y todas las manos) comparten programa.
  material.customProgramCacheKey = () => key;
  material.needsUpdate = true;
}

// ─────────────────────────────── utilidades ───────────────────────────────

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
function clampSym(x: number): number {
  return x < -1 ? -1 : x > 1 ? 1 : x;
}
function easeOut(x: number): number {
  return 1 - (1 - x) * (1 - x);
}
function easeInOut(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}
