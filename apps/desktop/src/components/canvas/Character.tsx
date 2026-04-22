"use client";

import { useRef, forwardRef, useImperativeHandle, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  RigidBody,
  CapsuleCollider,
  RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";
import {
  WRAP_X,
  MOVE_SPEED,
  JUMP_IMPULSE,
  MOVE_ACCEL,
  AIR_CONTROL,
} from "./constants";
import { useGroundCheck } from "@/hooks/use-ground-check";
import { computeNextVelocity, computeWrapX } from "@/lib/character-math";

/* ------------------------------------------------------------------ */
/* Lime Spirit — glass-body character that glows from within.         */
/* Matches the cube material language (transmission + iridescence     */
/* cousin). Pinhole eyes track the pointer. Leaves a faint trail.     */
/* ------------------------------------------------------------------ */

/* Physics */
const CAPSULE_HALF_HEIGHT = 0.4;
const CAPSULE_RADIUS = 0.35;
const CAPSULE_Y_OFFSET = 0.75;
const BODY_LENGTH = CAPSULE_HALF_HEIGHT * 2;
const BODY_TOTAL_HEIGHT = BODY_LENGTH + CAPSULE_RADIUS * 2;

/* Visual / material */
const SHELL_COLOR = "#e6ffa0";        // slightly-desaturated accent for the glass
const CORE_COLOR = "#c8ff00";         // pure accent — the inner glow
const EYE_COLOR = "#0a0a0a";
/* Eyes */
const EYE_RADIUS = 0.065;
const EYE_X_OFFSET = 0.14;
const EYE_Y_OFFSET = CAPSULE_HALF_HEIGHT * 0.55;
const EYE_Z_OFFSET = CAPSULE_RADIUS - 0.015;
const EYE_TRACK_AMP = 0.045;
const EYE_TRACK_LERP = 9;

/* Trail */
const TRAIL_COUNT = 6;
const TRAIL_SPAWN_INTERVAL = 0.06; // seconds between trail samples while moving
const TRAIL_SPEED_THRESHOLD = 1.5; // only emit when moving faster than this
const TRAIL_LIFETIME = 0.45;
const TRAIL_BASE_RADIUS = 0.18;

/* Motion */
const IDLE_BOB_AMP = 0.04;
const IDLE_BOB_FREQ = 1.3;
const IDLE_ROT_FREQ = 0.35;
const IDLE_ROT_AMP = 0.08;
const WALK_BOB_AMP = 0.07;
const WALK_BOB_FREQ = 8;
const LANDING_SQUASH_MS = 140;
const WAVE_TILT = 0.22;
const WAVE_FREQ = 4;
const SCALE_LERP = 14;
const JUMP_SCALE = { x: 0.86, y: 1.2,  z: 0.86 };
const FALL_SCALE = { x: 0.92, y: 1.1,  z: 0.92 };
const LAND_SCALE = { x: 1.22, y: 0.78, z: 1.22 };

/* Blink */
const BLINK_DURATION = 0.12;
const BLINK_MIN_INTERVAL = 3;
const BLINK_MAX_INTERVAL = 6;

export interface CharacterHandle {
  getPosition: () => THREE.Vector3;
  getFacingDirection: () => number;
  getRigidBody: () => RapierRigidBody | null;
  getModelHeight: () => number;
}

interface CharacterProps {
  position: [number, number, number];
  keys: React.RefObject<Set<string>>;
  holding?: boolean;
}

function expLerp(rate: number, dt: number): number {
  return 1 - Math.exp(-rate * dt);
}

function randomBlinkInterval(): number {
  return BLINK_MIN_INTERVAL + Math.random() * (BLINK_MAX_INTERVAL - BLINK_MIN_INTERVAL);
}

interface TrailSlot {
  position: THREE.Vector3;
  spawnTime: number; // -1 = empty
}

export const Character = forwardRef<CharacterHandle, CharacterProps>(
  function Character({ position, keys, holding = false }, ref) {
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const modelRef = useRef<THREE.Group>(null!);
    const bodyRef = useRef<THREE.Group>(null!);
    const inlayRef = useRef<THREE.Group>(null!);      // bobbing offset without affecting scale pivot
    const eyeLRef = useRef<THREE.Mesh>(null!);
    const eyeRRef = useRef<THREE.Mesh>(null!);
    const pointLightRef = useRef<THREE.PointLight>(null!);

    const trailGroupRef = useRef<THREE.Group>(null!);
    const trailMeshRefs = useRef<(THREE.Mesh | null)[]>([]);

    const { pointer } = useThree();

    const facingDir = useRef(1);
    const targetRotY = useRef(Math.PI / 2);
    const jumpCooldown = useRef(0);
    const jumpWasPressed = useRef(false);
    const wasGrounded = useRef(true);
    const landingEndTime = useRef(0);
    const eyeOffsetX = useRef(0);
    const eyeOffsetY = useRef(0);
    const nextBlinkTime = useRef(randomBlinkInterval());
    const blinkStartTime = useRef(-1);

    /* Trail ring buffer — fixed length, mutated in-place each frame. */
    const trail = useMemo<TrailSlot[]>(
      () =>
        Array.from({ length: TRAIL_COUNT }, () => ({
          position: new THREE.Vector3(),
          spawnTime: -1,
        })),
      []
    );
    const trailWriteIndex = useRef(0);
    const lastTrailSpawn = useRef(0);

    const { isGroundedRef, check: checkGround } = useGroundCheck(
      rigidBodyRef,
      CAPSULE_HALF_HEIGHT,
      CAPSULE_RADIUS,
      CAPSULE_Y_OFFSET
    );

    useImperativeHandle(ref, () => ({
      getPosition: () => {
        const rb = rigidBodyRef.current;
        if (!rb) return new THREE.Vector3();
        const t = rb.translation();
        return new THREE.Vector3(t.x, t.y, t.z);
      },
      getFacingDirection: () => facingDir.current,
      getRigidBody: () => rigidBodyRef.current,
      getModelHeight: () => BODY_TOTAL_HEIGHT,
    }), []);

    useFrame((state, delta) => {
      const rb = rigidBodyRef.current;
      const model = modelRef.current;
      const body = bodyRef.current;
      const inlay = inlayRef.current;
      const eyeL = eyeLRef.current;
      const eyeR = eyeRRef.current;
      if (!rb || !model || !body || !inlay || !eyeL || !eyeR || !keys.current) return;

      const dt = Math.min(delta, 1 / 30);
      const t = state.clock.elapsedTime;
      const activeKeys = keys.current;
      const vel = rb.linvel();
      const pos = rb.translation();

      checkGround();
      const grounded = isGroundedRef.current;
      if (jumpCooldown.current > 0) jumpCooldown.current -= dt;

      /* ------------------------------ Movement ------------------------------ */
      let moveX = 0;
      if (activeKeys.has("ArrowLeft") || activeKeys.has("KeyA")) moveX -= 1;
      if (activeKeys.has("ArrowRight") || activeKeys.has("KeyD")) moveX += 1;
      if (moveX !== 0) {
        facingDir.current = moveX;
        targetRotY.current = moveX > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      if (activeKeys.has("ArrowUp") || activeKeys.has("KeyW")) targetRotY.current = Math.PI;
      if (activeKeys.has("ArrowDown") || activeKeys.has("KeyS")) targetRotY.current = 0;

      const targetVx = moveX * MOVE_SPEED;
      const accel = grounded ? MOVE_ACCEL : AIR_CONTROL;
      const nextVx = computeNextVelocity(targetVx, vel.x, dt, accel);
      rb.setLinvel({ x: nextVx, y: vel.y, z: 0 }, true);

      const wrappedX = computeWrapX(pos.x, WRAP_X);
      if (wrappedX !== null) rb.setTranslation({ x: wrappedX, y: pos.y, z: 0 }, true);

      const jumpPressed = activeKeys.has("Space");
      const jumpJustPressed = jumpPressed && !jumpWasPressed.current;
      jumpWasPressed.current = jumpPressed;
      if (jumpJustPressed && grounded && jumpCooldown.current <= 0) {
        rb.applyImpulse({ x: 0, y: JUMP_IMPULSE, z: 0 }, true);
        jumpCooldown.current = 0.4;
      }

      if (grounded && !wasGrounded.current) landingEndTime.current = t + LANDING_SQUASH_MS / 1000;
      wasGrounded.current = grounded;

      /* -------------------- Visual: facing (root rotation) ------------------ */
      model.rotation.y += (targetRotY.current - model.rotation.y) * expLerp(12, dt);

      /* -------------------- Idle rotation wobble ---------------------------- */
      // Subtle constant Y-axis wobble makes the spirit feel 'alive' when still.
      const idleWobble = Math.sin(t * IDLE_ROT_FREQ * 2 * Math.PI) * IDLE_ROT_AMP;
      body.rotation.y = idleWobble;

      /* -------------------- Squash / stretch -------------------------------- */
      let tgtX = 1, tgtY = 1, tgtZ = 1;
      const speed = Math.abs(vel.x);

      if (!grounded) {
        if (vel.y > 0.2) {
          tgtX = JUMP_SCALE.x; tgtY = JUMP_SCALE.y; tgtZ = JUMP_SCALE.z;
        } else if (vel.y < -0.2) {
          tgtX = FALL_SCALE.x; tgtY = FALL_SCALE.y; tgtZ = FALL_SCALE.z;
        }
      } else if (t < landingEndTime.current) {
        tgtX = LAND_SCALE.x; tgtY = LAND_SCALE.y; tgtZ = LAND_SCALE.z;
      }

      const sLerp = expLerp(SCALE_LERP, dt);
      body.scale.x += (tgtX - body.scale.x) * sLerp;
      body.scale.y += (tgtY - body.scale.y) * sLerp;
      body.scale.z += (tgtZ - body.scale.z) * sLerp;

      /* -------------------- Spirit bobbing (position Y) --------------------- */
      // Happens on the inlay group so it doesn't fight the scale pivot.
      const bobAmp = speed > 0.5 ? WALK_BOB_AMP : IDLE_BOB_AMP;
      const bobFreq = speed > 0.5 ? WALK_BOB_FREQ : IDLE_BOB_FREQ;
      inlay.position.y = Math.sin(t * bobFreq) * bobAmp;

      /* ---------------------------- Wave tilt ------------------------------- */
      const facingCamera = activeKeys.has("ArrowDown") || activeKeys.has("KeyS");
      const tgtTilt = holding || facingCamera ? Math.sin(t * WAVE_FREQ) * WAVE_TILT : 0;
      body.rotation.z += (tgtTilt - body.rotation.z) * sLerp;

      /* -------------------------- Core glow pulse --------------------------- */
      const glowPulse = 0.8 + 0.2 * Math.sin(t * 2.2);
      if (pointLightRef.current) pointLightRef.current.intensity = 2.2 * glowPulse;

      /* -------------------------- Eye tracking ------------------------------ */
      const px = Math.max(-1, Math.min(1, pointer.x));
      const py = Math.max(-1, Math.min(1, pointer.y));
      const k = expLerp(EYE_TRACK_LERP, dt);
      eyeOffsetX.current += (px * EYE_TRACK_AMP - eyeOffsetX.current) * k;
      eyeOffsetY.current += (py * EYE_TRACK_AMP - eyeOffsetY.current) * k;
      eyeL.position.set(-EYE_X_OFFSET + eyeOffsetX.current, EYE_Y_OFFSET + eyeOffsetY.current, EYE_Z_OFFSET);
      eyeR.position.set( EYE_X_OFFSET + eyeOffsetX.current, EYE_Y_OFFSET + eyeOffsetY.current, EYE_Z_OFFSET);

      /* ------------------------------ Blink --------------------------------- */
      if (blinkStartTime.current < 0 && t >= nextBlinkTime.current) blinkStartTime.current = t;
      if (blinkStartTime.current >= 0) {
        const progress = (t - blinkStartTime.current) / BLINK_DURATION;
        if (progress >= 1) {
          blinkStartTime.current = -1;
          nextBlinkTime.current = t + randomBlinkInterval();
          eyeL.scale.y = 1;
          eyeR.scale.y = 1;
        } else {
          const closed = Math.sin(progress * Math.PI);
          const sy = 1 - closed * 0.95;
          eyeL.scale.y = sy;
          eyeR.scale.y = sy;
        }
      }

      /* ------------------------------ Trail --------------------------------- */
      // Emit a ghost sample when moving fast enough, throttled by interval.
      if (speed > TRAIL_SPEED_THRESHOLD && t - lastTrailSpawn.current >= TRAIL_SPAWN_INTERVAL) {
        const slot = trail[trailWriteIndex.current];
        slot.position.set(pos.x, pos.y + CAPSULE_Y_OFFSET, pos.z);
        slot.spawnTime = t;
        trailWriteIndex.current = (trailWriteIndex.current + 1) % TRAIL_COUNT;
        lastTrailSpawn.current = t;
      }

      // Update each trail mesh: fade size + opacity based on age.
      for (let i = 0; i < TRAIL_COUNT; i++) {
        const slot = trail[i];
        const mesh = trailMeshRefs.current[i];
        if (!mesh) continue;
        if (slot.spawnTime < 0) {
          mesh.visible = false;
          continue;
        }
        const age = t - slot.spawnTime;
        if (age > TRAIL_LIFETIME) {
          slot.spawnTime = -1;
          mesh.visible = false;
          continue;
        }
        const lifeProgress = age / TRAIL_LIFETIME;         // 0..1
        const falloff = 1 - lifeProgress;                  // 1..0
        mesh.visible = true;
        mesh.position.copy(slot.position);
        const s = TRAIL_BASE_RADIUS * falloff;
        mesh.scale.setScalar(Math.max(s, 0.02));
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = falloff * 0.35;
      }
    });

    return (
      <>
        <RigidBody
          ref={rigidBodyRef}
          position={position}
          lockRotations
          enabledTranslations={[true, true, false]}
          linearDamping={0.5}
          friction={0.7}
          restitution={0}
          colliders={false}
          name="character"
        >
          <CapsuleCollider args={[CAPSULE_HALF_HEIGHT, CAPSULE_RADIUS]} position={[0, CAPSULE_Y_OFFSET, 0]} />

          <group ref={modelRef}>
            {/* bodyRef handles rotation+scale for squash/stretch; inlay handles bobbing so scale pivots cleanly */}
            <group ref={bodyRef} position={[0, CAPSULE_Y_OFFSET, 0]}>
              <group ref={inlayRef}>
                {/* Glass shell — same material family as the cubes (transmission + clearcoat) */}
                <mesh castShadow receiveShadow>
                  <capsuleGeometry args={[CAPSULE_RADIUS, BODY_LENGTH, 10, 32]} />
                  <meshPhysicalMaterial
                    color={SHELL_COLOR}
                    transmission={0.6}
                    thickness={0.9}
                    roughness={0.12}
                    ior={1.4}
                    envMapIntensity={2.5}
                    clearcoat={1}
                    clearcoatRoughness={0.04}
                    emissive={CORE_COLOR}
                    emissiveIntensity={0.18}
                    metalness={0}
                    transparent
                    opacity={0.92}
                    toneMapped={false}
                    side={THREE.FrontSide}
                  />
                </mesh>

                {/* Point light — inner glow casts color onto the glass shell */}
                <pointLight
                  ref={pointLightRef}
                  color={CORE_COLOR}
                  intensity={2.2}
                  distance={3.5}
                  decay={2}
                />

                {/* Pinhole eyes */}
                <mesh ref={eyeLRef} position={[-EYE_X_OFFSET, EYE_Y_OFFSET, EYE_Z_OFFSET]}>
                  <sphereGeometry args={[EYE_RADIUS, 16, 16]} />
                  <meshStandardMaterial color={EYE_COLOR} roughness={0.1} metalness={0.3} />
                </mesh>
                <mesh ref={eyeRRef} position={[EYE_X_OFFSET, EYE_Y_OFFSET, EYE_Z_OFFSET]}>
                  <sphereGeometry args={[EYE_RADIUS, 16, 16]} />
                  <meshStandardMaterial color={EYE_COLOR} roughness={0.1} metalness={0.3} />
                </mesh>
              </group>
            </group>
          </group>
        </RigidBody>

        {/* Trail — lives outside the RigidBody so it stays in world space */}
        <group ref={trailGroupRef}>
          {Array.from({ length: TRAIL_COUNT }).map((_, i) => (
            <mesh
              key={i}
              ref={(el) => {
                trailMeshRefs.current[i] = el;
              }}
              visible={false}
            >
              <sphereGeometry args={[1, 10, 10]} />
              <meshBasicMaterial
                color={CORE_COLOR}
                transparent
                opacity={0}
                toneMapped={false}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      </>
    );
  }
);
