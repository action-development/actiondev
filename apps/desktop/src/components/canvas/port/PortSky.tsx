"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PortPalette } from "./time-of-day";

/**
 * Cielo de cómic — un único plano lejano con shader.
 *
 * Por qué un plano y no una esfera: la cámara es fija (fov 40, mira a -z), así
 * que solo se ve un rectángulo de cielo. El plano da coordenadas de mundo
 * directas para colocar el astro en el mismo sitio que su reflejo en la ría
 * (`PortWater` usa `SKY_Z` y `orbWorldX` para alinear el brillo).
 *
 * Lenguaje visual:
 *  - Degradado en BANDAS (cuantizado), no continuo: el cielo de un cómic está
 *    pintado en 5-6 tintas, no en 16 millones de colores.
 *  - Trama de medios tonos (halftone) alrededor del astro y sobre el horizonte,
 *    en espacio de pantalla para que los puntos tengan tamaño constante.
 *  - Astro con contorno grueso. De noche, luna creciente recortada.
 */

export const SKY_Z = -170;
/** Y de mundo donde el cielo toca el horizonte del agua a esta distancia. */
export const SKY_HORIZON_Y = -8;
const SKY_HEIGHT = 80;
const SKY_HALF_WIDTH = 150;

export function orbWorldX(p: PortPalette) {
  return p.orbX * SKY_HALF_WIDTH * 0.62;
}

export function orbWorldY(p: PortPalette) {
  return SKY_HORIZON_Y + p.orbY * SKY_HEIGHT * 0.8;
}

