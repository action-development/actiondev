"use client";

import React, { Suspense, useRef, useMemo, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
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
  thrownIds: React.RefObject<Set<string>>;
  gatedIds: React.RefObject<Set<string>>;
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

const CONFETTI_COUNT = 60;
const CONFETTI_COLORS = ["#c8ff00", "#6366f1", "#ec4899", "#22d3ee", "#ffffff", "#ff6600"];

interface ConfettiParticle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  rotSpeed: number;
  scale: number;
  color: THREE.Color;
  life: number;
}

function Confetti({ active }: { active: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particles = useRef<ConfettiParticle[]>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const prevActive = useRef(0);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Spawn new burst when active changes
    if (active !== prevActive.current) {
      prevActive.current = active;
      for (let i = 0; i < CONFETTI_COUNT; i++) {
        particles.current.push({
          x: (Math.random() - 0.5) * 1.5,
          y: -0.5,
          z: (Math.random() - 0.5) * 1.5,
          vx: (Math.random() - 0.5) * 6,
          vy: Math.random() * 8 + 4,
          vz: (Math.random() - 0.5) * 6,
          rotSpeed: (Math.random() - 0.5) * 10,
          scale: 0.06 + Math.random() * 0.08,
          color: new THREE.Color(CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]),
          life: 1.5 + Math.random() * 1,
        });
      }
    }

    // Update particles
    const alive = particles.current;
    for (let i = alive.length - 1; i >= 0; i--) {
      const p = alive[i];
      p.life -= delta;
      if (p.life <= 0) { alive.splice(i, 1); continue; }
      p.vy -= 9 * delta;
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      p.vx *= 0.98;
      p.vz *= 0.98;
    }

    // Write to instanced mesh
    mesh.count = Math.min(alive.length, CONFETTI_COUNT * 3);
    for (let i = 0; i < mesh.count; i++) {
      const p = alive[i];
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.life * p.rotSpeed, p.life * p.rotSpeed * 0.7, 0);
      dummy.scale.setScalar(p.scale * Math.min(p.life * 2, 1));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, p.color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CONFETTI_COUNT * 3]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial transparent opacity={0.9} toneMapped={false} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}


/**
 * Logo printed on the backboard face.
 * The webp is already RGBA with transparent background — no canvas processing needed.
 * Black marks on transparent → renders as black-on-white backboard, like a real sponsor logo.
 */
function BrandMark({ rimRadius }: { rimRadius: number }) {
  const tex = useTexture("/logos/logo.webp");
  return (
    // Plane faces -X (toward player). Local X → world Z (width), local Y → world Y.
    // Logo is 1563×625 = 2.5:1 → plane 5.2 wide × 2.08 tall preserves ratio.
    <mesh position={[rimRadius - 0.082, 2.1, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={[3.8, 1.52]} />
      <meshStandardMaterial
        map={tex}
        transparent
        alphaTest={0.01}
        roughness={0.85}
        metalness={0}
      />
    </mesh>
  );
}

export function Basket({ position, thrownIds, gatedIds, onScore }: BasketProps) {
  const rimMatRef = useRef<THREE.MeshStandardMaterial>(null!);
  const glowRef   = useRef<THREE.PointLight>(null);
  const [confettiBurst, setConfettiBurst] = useState(0);

  const rimRadius = 1.8;
  const netDepth = 2.0;
  const netLines = useMemo(() => generateNetLines(12, rimRadius, netDepth), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = Math.sin(t * 3);
    if (rimMatRef.current) rimMatRef.current.emissiveIntensity = 1.5 + 0.5 * pulse;
    if (glowRef.current)   glowRef.current.intensity  = 20 + 8 * pulse;
  });

  const handleScore = useCallback((payload: IntersectionEnterPayload) => {
    const rigidBodyObject = payload.other.rigidBodyObject;
    if (!rigidBodyObject) return;
    const userData = rigidBodyObject.userData as { pageData?: PageCubeData } | undefined;
    if (!userData?.pageData) return;

    // Only count scores for cubes the player actively threw, and prevent double-counting
    if (!thrownIds.current.has(userData.pageData.id)) return;
    if (gatedIds.current.has(userData.pageData.id)) return;
    thrownIds.current.delete(userData.pageData.id);
    gatedIds.current.add(userData.pageData.id);

    setConfettiBurst((c) => c + 1);
    onScore?.(userData.pageData);
  }, [onScore]);

  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      {/* === Physics colliders === */}
      {/* Backboard */}
      <CuboidCollider args={[0.12, 2.5, 1.6]} position={[rimRadius, 1.5, 0]} restitution={0.4} />
      {/* Rim left edge */}
      <CuboidCollider args={[0.12, 0.12, 0.12]} position={[-rimRadius, 0, 0]} restitution={0.6} />
      {/* Rim right edge (near backboard) */}
      <CuboidCollider args={[0.12, 0.12, 0.12]} position={[rimRadius - 0.3, 0, 0]} restitution={0.6} />

      {/* Score sensor — area below the rim */}
      <CuboidCollider
        args={[1.2, 0.3, 1.2]}
        position={[0, -1.0, 0]}
        sensor
        onIntersectionEnter={handleScore}
      />

      <group>
        {/* ========== POLE — vertical cylinder to ground ========== */}
        {/* Offset +X so the pole sits behind the backboard face, not through it */}
        <mesh position={[rimRadius + 0.1, -2, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 7, 8]} />
          <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* ========== BACKBOARD — centered so rim sits near the bottom edge ========== */}
        {/* y=2.0 center, height=4.5 → spans y=-0.25 to y=4.25 (rim at y=0, just clears bottom) */}
        <mesh position={[rimRadius, 2.0, 0]} castShadow>
          <boxGeometry args={[0.15, 4.5, 4.2]} />
          <meshStandardMaterial color="#f0f0f0" metalness={0.05} roughness={0.7} />
        </mesh>

        {/* ========== BRAND LOGO — printed on backboard face ========== */}
        <Suspense fallback={null}>
          <BrandMark rimRadius={rimRadius} />
        </Suspense>

        {/* ========== ARM — horizontal bar from backboard to rim ========== */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[rimRadius * 2, 0.1, 0.1]} />
          <meshStandardMaterial color="#ff6600" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* ========== RIM — orange torus ========== */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
          <torusGeometry args={[rimRadius, 0.06, 8, 32]} />
          <meshStandardMaterial
            ref={rimMatRef}
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
            position={[0, -t * netDepth, 0]}
            rotation={[Math.PI * 0.5, 0, 0]}
          >
            <torusGeometry args={[rimRadius * (1 - t * 0.65), 0.012, 4, 16]} />
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
        {/* ========== CONFETTI ========== */}
        <Confetti active={confettiBurst} />
      </group>
    </RigidBody>
  );
}
