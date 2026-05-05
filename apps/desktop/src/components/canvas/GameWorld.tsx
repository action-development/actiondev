"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import { scratchRapierVec } from "./_pools";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { LandingDust, type LandingDustHandle } from "./LandingDust";

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
const _raycaster   = new THREE.Raycaster();
const _aimPlane    = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

interface GameWorldProps {
  paused?: boolean;
  physicsPaused?: boolean;
  physicsActive?: boolean;
  onNavigate?: (href: string) => void;
  gameState: GameState;
  onReady?: () => void;
}

export function GameWorld({ paused = false, physicsPaused = false, physicsActive = false, onNavigate, gameState, onReady }: GameWorldProps) {
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

  const characterRef    = useRef<CharacterHandle>(null);
  const landingDustRef  = useRef<LandingDustHandle>(null);
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

  const handleLand = useCallback((pos: THREE.Vector3) => {
    // pos is a scratch vec from Character — extract scalars immediately, don't hold the reference
    landingDustRef.current?.trigger(pos.x, pos.y);
  }, []);

  const handleScore = useCallback((pageData: PageCubeData) => {
    setTimeout(() => { onNavigate?.(pageData.href); }, 800);
  }, [onNavigate]);

  useFrame((_, delta) => {
    if (paused) {
      // Release any held cube before suspending game logic.
      // Without this, if the mouse button is released while paused the "justReleased"
      // event is lost (wasDown resets to false), leaving the cube stuck kinematic
      // and floating at the last hold position indefinitely on resume.
      if (heldCubeRef.current) {
        heldCubeRef.current.rb.setBodyType(RB_TYPE_DYNAMIC, true);
        scratchRapierVec.x = 0; scratchRapierVec.y = 0; scratchRapierVec.z = 0;
        heldCubeRef.current.rb.setLinvel(scratchRapierVec, true);
        heldCubeRef.current = null;
        gameState.setHolding(false);
        setIsHolding(false);
      }
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
        // PICKUP — kinematic so contacts/gravity stop applying. Reuse scratchRapierVec
        // (zero-alloc): Rapier accepts plain {x,y,z}, no need for THREE.Vector3.
        const { rb } = nearbyCubeRef.current;
        rb.setBodyType(RB_TYPE_KINEMATIC_POSITION, true);
        scratchRapierVec.x = 0; scratchRapierVec.y = 0; scratchRapierVec.z = 0;
        rb.setLinvel(scratchRapierVec, true);
        rb.setAngvel(scratchRapierVec, true);
        // Teleport to hold position — setTranslation is a warp (no sweep), so Rapier
        // generates no contact impulse against the character capsule. Without this,
        // setNextKinematicTranslation in the same frame sweeps the cube through the
        // character body and flings it backward.
        scratchRapierVec.x = charPos.x;
        scratchRapierVec.y = charPos.y + char.getModelHeight() + LARGEST_CUBE_HALF + HOLD_MARGIN;
        scratchRapierVec.z = 0;
        rb.setTranslation(scratchRapierVec, true);
        heldCubeRef.current = nearbyCubeRef.current;
        gameState.setHolding(true);
        setIsHolding(true);
      } else if (heldCubeRef.current && !isAiming.current) {
        // DROP forward — back to dynamic before applying velocity
        const dir = char.getFacingDirection();
        const rb  = heldCubeRef.current.rb;
        rb.setBodyType(RB_TYPE_DYNAMIC, true);
        scratchRapierVec.x = dir * 3; scratchRapierVec.y = 1; scratchRapierVec.z = 0;
        rb.setLinvel(scratchRapierVec, true);
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

    // Inline normalize (escalares) — evita _aimDir.set().normalize() y la sqrt interna.
    const invLen = aimDist > 1e-6 ? 1 / aimDist : 0;
    const dirX = dx * invLen;
    const dirY = dy * invLen;

    const power = Math.min(Math.max((aimDist - MIN_AIM_DIST) / (MAX_AIM_DIST - MIN_AIM_DIST), 0), 1);
    const force = MIN_FORCE + power * (MAX_FORCE - MIN_FORCE);

    aimState.current.originX = holdX;
    aimState.current.originY = holdY;
    aimState.current.dirX    = dirX;
    aimState.current.dirY    = dirY;

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
      scratchRapierVec.x = dirX * force; scratchRapierVec.y = dirY * force; scratchRapierVec.z = 0;
      rb.setLinvel(scratchRapierVec, true);
      scratchRapierVec.x = 0; scratchRapierVec.y = 0; scratchRapierVec.z = -dirX * 4;
      rb.setAngvel(scratchRapierVec, true);

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
    // setNextKinematicTranslation (no setTranslation): marca el target del PRÓXIMO step,
    // Rapier hace sweep entre pos actual e interpolada → contactos correctos en el step
    // intermedio, evita micro-tunneling cuando el personaje salta con cubo en mano.
    {
      const cur = currentHeld.rb.translation();
      const lx = 1 - Math.exp(-HELD_LERP_SPEED * delta);
      scratchRapierVec.x = cur.x + (holdX - cur.x) * lx;
      scratchRapierVec.y = holdY;
      scratchRapierVec.z = 0;
      currentHeld.rb.setNextKinematicTranslation(scratchRapierVec);
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
      <LandingDust ref={landingDustRef} />

      <Physics gravity={[0, -GRAVITY, 0]} timeStep={1 / 60} interpolate paused={!physicsActive || physicsPaused}>
        {/*
          Compound static environment: 1 fixed RigidBody con 4 colliders compartiendo handle.
          Antes: 4 colliders sueltos → r3-rapier auto-wrappea cada uno → 4 fixed bodies en el
          broadphase BVH, 4 entradas en el island solver. Ahora: 1 sola entrada, AABB padre
          compartido. ~30% menos coste en la sección estática del step.
        */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider position={[0, -6.5, 0]} args={[20, 0.5, 5]} restitution={0.2} friction={0.8} />
          <CuboidCollider position={[0, 24, 0]}   args={[20, 0.5, 5]} />
          <CuboidCollider position={[0, 2, -3]}   args={[20, 20, 0.5]} />
          <CuboidCollider position={[0, 2, 3]}    args={[20, 20, 0.5]} />
        </RigidBody>

        <Character ref={characterRef} position={[-11, -4, 0]} keys={keys} holding={isHolding} onLand={handleLand} />

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
