import * as THREE from "three";
import { ORBIT } from "./plaza-camera";
import { PLAZA_PALETTES, type PlazaMode } from "./plaza-mode";
import { buildDecorLayout } from "./decor/furniture-layout";
import { LAMP_LIGHT_Y } from "./decor/furniture";

/**
 * Geometría del rig de luz de la plaza: direcciones, cámara de sombra, farolas
 * e IBL procedural. Funciones puras (sin React) para poder leerlas desde
 * cualquier pieza — el agua de la fuente, por ejemplo, puede pedir la
 * dirección del sol para su brillo sin duplicarla.
 */

/**
 * Dirección HACIA la luz (unitaria) a partir de ángulos relativos a la cámara
 * en reposo. `azimuthDeg` positivo = a la izquierda de la cámara.
 *
 * Por qué "izquierda" es sumar: la cámara vive en `(cos θ, sin θ)·R` mirando
 * al centro, y su vector derecho es `(sin θ, 0, −cos θ)` = −d/dθ de su
 * posición. Sumar ángulo la desplaza hacia su izquierda.
 */
export function lightDirection(azimuthDeg: number, elevationDeg: number, out = new THREE.Vector3()): THREE.Vector3 {
  const az = ORBIT.center + THREE.MathUtils.degToRad(azimuthDeg);
  const el = THREE.MathUtils.degToRad(elevationDeg);
  return out.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
}

/** Dirección hacia la luz principal (sol / luna) del modo. Unitaria. */
export function keyLightDirection(mode: PlazaMode, out = new THREE.Vector3()): THREE.Vector3 {
  const { azimuth, elevation } = PLAZA_PALETTES[mode].light.key;
  return lightDirection(azimuth, elevation, out);
}

/**
 * Sombra proyectada del sol.
 *
 * La direccional se coloca a `distance` del centro en su dirección: la
 * intensidad de una direccional no depende de la distancia, pero la cámara de
 * sombra mira desde la propia luz, y todo lo que quede detrás de ella no
 * proyecta.
 *
 * `radius` es el radio de SUELO que cubre la ortográfica: el de arrastre
 * máximo de un muñeco (11) más medio metro. El arbolado (16,8) y las palmeras
 * (14,6) quedan fuera a propósito — su sombra la ponen calcas falsas de
 * `vegetation` — y así cada téxel cubre menos suelo con el mismo mapa.
 *
 * La ortográfica NO es cuadrada: vista desde un sol a ~46° de elevación, un
 * círculo de suelo de radio r se ve como una elipse de r × r·sin(elev). El
 * alto se ajusta a eso (más la altura de lo que proyecta, `casterHeight`), y
 * los téxeles verticales que antes se perdían en suelo fuera del parque
 * pasan a dar densidad: ~2,2 cm por téxel en un mapa de 1024.
 *
 * `map`: el mapa es el segundo pase completo de la escena en cada frame — es
 * presupuesto, no calidad. A 2048 la plaza bajaba a la mitad de fps y el borde
 * extra no se veía con el desenfoque PCF de `radius`.
 *
 * `extent` se conserva por compatibilidad: es el radio que tiene que cubrir la
 * capa que recibe la sombra en `PlazaRoom` (= `radius`).
 */
export const SUN = {
  distance: 60,
  radius: 11.5,
  extent: 11.5,
  casterHeight: 3.4,
  map: 1024,
  bias: -0.0004,
  normalBias: 0.03,
  blur: 1.6,
} as const;

/** Medidas de la ortográfica de sombra para una elevación de sol dada. */
export function sunShadowFrustum(elevationDeg: number) {
  const el = THREE.MathUtils.degToRad(elevationDeg);
  const halfW = SUN.radius;
  const halfH = SUN.radius * Math.sin(el) + SUN.casterHeight * Math.cos(el);
  // Profundidad: el disco de suelo inclinado ocupa ±r·cos(elev) a lo largo
  // del rayo, más lo alto de lo que proyecta.
  const depth = SUN.radius * Math.cos(el) + SUN.casterHeight + 2;
  return {
    left: -halfW,
    right: halfW,
    top: halfH,
    bottom: -halfH,
    near: SUN.distance - depth,
    far: SUN.distance + depth,
  };
}

