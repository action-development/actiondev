"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GRAVITY, PHYSICS_DT, CUBE_LINEAR_DAMPING } from "./constants";

/**
 * AimLine — Trajectory prediction dots.
 *
 * Uses step-by-step Euler integration that matches Rapier's internal
 * integrator exactly: gravity → damping → position advance.
 * This guarantees the dots follow the REAL physics path, including
 * the effect of linearDamping on the cube.
 *
 * All state is read from a ref (no props that trigger re-renders).
 */

export interface AimState {
  originX: number;
  originY: number;
  dirX: number;
  dirY: number;
  power: number;
  force: number;
  visible: boolean;
}

interface AimLineProps {
  stateRef: React.RefObject<AimState>;
}

const DOT_COUNT = 14;
/** Physics steps to simulate between each dot (~0.1s per dot) */
const STEPS_PER_DOT = 6;

const sharedDotGeo = new THREE.SphereGeometry(1, 6, 6);

// Color gradient: near = lime accent, far = white — allocated once, never in useFrame
const _colNear    = new THREE.Color("#c8ff00");
const _colFar     = new THREE.Color("#ffffff");
const _colScratch = new THREE.Color();

/** Rapier damping factor: v *= 1 / (1 + damping * dt) each step */
const DAMP_FACTOR = 1 / (1 + CUBE_LINEAR_DAMPING * PHYSICS_DT);

/**
 * Pure Euler trajectory prediction — mirrors Rapier's integrator exactly.
 * Exported for unit testing: verify dots match real physics without Three.js.
 */
export function computeTrajectory(
  originX: number, originY: number,
  vx: number, vy: number,
  dotCount = DOT_COUNT,
  stepsPerDot = STEPS_PER_DOT,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  let cx = originX, cy = originY, cvx = vx, cvy = vy;
  for (let i = 0; i < dotCount; i++) {
    if (i === 0) {
      points.push({ x: cx, y: cy });
    } else {
      for (let step = 0; step < stepsPerDot; step++) {
        cvy -= GRAVITY * PHYSICS_DT;
        cvx *= DAMP_FACTOR;
        cvy *= DAMP_FACTOR;
        cx  += cvx * PHYSICS_DT;
        cy  += cvy * PHYSICS_DT;
      }
      points.push({ x: cx, y: cy });
    }
  }
  return points;
}

export function AimLine({ stateRef }: AimLineProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const group = groupRef.current;
    const s = stateRef.current;
    if (!group || !s) return;

    if (!s.visible) {
      group.visible = false;
      return;
    }
    group.visible = true;

    const t  = state.clock.elapsedTime;
    const vx = s.dirX * s.force;
    const vy = s.dirY * s.force;
    const points = computeTrajectory(s.originX, s.originY, vx, vy);

    for (let i = 0; i < DOT_COUNT; i++) {
      const child = group.children[i] as THREE.Mesh;
      if (!child) continue;
      child.position.set(points[i].x, points[i].y, 0.1);
      const fade  = 1 - i / DOT_COUNT;
      const pulse = 1 + 0.2 * Math.sin(t * 5 + i * 0.3);
      child.scale.setScalar((0.04 + s.power * 0.06 * fade) * pulse);
      const mat = child.material as THREE.MeshBasicMaterial;
      mat.opacity = fade * 0.8;
      // Gradient lime → white as dots move further from origin
      _colScratch.lerpColors(_colNear, _colFar, i / (DOT_COUNT - 1));
      mat.color.copy(_colScratch);
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: DOT_COUNT }, (_, i) => (
        <mesh key={i} geometry={sharedDotGeo}>
          <meshBasicMaterial color="#c8ff00" transparent opacity={0.8} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
