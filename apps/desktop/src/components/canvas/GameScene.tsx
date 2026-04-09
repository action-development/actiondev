"use client";

import { useRef, useCallback, useEffect, Suspense, MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Physics,
  CuboidCollider,
  RapierRigidBody,
} from "@react-three/rapier";
import { Environment } from "@react-three/drei";
import { Character, type CharacterHandle } from "./Character";
import { PageCube, type PageCubeData } from "./PageCube";
import { Basket } from "./Basket";
import { Starfield } from "./Starfield";
import { Decorations } from "./Decorations";
import { AimLine, type AimState } from "./AimLine";
import { useKeyboard } from "@/hooks/use-keyboard";
import {
  GRAVITY,
  MIN_FORCE,
  MAX_FORCE,
  MIN_AIM_DIST,
  MAX_AIM_DIST,
  HOLD_OFFSET_Y,
} from "./constants";
import * as THREE from "three";

/**
 * GameScene — 2.5D physics playground in a cosmic void.
 *
 * Camera sits high (y=8) so the ground plane falls near the bottom
 * of the viewport. The ground is invisible (collider only) — the scene
 * feels like a floating cosmic playground with decorative wireframe
 * geometry and atmospheric lighting in the background.
 */

const PAGE_CUBES: PageCubeData[] = [
  { id: "projects", label: "Projects", href: "/projects", color: "#6366f1" },
  { id: "testimonials", label: "Testimonials", href: "#testimonials", color: "#ec4899" },
  { id: "contact", label: "Contact", href: "/contact", color: "#c8ff00" },
  { id: "map", label: "Map", href: "#map", color: "#22d3ee" },
  { id: "home", label: "Home", href: "/", color: "#a855f7" },
];

/**
 * Pre-computed spawn positions — staggered heights so cubes land at different
 * times naturally (no React re-renders, no shader recompilation mid-session).
 * Avoids the basket zone (x 7-11).
 */
function generateSpawnPositions(count: number): [number, number, number][] {
  const positions: [number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    let x: number;
    do {
      x = -10 + Math.random() * 20;
    } while (x > 7 && x < 11);
    // Stagger heights: each cube ~2 units higher → lands ~0.4s later. Max y=17 (below ceiling at 18)
    const y = 10 + i * 1.8 + Math.random() * 1;
    positions.push([x, y, 0]);
  }
  return positions;
}

const CUBE_POSITIONS = generateSpawnPositions(PAGE_CUBES.length);

// Reusable vectors (never allocate in useFrame)
const _aimWorldPos = new THREE.Vector3();
const _aimDir = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _aimPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

// Module-level UI state for DOM power bar (no React re-renders)
const uiState = { power: 0, charging: false };

/** Track left mouse button state via window events (no re-renders). */
function useMouseButton(): MutableRefObject<boolean> {
  const down = useRef(false);
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (e.button === 0) down.current = true; };
    const onUp = (e: MouseEvent) => { if (e.button === 0) down.current = false; };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);
  return down;
}

