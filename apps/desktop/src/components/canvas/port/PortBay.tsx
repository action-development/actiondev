"use client";

import { LighthouseBeam } from "./LighthouseBeam";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PortPalette } from "./time-of-day";
import { SKY_Z, orbWorldX } from "./PortSky";
import { WATER_Y } from "./crane-logic";
import { getToonGradient } from "./toon";

/**
 * La ría de Vigo: agua, Cíes al fondo, Morrazo a la derecha, costa sur a la
 * izquierda, bateas de mejillón y grúas lejanas de la terminal de Bouzas.
 *
 * Todo lo lejano es SILUETA PLANA (ShapeGeometry + MeshBasicMaterial) con un
 * duplicado oscuro desplazado como contorno: así se pinta un fondo de cómic,
 * por planos, y cuesta un draw call por plano. La niebla de la escena aclara
 * las capas más lejanas → perspectiva atmosférica gratis.
 */

// ---------------------------------------------------------------- AGUA -------

const WATER_NEAR_Z = 14;
const WATER_FAR_Z = SKY_Z + 8;

const waterVertex = /* glsl */ `
  varying vec3 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const waterFragment = /* glsl */ `
  precision highp float;
  varying vec3 vW;
  uniform float uTime, uGlint, uOrbX;
  uniform vec3 uFar, uNear, uLine, uOrb, uFog;

  float hash(float n) { return fract(sin(n * 91.345) * 47453.5453); }

  void main() {
    // 0 cerca → 1 horizonte
    float d = clamp((${WATER_NEAR_Z.toFixed(1)} - vW.z) / ${(WATER_NEAR_Z - WATER_FAR_Z).toFixed(1)}, 0.0, 1.0);
    vec3 col = mix(uNear, uFar, floor(pow(d, 0.55) * 5.0) / 5.0);

    // Rayas de ola en filas: trazos horizontales discontinuos, cada fila con
    // su propio largo y deriva. Se apagan lejos para no generar aliasing.
    float rowH = 2.2;
    float row = floor(vW.z / rowH);
    float fy = fract(vW.z / rowH);
    float width = mix(0.06, 0.22, d);
    float inRow = 1.0 - smoothstep(width, width + 0.03, abs(fy - 0.5));
    float len = 5.0 + hash(row) * 9.0;
    float drift = (hash(row + 7.0) - 0.5) * 0.9 * uTime;
    float dash = step(0.62, fract((vW.x + drift + hash(row + 3.0) * 40.0) / len));
    float lines = inRow * dash * (1.0 - smoothstep(0.45, 0.9, d));
    col = mix(col, uLine, lines * 0.8);

    // Reflejo del astro: columna que apunta del ojo al sol/luna.
    float colX = uOrbX * (28.0 - vW.z) / ${(28 - SKY_Z).toFixed(1)};
    float gw = mix(1.2, 14.0, d);
    float glint = exp(-pow((vW.x - colX) / gw, 2.0));
    float gdash = step(0.45, fract((vW.x + hash(row) * 20.0 + uTime * 0.6) / (2.0 + hash(row + 1.0) * 3.0)));
    col = mix(col, uOrb, glint * gdash * inRow * uGlint);
    col = mix(col, uOrb, glint * uGlint * 0.18);

    col = mix(col, uFog, smoothstep(0.55, 1.0, d) * 0.55);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function Water({ palette }: { palette: PortPalette }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uGlint: { value: 0 },
      uOrbX: { value: 0 },
      uFar: { value: new THREE.Color() },
      uNear: { value: new THREE.Color() },
      uLine: { value: new THREE.Color() },
      uOrb: { value: new THREE.Color() },
      uFog: { value: new THREE.Color() },
    }),
    [],
  );
  uniforms.uGlint.value = palette.glint;
  uniforms.uOrbX.value = orbWorldX(palette);
  uniforms.uFar.value.set(palette.waterFar);
  uniforms.uNear.value.set(palette.waterNear);
  uniforms.uLine.value.set(palette.waterLine);
  uniforms.uOrb.value.set(palette.orb);
  uniforms.uFog.value.set(palette.fog);

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  const depth = WATER_NEAR_Z - WATER_FAR_Z;
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, WATER_Y, WATER_NEAR_Z - depth / 2]}
      renderOrder={-1}
    >
      <planeGeometry args={[520, depth]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={waterVertex}
        fragmentShader={waterFragment}
        uniforms={uniforms}
        fog={false}
        toneMapped={false}
      />
    </mesh>
  );
}

