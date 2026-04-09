"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import {
  RigidBody,
  RapierRigidBody,
  useRapier,
  interactionGroups,
} from "@react-three/rapier";
import { MeshTransmissionMaterial, Text, Float } from "@react-three/drei";
import * as THREE from "three";
import type { Project } from "@/data/projects";

/**
 * ProjectNode — A draggable physics-driven icosahedron representing a project.
 *
 * ### Architecture decisions:
 *
 * **Drag via pointer events + raycasting (not @use-gesture/react directly)**
 * R3F's event system already does raycasting for us. We track pointer state
 * manually and project the pointer's world-space position onto the drag plane
 * (perpendicular to camera). This gives pixel-accurate dragging in 3D space
 * without fighting the 2D→3D coordinate mismatch that plagues raw useDrag.
 *
 * **Fake jelly effect (squash & stretch)**
 * True soft-body physics would destroy FPS. Instead we detect impacts via
 * velocity delta between frames. When impact magnitude exceeds a threshold,
 * we trigger a squash (flatten on impact axis) → stretch (elongate) → settle
 * spring animation, all in useFrame. The mesh scale oscillates with damping.
 *
 * **MeshTransmissionMaterial**
 * Premium glass/crystal look. We keep `samples` low (4) and `resolution` at
 * 256 for performance. The `chromaticAberration` and `iridescence` give that
 * award-winning prismatic quality.
 *
 * Performance (three-best-practices):
 * - render-avoid-allocations: all THREE objects allocated once via useRef/useMemo
 * - material-avoid-transparency: transmission is expensive but justified here
 * - physics-integration: Rapier RigidBody with hull collider
 */

interface ProjectNodeProps {
  project: Project;
  position: [number, number, number];
  color: string;
  onCaptured?: (project: Project) => void;
}

/** Damped spring for jelly squash & stretch */
interface JellyState {
  /** Current deformation (0 = rest, negative = squash, positive = stretch) */
  deformation: number;
  /** Velocity of the spring */
  velocity: number;
  /** Whether we're currently animating */
  active: boolean;
}

// Reusable THREE objects (render-avoid-allocations)
const _impulse = new THREE.Vector3();
const _dragPlaneNormal = new THREE.Vector3(0, 0, 1);
const _dragPoint = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _dragPlane = new THREE.Plane();
const _intersection = new THREE.Vector3();

const JELLY_STIFFNESS = 180;
const JELLY_DAMPING = 8;
const IMPACT_THRESHOLD = 3;

