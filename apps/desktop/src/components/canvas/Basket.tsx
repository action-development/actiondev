"use client";

import React, { Suspense, useEffect, useRef, useMemo, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  RigidBody,
  CuboidCollider,
  IntersectionEnterPayload,
} from "@react-three/rapier";
import * as THREE from "three";
import type { PageCubeData } from "./PageCube";
import { scratchObj3D } from "./_pools";

/**
 * Basket — Basketball hoop with backboard, rim, net, and pole.
 *
 * Board dimensions (single source of truth):
 *   BOARD_H × BOARD_W × BOARD_D, center at [rimRadius, BOARD_CY, 0]
 *   Bezel rails wrap outside those edges, depth BEZEL_D > BOARD_D → lip catches light.
 */

// ─── Board constants ────────────────────────────────────────────────────────
const BOARD_H  = 5.2;   // height
const BOARD_W  = 5.8;   // width (Z axis)
const BOARD_D  = 0.18;  // depth (X axis)
const BOARD_CY = 2.4;   // center Y — bottom ≈ rim level, top clears well above
const BEZEL_T  = 0.20;  // rail cross-section (Y / Z)
const BEZEL_D  = 0.28;  // rail depth (X) — protrudes past board face, catches point-light
// ────────────────────────────────────────────────────────────────────────────

interface BasketProps {
  position: [number, number, number];
  thrownIds: React.RefObject<Set<string>>;
  gatedIds: React.RefObject<Set<string>>;
  onScore?: (pageData: PageCubeData) => void;
}

// Ring t-values — shared by rings render and cross-strand generator
const NET_RING_TS = [0.15, 0.32, 0.50, 0.68, 0.86] as const;

/** Generate net strand lines as a cone from rim edge to bottom center */
function generateNetLines(segments: number, rimRadius: number, depth: number) {
  const lines: { start: [number, number, number]; end: [number, number, number] }[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const topX = Math.cos(angle) * rimRadius;
    const topZ = Math.sin(angle) * rimRadius;
    const bottomX = Math.cos(angle) * rimRadius * 0.3;
    const bottomZ = Math.sin(angle) * rimRadius * 0.3;
    lines.push({ start: [topX, 0, topZ], end: [bottomX, -depth, bottomZ] });
  }
  return lines;
}

/**
 * Generate horizontal cross-strands connecting adjacent radial strands at each ring level.
 * Makes the net look woven (diamond mesh) rather than a wireframe cage.
 */
function generateCrossStrands(
  segments: number,
  rimRadius: number,
  netDepth: number,
  ringTs: readonly number[],
) {
  const crosses: { pos: [number, number, number]; len: number; rotY: number }[] = [];
  for (const t of ringTs) {
    // Radius at this level follows the same taper as the main strands
    const r = rimRadius * (1 - 0.7 * t);
    const y = -t * netDepth;
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = ((i + 1) / segments) * Math.PI * 2;
      const x0 = Math.cos(a0) * r, z0 = Math.sin(a0) * r;
      const x1 = Math.cos(a1) * r, z1 = Math.sin(a1) * r;
      const dx = x1 - x0, dz = z1 - z0;
      crosses.push({
        pos: [(x0 + x1) / 2, y, (z0 + z1) / 2],
        len: Math.sqrt(dx * dx + dz * dz),
        rotY: Math.atan2(dx, dz),
      });
    }
  }
  return crosses;
}

// ─── Confetti ────────────────────────────────────────────────────────────────
const CONFETTI_COUNT  = 60;
const CONFETTI_COLORS = ["#c8ff00", "#6366f1", "#ec4899", "#22d3ee", "#ffffff", "#ff6600"];

interface ConfettiParticle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  rotSpeed: number; scale: number; color: THREE.Color; life: number;
}