const vertexShader = /* glsl */ `
  varying vec3 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec3 vW;

  uniform float uTime;
  uniform vec3 uTop, uMid, uHorizon, uOrb, uHalftone, uOutline;
  uniform vec2 uOrbPos;
  uniform float uOrbSize, uIsMoon, uStars;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    float h = clamp((vW.y - ${SKY_HORIZON_Y.toFixed(1)}) / ${SKY_HEIGHT.toFixed(1)}, 0.0, 1.0);

    // Degradado de 3 colores cuantizado a 7 bandas.
    float hq = floor(h * 7.0) / 7.0;
    vec3 col = hq < 0.35
      ? mix(uHorizon, uMid, hq / 0.35)
      : mix(uMid, uTop, (hq - 0.35) / 0.65);

    // --- Astro ---
    vec2 d = vW.xy - uOrbPos;
    float r = length(d);
    float disk = 1.0 - step(uOrbSize, r);
    float ring = step(uOrbSize, r) * (1.0 - step(uOrbSize + 0.9, r));
    // Luna: se recorta un segundo disco desplazado → creciente.
    float bite = uIsMoon * (1.0 - step(uOrbSize * 0.92, length(d - vec2(uOrbSize * 0.45, uOrbSize * 0.2))));
    disk *= 1.0 - bite;
    ring *= 1.0 - bite;

    // --- Trama de medios tonos: halo del astro + franja del horizonte ---
    float glow = exp(-max(r - uOrbSize, 0.0) / (uOrbSize * 1.6));
    float band = (1.0 - smoothstep(0.0, 0.28, h)) * 0.75;
    float amount = clamp(max(glow * (1.0 - uIsMoon * 0.5), band), 0.0, 1.0);
    vec2 cell = gl_FragCoord.xy / 9.0;
    // Rejilla rotada 45º, como la trama de imprenta.
    cell = mat2(0.7071, -0.7071, 0.7071, 0.7071) * cell;
    float dotR = amount * 0.55;
    float dots = 1.0 - step(dotR, length(fract(cell) - 0.5));
    col = mix(col, uHalftone, dots * 0.85);

    // --- Estrellas en cruz, solo arriba ---
    if (uStars > 0.0) {
      vec2 g = vW.xy / 3.2;
      vec2 id = floor(g);
      float rnd = hash(id);
      if (rnd > 0.965) {
        vec2 f = fract(g) - 0.5;
        float tw = 0.6 + 0.4 * sin(uTime * (1.0 + rnd * 3.0) + rnd * 40.0);
        float cross = max(1.0 - smoothstep(0.0, 0.05, abs(f.x)) , 1.0 - smoothstep(0.0, 0.05, abs(f.y)));
        cross *= 1.0 - smoothstep(0.08, 0.3 * tw, length(f));
        col = mix(col, vec3(1.0, 0.98, 0.9), cross * uStars * smoothstep(0.2, 0.6, h));
      }
    }

    col = mix(col, uOrb, disk);
    col = mix(col, uOutline, ring);

    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Cloud {
  x: number;
  y: number;
  z: number;
  scale: number;
  speed: number;
  puffs: [number, number, number][];
}

/** Nubes de cómic: racimos de círculos planos con base recta. Deterministas. */
const CLOUDS: Cloud[] = [
  { x: -70, y: 34, z: -150, scale: 1.4, speed: 0.6, puffs: [[-6, 0, 5], [0, 2.5, 6.5], [6.5, 0.5, 5], [12, -0.5, 3.5]] },
  { x: 40, y: 44, z: -155, scale: 1.2, speed: 0.45, puffs: [[-5, 0, 4], [1, 2, 5.5], [7, 0, 4.5]] },
  { x: -10, y: 20, z: -140, scale: 1.0, speed: 0.8, puffs: [[-4, 0, 3.5], [1.5, 1.5, 4.5], [6.5, 0, 3.2]] },
  { x: 95, y: 26, z: -150, scale: 1.3, speed: 0.55, puffs: [[-6, 0, 4], [0, 2, 5.5], [6, 0.5, 4.5], [11, 0, 3]] },
];

const CLOUD_WRAP = 190;

export function PortSky({ palette }: { palette: PortPalette }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTop: { value: new THREE.Color() },
      uMid: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uOrb: { value: new THREE.Color() },
      uHalftone: { value: new THREE.Color() },
      uOutline: { value: new THREE.Color() },
      uOrbPos: { value: new THREE.Vector2() },
      uOrbSize: { value: 8 },
      uIsMoon: { value: 0 },
      uStars: { value: 0 },
    }),
    [],
  );

  // Paleta → uniforms en render (barato, sin recompilar: mismo objeto uniforms).
  uniforms.uTop.value.set(palette.skyTop);
  uniforms.uMid.value.set(palette.skyMid);
  uniforms.uHorizon.value.set(palette.skyHorizon);
  uniforms.uOrb.value.set(palette.orb);
  uniforms.uHalftone.value.set(palette.halftone);
  uniforms.uOutline.value.set(palette.outline);
  uniforms.uOrbPos.value.set(orbWorldX(palette), orbWorldY(palette));
  uniforms.uOrbSize.value = palette.orbSize;
  uniforms.uIsMoon.value = palette.isMoon;
  uniforms.uStars.value = palette.stars;

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group>
      <mesh position={[0, SKY_HORIZON_Y + SKY_HEIGHT / 2 - 6, SKY_Z]} renderOrder={-2}>
        <planeGeometry args={[SKY_HALF_WIDTH * 2 + 200, SKY_HEIGHT + 60]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      <ComicClouds palette={palette} />
    </group>
  );
}

/** Nubes de cómic a la deriva. También se usan sobre el fondo pintado. */
export function ComicClouds({ palette }: { palette: PortPalette }) {
  const cloudRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    for (let i = 0; i < CLOUDS.length; i++) {
      const g = cloudRefs.current[i];
      if (!g) continue;
      g.position.x += CLOUDS[i].speed * dt;
      if (g.position.x > CLOUD_WRAP) g.position.x = -CLOUD_WRAP;
    }
  });

  return (
    <group>
      {CLOUDS.map((c, i) => (
        <group
          key={i}
          ref={(el) => { cloudRefs.current[i] = el; }}
          position={[c.x, c.y, c.z]}
          scale={c.scale}
        >
          {/*
            Tres capas de los mismos círculos: contorno (mayor, detrás), sombra
            (desplazada abajo) y luz (encima, algo menor). La media luna de sombra
            que asoma por debajo es el sombreado de cómic, sin shader.
          */}
          {c.puffs.map(([px, py, pr], j) => (
            <mesh key={`o${j}`} position={[px, py - 0.4, -0.2]}>
              <circleGeometry args={[pr + 0.45, 28]} />
              <meshBasicMaterial color={palette.outline} fog={false} toneMapped={false} />
            </mesh>
          ))}
          {c.puffs.map(([px, py, pr], j) => (
            <mesh key={`s${j}`} position={[px, py - 0.8, -0.1]}>
              <circleGeometry args={[pr, 28]} />
              <meshBasicMaterial color={palette.cloudShade} fog={false} toneMapped={false} />
            </mesh>
          ))}
          {c.puffs.map(([px, py, pr], j) => (
            <mesh key={`f${j}`} position={[px, py + 0.3, 0]}>
              <circleGeometry args={[pr * 0.92, 28]} />
              <meshBasicMaterial color={palette.cloud} fog={false} toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
