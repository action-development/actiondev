"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Physics, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

import { Character, type CharacterHandle } from "./Character";
import { PageCube, type PageCubeData } from "./PageCube";
import { Basket } from "./Basket";
import { Starfield } from "./Starfield";
import { AimLine, type AimState } from "./AimLine";
import { useKeyboard } from "@/hooks/use-keyboard";
import { useMouseButton } from "@/hooks/use-mouse-button";
import { useMousePosition } from "@/hooks/use-mouse-position";
import type { GameState } from "@/hooks/use-game-state";
import {
  GRAVITY,
  MIN_FORCE,
  MAX_FORCE,
  MIN_AIM_DIST,
  MAX_AIM_DIST,
  HOLD_MARGIN,
  HELD_LERP_SPEED,
} from "./constants";

/** Rapier RigidBodyType enum values (stable — mirror of @dimforge/rapier3d-compat). */
const RB_TYPE_DYNAMIC = 0;
const RB_TYPE_KINEMATIC_POSITION = 2;
import { PAGE_CUBES } from "@/data/game-cubes";

/** Y of the floor collider top surface in world coordinates. */
const FLOOR_TOP_Y = -6;

/** X spawn range: keep cubes in the playable center, away from character (x≈-11) and basket (x≈12). */
/** Tight X window — cubes land close together and collide on the way down. */
const SPAWN_X_CENTER = 1;
const SPAWN_X_SPREAD = 2.5;

/**
 * Random spawn positions in a tight cluster above the viewport so cubes collide
 * as they fall, showcasing physics on entry.
 * Y stagger ≥ 4u keeps cubes separated at spawn (avoids Rapier overlap explosions).
 * Called once per module load → different every page reload, same within a session.
 */
export function computeCubeSpawnPositions(
  cubes: readonly { size: number }[]
): [number, number, number][] {
  return cubes.map((_, i) => {
    const x = SPAWN_X_CENTER + (Math.random() - 0.5) * SPAWN_X_SPREAD * 2;
    const y = 7 + i * 4 + Math.random() * 1.5;
    return [x, y, 0];
  });
}

const CUBE_POSITIONS = computeCubeSpawnPositions(PAGE_CUBES);

/** Half-size of the largest cube — used for hold height clearance. */
const LARGEST_CUBE_HALF = Math.max(...PAGE_CUBES.map((c) => c.size)) / 2;

// Reusable vectors — never allocate in useFrame
const _aimWorldPos = new THREE.Vector3();
const _aimDir      = new THREE.Vector3();
const _raycaster   = new THREE.Raycaster();
const _aimPlane    = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

interface GameWorldProps {
  paused?: boolean;
  physicsActive?: boolean;
  onNavigate?: (href: string) => void;
  gameState: GameState;
  onReady?: () => void;
}