/**
 * La luz va un pelo por debajo del centro del farol (`LAMP_LIGHT_Y`, de
 * `decor/furniture.ts`): sale hacia abajo y así no quema la capucha por dentro.
 */
const LAMP_LIGHT_DROP = 0.12;

/**
 * Posiciones de la luz de cada farola, leídas del MISMO layout que monta el
 * mobiliario (`buildDecorLayout`, que retira las del pasillo de cámara). Nunca a
 * mano: si se mueve o se quita una farola, su luz va detrás.
 */
export function lampLightPositions(): THREE.Vector3[] {
  return buildDecorLayout()
    .filter((d) => d.kind === "lamp")
    .map((d) => new THREE.Vector3(d.pos[0], (LAMP_LIGHT_Y - LAMP_LIGHT_DROP) * d.scale, d.pos[1]));
}

/**
 * IBL procedural: una cúpula con el degradado del cielo del modo, el suelo
 * por debajo del horizonte y un lóbulo de brillo hacia la luz principal,
 * prefiltrada con PMREM.
 *
 * Por qué no `RoomEnvironment` (lo usa la calle): es un INTERIOR — paneles
 * blancos en un techo gris —, y en un parque los brillos de pelo, agua y metal
 * tienen que reflejar cielo azul arriba y granito abajo, no fluorescentes.
 * Por qué no un HDR: prohibido (descarga, y un `preset` de drei suspende el
 * loader). Esto son ~4 ms al montar y cero bytes.
 *
 * El shader escribe radiancia LINEAL (el render target de PMREM es lineal; los
 * `THREE.Color` ya convierten el hex sRGB a lineal al construirse).
 *
 * Devuelve el render target entero (no solo su textura): al desmontar hay que
 * liberar también su framebuffer, y `texture.dispose()` no lo hace.
 */
export function buildEnvironment(gl: THREE.WebGLRenderer, mode: PlazaMode): THREE.WebGLRenderTarget {
  const { env } = PLAZA_PALETTES[mode].light;
  const scene = new THREE.Scene();
  const geometry = new THREE.SphereGeometry(10, 48, 24);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uZenith: { value: new THREE.Color(env.zenith) },
      uHorizon: { value: new THREE.Color(env.horizon) },
      uGround: { value: new THREE.Color(env.ground) },
      uGlow: { value: new THREE.Color(env.glow) },
      uSun: { value: keyLightDirection(mode) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uZenith, uHorizon, uGround, uGlow, uSun;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float up = d.y;
        // Cielo: horizonte claro que sube al cenit con una curva suave.
        vec3 sky = mix(uHorizon, uZenith, pow(clamp(up, 0.0, 1.0), 0.55));
        // Suelo: un filo claro justo bajo el horizonte (el pavimento lejano)
        // que cae enseguida al tono del granito.
        vec3 ground = mix(uHorizon * 0.8, uGround, smoothstep(0.0, 0.18, -up));
        vec3 col = up >= 0.0 ? sky : ground;
        // Lóbulo hacia el sol: el cielo es más claro en su lado. Ancho, no un
        // disco — el disco y su brillo especular ya los pone la direccional.
        float g = max(dot(d, normalize(uSun)), 0.0);
        col += uGlow * (pow(g, 6.0) * 0.6 + pow(g, 48.0) * 0.8) * step(0.0, up + 0.05);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  scene.add(new THREE.Mesh(geometry, material));

  const pmrem = new THREE.PMREMGenerator(gl);
  const target = pmrem.fromScene(scene, 0.02, 0.1, 50);
  pmrem.dispose();
  geometry.dispose();
  material.dispose();
  return target;
}