// ----------------------------------------------------------- SILUETAS -------

/** Perfil [x, altura] sobre el agua → Shape cerrada por abajo. */
function profileShape(points: [number, number][], base = -4): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(points[0][0], base);
  for (const [x, y] of points) s.lineTo(x, y);
  s.lineTo(points[points.length - 1][0], base);
  s.closePath();
  return s;
}

interface SilhouetteProps {
  points: [number, number][];
  z: number;
  color: string;
  outline: string;
  /** Grosor del contorno en unidades de mundo (crece con la distancia). */
  stroke: number;
  /** Escala [ancho, alto] del perfil — ver CIES_SCALE. */
  scale?: [number, number];
}

function Silhouette({ points, z, color, outline, stroke, scale = [1, 1] }: SilhouetteProps) {
  const geo = useMemo(() => new THREE.ShapeGeometry(profileShape(points)), [points]);
  return (
    <group position={[0, WATER_Y, z]} scale={[scale[0], scale[1], 1]}>
      <mesh geometry={geo} position={[0, stroke / scale[1], -0.3]} scale={[1 + stroke * 0.004, 1, 1]}>
        <meshBasicMaterial color={outline} toneMapped={false} />
      </mesh>
      <mesh geometry={geo}>
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

// Perfiles dibujados a mano a partir de la silueta real vista desde Vigo:
// Monteagudo (norte, derecha) · playa de Rodas · Monte Faro con el faro ·
// San Martiño (sur, izquierda) separada por el Freu da Porta.
// Muchos vértices a propósito: con 8-10 puntos salían pirámides. La costa de
// las Cíes vista desde Vigo es de lomas redondeadas con crestas de roca.
const CIES_SAN_MARTINO: [number, number][] = [
  [-80, 0], [-77, 1.2], [-74, 2.6], [-71, 4.4], [-68.5, 5.2], [-66, 6.6], [-63.5, 7.6], [-61.5, 7.9],
  [-59.5, 7.3], [-58, 7.6], [-56, 6.8], [-53.5, 5.1], [-51, 3.9], [-48.5, 2.2], [-46, 0.9], [-44, 0],
];
const CIES_FARO: [number, number][] = [
  [-39, 0], [-36.5, 1.4], [-34, 3.1], [-31.5, 4.6], [-29, 6.8], [-26.5, 8.2], [-24, 10.1], [-21.5, 11.6],
  [-19.5, 13.4], [-18, 14.1], [-16.8, 15.6], [-15.4, 15.2], [-14, 14.3], [-12.2, 13.6], [-10, 11.5],
  [-8, 10.4], [-5.5, 8.1], [-3, 6.6], [-0.5, 4.4], [2, 2.9], [4.5, 1.4], [7, 0.5],
];
const CIES_MONTEAGUDO: [number, number][] = [
  [9, 0.5], [11.5, 1.8], [14, 3.6], [16.5, 5.2], [19, 7.4], [21.5, 8.8], [24, 10.6], [26.5, 11.9],
  [28.5, 12.6], [30.5, 12.2], [32, 12.9], [34, 12.1], [36.5, 10.4], [39, 8.9], [41.5, 6.8],
  [44, 5.3], [47, 3.4], [50, 1.8], [53, 0.6], [55, 0],
];
const MORRAZO: [number, number][] = [
  [46, 0], [50, 1.8], [54, 3.9], [58, 6.2], [62, 8.1], [66, 10.8], [70, 12.4], [74, 15.1],
  [78, 16.8], [82, 18.9], [86, 19.6], [90, 21.4], [95, 20.8], [100, 21.9], [106, 23.6], [112, 23.1],
  [120, 24.8], [130, 24.2], [140, 25.5],
];
const SOUTH_COAST: [number, number][] = [
  [-150, 18], [-135, 16], [-120, 12], [-108, 9], [-96, 6.5], [-86, 3], [-78, 0.8], [-72, 0],
];

/**
 * Las Cíes son largas y bajas (≈1:6 alto/ancho vistas desde Vigo). Los perfiles
 * se dibujan con alturas legibles y se aplastan aquí; sin esto se leían como
 * pirámides.
 */
const CIES_SCALE: [number, number] = [1.3, 0.55];

/** Posición del faro de Monte Faro (sobre la cima de CIES_FARO, ya escalada). */
export const LIGHTHOUSE: [number, number, number] = [-16.4 * CIES_SCALE[0], WATER_Y + 15.4 * CIES_SCALE[1], -118];

function Lighthouse({ palette }: { palette: PortPalette }) {
  const lampRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Destello real del faro de Cíes: grupos de 2 destellos. Aproximado.
    const phase = t % 8;
    const flash = phase < 0.35 || (phase > 0.9 && phase < 1.25) ? 1 : 0.15;
    if (lampRef.current) lampRef.current.opacity = 0.25 + 0.75 * flash * Math.max(palette.lamps, 0.3);
  });

  return (
    <group position={LIGHTHOUSE}>
      <mesh position={[0, 1.4, 0.2]}>
        <planeGeometry args={[1.2, 2.8]} />
        <meshBasicMaterial color={palette.lamps > 0.5 ? "#e9e4d0" : "#ffffff"} toneMapped={false} />
      </mesh>
      <mesh position={[0, 3.1, 0.3]}>
        <circleGeometry args={[0.8, 16]} />
        <meshBasicMaterial ref={lampRef} color="#c8ff00" transparent toneMapped={false} fog={false} />
      </mesh>
      <group position={[0, 3.1, 0.25]}>
        <LighthouseBeam strength={Math.max(palette.lamps, 0.35)} color="#e9ffb0" />
      </group>
    </group>
  );
}

