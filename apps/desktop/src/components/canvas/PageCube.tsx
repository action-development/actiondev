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
import { CUBE_LINEAR_DAMPING, CUBE_ANGULAR_DAMPING } from "./constants";

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
}

interface PageCubeProps {
  data: PageCubeData;
  position: [number, number, number];
  onNearby?: (id: string, rb: RapierRigidBody) => void;
  onNearbyExit?: (id: string) => void;
}

const JELLY_STIFFNESS = 200;
const JELLY_DAMPING = 10;
const IMPACT_THRESHOLD = 2.5;

export function PageCube({ data, position, onNearby, onNearbyExit }: PageCubeProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);

  // Jelly spring
  const jelly = useRef({ deformation: 0, velocity: 0, active: false });
  const prevLinVel = useRef(new THREE.Vector3());

  const floatPhase = useMemo(() => Math.random() * Math.PI * 2, []);

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

    // Lock Z to 0
    const pos = rb.translation();
    if (Math.abs(pos.z) > 0.1) {
      rb.setTranslation({ x: pos.x, y: pos.y, z: 0 }, true);
    }

    // --- Inner glow pulse ---
    if (glowRef.current) {
      const pulse = 0.7 + 0.3 * Math.sin(state.clock.elapsedTime * 2 + floatPhase);
      glowRef.current.intensity = (hovered ? 12 : 6) * pulse;
    }

    // --- Jelly effect ---
    const linVel = rb.linvel();
    const currentVel = new THREE.Vector3(linVel.x, linVel.y, linVel.z);
    const velDelta = currentVel.distanceTo(prevLinVel.current);

    if (velDelta > IMPACT_THRESHOLD) {
      jelly.current.velocity = -Math.min(velDelta * 0.12, 1.2);
      jelly.current.active = true;
    }

    prevLinVel.current.copy(currentVel);

    const j = jelly.current;
    if (j.active) {
      const springForce = -JELLY_STIFFNESS * j.deformation;
      const dampForce = -JELLY_DAMPING * j.velocity;
      j.velocity += (springForce + dampForce) * delta;
      j.deformation += j.velocity * delta;

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

    // Idle float
    const speed = Math.sqrt(linVel.x ** 2 + linVel.y ** 2);
    if (speed < 0.5) {
      mesh.position.y = Math.sin(state.clock.elapsedTime * 1.5 + floatPhase) * 0.03;
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      restitution={0.6}
      friction={0.4}
      linearDamping={CUBE_LINEAR_DAMPING}
      angularDamping={CUBE_ANGULAR_DAMPING}
      colliders={false}
      name={`cube-${data.id}`}
      userData={{ pageData: data }}
    >
      <CuboidCollider args={[0.7, 0.7, 0.7]} />

      <BallCollider
        args={[1.2]}
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
        {/* === Cube mesh — premium physical material === */}
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
          <RoundedBox args={[1.4, 1.4, 1.4]} radius={0.16} smoothness={4}>
            <meshPhysicalMaterial
              color={data.color}
              emissive={data.color}
              emissiveIntensity={hovered ? 0.8 : 0.25}
              metalness={0.92}
              roughness={0.06}
              clearcoat={1}
              clearcoatRoughness={0.04}
              iridescence={0.4}
              iridescenceIOR={1.6}
              iridescenceThicknessRange={[100, 800]}
              envMapIntensity={1.8}
              toneMapped={false}
            />
          </RoundedBox>
        </mesh>

        {/* === Inner glow — point light casting cube color === */}
        <pointLight
          ref={glowRef}
          color={data.color}
          intensity={6}
          distance={4}
          decay={2}
        />

        {/* === Text glow backing — front === */}
        <mesh position={[0, 0, 0.76]}>
          <planeGeometry args={[1.2, 0.4]} />
          <meshBasicMaterial
            color={data.color}
            transparent
            opacity={0.12}
            toneMapped={false}
          />
        </mesh>

        {/* === Label — front face === */}
        <Text
          position={[0, 0, 0.78]}
          fontSize={0.28}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.025}
          outlineColor={data.color}
          maxWidth={1.2}
          letterSpacing={0.06}
        >
          {data.label.toUpperCase()}
        </Text>

        {/* === Text glow backing — back === */}
        <mesh position={[0, 0, -0.76]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.2, 0.4]} />
          <meshBasicMaterial
            color={data.color}
            transparent
            opacity={0.12}
            toneMapped={false}
          />
        </mesh>

        {/* === Label — back face === */}
        <Text
          position={[0, 0, -0.78]}
          fontSize={0.28}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          rotation={[0, Math.PI, 0]}
          outlineWidth={0.025}
          outlineColor={data.color}
          maxWidth={1.2}
          letterSpacing={0.06}
        >
          {data.label.toUpperCase()}
        </Text>
      </group>
    </RigidBody>
  );
}