function GameWorld() {
  const keys = useKeyboard();
  const mouseDown = useMouseButton();
  const { camera, pointer } = useThree();

  const characterRef = useRef<CharacterHandle>(null);
  const heldCubeRef = useRef<{ id: string; rb: RapierRigidBody } | null>(null);
  const throwCooldown = useRef(0);

  const wasDown = useRef(false);
  const eWasDown = useRef(false);
  const isAiming = useRef(false);

  const aimState = useRef<AimState>({
    originX: 0, originY: 0,
    dirX: 1, dirY: 0.5,
    power: 0, force: 0, visible: false,
  });

  // Store nearby cube ref (sensor notifies, but pickup waits for E press)
  const nearbyCubeRef = useRef<{ id: string; rb: RapierRigidBody } | null>(null);

  const handleNearby = useCallback(
    (id: string, rb: RapierRigidBody) => {
      nearbyCubeRef.current = { id, rb };
    },
    []
  );

  const handleNearbyExit = useCallback(
    (id: string) => {
      if (nearbyCubeRef.current?.id === id) {
        nearbyCubeRef.current = null;
      }
    },
    []
  );

  const handleScore = useCallback((pageData: PageCubeData) => {
    setTimeout(() => {
      if (!pageData.href.startsWith("#")) {
        window.location.href = pageData.href;
      }
    }, 800);
  }, []);

  useFrame(() => {
    const dt = 1 / 60;
    if (throwCooldown.current > 0) throwCooldown.current -= dt;

    const char = characterRef.current;
    if (!char) return;

    const charPos = char.getPosition();

    // --- E key: pickup / drop ---
    const eDown = keys.current?.has("KeyE") ?? false;
    const eJustPressed = eDown && !eWasDown.current;
    eWasDown.current = eDown;

    if (eJustPressed) {
      if (!heldCubeRef.current && nearbyCubeRef.current && throwCooldown.current <= 0) {
        // PICKUP
        const { rb } = nearbyCubeRef.current;
        heldCubeRef.current = nearbyCubeRef.current;
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
      } else if (heldCubeRef.current && !isAiming.current) {
        // DROP (only if not mid-aim — release click handles throw)
        heldCubeRef.current = null;
        throwCooldown.current = 0.3;
      }
    }

    // Re-read held (may have changed from E press above)
    const currentHeld = heldCubeRef.current;

    // --- Left click: aim & throw ---
    const btnDown = mouseDown.current;
    const justPressed = btnDown && !wasDown.current;
    const justReleased = !btnDown && wasDown.current;
    wasDown.current = btnDown;

    // --- Aim: direction + distance from mouse to hold position ---
    _raycaster.setFromCamera(pointer, camera);
    _raycaster.ray.intersectPlane(_aimPlane, _aimWorldPos);

    const holdX = charPos.x;
    const holdY = charPos.y + HOLD_OFFSET_Y;
    const dx = _aimWorldPos.x - holdX;
    const dy = _aimWorldPos.y - holdY;
    const aimDist = Math.sqrt(dx * dx + dy * dy);

    _aimDir.set(dx, dy, 0).normalize();

    // Power & force from mouse distance (far = strong, close = weak)
    const power = Math.min(Math.max((aimDist - MIN_AIM_DIST) / (MAX_AIM_DIST - MIN_AIM_DIST), 0), 1);
    const force = MIN_FORCE + power * (MAX_FORCE - MIN_FORCE);

    aimState.current.originX = holdX;
    aimState.current.originY = holdY;
    aimState.current.dirX = _aimDir.x;
    aimState.current.dirY = _aimDir.y;

    // --- Not holding a cube → reset ---
    if (!currentHeld) {
      aimState.current.visible = false;
      aimState.current.power = 0;
      aimState.current.force = 0;
      isAiming.current = false;
      uiState.charging = false;
      uiState.power = 0;
      return;
    }

    // --- THROW on release ---
    if (justReleased && isAiming.current) {
      const rb = currentHeld.rb;
      rb.wakeUp();
      rb.setLinvel(
        { x: _aimDir.x * force, y: _aimDir.y * force, z: 0 },
        true
      );
      rb.setAngvel(
        { x: 0, y: 0, z: -_aimDir.x * 4 },
        true
      );

      heldCubeRef.current = null;
      throwCooldown.current = 0.4;
      isAiming.current = false;
      aimState.current.visible = false;
      aimState.current.power = 0;
      aimState.current.force = 0;
      uiState.power = 0;
      uiState.charging = false;
      return;
    }

    // --- Teleport held cube above character ---
    currentHeld.rb.setTranslation({ x: holdX, y: holdY, z: 0 }, true);
    currentHeld.rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    currentHeld.rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

    // --- Aiming: show trajectory while mouse is held ---
    if (justPressed) {
      isAiming.current = true;
    }

    if (btnDown && isAiming.current) {
      aimState.current.power = power;
      aimState.current.force = force;
      aimState.current.visible = true;
      uiState.power = power;
      uiState.charging = true;
    }
  });

  return (
    <>
      {/* === Lighting === */}
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[10, 15, 8]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={15}
        shadow-camera-bottom={-5}
      />
      <Environment preset="night" />

      {/* === Atmosphere === */}
      <fog attach="fog" args={["#0a0a12", 50, 110]} />
      <Starfield />
      <Decorations />

      {/* === AimLine (outside Physics — visual only) === */}
      <AimLine stateRef={aimState} />

      <Physics gravity={[0, -GRAVITY, 0]} timeStep={1 / 60}>
        {/* Invisible ground — collider only, no mesh */}
        <CuboidCollider
          position={[0, -2.5, 0]}
          args={[15, 0.5, 5]}
          restitution={0.2}
          friction={0.8}
        />

        {/* Walls */}
        <CuboidCollider position={[-13, 6, 0]} args={[0.5, 15, 5]} />
        <CuboidCollider position={[13, 6, 0]} args={[0.5, 15, 5]} />
        <CuboidCollider position={[0, 18, 0]} args={[15, 0.5, 5]} />
        <CuboidCollider position={[0, 6, -3]} args={[15, 15, 0.5]} />
        <CuboidCollider position={[0, 6, 3]} args={[15, 15, 0.5]} />

        <Character ref={characterRef} position={[-11, 0, 0]} keys={keys} />

        {PAGE_CUBES.map((cube, i) => (
          <PageCube
            key={cube.id}
            data={cube}
            position={CUBE_POSITIONS[i]}
            onNearby={handleNearby}
            onNearbyExit={handleNearbyExit}
          />
        ))}

        <Basket position={[9, 4, 0]} onScore={handleScore} />
      </Physics>
    </>
  );
}

function PowerBarOverlay() {
  const barRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const container = containerRef.current;
      const bar = barRef.current;
      if (container && bar) {
        if (uiState.charging) {
          container.style.display = "flex";
          const p = uiState.power;
          bar.style.width = `${p * 100}%`;
          bar.style.backgroundColor =
            p < 0.4 ? "#c8ff00" : p < 0.75 ? "#ff9900" : "#ff3333";
        } else {
          container.style.display = "none";
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex-col items-center gap-2 pointer-events-none"
      style={{ display: "none" }}
    >
      <div className="w-48 h-3 bg-border/50 rounded-full overflow-hidden border border-border">
        <div ref={barRef} className="h-full rounded-full" />
      </div>
      <p className="text-muted/60 text-[10px] font-mono uppercase tracking-wider mt-2">
        Release to throw
      </p>
    </div>
  );
}

export function GameScene() {
  return (
    <div className="w-screen h-screen bg-black relative animate-fade-in">
      <Canvas
        shadows
        camera={{ position: [0, 8, 28], fov: 40 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        style={{ width: "100vw", height: "100vh" }}
      >
        <color attach="background" args={["#0a0a12"]} />
        <Suspense fallback={null}>
          <GameWorld />
        </Suspense>
      </Canvas>

      <div className="absolute top-6 right-6 z-10 pointer-events-none text-right">
        <p className="text-muted/60 text-[11px] font-mono leading-relaxed">
          <span className="text-accent">A/D</span> move
          <span className="text-muted/30 mx-1.5">·</span>
          <span className="text-accent">SPACE</span> jump
          <span className="text-muted/30 mx-1.5">·</span>
          <span className="text-accent">E</span> pickup / drop
          <span className="text-muted/30 mx-1.5">·</span>
          <span className="text-accent">CLICK</span> aim & throw
        </p>
      </div>

      <PowerBarOverlay />
    </div>
  );
}