// ------------------------------------------------------------- BATEAS -------

/**
 * Bateas de mejillón: plataforma de madera + postes + caseta. 3 InstancedMesh
 * (plataformas, postes, casetas) = 3 draw calls para todas.
 */
const BATEAS: [number, number, number][] = [
  [-46, 0, -34], [-30, 0, -52], [-12, 0, -40], [4, 0, -62], [22, 0, -36],
  [38, 0, -55], [-60, 0, -70], [58, 0, -78], [-22, 0, -84], [12, 0, -95],
];

function Bateas({ palette }: { palette: PortPalette }) {
  const platRef = useRef<THREE.InstancedMesh>(null);
  const postRef = useRef<THREE.InstancedMesh>(null);
  const hutRef = useRef<THREE.InstancedMesh>(null);
  const gradient = getToonGradient();

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    BATEAS.forEach(([x, , z], i) => {
      const rot = ((i * 37) % 10) * 0.03 - 0.15;
      o.position.set(x, WATER_Y + 0.35, z);
      o.rotation.set(0, rot, 0);
      o.updateMatrix();
      platRef.current?.setMatrixAt(i, o.matrix);

      o.position.set(x + (i % 2 ? 1.6 : -1.4), WATER_Y + 0.95, z - 0.6);
      o.updateMatrix();
      hutRef.current?.setMatrixAt(i, o.matrix);

      for (let p = 0; p < 4; p++) {
        const px = x + (p < 2 ? -2.6 : 2.6);
        const pz = z + (p % 2 ? -1.8 : 1.8);
        o.position.set(px, WATER_Y + 0.9, pz);
        o.rotation.set(0, 0, 0);
        o.updateMatrix();
        postRef.current?.setMatrixAt(i * 4 + p, o.matrix);
      }
    });
    for (const m of [platRef.current, postRef.current, hutRef.current]) {
      if (m) m.instanceMatrix.needsUpdate = true;
    }
  }, []);

  const wood = palette.lamps > 0.5 ? "#3a2f3a" : "#6b4a33";
  return (
    <group>
      <instancedMesh ref={platRef} args={[undefined, undefined, BATEAS.length]}>
        <boxGeometry args={[6, 0.35, 4]} />
        <meshToonMaterial color={wood} gradientMap={gradient} />
      </instancedMesh>
      <instancedMesh ref={postRef} args={[undefined, undefined, BATEAS.length * 4]}>
        <boxGeometry args={[0.18, 1.3, 0.18]} />
        <meshToonMaterial color={palette.outline} gradientMap={gradient} />
      </instancedMesh>
      <instancedMesh ref={hutRef} args={[undefined, undefined, BATEAS.length]}>
        <boxGeometry args={[1.4, 0.9, 1.1]} />
        <meshToonMaterial color={palette.lamps > 0.5 ? "#8a8fa8" : "#f2efe6"} gradientMap={gradient} />
      </instancedMesh>
    </group>
  );
}

