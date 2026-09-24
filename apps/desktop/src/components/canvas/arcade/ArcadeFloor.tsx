"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { CABINET, DOOR, HALL, WALK } from "./arcade-config";
import type { ArcadeMode, ArcadePalette } from "./arcade-mode";
import { getCarpetTexture } from "./arcade-textures";
import { getCarpetBump, getDoormatTexture, getFloorWearTexture } from "./hall-textures";

interface ArcadeFloorProps {
  mode: ArcadeMode;
  palette: ArcadePalette;
}

const LENGTH = HALL.entranceZ - HALL.endZ;
const MID_Z = (HALL.entranceZ + HALL.endZ) / 2;
const W = HALL.halfWidth;
/** Teja del dibujo de la moqueta y del relieve de la fibra, en metros. */
const CARPET_TILE = 2.4;
const BUMP_TILE = 0.45;

/** Balizas de pasillo: justo delante de los paneles de mandos. */
const GUIDE = { x: CABINET.frontX - 0.12, step: 0.5, speed: 5.5, wave: 3.2 } as const;

/**
 * El suelo: moqueta con dibujo y relieve de fibra, una capa de desgaste (polvo
 * contra las paredes, el centro pisado y alguna mancha), las balizas LED del
 * pasillo —con un pulso que corre hacia la puerta: el suelo también señala la
 * salida— y, al fondo, el umbral de aluminio y el felpudo de la entrada.
 */
export function ArcadeFloor({ mode, palette }: ArcadeFloorProps) {
  const carpet = useMemo(() => {
    const t = getCarpetTexture(mode, palette);
    t.repeat.set((W * 2) / CARPET_TILE, LENGTH / CARPET_TILE);
    return t;
  }, [mode, palette]);
  const bump = useMemo(() => {
    const t = getCarpetBump().clone();
    t.repeat.set((W * 2) / BUMP_TILE, LENGTH / BUMP_TILE);
    t.needsUpdate = true;
    return t;
  }, []);
  const wear = useMemo(() => {
    const t = getFloorWearTexture().clone();
    t.repeat.set(1, LENGTH / 5);
    t.needsUpdate = true;
    return t;
  }, []);
  useEffect(
    () => () => {
      bump.dispose();
      wear.dispose();
    },
    [bump, wear],
  );

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, MID_Z]}>
        <planeGeometry args={[W * 2, LENGTH]} />
        <meshStandardMaterial map={carpet} bumpMap={bump} bumpScale={0.9} roughness={1} metalness={0} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, MID_Z]} renderOrder={1}>
        <planeGeometry args={[W * 2, LENGTH]} />
        <meshBasicMaterial map={wear} transparent depthWrite={false} />
      </mesh>

      <GuideLights palette={palette} />

      {/* Umbral de aluminio bajo la puerta y felpudo delante */}
      <mesh position={[0, 0.006, HALL.endZ + 0.06]}>
        <boxGeometry args={[DOOR.width + 0.2, 0.012, 0.1]} />
        <meshStandardMaterial color="#b9bcc4" roughness={0.25} metalness={0.8} />
      </mesh>
      <group position={[0, 0, HALL.endZ + 0.8]}>
        <mesh position={[0, 0.006, 0]}>
          <boxGeometry args={[1.62, 0.012, 0.92]} />
          <meshStandardMaterial color="#0a0a0c" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.0125, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1.6, 0.9]} />
          <meshStandardMaterial map={getDoormatTexture()} roughness={1} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Balizas LED empotradas a ambos lados del pasillo, como las de un cine. Un
 * pulso de luz las recorre de la entrada hacia la puerta, sin parar. Una
 * `InstancedMesh`; la animación solo reescribe colores.
 */
function GuideLights({ palette }: { palette: ArcadePalette }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const zs = useMemo(() => {
    const out: number[] = [];
    for (let z = WALK.startZ - 0.3; z > HALL.endZ + 1.4; z -= GUIDE.step) out.push(z);
    return out;
  }, []);
  const count = zs.length * 2;
  const geometry = useMemo(() => new THREE.BoxGeometry(0.035, 0.01, 0.14), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    zs.forEach((z, k) => {
      mesh.setMatrixAt(k, m.makeTranslation(-GUIDE.x, 0.005, z));
      mesh.setMatrixAt(k + zs.length, m.makeTranslation(GUIDE.x, 0.005, z));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [zs]);

  const base = useMemo(() => new THREE.Color(palette.neon.color), [palette.neon.color]);
  const dim = palette.neon.on ? 0.22 : 0.12;
  const peak = palette.neon.on ? 1 : 0.45;
  const still = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    // Posición del pulso, en metros recorridos desde la entrada.
    const head = still.current ? -99 : (clock.elapsedTime * GUIDE.speed) % (zs.length * GUIDE.step + GUIDE.wave * 2);
    zs.forEach((_, k) => {
      const d = head - k * GUIDE.step;
      const glow = d >= 0 && d < GUIDE.wave ? 1 - d / GUIDE.wave : 0;
      tmp.copy(base).multiplyScalar(dim + (peak - dim) * glow);
      mesh.setColorAt(k, tmp);
      mesh.setColorAt(k + zs.length, tmp);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geometry, material, count]} />;
}
