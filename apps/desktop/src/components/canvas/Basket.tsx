"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  RigidBody,
  CuboidCollider,
  IntersectionEnterPayload,
} from "@react-three/rapier";
import * as THREE from "three";
import type { PageCubeData } from "./PageCube";

/**
 * Basket — Basketball hoop with backboard, rim, net, and pole.
 *
 * Structure (side view):
 *
 *    ┌──────────┐  ← backboard (tall rectangle)
 *    │          │
 *    │          │
 *    └──────────┘
 *        ○────      ← rim (torus) extending forward from backboard
 *       /||||\
 *      / |||| \     ← net (cone wireframe hanging from rim)
 *       ════
 *        │          ← pole (cylinder going to ground)
 *        │
 *   ─────┴──────    ← ground
 *
 * Physics: rim colliders (two small cuboids at rim edges to bounce cubes),
 * backboard collider, and a sensor below the rim to detect scores.
 */

interface BasketProps {
  position: [number, number, number];
  onScore?: (pageData: PageCubeData) => void;
}

/** Generate net vertices as a cone of lines from rim to bottom */
function generateNetLines(segments: number, rimRadius: number, depth: number) {
  const lines: { start: [number, number, number]; end: [number, number, number] }[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const topX = Math.cos(angle) * rimRadius;
    const topZ = Math.sin(angle) * rimRadius;
    const bottomX = Math.cos(angle) * rimRadius * 0.3;
    const bottomZ = Math.sin(angle) * rimRadius * 0.3;
    lines.push({
      start: [topX, 0, topZ],
      end: [bottomX, -depth, bottomZ],
    });
  }
  return lines;
}

export function Basket({ position, onScore }: BasketProps) {
  const rimRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const netLines = useMemo(() => generateNetLines(12, 1.35, 1.6), []);

  useFrame((state) => {
    if (rimRef.current) {
      const mat = rimRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.5 + 0.5 * Math.sin(state.clock.elapsedTime * 3);
    }
    if (glowRef.current) {
      glowRef.current.intensity = 20 + 8 * Math.sin(state.clock.elapsedTime * 3);
    }
  });

  const handleScore = (payload: IntersectionEnterPayload) => {
    const rigidBodyObject = payload.other.rigidBodyObject;
    if (!rigidBodyObject) return;
    const userData = rigidBodyObject.userData as { pageData?: PageCubeData } | undefined;
    if (userData?.pageData && onScore) {
      onScore(userData.pageData);
    }
  };

  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      {/* === Physics colliders === */}
      {/* Backboard */}
      <CuboidCollider args={[0.12, 2, 1.2]} position={[1.35, 1.5, 0]} restitution={0.4} />
      {/* Rim left edge */}
      <CuboidCollider args={[0.1, 0.1, 0.1]} position={[-1.35, 0, 0]} restitution={0.6} />
      {/* Rim right edge (near backboard) */}
      <CuboidCollider args={[0.1, 0.1, 0.1]} position={[1.05, 0, 0]} restitution={0.6} />

      {/* Score sensor — area below the rim */}
      <CuboidCollider
        args={[0.8, 0.3, 0.8]}
        position={[0, -0.8, 0]}
        sensor
        onIntersectionEnter={handleScore}
      />

      <group>
        {/* ========== POLE — vertical cylinder to ground ========== */}
        <mesh position={[1.35, -2, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 7, 8]} />
          <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* ========== BACKBOARD — white rectangle ========== */}
        <mesh position={[1.35, 1.5, 0]} castShadow>
          <boxGeometry args={[0.15, 4, 2.4]} />
          <meshStandardMaterial color="#eeeeee" metalness={0.1} roughness={0.6} />
        </mesh>
        {/* Backboard inner rectangle (target square) */}
        <mesh position={[1.26, 1.7, 0]}>
          <boxGeometry args={[0.02, 1.6, 1.4]} />
          <meshStandardMaterial
            color="#ff4444"
            emissive="#ff4444"
            emissiveIntensity={0.3}
            toneMapped={false}
          />
        </mesh>

        {/* ========== ARM — horizontal bar from backboard to rim ========== */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.4, 0.08, 0.08]} />
          <meshStandardMaterial color="#ff6600" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* ========== RIM — orange torus ========== */}
        <mesh ref={rimRef} position={[0, 0, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
          <torusGeometry args={[1.35, 0.05, 8, 32]} />
          <meshStandardMaterial
            color="#ff6600"
            emissive="#ff6600"
            emissiveIntensity={1.5}
            metalness={0.9}
            roughness={0.1}
            toneMapped={false}
          />
        </mesh>

        {/* ========== NET — vertical lines hanging from rim ========== */}
        {netLines.map((line, i) => {
          const sx = line.start[0];
          const sy = line.start[1];
          const sz = line.start[2];
          const ex = line.end[0];
          const ey = line.end[1];
          const ez = line.end[2];
          const mx = (sx + ex) / 2;
          const my = (sy + ey) / 2;
          const mz = (sz + ez) / 2;
          const len = Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2 + (ez - sz) ** 2);

          return (
            <mesh
              key={`net-${i}`}
              position={[mx, my, mz]}
              rotation={[
                Math.atan2(
                  Math.sqrt((ex - sx) ** 2 + (ez - sz) ** 2),
                  ey - sy
                ),
                Math.atan2(ex - sx, ez - sz),
                0,
              ]}
            >
              <cylinderGeometry args={[0.008, 0.008, len, 3]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
            </mesh>
          );
        })}

        {/* Net horizontal rings */}
        {[0.25, 0.55, 0.85].map((t, i) => (
          <mesh
            key={`net-ring-${i}`}
            position={[0, -t * 1.6, 0]}
            rotation={[Math.PI * 0.5, 0, 0]}
          >
            <torusGeometry args={[1.35 * (1 - t * 0.65), 0.01, 4, 16]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
          </mesh>
        ))}

        {/* ========== GLOW ========== */}
        <pointLight
          ref={glowRef}
          position={[0, 0, 0.5]}
          color="#ff6600"
          intensity={20}
          distance={6}
          decay={2}
        />
      </group>
    </RigidBody>
  );
}
