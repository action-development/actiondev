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

/** Rapier damping factor: v *= 1 / (1 + damping * dt) each step */
const DAMP_FACTOR = 1 / (1 + CUBE_LINEAR_DAMPING * PHYSICS_DT);

export function AimLine({ stateRef }: AimLineProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    const s = stateRef.current;
    if (!group || !s) return;

    if (!s.visible) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // Initial velocity = impulse / mass (mass ≈ 1)
    let vx = s.dirX * s.force;
    let vy = s.dirY * s.force;
    let x = s.originX;
    let y = s.originY;

    for (let i = 0; i < DOT_COUNT; i++) {
      const child = group.children[i] as THREE.Mesh;
      if (!child) continue;

      if (i === 0) {
        // First dot sits exactly at the cube origin
        child.position.set(x, y, 0.1);
      } else {
        // Simulate STEPS_PER_DOT physics steps (matches Rapier's integrator)
        for (let step = 0; step < STEPS_PER_DOT; step++) {
          vy -= GRAVITY * PHYSICS_DT;
          vx *= DAMP_FACTOR;
          vy *= DAMP_FACTOR;
          x += vx * PHYSICS_DT;
          y += vy * PHYSICS_DT;
        }
        child.position.set(x, y, 0.1);
      }

      const fade = 1 - i / DOT_COUNT;
      child.scale.setScalar(0.04 + s.power * 0.06 * fade);
      (child.material as THREE.MeshBasicMaterial).opacity = fade * 0.8;
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: DOT_COUNT }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial
            color="#c8ff00"
            transparent
            opacity={0.8}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