export function ProjectNode({
  project,
  position,
  color,
  onCaptured,
}: ProjectNodeProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { camera, pointer, size } = useThree();

  // Drag state
  const isDragging = useRef(false);
  const dragOffset = useRef(new THREE.Vector3());
  const lastVelocity = useRef(new THREE.Vector3());

  // Jelly spring state
  const jelly = useRef<JellyState>({
    deformation: 0,
    velocity: 0,
    active: false,
  });

  // Track previous linear velocity for impact detection
  const prevLinVel = useRef(new THREE.Vector3());

  // Glow on hover
  const [hovered, setHovered] = useState(false);

  /** Project the pointer onto a plane at the object's Z depth */
  const getWorldPointerOnPlane = useCallback(
    (planePoint: THREE.Vector3) => {
      // Build a plane facing the camera at the object's position
      _dragPlaneNormal.copy(camera.position).sub(planePoint).normalize();
      _dragPlane.setFromNormalAndCoplanarPoint(_dragPlaneNormal, planePoint);

      // Cast ray from pointer through camera
      _raycaster.setFromCamera(pointer, camera);
      _raycaster.ray.intersectPlane(_dragPlane, _intersection);

      return _intersection;
    },
    [camera, pointer]
  );

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      // @ts-expect-error - setPointerCapture exists on the target
      e.target.setPointerCapture(e.pointerId);
      isDragging.current = true;

      const rb = rigidBodyRef.current;
      if (!rb) return;

      // Store offset between pointer hit point and body center
      const bodyPos = rb.translation();
      const hitPoint = e.point;
      dragOffset.current.set(
        bodyPos.x - hitPoint.x,
        bodyPos.y - hitPoint.y,
        bodyPos.z - hitPoint.z
      );

      // Make the body kinematic while dragging for direct control
      rb.setBodyType(2, true); // 2 = KinematicPositionBased
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDragging.current || !rigidBodyRef.current) return;
      e.stopPropagation();

      const rb = rigidBodyRef.current;
      const bodyPos = rb.translation();

      // Project pointer onto drag plane at current body depth
      _dragPoint.set(bodyPos.x, bodyPos.y, bodyPos.z);
      const worldPoint = getWorldPointerOnPlane(_dragPoint);

      // Apply offset so object doesn't snap to cursor center
      const targetX = worldPoint.x + dragOffset.current.x;
      const targetY = worldPoint.y + dragOffset.current.y;
      const targetZ = bodyPos.z; // Keep Z stable

      // Track velocity for throw
      lastVelocity.current.set(
        (targetX - bodyPos.x) * 60,
        (targetY - bodyPos.y) * 60,
        0
      );

      rb.setNextKinematicTranslation({
        x: targetX,
        y: targetY,
        z: targetZ,
      });
    },
    [getWorldPointerOnPlane]
  );

  const handlePointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDragging.current) return;
      e.stopPropagation();
      isDragging.current = false;

      const rb = rigidBodyRef.current;
      if (!rb) return;

      // Switch back to dynamic and apply throw impulse
      rb.setBodyType(0, true); // 0 = Dynamic
      rb.wakeUp();

      // Apply the tracked velocity as an impulse for the "throw" feel
      _impulse.copy(lastVelocity.current).multiplyScalar(0.15);
      // Clamp max throw force
      const maxForce = 25;
      if (_impulse.length() > maxForce) {
        _impulse.normalize().multiplyScalar(maxForce);
      }
      rb.applyImpulse(
        { x: _impulse.x, y: _impulse.y, z: _impulse.z },
        true
      );
    },
    []
  );

  useFrame((state, delta) => {
    const rb = rigidBodyRef.current;
    const mesh = meshRef.current;
    if (!rb || !mesh) return;

    // --- Impact detection for jelly effect ---
    if (!isDragging.current) {
      const linVel = rb.linvel();
      const currentVel = new THREE.Vector3(linVel.x, linVel.y, linVel.z);
      const velDelta = currentVel.distanceTo(prevLinVel.current);

      if (velDelta > IMPACT_THRESHOLD) {
        // Trigger squash — magnitude proportional to impact
        jelly.current.velocity = -Math.min(velDelta * 0.15, 1.5);
        jelly.current.active = true;
      }

      prevLinVel.current.copy(currentVel);
    }

    // --- Jelly spring animation (damped harmonic oscillator) ---
    const j = jelly.current;
    if (j.active) {
      const springForce = -JELLY_STIFFNESS * j.deformation;
      const dampForce = -JELLY_DAMPING * j.velocity;
      j.velocity += (springForce + dampForce) * delta;
      j.deformation += j.velocity * delta;

      // Apply squash & stretch to mesh scale
      // Squash: flatten Y, expand X/Z (volume preservation)
      const squash = 1 + j.deformation;
      const stretch = 1 / Math.sqrt(Math.max(squash, 0.3)); // Preserve volume
      mesh.scale.set(stretch, squash, stretch);

      // Settle when energy is negligible
      if (
        Math.abs(j.deformation) < 0.001 &&
        Math.abs(j.velocity) < 0.001
      ) {
        j.deformation = 0;
        j.velocity = 0;
        j.active = false;
        mesh.scale.set(1, 1, 1);
      }
    }
  });

  // Color as THREE.Color for emissive calculations
  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      colliders="hull"
      restitution={1.3}
      friction={0.05}
      linearDamping={0.3}
      angularDamping={0.5}
      name={project.id}
      userData={{ project }}
    >
      <group ref={groupRef}>
        <mesh
          ref={meshRef}
          castShadow
          receiveShadow
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerOver={() => {
            setHovered(true);
            document.body.style.cursor = "grab";
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "default";
          }}
        >
          <icosahedronGeometry args={[1.4, 3]} />
          <MeshTransmissionMaterial
            backside
            samples={4}
            resolution={256}
            thickness={2.5}
            chromaticAberration={0.8}
            anisotropy={0.3}
            iridescence={1}
            iridescenceIOR={1.2}
            iridescenceThicknessRange={[100, 1400]}
            clearcoat={1}
            clearcoatRoughness={0.1}
            transmission={0.97}
            roughness={0.05}
            color={color}
            emissive={color}
            emissiveIntensity={hovered ? 0.4 : 0.1}
            toneMapped={false}
          />
        </mesh>

        {/* Project title floating on the surface */}
        <Text
          position={[0, 0, 1.6]}
          fontSize={0.32}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="black"
          maxWidth={2.5}
        >
          {project.title.toUpperCase()}
        </Text>

        {/* Category label below */}
        <Text
          position={[0, -0.45, 1.6]}
          fontSize={0.16}
          color="#888888"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="black"
        >
          {project.category}
        </Text>
      </group>
    </RigidBody>
  );
}