export function GameWorld({ paused = false, physicsActive = false, onNavigate, gameState, onReady }: GameWorldProps) {
  const keys      = useKeyboard();
  const mouseDown = useMouseButton();
  const mousePos  = useMousePosition();
  const { camera, gl, scene } = useThree();

  // Reset state on mount — prevents stale data across navigations
  useEffect(() => {
    gameState.reset();
    return () => gameState.reset();
  }, [gameState]);

  // Pre-compile all GLSL shaders while the loading screen is still visible.
  // gl.compile() blocks the GPU synchronously — paying that cost now means
  // the first active frame (when loading hides) renders without any stutter.
  // Fires once after mount, by which time all meshes are in the scene.
  useEffect(() => {
    gl.compile(scene, camera);
    onReady?.();
    // gl / scene / camera are stable R3F refs — safe to omit from deps.
    // onReady is stable (useCallback in parent). Running once is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const characterRef  = useRef<CharacterHandle>(null);
  const [isHolding, setIsHolding] = useState(false);
  const heldCubeRef   = useRef<{ id: string; rb: RapierRigidBody } | null>(null);
  const throwCooldown = useRef(0);

  const wasDown  = useRef(false);
  const eWasDown = useRef(false);
  const isAiming = useRef(false);

  const aimState = useRef<AimState>({
    originX: 0, originY: 0,
    dirX: 1, dirY: 0.5,
    power: 0, force: 0, visible: false,
  });

  const nearbyCubeRef = useRef<{ id: string; rb: RapierRigidBody } | null>(null);

  const handleNearby = useCallback((id: string, rb: RapierRigidBody) => {
    nearbyCubeRef.current = { id, rb };
  }, []);

  const handleNearbyExit = useCallback((id: string) => {
    if (nearbyCubeRef.current?.id === id) nearbyCubeRef.current = null;
  }, []);

  const handleScore = useCallback((pageData: PageCubeData) => {
    setTimeout(() => { onNavigate?.(pageData.href); }, 800);
  }, [onNavigate]);

  useFrame((_, delta) => {
    if (paused) {
      // Reset transient input state so nothing fires on resume
      wasDown.current = false;
      eWasDown.current = false;
      isAiming.current = false;
      if (aimState.current.visible) {
        aimState.current.visible = false;
        aimState.current.power = 0;
        aimState.current.force = 0;
        gameState.setPower(0, false);
      }
      return;
    }

    if (throwCooldown.current > 0) throwCooldown.current -= delta;

    const char = characterRef.current;
    if (!char) return;

    const charPos = char.getPosition();

    // --- E key: pickup / drop ---
    const eDown        = keys.current?.has("KeyE") ?? false;
    const eJustPressed = eDown && !eWasDown.current;
    eWasDown.current   = eDown;

    if (eJustPressed) {
      if (!heldCubeRef.current && nearbyCubeRef.current && throwCooldown.current <= 0) {
        // PICKUP — switch to kinematic so it stops reacting to contacts / gravity
        const { rb } = nearbyCubeRef.current;
        rb.setBodyType(RB_TYPE_KINEMATIC_POSITION, true);
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
        heldCubeRef.current = nearbyCubeRef.current;
        gameState.setHolding(true);
        setIsHolding(true);
      } else if (heldCubeRef.current && !isAiming.current) {
        // DROP forward — back to dynamic before applying velocity
        const dir = char.getFacingDirection();
        const rb  = heldCubeRef.current.rb;
        rb.setBodyType(RB_TYPE_DYNAMIC, true);
        rb.setLinvel({ x: dir * 3, y: 1, z: 0 }, true);
        heldCubeRef.current = null;
        gameState.setHolding(false);
        setIsHolding(false);
        throwCooldown.current = 0.3;
      }
    }

    const currentHeld = heldCubeRef.current;

    // --- Left click: aim & throw ---
    const btnDown      = mouseDown.current;
    const justPressed  = btnDown && !wasDown.current;
    const justReleased = !btnDown && wasDown.current;
    wasDown.current    = btnDown;

    // --- Mouse → world plane intersection (everything lives in world space now) ---
    _raycaster.setFromCamera(mousePos.current, camera);
    _raycaster.ray.intersectPlane(_aimPlane, _aimWorldPos);

    const mouseX = _aimWorldPos.x;
    const mouseY = _aimWorldPos.y;

    const holdX = charPos.x;
    const holdY = charPos.y + char.getModelHeight() + LARGEST_CUBE_HALF + HOLD_MARGIN;
    const dx    = mouseX - holdX;
    const dy    = mouseY - holdY;
    const aimDist = Math.sqrt(dx * dx + dy * dy);

    _aimDir.set(dx, dy, 0).normalize();

    const power = Math.min(Math.max((aimDist - MIN_AIM_DIST) / (MAX_AIM_DIST - MIN_AIM_DIST), 0), 1);
    const force = MIN_FORCE + power * (MAX_FORCE - MIN_FORCE);

    aimState.current.originX = holdX;
    aimState.current.originY = holdY;
    aimState.current.dirX    = _aimDir.x;
    aimState.current.dirY    = _aimDir.y;

    if (!currentHeld) {
      aimState.current.visible = false;
      aimState.current.power   = 0;
      aimState.current.force   = 0;
      isAiming.current         = false;
      gameState.setPower(0, false);
      return;
    }

    // --- THROW on release ---
    if (justReleased && isAiming.current) {
      const rb = currentHeld.rb;
      rb.setBodyType(RB_TYPE_DYNAMIC, true);
      rb.wakeUp();
      rb.setLinvel({ x: _aimDir.x * force, y: _aimDir.y * force, z: 0 }, true);
      rb.setAngvel({ x: 0, y: 0, z: -_aimDir.x * 4 }, true);

      gameState.thrownIds.current.add(currentHeld.id);
      heldCubeRef.current      = null;
      throwCooldown.current    = 0.4;
      isAiming.current         = false;
      aimState.current.visible = false;
      aimState.current.power   = 0;
      aimState.current.force   = 0;
      gameState.setPower(0, false);
      gameState.setHolding(false);
      setIsHolding(false);
      gameState.notifyThrow();
      return;
    }

    // --- Kinematic follow above character ---
    // Y snaps directly to holdY so the cube rises instantly with the character on jump,
    // preventing the capsule from colliding with the cube from below mid-air.
    // X still lerps smoothly for natural aiming feel.
    {
      const cur = currentHeld.rb.translation();
      const lx = 1 - Math.exp(-HELD_LERP_SPEED * delta);
      currentHeld.rb.setTranslation(
        { x: cur.x + (holdX - cur.x) * lx, y: holdY, z: 0 },
        true
      );
    }

    if (justPressed) isAiming.current = true;

    if (btnDown && isAiming.current) {
      aimState.current.power   = power;
      aimState.current.force   = force;
      aimState.current.visible = true;
      gameState.setPower(power, true);
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[10, 15, 8]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
      />
      <Environment preset="night" />

      <fog attach="fog" args={["#0a0a12", 50, 110]} />
      <Starfield />

      <AimLine stateRef={aimState} />

      <Physics gravity={[0, -GRAVITY, 0]} timeStep={1 / 60} paused={!physicsActive || paused}>
        {/* Floor, ceiling, front/back walls — world-space */}
        <CuboidCollider position={[0, -6.5, 0]} args={[20, 0.5, 5]} restitution={0.2} friction={0.8} />
        <CuboidCollider position={[0, 24, 0]}   args={[20, 0.5, 5]} />
        <CuboidCollider position={[0, 2, -3]}   args={[20, 20, 0.5]} />
        <CuboidCollider position={[0, 2, 3]}    args={[20, 20, 0.5]} />

        <Character ref={characterRef} position={[-11, -4, 0]} keys={keys} holding={isHolding} />

        {PAGE_CUBES.map((cube, i) => (
          <PageCube
            key={cube.id}
            data={cube}
            position={CUBE_POSITIONS[i]}
            spawnIndex={i}
            onNearby={handleNearby}
            onNearbyExit={handleNearbyExit}
          />
        ))}

        <Basket
          position={[12, 0, 0]}
          thrownIds={gameState.thrownIds}
          gatedIds={gameState.gatedIds}
          onScore={handleScore}
        />
      </Physics>
    </>
  );
}
