import * as THREE from "three";

/**
 * Material de HOLOGRAMA compartido del puerto — el lenguaje visual con el que
 * el juego "habla" al jugador: lima de marca, translúcido, líneas de barrido,
 * borde fresnel y parpadeo de proyector.
 *
 * Nació en la flecha de la bodega (`Ship.tsx`) y se sacó aquí al añadir la guía
 * del gancho (`HookGuide.tsx`): son la MISMA señal y tienen que parecerlo. Los
 * valores por defecto son EXACTAMENTE los de la flecha — no tocarlos sin mirar
 * el barco, o la flecha cambia de aspecto sin que nadie lo haya pedido.
 */

const HOLO_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorld;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(cameraPosition - wp.xyz);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const HOLO_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uAlpha;
  uniform vec3 uScanAxis;
  uniform float uScanScale;
  uniform float uScanSpeed;
  uniform float uBase;
  uniform float uFresnel;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorld;
  void main() {
    // Líneas de barrido que recorren la pieza a lo largo de su eje.
    float coord = dot(vWorld, uScanAxis);
    float scan = 0.55 + 0.45 * step(0.5, fract(coord * uScanScale - uTime * uScanSpeed));
    // Borde luminoso tipo fresnel: el interior queda translúcido.
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 1.6);
    // Parpadeo de proyector: leve y con un tartamudeo ocasional.
    float flicker = 0.9 + 0.1 * sin(uTime * 37.0) * sin(uTime * 3.3);
    float a = (uBase + fresnel * uFresnel) * scan * flicker * uAlpha;
    vec3 col = mix(uColor, vec3(1.0), fresnel * 0.5);
    gl_FragColor = vec4(col, a);
  }
`;

/** Lima de marca — el mismo `--accent` del CSS. */
export const HOLO_COLOR = "#c8ff00";

export interface HoloOptions {
  /** Opacidad global de la pieza (uniform `uAlpha`, animable en caliente). */
  alpha?: number;
  /** Eje de MUNDO por el que corren las líneas de barrido. */
  scanAxis?: [number, number, number];
  /** Líneas por unidad de mundo. */
  scanScale?: number;
  /** Velocidad del barrido (unidades/s). */
  scanSpeed?: number;
  /** Suelo de opacidad: cuánto se ve la cara de frente. */
  base?: number;
  /** Cuánto suma el borde fresnel. Alto = silueta marcada, interior vacío. */
  fresnel?: number;
}

/**
 * Crea un material de holograma. Cada llamada devuelve una instancia NUEVA con
 * sus propios uniforms: quien lo crea es dueño de su `uTime` y de su `dispose()`.
 */
export function createHoloMaterial(opts: HoloOptions = {}): THREE.ShaderMaterial {
  const {
    alpha = 1,
    scanAxis = [0, 1, 0],
    scanScale = 5,
    scanSpeed = 1.6,
    base = 0.28,
    fresnel = 0.6,
  } = opts;
  return new THREE.ShaderMaterial({
    vertexShader: HOLO_VERT,
    fragmentShader: HOLO_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(HOLO_COLOR) },
      uAlpha: { value: alpha },
      uScanAxis: { value: new THREE.Vector3(scanAxis[0], scanAxis[1], scanAxis[2]) },
      uScanScale: { value: scanScale },
      uScanSpeed: { value: scanSpeed },
      uBase: { value: base },
      uFresnel: { value: fresnel },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

/**
 * Silueta de la flecha holográfica (punta en y = 0, apunta a -y, 2,6 de alto).
 * La usan la flecha de la bodega (`Ship.tsx`) y la que señala contenedores
 * (`TargetMarker.tsx`): misma señal, misma forma.
 */
export function holoArrowShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(1.35, 1.3);
  s.lineTo(0.55, 1.3);
  s.lineTo(0.55, 2.6);
  s.lineTo(-0.55, 2.6);
  s.lineTo(-0.55, 1.3);
  s.lineTo(-1.35, 1.3);
  s.closePath();
  return s;
}
