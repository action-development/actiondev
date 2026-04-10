"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import { useFrame } from "@react-three/fiber";
import {
  RigidBody,
  CapsuleCollider,
  RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";

/**
 * Character — Simple geometric capsule character (no GLB model).
 * Capsule body + sphere head + accent visor. Reliable, zero dependencies.
 */

const MOVE_SPEED = 6;
const JUMP_IMPULSE = 8;

export interface CharacterHandle {
  getPosition: () => THREE.Vector3;
  getFacingDirection: () => number;
  getRigidBody: () => RapierRigidBody | null;
}

interface CharacterProps {
  position: [number, number, number];
  keys: React.RefObject<Set<string>>;
}

export const Character = forwardRef<CharacterHandle, CharacterProps>(
  function Character({ position, keys }, ref) {
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const groupRef = useRef<THREE.Group>(null);
    const facingDir = useRef(1);
    const isGrounded = useRef(false);
    const jumpCooldown = useRef(0);
    const jumpWasPressed = useRef(false);

    useImperativeHandle(
      ref,
      () => ({
        getPosition: () => {
          const rb = rigidBodyRef.current;
          if (!rb) return new THREE.Vector3();
          const t = rb.translation();
          return new THREE.Vector3(t.x, t.y, t.z);
        },
        getFacingDirection: () => facingDir.current,
        getRigidBody: () => rigidBodyRef.current,
      }),
      []
    );

    useFrame((state, delta) => {
      const rb = rigidBodyRef.current;
      const group = groupRef.current;
      if (!rb || !group || !keys.current) return;

      const activeKeys = keys.current;
      const vel = rb.linvel();
      const pos = rb.translation();

      // Ground check — character is grounded when barely moving vertically
      // pos.y is in world space (group offset -4), capsule bottom at RB.y + 0.0
      isGrounded.current = Math.abs(vel.y) < 0.3;

      if (jumpCooldown.current > 0) jumpCooldown.current -= delta;

      // Movement
      let moveX = 0;
      if (activeKeys.has("ArrowLeft") || activeKeys.has("KeyA")) moveX -= 1;
      if (activeKeys.has("ArrowRight") || activeKeys.has("KeyD")) moveX += 1;
      if (moveX !== 0) facingDir.current = moveX;

      rb.setLinvel({ x: moveX * MOVE_SPEED, y: vel.y, z: 0 }, true);

      // Lock Z
      if (Math.abs(pos.z) > 0.1) {
        rb.setTranslation({ x: pos.x, y: pos.y, z: 0 }, true);
      }

      // Jump — only on key DOWN (not hold), and only when grounded
      const jumpPressed =
        activeKeys.has("Space") ||
        activeKeys.has("ArrowUp") ||
        activeKeys.has("KeyW");
      const jumpJustPressed = jumpPressed && !jumpWasPressed.current;
      jumpWasPressed.current = jumpPressed;

      if (jumpJustPressed && isGrounded.current && jumpCooldown.current <= 0) {
        rb.applyImpulse({ x: 0, y: JUMP_IMPULSE, z: 0 }, true);
        jumpCooldown.current = 0.4;
      }

      // Visual flip
      group.scale.x = facingDir.current;

      // Tilt
      group.rotation.z = THREE.MathUtils.lerp(
        group.rotation.z,
        moveX * 0.12,
        0.15
      );

      // Bob
      if (isGrounded.current && moveX !== 0) {
        group.position.y = Math.sin(state.clock.elapsedTime * 12) * 0.04;
      } else {
        group.position.y = THREE.MathUtils.lerp(group.position.y, 0, 0.1);
      }
    });

    return (
      <RigidBody
        ref={rigidBodyRef}
        position={position}
        lockRotations
        linearDamping={0.5}
        friction={0.7}
        restitution={0}
        colliders={false}
        name="character"
      >
        <CapsuleCollider args={[0.4, 0.35]} position={[0, 0.75, 0]} />

        <group ref={groupRef}>
          {/* Body */}
          <mesh position={[0, 0.75, 0]} castShadow>
            <capsuleGeometry args={[0.35, 0.8, 8, 16]} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Head */}
          <mesh position={[0, 1.65, 0]} castShadow>
            <sphereGeometry args={[0.28, 16, 16]} />
            <meshStandardMaterial color="#16213e" metalness={0.9} roughness={0.1} />
          </mesh>

          {/* Visor */}
          <mesh position={[0, 1.68, 0.22]}>
            <boxGeometry args={[0.4, 0.08, 0.08]} />
            <meshStandardMaterial
              color="#c8ff00"
              emissive="#c8ff00"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>

          {/* Eyes */}
          <mesh position={[-0.1, 1.72, 0.26]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={3} toneMapped={false} />
          </mesh>
          <mesh position={[0.1, 1.72, 0.26]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={3} toneMapped={false} />
          </mesh>
        </group>
      </RigidBody>
    );
  }
);
