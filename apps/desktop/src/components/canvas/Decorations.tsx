"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Decorations — Floating wireframe geometry + atmospheric elements.
 *
 * Placed at negative Z (behind the gameplay plane) so they never
 * interfere with physics or pointer events. Low-opacity wireframes
 * create depth and a premium "cosmic lab" atmosphere.
 */

interface ShapeData {
  position: [number, number, number];
  size: number;
  speed: number;
  color: string;
  opacity: number;
}

interface RingData {
  position: [number, number, number];
  size: number;
  tube: number;
  tilt: [number, number, number];
  speed: number;
  color: string;
  opacity: number;
}

const SHAPES: ShapeData[] = [
  { position: [-9, 14, -5], size: 1.4, speed: 0.25, color: "#c8ff00", opacity: 0.08 },
  { position: [8, 16, -8], size: 0.9, speed: 0.4, color: "#8b5cf6", opacity: 0.1 },
  { position: [-3, 11, -6], size: 0.7, speed: 0.55, color: "#22d3ee", opacity: 0.07 },
  { position: [11, 10, -10], size: 1.8, speed: 0.18, color: "#ec4899", opacity: 0.06 },
  { position: [0, 18, -7], size: 1.1, speed: 0.3, color: "#6366f1", opacity: 0.09 },
];

const RINGS: RingData[] = [
  { position: [-7, 16, -6], size: 2.2, tube: 0.015, tilt: [0.4, 0.6, 0], speed: 0.12, color: "#c8ff00", opacity: 0.1 },
  { position: [6, 12, -9], size: 1.6, tube: 0.012, tilt: [0.9, 0.2, 0.5], speed: 0.2, color: "#6366f1", opacity: 0.08 },
  { position: [0, 20, -5], size: 3.0, tube: 0.01, tilt: [0.1, 0, 0.3], speed: 0.08, color: "#22d3ee", opacity: 0.06 },
];

function FloatingShape({ position, size, speed, color, opacity }: ShapeData) {
  const ref = useRef<THREE.Mesh>(null);
  const baseY = position[1];

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.x = t * speed * 0.4;
    ref.current.rotation.y = t * speed * 0.6;
    ref.current.position.y = baseY + Math.sin(t * speed * 0.8) * 0.6;
  });

  return (
    <mesh ref={ref} position={position}>
      <octahedronGeometry args={[size, 0]} />
      <meshBasicMaterial
        color={color}
        wireframe
        transparent
        opacity={opacity}
        toneMapped={false}
      />
    </mesh>
  );
}

function FloatingRing({ position, size, tube, tilt, speed, color, opacity }: RingData) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.x = tilt[0] + t * speed * 0.3;
    ref.current.rotation.y = tilt[1] + t * speed * 0.5;
    ref.current.rotation.z = tilt[2] + t * speed * 0.2;
  });

  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[size, tube, 8, 48]} />
      <meshBasicMaterial
        color={color}
        wireframe
        transparent
        opacity={opacity}
        toneMapped={false}
      />
    </mesh>
  );
}

export function Decorations() {
  return (
    <group>
      {/* Floating wireframe octahedrons */}
      {SHAPES.map((shape, i) => (
        <FloatingShape key={`shape-${i}`} {...shape} />
      ))}

      {/* Floating wireframe rings */}
      {RINGS.map((ring, i) => (
        <FloatingRing key={`ring-${i}`} {...ring} />
      ))}

      {/* Horizon glow — thin accent line at ground level */}
      <mesh position={[0, -2, 0]}>
        <boxGeometry args={[35, 0.015, 0.015]} />
        <meshBasicMaterial
          color="#c8ff00"
          transparent
          opacity={0.15}
          toneMapped={false}
        />
      </mesh>

      {/* Ambient colored accent lights near gameplay area */}
      <pointLight position={[-10, 6, -5]} color="#6366f1" intensity={12} distance={25} decay={2} />
      <pointLight position={[10, 8, -5]} color="#ec4899" intensity={8} distance={20} decay={2} />
      <pointLight position={[0, 12, -8]} color="#22d3ee" intensity={6} distance={20} decay={2} />
    </group>
  );
}
