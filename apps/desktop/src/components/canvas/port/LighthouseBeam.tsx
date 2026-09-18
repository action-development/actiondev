"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { beamAt } from "./lighthouse-beam";

/**
 * Haz de luz del faro (ver `lighthouse-beam.ts` para el giro). Un cono plano
 * con degradado suave en shader: se desvanece a lo largo y por los bordes,
 * aditivo para que ilumine el cielo en vez de taparlo. Coordenadas locales:
 * origen = linterna.
 */

const LENGTH = 70;
const SPREAD = 0.075; // semiapertura en radianes

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// vUv.x: 0 en la linterna → 1 en la punta. vUv.y: 0..1 de un borde al otro.
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float along = pow(1.0 - vUv.x, 1.6);
    float edge = 1.0 - abs(vUv.y * 2.0 - 1.0);
    float core = smoothstep(0.0, 0.9, edge);
    float a = along * core * uIntensity;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

function beamGeometry() {
  // Abanico: vértice en la linterna, arco en la punta. UV x = distancia, y = través.
  const segs = 8;
  const pos: number[] = [0, 0, 0];
  const uv: number[] = [0, 0.5];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const ang = -SPREAD + t * SPREAD * 2;
    pos.push(Math.cos(ang), Math.sin(ang), 0);
    uv.push(1, t);
  }
  const idx: number[] = [];
  for (let i = 1; i <= segs; i++) idx.push(0, i, i + 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

export function LighthouseBeam({ strength = 1, color = "#fff2c8" }: { strength?: number; color?: string }) {
  const beamRef = useRef<THREE.Mesh>(null);
  const flareRef = useRef<THREE.MeshBasicMaterial>(null);

  const geometry = useMemo(() => beamGeometry(), []);
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color(color) }, uIntensity: { value: 0 } }), [color]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const b = beamAt(state.clock.elapsedTime);
    const mesh = beamRef.current;
    if (mesh) {
      // Ligeramente elevado sobre el horizonte, hacia el lado que toque.
      mesh.rotation.z = b.side >= 0 ? 0.06 : Math.PI - 0.06;
      mesh.scale.set(LENGTH * Math.max(0.04, b.length), LENGTH * Math.max(0.04, b.length), 1);
      uniforms.uIntensity.value = 0.32 * b.intensity * strength;
    }
    if (flareRef.current) flareRef.current.opacity = b.flare * 0.85 * strength;
  });

  return (
    <group>
      <mesh ref={beamRef} geometry={geometry} renderOrder={1}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          fog={false}
        />
      </mesh>
      {/* Destello cuando la óptica mira al visitante */}
      <mesh position={[0, 0, 0.2]} renderOrder={1}>
        <circleGeometry args={[2.2, 24]} />
        <meshBasicMaterial
          ref={flareRef}
          color={color}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          fog={false}
        />
      </mesh>
    </group>
  );
}
