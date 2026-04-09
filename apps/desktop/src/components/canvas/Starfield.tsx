"use client";

import { useRef, useMemo } from "react";
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

/** Pre-computed random positions + phase offsets for twinkle animation */
function generateStarData(count: number) {
  const matrices: THREE.Matrix4[] = [];
  const phases: number[] = [];
  const baseScales: number[] = [];

  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const matrix = new THREE.Matrix4();

  for (let i = 0; i < count; i++) {
    // Distribute on sphere shell using fibonacci sphere algorithm
    // for even distribution (no polar clustering)
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;

    // Add noise to radius so stars aren't on a perfect shell
    const r = SHELL_RADIUS + (Math.random() - 0.5) * 30;

    position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );

    const s = 0.02 + Math.random() * 0.08;
    scale.set(s, s, s);
    baseScales.push(s);

    matrix.compose(position, quaternion, scale);
    matrices.push(matrix.clone());

    phases.push(Math.random() * Math.PI * 2);
  }

  return { matrices, phases, baseScales };
}

export function Starfield() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { matrices, phases, baseScales } = useMemo(
    () => generateStarData(STAR_COUNT),
    []
  );

  // Reusable objects for the animation loop (render-avoid-allocations)
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPosition = useMemo(() => new THREE.Vector3(), []);
  const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const tempScale = useMemo(() => new THREE.Vector3(), []);

  // Set initial instance matrices
  useMemo(() => {
    // This runs once — sets up the initial transforms
    // Actual mesh assignment happens in the ref callback below
  }, [matrices]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = state.clock.elapsedTime;

    for (let i = 0; i < STAR_COUNT; i++) {
      // Twinkle: oscillate scale with per-star phase offset
      const twinkle = 0.6 + 0.4 * Math.sin(time * 1.5 + phases[i]);
      const s = baseScales[i] * twinkle;

      matrices[i].decompose(tempPosition, tempQuaternion, tempScale);
      tempScale.set(s, s, s);
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);

      mesh.setMatrixAt(i, tempMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, STAR_COUNT]}
      frustumCulled={false}
      onUpdate={(mesh) => {
        // Set initial matrices when the mesh first mounts
        for (let i = 0; i < STAR_COUNT; i++) {
          mesh.setMatrixAt(i, matrices[i]);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }}
    >
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#ffffff" toneMapped={false} />
    </instancedMesh>
  );
}