function Confetti({ active }: { active: number }) {
  const meshRef   = useRef<THREE.InstancedMesh>(null);
  const particles = useRef<ConfettiParticle[]>([]);
  const dummy     = useMemo(() => new THREE.Object3D(), []);
  const prevActive = useRef(0);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

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

    const alive = particles.current;
    for (let i = alive.length - 1; i >= 0; i--) {
      const p = alive[i];
      p.life -= delta;
      if (p.life <= 0) { alive.splice(i, 1); continue; }
      p.vy -= 9 * delta;
      p.x += p.vx * delta; p.y += p.vy * delta; p.z += p.vz * delta;
      p.vx *= 0.98; p.vz *= 0.98;
    }

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

// ─── Brand mark ──────────────────────────────────────────────────────────────
// Logo: RGBA webp, black marks on transparent. Canvas-inverted to white marks.
// Material: emissiveMap makes it glow like an LED panel — no lighting dependency.
function BrandMark({ rimRadius }: { rimRadius: number }) {
  const logoTex = useTexture("/logos/logo.webp");

  const whiteTex = useMemo(() => {
    const img = logoTex.image as HTMLImageElement;
    if (!img?.width) return logoTex;
    const canvas = document.createElement("canvas");
    canvas.width  = img.naturalWidth  || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = data.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = d[i + 1] = d[i + 2] = 255; // keep alpha, force marks to white
    }
    ctx.putImageData(data, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [logoTex]);

  // Logo occupies upper portion of board: center at BOARD_CY + 0.8, leaving room for aim square
  const logoPosY = BOARD_CY + 0.8;
  // Width fills most of the board (5.8) with margin; ratio 2.5:1 → height = W/2.5
  const logoW = 4.8;
  const logoH = logoW / 2.5;

  return (
    <mesh position={[rimRadius - BOARD_D / 2 - 0.01, logoPosY, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={[logoW, logoH]} />
      <meshStandardMaterial
        map={whiteTex}
        emissiveMap={whiteTex}
        emissive="#ffffff"
        emissiveIntensity={0.55}
        transparent
        alphaTest={0.01}
        toneMapped={false}
        metalness={0}
        roughness={1}
      />
    </mesh>
  );
}

// ─── Net instanced ───────────────────────────────────────────────────────────
/**
 * 16 strands radiales + 80 cross-strands se renderizaban antes como 96 meshes
 * independientes con 96 BufferGeometries (cada `len` único impedía sharing) → 96 draw calls.
 *
 * InstancedMesh: 1 cylinderGeometry unitaria (length=1) por mesh, escalada en Y por
 * instancia. Matrices subidas UNA vez en useEffect (la red no se mueve) con
 * StaticDrawUsage para que la GPU las marque inmutables. 0 coste por frame, 2 draw calls.
 */
function NetInstanced({
  radial,
  cross,
}: {
  radial: { start: [number, number, number]; end: [number, number, number] }[];
  cross: { pos: [number, number, number]; len: number; rotY: number }[];
}) {
  const radialRef = useRef<THREE.InstancedMesh>(null);
  const crossRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const r = radialRef.current;
    if (!r) return;
    for (let i = 0; i < radial.length; i++) {
      const { start, end } = radial[i];
      const sx = start[0], sy = start[1], sz = start[2];
      const ex = end[0],   ey = end[1],   ez = end[2];
      const dx = ex - sx, dy = ey - sy, dz = ez - sz;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      scratchObj3D.position.set((sx + ex) * 0.5, (sy + ey) * 0.5, (sz + ez) * 0.5);
      scratchObj3D.rotation.set(
        Math.atan2(Math.sqrt(dx * dx + dz * dz), dy),
        Math.atan2(dx, dz),
        0
      );
      scratchObj3D.scale.set(1, len, 1);
      scratchObj3D.updateMatrix();
      r.setMatrixAt(i, scratchObj3D.matrix);
    }
    r.instanceMatrix.needsUpdate = true;
    r.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  }, [radial]);

  useEffect(() => {
    const c = crossRef.current;
    if (!c) return;
    for (let i = 0; i < cross.length; i++) {
      const { pos, len, rotY } = cross[i];
      scratchObj3D.position.set(pos[0], pos[1], pos[2]);
      scratchObj3D.rotation.set(Math.PI / 2, rotY, 0);
      scratchObj3D.scale.set(1, len, 1);
      scratchObj3D.updateMatrix();
      c.setMatrixAt(i, scratchObj3D.matrix);
    }
    c.instanceMatrix.needsUpdate = true;
    c.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  }, [cross]);

  return (
    <>
      <instancedMesh ref={radialRef} args={[undefined, undefined, radial.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.009, 0.009, 1, 4]} />
        <meshBasicMaterial color="#e8e4d8" transparent opacity={0.5} />
      </instancedMesh>
      <instancedMesh ref={crossRef} args={[undefined, undefined, cross.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.007, 0.007, 1, 4]} />
        <meshBasicMaterial color="#e8e4d8" transparent opacity={0.38} />
      </instancedMesh>
    </>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function Basket({ position, thrownIds, gatedIds, onScore }: BasketProps) {
  const rimMatRef = useRef<THREE.MeshStandardMaterial>(null!);
  const glowRef   = useRef<THREE.PointLight>(null);
  const [confettiBurst, setConfettiBurst] = useState(0);

  const rimRadius = 1.8;
  const netDepth  = 2.0;

  const netLines    = useMemo(() => generateNetLines(16, rimRadius, netDepth), []);
  const crossStrands = useMemo(() => generateCrossStrands(16, rimRadius, netDepth, NET_RING_TS), []);

  // Shared material for all 4 bezel rails + arm — dark copper, catches rim's orange point-light
  const bezelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color:     new THREE.Color("#883300"),
    metalness: 0.9,
    roughness: 0.12,
  }), []);

  // NBA targeting rectangle — thin ring around the aim point just above the rim
  // Real dimensions ≈ 59 × 45 cm; scaled to scene units (~0.032 per cm)
  const aimSquareGeo = useMemo(() => {
    const oW = 0.95, oH = 0.72;  // outer half-dims
    const iW = 0.88, iH = 0.65;  // inner half-dims (line thickness ≈ 0.07)
    const shape = new THREE.Shape();
    shape.moveTo(-oW, -oH); shape.lineTo(oW, -oH);
    shape.lineTo(oW,  oH);  shape.lineTo(-oW, oH);
    shape.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-iW, -iH); hole.lineTo(iW, -iH);
    hole.lineTo(iW,  iH);  hole.lineTo(-iW, iH);
    hole.closePath();
    shape.holes.push(hole);
    return new THREE.ShapeGeometry(shape);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = Math.sin(t * 3);
    if (rimMatRef.current) rimMatRef.current.emissiveIntensity = 1.5 + 0.5 * pulse;
    if (glowRef.current)   glowRef.current.intensity = 20 + 8 * pulse;
  });

  const handleScore = useCallback((payload: IntersectionEnterPayload) => {
    const rigidBodyObject = payload.other.rigidBodyObject;
    if (!rigidBodyObject) return;
    const userData = rigidBodyObject.userData as { pageData?: PageCubeData } | undefined;
    if (!userData?.pageData) return;
    if (!thrownIds.current.has(userData.pageData.id)) return;
    if (gatedIds.current.has(userData.pageData.id)) return;
    thrownIds.current.delete(userData.pageData.id);
    gatedIds.current.add(userData.pageData.id);
    setConfettiBurst((c) => c + 1);
    onScore?.(userData.pageData);
  }, [onScore]);

  // Derived bezel positions (all from constants)
  const topRailY    = BOARD_CY + BOARD_H / 2 + BEZEL_T / 2;
  const botRailY    = BOARD_CY - BOARD_H / 2 - BEZEL_T / 2;
  const sideRailZ   = BOARD_W / 2 + BEZEL_T / 2;
  const topBotWidth = BOARD_W + 2 * BEZEL_T;

  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      {/* === Physics colliders (updated to match new board size) === */}
      <CuboidCollider
        args={[0.12, BOARD_H / 2, BOARD_W / 2]}
        position={[rimRadius, BOARD_CY, 0]}
        restitution={0.4}
      />
      <CuboidCollider args={[0.12, 0.12, 0.12]} position={[-rimRadius, 0, 0]} restitution={0.6} />
      <CuboidCollider args={[0.12, 0.12, 0.12]} position={[rimRadius - 0.3, 0, 0]} restitution={0.6} />
      <CuboidCollider
        args={[1.2, 0.3, 1.2]}
        position={[0, -1.0, 0]}
        sensor
        onIntersectionEnter={handleScore}
      />

      <group>
        {/* ========== POLE ========== */}
        <mesh position={[rimRadius + 0.1, -2, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 7, 8]} />
          <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* ========== BACKBOARD BEZEL — 4 physical metal rails ========== */}
        {/* Same copper-dark material as arm — makes the whole structure feel designed */}
        <mesh material={bezelMaterial} position={[rimRadius, topRailY, 0]} castShadow>
          <boxGeometry args={[BEZEL_D, BEZEL_T, topBotWidth]} />
        </mesh>
        <mesh material={bezelMaterial} position={[rimRadius, botRailY, 0]} castShadow>
          <boxGeometry args={[BEZEL_D, BEZEL_T, topBotWidth]} />
        </mesh>
        <mesh material={bezelMaterial} position={[rimRadius, BOARD_CY,  sideRailZ]} castShadow>
          <boxGeometry args={[BEZEL_D, BOARD_H, BEZEL_T]} />
        </mesh>
        <mesh material={bezelMaterial} position={[rimRadius, BOARD_CY, -sideRailZ]} castShadow>
          <boxGeometry args={[BEZEL_D, BOARD_H, BEZEL_T]} />
        </mesh>

        {/* ========== BACKBOARD ========== */}
        <mesh position={[rimRadius, BOARD_CY, 0]} castShadow>
          <boxGeometry args={[BOARD_D, BOARD_H, BOARD_W]} />
          <meshStandardMaterial
            color="#0d0d1a"
            emissive="#0a0a14"
            emissiveIntensity={0.4}
            metalness={0.2}
            roughness={0.8}
          />
        </mesh>

        {/* ========== BRAND LOGO — LED-panel emissive ========== */}
        <Suspense fallback={null}>
          <BrandMark rimRadius={rimRadius} />
        </Suspense>

        {/* ========== AIMING RECTANGLE — NBA targeting square above rim ========== */}
        <mesh
          geometry={aimSquareGeo}
          position={[rimRadius - BOARD_D / 2 - 0.01, 0.55, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <meshBasicMaterial color="#ffffff" transparent opacity={0.55} toneMapped={false} />
        </mesh>

        {/* ========== ARM — rim bracket to backboard, bezel material ========== */}
        <mesh material={bezelMaterial} position={[0, 0, 0]} castShadow>
          <boxGeometry args={[rimRadius * 2, 0.18, 0.18]} />
        </mesh>

        {/* Mounting bracket — small block where arm meets the rim body */}
        <mesh material={bezelMaterial} position={[rimRadius - 0.14, -0.06, 0]} castShadow>
          <boxGeometry args={[0.28, 0.20, 0.32]} />
        </mesh>

        {/* ========== RIM ========== */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
          <torusGeometry args={[rimRadius, 0.08, 16, 48]} />
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

        {/* ========== NET — radial + cross strands instanciados (96 → 2 draw calls) ========== */}
        <NetInstanced radial={netLines} cross={crossStrands} />

        {/* 5 horizontal rings — warm tint matches strands */}
        {NET_RING_TS.map((t, i) => (
          <mesh
            key={`net-ring-${i}`}
            position={[0, -t * netDepth, 0]}
            rotation={[Math.PI * 0.5, 0, 0]}
          >
            <torusGeometry args={[rimRadius * (1 - t * 0.65), 0.012, 6, 24]} />
            <meshBasicMaterial color="#e8e4d8" transparent opacity={0.35} />
          </mesh>
        ))}

        {/* ========== GLOW — orange pulse from rim ========== */}
        <pointLight
          ref={glowRef}
          position={[0, 0, 0.5]}
          color="#ff6600"
          intensity={20}
          distance={6}
          decay={2}
        />

        {/* ========== FILL LIGHT — illuminates board face toward player ========== */}
        {/* The scene's directional light hits the back/top of the board, not the front face.
            This fill light sits in front and slightly above centre, giving the logo
            and aiming square consistent visibility without washing out the orange glow. */}
        <pointLight
          position={[-1, BOARD_CY + 1, 1.5]}
          color="#f0f6ff"
          intensity={3}
          distance={9}
          decay={2}
        />

        {/* ========== CONFETTI ========== */}
        <Confetti active={confettiBurst} />
      </group>
    </RigidBody>
  );
}
