"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Starfield — deep-space background using InstancedMesh for performance.
 *
 * Instead of thousands of individual meshes (draw call nightmare), we use a
 * single InstancedMesh with a tiny sphere geometry. Each instance gets a random
 * position on a large sphere shell surrounding the scene, plus a subtle twinkle
 * animation driven by a per-instance phase offset.
 *
 * Performance notes (three-best-practices):
 * - geometry-instanced-mesh: single draw call for all stars
 * - render-avoid-allocations: reuse matrix/color objects outside the loop
 * - material-simplest-sufficient: MeshBasicMaterial (no lighting calc needed)
 */

const STAR_COUNT = 1200;
const SHELL_RADIUS = 80;

/** Pre-computed star data. Positions stored flat for fast indexed access in useFrame. */
function generateStarData(count: number) {
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const baseScales = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = SHELL_RADIUS + (Math.random() - 0.5) * 30;

    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    baseScales[i] = 0.02 + Math.random() * 0.08;
    phases[i]     = Math.random() * Math.PI * 2;
  }

  return { positions, phases, baseScales };
}

export function Starfield() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { positions, phases, baseScales } = useMemo(
    () => generateStarData(STAR_COUNT),
    []
  );
  const frameRef = useRef(0);

  useEffect(() => {
    const mesh = meshRef.current;
    return () => {
      if (!mesh) return;
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    };
  }, []);

  // Single reusable matrix — no decompose/compose needed for scale+translate (no rotation).
  const m = useMemo(() => new THREE.Matrix4(), []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Twinkle is slow — updating every other frame is imperceptible and halves CPU cost.
    if (++frameRef.current % 2 !== 0) return;

    const t = state.clock.elapsedTime;

    for (let i = 0; i < STAR_COUNT; i++) {
      const s = baseScales[i] * (0.6 + 0.4 * Math.sin(t * 1.5 + phases[i]));
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      // Scale + translate matrix, no rotation. Row-major: set(n11..n44)
      // [s 0 0 x]
      // [0 s 0 y]
      // [0 0 s z]
      // [0 0 0 1]
      m.set(s,0,0,x, 0,s,0,y, 0,0,s,z, 0,0,0,1);
      mesh.setMatrixAt(i, m);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, STAR_COUNT]}
      frustumCulled={false}
      onUpdate={(mesh) => {
        const mat = new THREE.Matrix4();
        for (let i = 0; i < STAR_COUNT; i++) {
          const s = baseScales[i];
          const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
          mat.set(s,0,0,x, 0,s,0,y, 0,0,s,z, 0,0,0,1);
          mesh.setMatrixAt(i, mat);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }}
    >
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#ffffff" toneMapped={false} />
    </instancedMesh>
  );
}
