"use client";

import { useLayoutEffect, useRef } from "react";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import type { PortPalette } from "./time-of-day";
import { QUAY_EDGE_X, QUAY_TOP_Y } from "./crane-logic";
import { getToonGradient, OUTLINE_THIN } from "./toon";

/**
 * Muelle de contenedores: la losa donde aterrizan los contenedores de página,
 * con franja de seguridad lima en el cantil, bolardos y pilas de contenedores
 * de atrezo al fondo.
 *
 * La losa visual es PROFUNDA (z de -4 a 16): desde la cámara (y = -3) se ve su
 * cara superior como suelo en primer plano. La física solo necesita la franja
 * del plano de juego (z = 0).
 */

const LEFT_X = -24;
const Z_BACK = -4;
const Z_FRONT = 16;
const SLAB_H = 8;

/** Pilas de atrezo: [x, nivel, color]. Detrás del plano de juego y de las patas de la grúa, z = -3.4. */
const PROP_STACKS: [number, number, string][] = [
  [-22, 0, "#2a6fdb"], [-22, 1, "#e8e3d3"], [-14.8, 0, "#d9432f"],
  [-6.5, 0, "#1f8a70"], [-6.5, 1, "#f2b134"], [-2.8, 0, "#7a4fd6"],
  [-14.8, 1, "#2a6fdb"]
];

function PropStacks({ palette }: { palette: PortPalette }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    PROP_STACKS.forEach(([x, level, color], i) => {
      o.position.set(x, QUAY_TOP_Y + 0.75 + level * 1.55, -3.4);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      mesh.setColorAt(i, c.set(color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, PROP_STACKS.length]} receiveShadow>
      <boxGeometry args={[3.3, 1.5, 1.5]} />
      {/* El color real va por instancia; el del material solo atenúa de noche. */}
      <meshToonMaterial gradientMap={getToonGradient()} color={palette.lamps > 0.9 ? "#8a90b0" : "#e6e6e6"} />
    </instancedMesh>
  );
}

export function Quay({ palette, showStatic = true }: { palette: PortPalette; showStatic?: boolean }) {
  const gradient = getToonGradient();
  const width = QUAY_EDGE_X - LEFT_X;
  const depth = Z_FRONT - Z_BACK;
  const concrete = palette.lamps > 0.5 ? "#4a4f66" : "#a9a7a0";

  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[width / 2, 1, 3]}
          position={[LEFT_X + width / 2, QUAY_TOP_Y - 1, 0]}
          friction={0.9}
          restitution={0.05}
        />
      </RigidBody>

      {/* Losa */}
      <mesh
        position={[LEFT_X + width / 2, QUAY_TOP_Y - SLAB_H / 2, Z_BACK + depth / 2]}
        receiveShadow
        renderOrder={showStatic ? 0 : -1}
      >
        <boxGeometry args={[width, SLAB_H, depth]} />
        {showStatic ? (
          <>
            <meshToonMaterial color={concrete} gradientMap={gradient} />
            <Outlines thickness={OUTLINE_THIN} color={palette.outline} />
          </>
        ) : (
          // Oclusor invisible: un contenedor que cae por el cantil se esconde tras el muelle dibujado.
          <meshBasicMaterial colorWrite={false} />
        )}
      </mesh>

      {/* Sombras de las piezas 3D sobre el muelle pintado */}
      {!showStatic && (
        <mesh position={[LEFT_X + width / 2, QUAY_TOP_Y + 0.01, Z_BACK + depth / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[width, depth]} />
          <shadowMaterial opacity={0.35} />
        </mesh>
      )}

      <group visible={showStatic}>

      {/* Franja de seguridad lima en el cantil — el acento de marca en el suelo. */}
      <mesh position={[QUAY_EDGE_X - 0.35, QUAY_TOP_Y + 0.01, Z_BACK + depth / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, depth]} />
        <meshBasicMaterial color="#c8ff00" toneMapped={false} />
      </mesh>
      {/* Carriles de la grúa */}
      {[-2.3, -1.7].map((z) => (
        <mesh key={z} position={[LEFT_X + width / 2, QUAY_TOP_Y + 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width, 0.14]} />
          <meshBasicMaterial color={palette.outline} />
        </mesh>
      ))}

      {/* Bolardos en el cantil */}
      {[5].map((z) => (
        <mesh key={z} position={[QUAY_EDGE_X - 1.1, QUAY_TOP_Y + 0.35, z]} castShadow>
          <cylinderGeometry args={[0.32, 0.42, 0.7, 12]} />
          <meshToonMaterial color="#2b2f3f" gradientMap={gradient} />
          <Outlines thickness={OUTLINE_THIN} color={palette.outline} />
        </mesh>
      ))}

      <PropStacks palette={palette} />
      </group>
    </group>
  );
}
