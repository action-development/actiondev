"use client";

import { useRef, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import {
  RigidBody,
  BallCollider,
  IntersectionEnterPayload,
  useRapier,
} from "@react-three/rapier";
import * as THREE from "three";
import type { Project } from "@/data/projects";

/**
 * BlackHole — The gravitational attractor and "project catcher".
 *
 * ### How it works:
 *
 * 1. **Visual**: A rotating wireframe torus (accretion disk) + inner sphere
 *    with emissive purple glow + orbiting particle ring. No custom shaders
 *    needed — the composition of simple geometries + bloom-worthy emissive
 *    values creates a convincing effect.
 *
 * 2. **Gravitational pull**: Each frame we iterate all dynamic rigid bodies
 *    in the Rapier world and apply a force toward the black hole center,
 *    scaled by inverse-square distance (capped to avoid singularity).
 *    This creates a natural "orbit and fall in" behavior.
 *
 * 3. **Capture sensor**: A Rapier sensor collider (ball) detects when a
 *    ProjectNode enters the event horizon. On intersection, we fire the
 *    onCapture callback with the project data.
 *
 * Performance (three-best-practices):
 * - render-avoid-allocations: all temp vectors allocated once
 * - lighting-limit-lights: single point light for the glow
 * - material-simplest-sufficient: MeshBasicMaterial for wireframes
 */

interface BlackHoleProps {
  position?: [number, number, number];
  onCapture?: (project: Project) => void;
  /** Gravitational strength multiplier */
  gravity?: number;
  /** Radius of the capture sensor */
  eventHorizonRadius?: number;
}

// Reusable temp vectors (render-avoid-allocations)
const _toCenter = new THREE.Vector3();
const _force = new THREE.Vector3();

/** Number of particles in the accretion ring */
const RING_PARTICLE_COUNT = 60;

export function BlackHole({
  position = [0, -6, 0],
  onCapture,
  gravity = 15,
  eventHorizonRadius = 2.5,
}: BlackHoleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Points>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const diskRef = useRef<THREE.Mesh>(null);
  const { world } = useRapier();

  const blackHolePos = useMemo(
    () => new THREE.Vector3(...position),
    [position]
  );

  // Generate ring particle positions (on a torus path)
  const ringGeometry = useMemo(() => {
    const positions = new Float32Array(RING_PARTICLE_COUNT * 3);
    const sizes = new Float32Array(RING_PARTICLE_COUNT);

    for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
      const angle = (i / RING_PARTICLE_COUNT) * Math.PI * 2;
      const radius = 3.2 + (Math.random() - 0.5) * 0.8;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      sizes[i] = 0.03 + Math.random() * 0.06;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, []);

  // Apply gravitational force to all dynamic bodies each frame
  useFrame((state, delta) => {
    const group = groupRef.current;
    const ring = ringRef.current;
    const inner = innerRef.current;
    const disk = diskRef.current;

    // Visual animations
    if (group) {
      // Slow majestic rotation for the whole assembly
      group.rotation.y += delta * 0.3;
    }
    if (inner) {
      inner.rotation.y += delta * 1.2;
      inner.rotation.x += delta * 0.5;
      // Pulsing emissive
      const pulse = 0.8 + 0.2 * Math.sin(state.clock.elapsedTime * 2);
      (inner.material as THREE.MeshStandardMaterial).emissiveIntensity =
        3 * pulse;
    }
    if (disk) {
      disk.rotation.z += delta * 0.8;
    }
    if (ring) {
      ring.rotation.y -= delta * 0.6;
    }

    // --- Gravitational pull on all dynamic bodies ---
    world.bodies.forEach((body) => {
      // Skip fixed/kinematic bodies
      if (!body.isDynamic()) return;

      const bodyPos = body.translation();
      _toCenter.set(
        blackHolePos.x - bodyPos.x,
        blackHolePos.y - bodyPos.y,
        blackHolePos.z - bodyPos.z
      );

      const distSq = _toCenter.lengthSq();
      const dist = Math.sqrt(distSq);

      // Skip if too close (avoid singularity) or too far (no effect)
      if (dist < 0.5 || dist > 25) return;

      // Inverse-square gravitational force, capped
      const forceMag = Math.min(gravity / Math.max(distSq, 1), 20);

      _force.copy(_toCenter).normalize().multiplyScalar(forceMag);

      body.applyImpulse(
        { x: _force.x * delta, y: _force.y * delta, z: _force.z * delta },
        true
      );
    });
  });

  /** Handle project entering the event horizon */
  const handleIntersection = useCallback(
    (payload: IntersectionEnterPayload) => {
      const rigidBodyObject = payload.other.rigidBodyObject;
      if (!rigidBodyObject) return;

      // Extract project data from the RigidBody's userData
      const userData = rigidBodyObject.userData as
        | { project?: Project }
        | undefined;
      if (userData?.project && onCapture) {
        onCapture(userData.project);
      }
    },
    [onCapture]
  );

  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      {/* Sensor collider for capture detection */}
      <BallCollider
        args={[eventHorizonRadius]}
        sensor
        onIntersectionEnter={handleIntersection}
      />

      <group ref={groupRef}>
        {/* Core — dark sphere with purple emissive glow */}
        <mesh ref={innerRef}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial
            color="#0a0010"
            emissive="#8b5cf6"
            emissiveIntensity={3}
            roughness={0}
            metalness={1}
          />
        </mesh>

        {/* Accretion disk — wireframe torus */}
        <mesh ref={diskRef} rotation={[Math.PI * 0.5, 0, 0]}>
          <torusGeometry args={[2.8, 0.15, 8, 64]} />
          <meshBasicMaterial
            color="#a855f7"
            wireframe
            transparent
            opacity={0.6}
            toneMapped={false}
          />
        </mesh>

        {/* Second ring at a tilt for depth */}
        <mesh rotation={[Math.PI * 0.35, 0.3, 0]}>
          <torusGeometry args={[3.2, 0.08, 6, 48]} />
          <meshBasicMaterial
            color="#c084fc"
            wireframe
            transparent
            opacity={0.3}
            toneMapped={false}
          />
        </mesh>

        {/* Orbiting particle ring */}
        <points ref={ringRef} geometry={ringGeometry}>
          <pointsMaterial
            color="#d8b4fe"
            size={0.08}
            sizeAttenuation
            transparent
            opacity={0.8}
            toneMapped={false}
          />
        </points>

        {/* Glow light */}
        <pointLight
          color="#8b5cf6"
          intensity={80}
          distance={15}
          decay={2}
        />
      </group>
    </RigidBody>
  );
}
