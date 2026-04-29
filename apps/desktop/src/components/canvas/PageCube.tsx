"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  RigidBody,
  RapierRigidBody,
  CuboidCollider,
  BallCollider,
} from "@react-three/rapier";
import { Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import {
  CUBE_LINEAR_DAMPING,
  CUBE_ANGULAR_DAMPING,
  CUBE_RESTITUTION,
  WRAP_X,
} from "./constants";
import { scratchRapierVec } from "./_pools";

const FADE_IN_DURATION = 0.6;
/** Per-index spawn delay so cubes appear staggered. */
const FADE_STAGGER = 0.12;

/**
 * PageCube — Premium physics-driven gem representing a navigable page.
 *
 * Material: MeshPhysicalMaterial with clearcoat + iridescence + emissive glow.
 * Each cube has an internal point light that casts its color onto surroundings.
 * Text: white with colored glow outline for legibility on any background.
 */

export interface PageCubeData {
  id: string;
  label: string;
  href: string;
  color: string;
  size: number;
}

interface PageCubeProps {
  data: PageCubeData;
  position: [number, number, number];
  /** 0-based index used to stagger the fade-in animation across cubes. */
  spawnIndex?: number;
  onNearby?: (id: string, rb: RapierRigidBody) => void;
  onNearbyExit?: (id: string) => void;
}

const JELLY_STIFFNESS = 200;
const JELLY_DAMPING = 10;
const IMPACT_THRESHOLD = 2.5;

/** Compute fontSize that fits the label within the cube face at given size. */
function labelFontSize(label: string, cubeSize: number): number {
  const maxWidth = cubeSize * 0.78;
  const charWidthRatio = 0.55;
  const idealSize = maxWidth / (label.length * charWidthRatio);
  return Math.min(Math.max(idealSize, 0.1), cubeSize * 0.19);
}

export function PageCube({ data, position, spawnIndex = 0, onNearby, onNearbyExit }: PageCubeProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const outlineMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const [hovered, setHovered] = useState(false);

  // Jelly spring
  const jelly = useRef({ deformation: 0, velocity: 0, active: false });
  // Plain object — Rapier devuelve {x,y,z}, no necesitamos las 200+ funciones de Vector3.
  const prevLinVel = useRef({ x: 0, y: 0, z: 0 });
  // Fade-in on mount — tracks when the cube first appears so we can stagger it
  const spawnTimeRef = useRef<number | null>(null);
  // Gate: una vez fade=1 dejamos de reescribir el material principal cada frame.
  const fadeCompleteRef = useRef(false);

  const floatPhase = useMemo(() => {
    let h = 0;
    for (let i = 0; i < data.id.length; i++) h = (h * 31 + data.id.charCodeAt(i)) & 0xffffffff;
    return ((h >>> 0) / 0xffffffff) * Math.PI * 2;
  }, [data.id]);
  const s = data.size;
  const half = s / 2;
  const fontSize = useMemo(() => labelFontSize(data.label, s), [data.label, s]);

  const handleCharacterNear = useCallback(() => {
    const rb = rigidBodyRef.current;
    if (!rb) return;
    onNearby?.(data.id, rb);
  }, [data.id, onNearby]);

  const handleCharacterLeave = useCallback(() => {
    onNearbyExit?.(data.id);
  }, [data.id, onNearbyExit]);

  useFrame((state, delta) => {
    const rb = rigidBodyRef.current;
    const mesh = meshRef.current;
    if (!rb || !mesh) return;

    // Cap delta to prevent explicit Euler instability in the jelly spring.
    // With JELLY_STIFFNESS=200, the stability threshold is dt < 2/sqrt(200) ≈ 141ms.
    // Heavy frames at load time (React unmounting LoadingScreen, ScrollTrigger.refresh)
    // can exceed that threshold, causing the spring to diverge and scale to blow up.
    // 1/30 ≈ 33ms gives a 4× safety margin below the instability threshold.
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;

    // --- Fade-in con gate post-completion ---
    // Pre-fade: escribimos opacity en ambos materiales. Post-fade: solo el outline
    // reacciona a hover (con threshold para evitar writes inútiles).
    if (!fadeCompleteRef.current) {
      if (spawnTimeRef.current === null) spawnTimeRef.current = t;
      const elapsed = t - spawnTimeRef.current - spawnIndex * FADE_STAGGER;
      const fade = elapsed >= FADE_IN_DURATION ? 1 : Math.max(elapsed / FADE_IN_DURATION, 0);
      if (materialRef.current) materialRef.current.opacity = fade;
      if (outlineMaterialRef.current) {
        outlineMaterialRef.current.opacity = fade * (hovered ? 0.25 : 0.1);
      }
      if (fade >= 1) fadeCompleteRef.current = true;
    } else if (outlineMaterialRef.current) {
      const target = hovered ? 0.25 : 0.1;
      if (Math.abs(outlineMaterialRef.current.opacity - target) > 0.001) {
        outlineMaterialRef.current.opacity = target;
      }
    }

    // Horizontal wrap (WRAP_X shared with Character via constants). Z is locked via enabledTranslations.
    const pos = rb.translation();
    if (pos.x > WRAP_X) {
      scratchRapierVec.x = -WRAP_X; scratchRapierVec.y = pos.y; scratchRapierVec.z = 0;
      rb.setTranslation(scratchRapierVec, true);
    } else if (pos.x < -WRAP_X) {
      scratchRapierVec.x = WRAP_X; scratchRapierVec.y = pos.y; scratchRapierVec.z = 0;
      rb.setTranslation(scratchRapierVec, true);
    }

    // --- Inner glow pulse ---
    if (glowRef.current) {
      const pulse = 0.7 + 0.3 * Math.sin(t * 2 + floatPhase);
      glowRef.current.intensity = (hovered ? 12 : 6) * pulse;
    }

    // --- Jelly (zero-alloc) ---
    // Sustituye new Vector3(...).distanceTo(prev) por escalares puros.
    // 3 restas + 1 dot + 1 sqrt vs 1 alloc + métodos. Mismo resultado, 0 GC pressure.
    const linVel = rb.linvel();
    const dvx = linVel.x - prevLinVel.current.x;
    const dvy = linVel.y - prevLinVel.current.y;
    const dvz = linVel.z - prevLinVel.current.z;
    const velDelta = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);

    if (velDelta > IMPACT_THRESHOLD) {
      jelly.current.velocity = -Math.min(velDelta * 0.12, 1.2);
      jelly.current.active = true;
    }
    prevLinVel.current.x = linVel.x;
    prevLinVel.current.y = linVel.y;
    prevLinVel.current.z = linVel.z;

    const j = jelly.current;
    if (j.active) {
      const springForce = -JELLY_STIFFNESS * j.deformation;
      const dampForce = -JELLY_DAMPING * j.velocity;
      j.velocity += (springForce + dampForce) * dt;
      j.deformation += j.velocity * dt;

      const squash = 1 + j.deformation;
      const stretch = 1 / Math.sqrt(Math.max(squash, 0.4));
      mesh.scale.set(stretch, squash, stretch);

      if (Math.abs(j.deformation) < 0.001 && Math.abs(j.velocity) < 0.001) {
        j.deformation = 0;
        j.velocity = 0;
        j.active = false;
        mesh.scale.set(1, 1, 1);
      }
    }

    // Idle float — comparamos cuadrados (evita sqrt + slow path de hypot/Math.pow).
    const speedSq = linVel.x * linVel.x + linVel.y * linVel.y;
    if (speedSq < 0.25) {
      mesh.position.y = Math.sin(t * 1.5 + floatPhase) * 0.03;
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      restitution={CUBE_RESTITUTION}
      friction={0.4}
      mass={0.08}
      linearDamping={CUBE_LINEAR_DAMPING}
      angularDamping={CUBE_ANGULAR_DAMPING}
      colliders={false}
      enabledTranslations={[true, true, false]}
      name={`cube-${data.id}`}
      userData={{ pageData: data }}
    >
      <CuboidCollider args={[half, half, half]} />

      <BallCollider
        args={[s * 0.85]}
        sensor
        onIntersectionEnter={(payload) => {
          if (payload.other.rigidBodyObject?.name === "character") {
            handleCharacterNear();
          }
        }}
        onIntersectionExit={(payload) => {
          if (payload.other.rigidBodyObject?.name === "character") {
            handleCharacterLeave();
          }
        }}
      />

      <group>
        {/* === Glass cube === */}
        <mesh
          ref={meshRef}
          castShadow
          receiveShadow
          onPointerOver={() => {
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "default";
          }}
        >
          <RoundedBox args={[s, s, s]} radius={s * 0.13} smoothness={4}>
            <meshPhysicalMaterial
              ref={materialRef}
              color={data.color}
              transmission={0.92}
              thickness={s}
              roughness={0.05}
              ior={1.5}
              envMapIntensity={2.5}
              clearcoat={1}
              clearcoatRoughness={0.02}
              iridescence={0.3}
              iridescenceIOR={1.3}
              iridescenceThicknessRange={[100, 400]}
              metalness={0}
              emissive={data.color}
              emissiveIntensity={hovered ? 0.4 : 0.08}
              transparent
              opacity={0}
              toneMapped={false}
              side={THREE.FrontSide}
            />
          </RoundedBox>
        </mesh>

        {/* === Colored edge wireframe for definition === */}
        <mesh>
          <RoundedBox args={[s + 0.02, s + 0.02, s + 0.02]} radius={s * 0.13} smoothness={4}>
            <meshBasicMaterial
              ref={outlineMaterialRef}
              color={data.color}
              wireframe
              transparent
              opacity={0}
              toneMapped={false}
            />
          </RoundedBox>
        </mesh>

        {/* === Inner glow — point light casting cube color === */}
        <pointLight
          ref={glowRef}
          color={data.color}
          intensity={6}
          distance={5}
          decay={2}
        />

        {/* === Labels on front and back — side faces are rarely visible and cost 4 extra SDF textures === */}
        {([
          { pos: [0, 0, half + 0.03] as const, rot: [0, 0, 0] as const },
          { pos: [0, 0, -(half + 0.03)] as const, rot: [0, Math.PI, 0] as const },
        ]).map((face, i) => (
          <Text
            key={i}
            position={[face.pos[0], face.pos[1], face.pos[2]]}
            rotation={[face.rot[0], face.rot[1], face.rot[2]]}
            fontSize={fontSize}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineBlur={0.05}
            outlineColor={data.color}
            letterSpacing={0.1}
            fontWeight={700}
            maxWidth={s * 0.85}
            material-depthOffset={-1}
          >
            {data.label.toUpperCase()}
          </Text>
        ))}
      </group>
    </RigidBody>
  );
}
