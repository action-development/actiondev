"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scratchObj3D } from "./_pools";

/**
 * LandingDust — Lime-green particle burst on character landing.
 *
 * Architecture mirrors Confetti (Basket.tsx): InstancedMesh + ring buffer.
 * Triggered imperatively via LandingDustHandle.trigger() to avoid React re-renders.
 * Lives outside <Physics> — purely visual, no RigidBody.
 */

const DUST_COUNT    = 8;
const DUST_LIFETIME = 0.28;   // seconds
const DUST_COLOR    = "#c8ff00";

export interface LandingDustHandle {
  /** Emit a burst at (worldX, worldY). Extracts scalars — safe to pass a scratch Vector3. */
  trigger: (worldX: number, worldY: number) => void;
}

interface DustParticle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; // remaining seconds; -1 = inactive
}

export const LandingDust = forwardRef<LandingDustHandle>(
  function LandingDust(_props, ref) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const particles = useRef<DustParticle[]>(
      Array.from({ length: DUST_COUNT }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: -1 }))
    );
    const writeIdx = useRef(0);

    useImperativeHandle(ref, () => ({
      trigger(worldX: number, worldY: number) {
        for (let i = 0; i < DUST_COUNT; i++) {
          const slot = particles.current[(writeIdx.current + i) % DUST_COUNT];
          // Radial spread: evenly distribute angles with a random speed offset
          const angle  = (i / DUST_COUNT) * Math.PI * 2;
          slot.x    = worldX;
          slot.y    = worldY;
          slot.vx   = Math.cos(angle) * (1.0 + Math.random() * 1.0);
          slot.vy   = 0.4 + Math.random() * 1.2;  // small upward impulse
          slot.life = DUST_LIFETIME;
        }
        writeIdx.current = (writeIdx.current + DUST_COUNT) % DUST_COUNT;
      },
    }), []);

    useFrame((_, delta) => {
      const mesh = meshRef.current;
      if (!mesh) return;

      const dt = Math.min(delta, 1 / 30);
      let visible = 0;

      for (let i = 0; i < DUST_COUNT; i++) {
        const p = particles.current[i];
        if (p.life < 0) continue;
        p.life -= dt;
        if (p.life < 0) continue;

        p.vy -= 3.5 * dt;  // gentle gravity pull
        p.x  += p.vx * dt;
        p.y  += p.vy * dt;

        const lifeRatio = p.life / DUST_LIFETIME;  // 1→0
        scratchObj3D.position.set(p.x, p.y, 0.15);
        scratchObj3D.scale.setScalar(0.07 + 0.05 * lifeRatio);
        scratchObj3D.rotation.set(0, 0, 0);
        scratchObj3D.updateMatrix();
        mesh.setMatrixAt(visible, scratchObj3D.matrix);
        visible++;
      }

      mesh.count = visible;
      if (visible > 0) mesh.instanceMatrix.needsUpdate = true;
    });

    return (
      <instancedMesh ref={meshRef} args={[undefined, undefined, DUST_COUNT]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial
          color={DUST_COLOR}
          transparent
          opacity={0.6}
          toneMapped={false}
          depthWrite={false}
        />
      </instancedMesh>
    );
  }
);
