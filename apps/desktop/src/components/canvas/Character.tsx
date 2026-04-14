"use client";

import { useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame } from "@react-three/fiber";
import {
  RigidBody,
  CapsuleCollider,
  RapierRigidBody,
} from "@react-three/rapier";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import * as THREE from "three";

const MODEL_PATH = "/3d_models/astronaut/character.glb";

const MOVE_SPEED = 6;
const JUMP_IMPULSE = 8;
const WRAP_X = 18.5;
/** Offset to align model feet with capsule collider bottom */
const MODEL_Y_OFFSET = 4.0;

export interface CharacterHandle {
  getPosition: () => THREE.Vector3;
  getFacingDirection: () => number;
  getRigidBody: () => RapierRigidBody | null;
}

interface CharacterProps {
  position: [number, number, number];
  keys: React.RefObject<Set<string>>;
  holding?: boolean;
}

type AnimState = "idle" | "walk" | "jump" | "fall" | "wave";

const ANIM_NAMES: Record<AnimState, string> = {
  idle: "CharacterArmature|Idle",
  walk: "CharacterArmature|Run",
  jump: "CharacterArmature|Jump",
  fall: "CharacterArmature|Jump_Idle",
  wave: "CharacterArmature|Wave",
};

export const Character = forwardRef<CharacterHandle, CharacterProps>(
  function Character({ position, keys, holding = false }, ref) {
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const modelRef = useRef<THREE.Group>(null!);
    const facingDir = useRef(1);
    const targetRotY = useRef(Math.PI / 2); // start facing right
    const isGrounded = useRef(false);
    const jumpCooldown = useRef(0);
    const jumpWasPressed = useRef(false);
    const currentAnim = useRef<AnimState>("idle");
    const prevHolding = useRef(false);

    const { scene, animations } = useGLTF(MODEL_PATH);

    // SkeletonUtils.clone properly rebinds skeleton → mesh follows parent transforms
    const clone = useMemo(() => {
      const c = SkeletonUtils.clone(scene);
      c.traverse((child) => {
        if (child.name === "Pistol") child.visible = false;
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).castShadow = true;
          (child as THREE.Mesh).receiveShadow = true;
        }
      });
      return c;
    }, [scene]);

    const { actions } = useAnimations(animations, modelRef);

    // Play idle on mount
    useEffect(() => {
      const idle = actions[ANIM_NAMES.idle];
      if (idle) idle.reset().fadeIn(0.2).play();
    }, [actions]);

    // Holding changed
    useEffect(() => {
      if (holding && !prevHolding.current) {
        switchAnim("wave");
      } else if (!holding && prevHolding.current) {
        switchAnim("idle");
      }
      prevHolding.current = holding;
    }, [holding]);

    function switchAnim(state: AnimState) {
      if (currentAnim.current === state) return;
      const prev = actions[ANIM_NAMES[currentAnim.current]];
      const next = actions[ANIM_NAMES[state]];
      currentAnim.current = state;
      if (!next) return;
      prev?.fadeOut(0.2);
      if (state === "jump") {
        next.reset().fadeIn(0.1).setLoop(THREE.LoopOnce, 1).play();
        next.clampWhenFinished = true;
      } else {
        next.reset().fadeIn(0.2).play();
      }
    }

    useImperativeHandle(ref, () => ({
      getPosition: () => {
        const rb = rigidBodyRef.current;
        if (!rb) return new THREE.Vector3();
        const t = rb.translation();
        return new THREE.Vector3(t.x, t.y, t.z);
      },
      getFacingDirection: () => facingDir.current,
      getRigidBody: () => rigidBodyRef.current,
    }), []);

    useFrame((_state, delta) => {
      const rb = rigidBodyRef.current;
      const model = modelRef.current;
      if (!rb || !model || !keys.current) return;

      const activeKeys = keys.current;
      const vel = rb.linvel();
      const pos = rb.translation();

      // --- Sync visual to physics body (offset up so feet touch ground) ---
      model.position.set(pos.x, pos.y + MODEL_Y_OFFSET, pos.z);

      isGrounded.current = Math.abs(vel.y) < 0.3;
      if (jumpCooldown.current > 0) jumpCooldown.current -= delta;

      // --- Movement (A/D or Left/Right) ---
      let moveX = 0;
      if (activeKeys.has("ArrowLeft") || activeKeys.has("KeyA")) moveX -= 1;
      if (activeKeys.has("ArrowRight") || activeKeys.has("KeyD")) moveX += 1;
      if (moveX !== 0) {
        facingDir.current = moveX;
        targetRotY.current = moveX > 0 ? Math.PI / 2 : -Math.PI / 2;
      }

      rb.setLinvel({ x: moveX * MOVE_SPEED, y: vel.y, z: 0 }, true);

      // --- Rotate model with W/Up (face camera) and S/Down (face away) ---
      if (activeKeys.has("ArrowUp") || activeKeys.has("KeyW")) {
        targetRotY.current = Math.PI; // face toward camera
      }
      if (activeKeys.has("ArrowDown") || activeKeys.has("KeyS")) {
        targetRotY.current = 0; // face away from camera
      }

      // --- Wrap around ---
      if (pos.x > WRAP_X) {
        rb.setTranslation({ x: -WRAP_X, y: pos.y, z: 0 }, true);
      } else if (pos.x < -WRAP_X) {
        rb.setTranslation({ x: WRAP_X, y: pos.y, z: 0 }, true);
      }

      // --- Lock Z ---
      if (Math.abs(pos.z) > 0.1) {
        rb.setTranslation({ x: pos.x, y: pos.y, z: 0 }, true);
      }

      // --- Jump (Space only) ---
      const jumpPressed = activeKeys.has("Space");
      const jumpJustPressed = jumpPressed && !jumpWasPressed.current;
      jumpWasPressed.current = jumpPressed;

      if (jumpJustPressed && isGrounded.current && jumpCooldown.current <= 0) {
        rb.applyImpulse({ x: 0, y: JUMP_IMPULSE, z: 0 }, true);
        jumpCooldown.current = 0.4;
        switchAnim("jump");
      }

      // --- Animation state ---
      const facingCamera = activeKeys.has("ArrowDown") || activeKeys.has("KeyS");
      if (!isGrounded.current && vel.y < -1) {
        switchAnim("fall");
      } else if (isGrounded.current) {
        if (moveX !== 0) {
          switchAnim("walk");
        } else if (holding || facingCamera) {
          switchAnim("wave");
        } else {
          switchAnim("idle");
        }
      }

      // --- Face direction (smooth rotation to target) ---
      model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, targetRotY.current, 0.15);
    });

    return (
      <>
        {/* Physics body — invisible */}
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
        </RigidBody>

        {/* Visual model — synced to physics in useFrame */}
        <group ref={modelRef}>
          <primitive object={clone} />
        </group>
      </>
    );
  }
);

useGLTF.preload(MODEL_PATH);