// ------------------------------------------------- GRÚAS DE BOUZAS ----------

/** Silueta de grúa portuaria lejana — la firma del puerto, al fondo izquierdo. */
function DistantCrane({ x, z, color, lamp }: { x: number; z: number; color: string; lamp: number }) {
  return (
    <group position={[x, WATER_Y, z]}>
      <mesh position={[-2.2, 6, 0]}><planeGeometry args={[0.6, 12]} /><meshBasicMaterial color={color} /></mesh>
      <mesh position={[2.2, 6, 0]}><planeGeometry args={[0.6, 12]} /><meshBasicMaterial color={color} /></mesh>
      <mesh position={[3, 12.3, 0]}><planeGeometry args={[19, 0.9]} /><meshBasicMaterial color={color} /></mesh>
      <mesh position={[0, 15, 0]} rotation={[0, 0, 0.5]}><planeGeometry args={[0.35, 7]} /><meshBasicMaterial color={color} /></mesh>
      <mesh position={[0, 15, 0]} rotation={[0, 0, -0.5]}><planeGeometry args={[0.35, 7]} /><meshBasicMaterial color={color} /></mesh>
      <mesh position={[12.3, 12.3, 0.05]}>
        <circleGeometry args={[0.45, 10]} />
        <meshBasicMaterial color="#ff4a3a" transparent opacity={0.2 + 0.8 * lamp} toneMapped={false} />
      </mesh>
    </group>
  );
}

// -------------------------------------------------------------- BAY ---------

export function PortBay({ palette }: { palette: PortPalette }) {
  const p = palette;
  return (
    <group>
      <Water palette={p} />

      <Silhouette points={SOUTH_COAST} z={-128} color={p.islandFar} outline={p.outline} stroke={0.9} />
      <Silhouette points={CIES_SAN_MARTINO} z={-122} color={p.islandFar} outline={p.outline} stroke={0.8} scale={CIES_SCALE} />
      <Silhouette points={CIES_FARO} z={-120} color={p.islandNear} outline={p.outline} stroke={0.8} scale={CIES_SCALE} />
      <Silhouette points={CIES_MONTEAGUDO} z={-121} color={p.islandFar} outline={p.outline} stroke={0.8} scale={CIES_SCALE} />
      {/* Playa de Rodas: la lengua de arena que une Faro y Monteagudo. */}
      <mesh position={[8 * CIES_SCALE[0], WATER_Y + 0.3, -119.6]}>
        <planeGeometry args={[11, 0.55]} />
        <meshBasicMaterial color={p.sand} toneMapped={false} />
      </mesh>
      <Lighthouse palette={p} />
      <Silhouette points={MORRAZO} z={-92} color={p.islandNear} outline={p.outline} stroke={0.7} scale={[1, 0.7]} />

      <DistantCrane x={-58} z={-44} color={p.islandNear} lamp={p.lamps} />
      <DistantCrane x={-80} z={-52} color={p.islandFar} lamp={p.lamps} />

      <Bateas palette={p} />
    </group>
  );
}
