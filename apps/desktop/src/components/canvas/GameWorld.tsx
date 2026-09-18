"use client";

import { useRef, useCallback, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Physics,
  RigidBody,
  CuboidCollider,
  type RapierRigidBody,
  type IntersectionEnterPayload,
  type IntersectionExitPayload,
} from "@react-three/rapier";
import * as THREE from "three";
import { scratchRapierVec } from "./_pools";
import { useKeyboard } from "@/hooks/use-keyboard";
import { useActionQueue } from "@/hooks/use-action-queue";
import { remoteInput, resetRemoteInput } from "@/lib/hero-remote";
import { useMousePosition } from "@/hooks/use-mouse-position";
import type { GameState } from "@/hooks/use-game-state";
import { useT } from "@/lib/i18n";
import { PORT_CONTAINERS } from "@/data/port-containers";
import type { PortPalette } from "./port/time-of-day";
import { ComicClouds, PortSky } from "./port/PortSky";
import { Seagulls } from "./port/Seagulls";
import type { Disturbance } from "./port/gull-behaviour";
import { GullHunt, type GullHuntHandle } from "./port/GullHunt";
import { pickGullTarget, type GullTarget } from "./port/gull-hunt-logic";
import { PortBay } from "./port/PortBay";
import { Quay } from "./port/Quay";
import { Ship } from "./port/Ship";
import { pickShipAt } from "./port/ship-hull";
import { playHornSfx } from "@/lib/hero-sfx";
import { PaintedFraming, WaterOccluder } from "./port/PaintedLayer";
import { PaintedLighthouse } from "./port/PaintedScenery";
import type { SceneMode } from "./port/painted-backdrops";
import { CargoContainer, CONTAINER_HALF_H, type ContainerData } from "./port/CargoContainer";
import {
  Crane,
  CRANE_START_X,
  HOOK_TOP_Y,
  SPREADER_HALF_H,
  TROLLEY_MAX_X,
  TROLLEY_MIN_X,
  type CraneHandle,
} from "./port/Crane";
import {
  approach,
  findGrabTarget,
  groundTopAt,
  pickContainerAt,
  restingY,
  SHIP_DROP_X,
  stepSway,
  type GrabCandidate,
  type SwayState,
} from "./port/crane-logic";

/**
 * GameWorld — "La Grúa": el puerto de Vigo como navegación.
 *
 * Dos formas de jugar, y las dos llevan al mismo sitio:
 *
 * - **Click en un contenedor** → la grúa hace el viaje ENTERA sola: se coloca
 *   encima, baja el gancho, engancha y lo deja en la bodega. Un click, cero
 *   destreza. El carro NO sigue al ratón: mover el ratón por la pantalla no
 *   mueve nada, así que no hay forma de "estropear" la maniobra sin querer.
 * - **Manual** — A/D/flechas o el mando mueven el carro, y la acción
 *   (Espacio / E / botón del mando) baja el gancho y suelta.
 *
 * Cualquier entrada manual durante la maniobra automática la cancela: manda
 * quien toca.
 *
 * UN SOLO BUCLE: toda la lógica vive en el `useFrame` de abajo y empuja el
 * resultado a `Crane.update()`. Los componentes de `port/` son visuales.
 *
 * Easter egg: un click SOBRE una gaviota no baja el gancho — dispara una bala
 * desde al lado del mando (`GullHunt`). El hit-test se hace en el interceptor
 * de `use-action-queue`, antes de que el click entre en la cola de acciones.
 */

/** Rapier RigidBodyType enum values (stable — mirror of @dimforge/rapier3d-compat). */
const RB_TYPE_DYNAMIC = 0;
const RB_TYPE_KINEMATIC_POSITION = 2;

const GRAVITY = 20;

// Dinámica del carro: sigue al objetivo con velocidad y aceleración limitadas.
// Esa inercia es la que alimenta el balanceo del spreader — y el balanceo es
// lo que convierte "mover un cursor" en "manejar una grúa".
const TROLLEY_MAX_SPEED = 17;
const TROLLEY_ACCEL = 42;
const TROLLEY_GAIN = 3.4;
/** Velocidad a la que A/D desplazan el objetivo (u/s). */
const KEY_TARGET_SPEED = 14;

const LOWER_SPEED = 12;
const RAISE_SPEED = 9;
/** Por debajo de esto un contenedor se ha caído a la ría → reaparece en el muelle. */
const SINK_Y = -11;
const NAVIGATE_DELAY_MS = 900;

/**
 * Maniobra automática: cuándo se considera que la grúa está "sobre" su
 * objetivo. No basta con la x del carro — el spreader cuelga de un cable y
 * llega balanceándose: bajar el gancho con el péndulo vivo engancharía de
 * refilón o dejaría la caja fuera de la bodega.
 */
const AUTO_ALIGN_X = 0.16;
const AUTO_CALM_VEL = 0.7;

/**
 * Sol del fondo pintado: detrás de la escena y a la derecha. Ilumina los
 * testeros y deja la cara frontal en sombra; la sombra cae hacia delante-izquierda,
 * igual que la de los contenedores dibujados.
 */
const PAINTED_SUN: [number, number, number] = [26, 16, -30];

type HookPhase = "idle" | "lowering" | "raising";

/**
 * Maniobra en curso lanzada por un click sobre un contenedor.
 * `pick` = ir a por él; `drop` = llevarlo a la bodega.
 * `lowered` marca que ya se ha intentado bajar el gancho una vez: si vuelve
 * arriba de vacío (la caja se movió, chocó con la vecina), se abandona en vez
 * de quedarse bajando en bucle.
 */
interface AutoRun {
  id: string;
  phase: "pick" | "drop";
  lowered: boolean;
}

interface Tracked {
  rb: RapierRigidBody;
  data: ContainerData;
  spawnX: number;
  /** Nivel en su pila: al reaparecer vuelve a su sitio, no al suelo. */
  tier: number;
  cand: GrabCandidate;
}

const _hit = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _ndc = new THREE.Vector2();
const _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const _identityQuat = { x: 0, y: 0, z: 0, w: 1 };

/**
 * Altura desde la que reaparece un contenedor que se ha ido a la ría. Un salto
 * corto sobre su hueco, no una caída desde las nubes: al cargar la web los
 * contenedores YA están puestos en el muelle.
 */
const RESPAWN_DROP = 2;

interface GameWorldProps {
  paused?: boolean;
  physicsPaused?: boolean;
  physicsActive?: boolean;
  onNavigate?: (href: string) => void;
  gameState: GameState;
  palette: PortPalette;
  mode: SceneMode;
  onReady?: () => void;
}

export function GameWorld({
  paused = false,
  physicsPaused = false,
  physicsActive = false,
  onNavigate,
  gameState,
  palette,
  mode,
  onReady,
}: GameWorldProps) {
  const t = useT();
  const keys = useKeyboard();
  const mousePos = useMousePosition();
  const { camera, gl, scene } = useThree();

  // --- Easter egg: caza de gaviotas ---
  const gullTargets = useRef(new Map<number, GullTarget>()).current;
  const hunt = useRef<GullHuntHandle>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const cursor = useRef("");
  /** Contenedor pinchado este frame, a la espera de que lo recoja el bucle. */
  const autoRequest = useRef<string | null>(null);
  const clickIntercept = useRef<((e: MouseEvent) => boolean) | null>(null);
  clickIntercept.current = (e) => {
    if (pausedRef.current) return false;
    _ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    _raycaster.setFromCamera(_ndc, camera);
    const { origin: o, direction: d } = _raycaster.ray;
    const gull = pickGullTarget(o.x, o.y, o.z, d.x, d.y, d.z, gullTargets.values());
    if (gull) {
      hunt.current?.fire(gull);
      // El tiro espanta a las posadas.
      disturbance.current.pulse++;
      return true;
    }
    // Click sobre un contenedor → maniobra automática, no acción de gancho.
    if (_raycaster.ray.intersectPlane(_plane, _hit)) {
      const box = pickContainerAt(candidates.current, _hit.x, _hit.y);
      if (box) {
        autoRequest.current = box.id;
        return true;
      }
      // Click sobre el barco → bocina de zarpar. Tampoco baja el gancho.
      if (pickShipAt(_hit.x, _hit.y)) {
        playHornSfx();
        return true;
      }
    }
    return false;
  };
  const handleGullHit = useCallback(() => gameState.notifyGullKill(), [gameState]);

  const actions = useActionQueue(gl.domElement, clickIntercept);

  useEffect(() => {
    gameState.reset();
    return () => gameState.reset();
  }, [gameState]);

  // Pre-compila shaders con la pantalla de carga aún visible (ver LoadingScreen).
  useEffect(() => {
    gl.compile(scene, camera);
    onReady?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const craneRef = useRef<CraneHandle>(null);

  // Qué hay cerca de las gaviotas (carro, spreader, cursor): lo leen ellas.
  const disturbance = useRef<Disturbance>({
    trolleyX: CRANE_START_X, hookX: CRANE_START_X, hookY: HOOK_TOP_Y,
    pointerX: 999, pointerY: 999, pulse: 0,
  });

  // --- Contenedores registrados (sin re-render: Map + lista de candidatos reutilizada) ---
  const tracked = useRef(new Map<string, Tracked>());
  const candidates = useRef<GrabCandidate[]>([]);

  const handleRegister = useCallback((id: string, rb: RapierRigidBody | null) => {
    const map = tracked.current;
    if (rb) {
      const def = PORT_CONTAINERS.find((c) => c.id === id);
      if (!def) return;
      map.set(id, {
        rb,
        data: def,
        spawnX: def.spawnX,
        tier: def.tier,
        cand: { id, x: 0, y: 0, halfW: def.halfW, halfH: CONTAINER_HALF_H },
      });
    } else {
      map.delete(id);
    }
    candidates.current = Array.from(map.values(), (v) => v.cand);
  }, []);

  // --- Estado de la grúa (refs: se muta a 60 fps) ---
  const crane = useRef({
    trolleyX: CRANE_START_X,
    trolleyVel: 0,
    targetX: CRANE_START_X,
    hookY: HOOK_TOP_Y,
    phase: "idle" as HookPhase,
  });
  const sway = useRef<SwayState>({ offset: 0, velocity: 0 });
  const held = useRef<Tracked | null>(null);
  const auto = useRef<AutoRun | null>(null);

  const release = useCallback((velX: number, counts: boolean) => {
    const h = held.current;
    if (!h) return;
    h.rb.setBodyType(RB_TYPE_DYNAMIC, true);
    h.rb.wakeUp();
    scratchRapierVec.x = velX; scratchRapierVec.y = 0; scratchRapierVec.z = 0;
    h.rb.setLinvel(scratchRapierVec, true);
    scratchRapierVec.x = 0; scratchRapierVec.y = 0; scratchRapierVec.z = -velX * 0.04;
    h.rb.setAngvel(scratchRapierVec, true);
    held.current = null;
    gameState.setHolding(false);
    if (counts) {
      gameState.thrownIds.current.add(h.data.id);
      gameState.notifyThrow();
    }
  }, [gameState]);

  // --- Bodega del barco = la antigua canasta ---
  const handleEnterHold = useCallback((payload: IntersectionEnterPayload) => {
    const data = (payload.other.rigidBodyObject?.userData as { container?: ContainerData } | undefined)?.container;
    if (!data) return;
    const { thrownIds, gatedIds } = gameState;
    if (!thrownIds.current.has(data.id) || gatedIds.current.has(data.id)) return;
    thrownIds.current.delete(data.id);
    gatedIds.current.add(data.id);
    setTimeout(() => onNavigate?.(data.href), NAVIGATE_DELAY_MS);
  }, [gameState, onNavigate]);

  // Al sacarlo de la bodega se puede volver a cargar (y volver a navegar).
  const handleExitHold = useCallback((payload: IntersectionExitPayload) => {
    const data = (payload.other.rigidBodyObject?.userData as { container?: ContainerData } | undefined)?.container;
    if (data) gameState.gatedIds.current.delete(data.id);
  }, [gameState]);

  useFrame((_, delta) => {
    const c = crane.current;

    if (paused) {
      // Soltar lo que cuelga: si el ratón se suelta con el juego en pausa, el
      // contenedor se quedaría cinemático flotando para siempre.
      if (held.current) release(0, false);
      actions.current = 0;
      auto.current = null;
      autoRequest.current = null;
      resetRemoteInput();
      if (c.phase === "lowering") c.phase = "raising";
      return;
    }

    const dt = Math.min(delta, 1 / 30);
    const k = keys.current;

    // --- Entrada: acción (click en canvas / Espacio / E / mando). Una por frame. ---
    // El mando de radiocontrol (overlay DOM) tiene su propia cola: se vuelca aquí.
    if (remoteInput.actions > 0) {
      remoteInput.actions--;
      actions.current++;
    }
    let action = actions.current > 0;
    if (action) actions.current--;

    // --- Entrada: objetivo del carro (teclas y mando). El ratón NO mueve el carro. ---
    const left = k.has("KeyA") || k.has("ArrowLeft") || remoteInput.left;
    const right = k.has("KeyD") || k.has("ArrowRight") || remoteInput.right;
    const mp = mousePos.current;
    // Tocar los mandos manda sobre la maniobra automática.
    if (left || right || action) auto.current = null;
    if (left || right) c.targetX += (right ? 1 : -1) * KEY_TARGET_SPEED * dt;

    // --- Maniobra automática (click en un contenedor) ---
    if (autoRequest.current) {
      const id = autoRequest.current;
      autoRequest.current = null;
      // Con algo colgando, el click significa "llévalo al barco".
      if (held.current) auto.current = { id: held.current.data.id, phase: "drop", lowered: true };
      else if (tracked.current.has(id)) auto.current = { id, phase: "pick", lowered: false };
    }

    const run = auto.current;
    if (run) {
      if (held.current) run.phase = "drop";
      // Posición del gancho al final del frame anterior: sirve para saber si
      // la vertical ya está sobre el objetivo.
      const hookNow = c.trolleyX + sway.current.offset;
      const calm = Math.abs(c.trolleyVel) < AUTO_CALM_VEL && Math.abs(sway.current.velocity) < AUTO_CALM_VEL;

      if (run.phase === "pick") {
        const tr = tracked.current.get(run.id);
        if (!tr || (run.lowered && c.phase === "idle")) {
          auto.current = null; // desapareció, o bajó y volvió de vacío
        } else {
          c.targetX = tr.cand.x;
          if (c.phase === "idle" && calm && Math.abs(hookNow - tr.cand.x) < AUTO_ALIGN_X) {
            run.lowered = true;
            action = true; // → lowering
          }
        }
      } else if (!held.current) {
        auto.current = null; // ya está soltado
      } else {
        c.targetX = SHIP_DROP_X;
        if (c.phase === "idle" && calm && Math.abs(hookNow - SHIP_DROP_X) < AUTO_ALIGN_X) {
          release(c.trolleyVel + sway.current.velocity, true);
          auto.current = null;
        }
      }
    }

    c.targetX = Math.min(Math.max(c.targetX, TROLLEY_MIN_X), TROLLEY_MAX_X);

    // --- Carro con inercia + balanceo ---
    const desired = Math.min(Math.max((c.targetX - c.trolleyX) * TROLLEY_GAIN, -TROLLEY_MAX_SPEED), TROLLEY_MAX_SPEED);
    const newVel = approach(c.trolleyVel, desired, TROLLEY_ACCEL * dt);
    const accel = (newVel - c.trolleyVel) / dt;
    c.trolleyVel = newVel;
    c.trolleyX = Math.min(Math.max(c.trolleyX + newVel * dt, TROLLEY_MIN_X), TROLLEY_MAX_X);
    // Cargado balancea más: la masa cuenta.
    stepSway(sway.current, held.current ? accel * 1.4 : accel, dt);
    const hookX = c.trolleyX + sway.current.offset;

    // --- Refresca candidatos con la física actual ---
    for (const tr of tracked.current.values()) {
      const p = tr.rb.translation();
      tr.cand.x = p.x;
      tr.cand.y = p.y;
      if (p.y < SINK_Y && tr !== held.current) {
        scratchRapierVec.x = tr.spawnX;
        scratchRapierVec.y =
          restingY(tr.spawnX, CONTAINER_HALF_H) + tr.tier * CONTAINER_HALF_H * 2 + RESPAWN_DROP;
        scratchRapierVec.z = 0;
        tr.rb.setTranslation(scratchRapierVec, true);
        tr.rb.setRotation(_identityQuat, true);
        scratchRapierVec.x = 0; scratchRapierVec.y = 0; scratchRapierVec.z = 0;
        tr.rb.setLinvel(scratchRapierVec, true);
        tr.rb.setAngvel(scratchRapierVec, true);
        gameState.thrownIds.current.delete(tr.data.id);
      }
    }

    // --- Máquina de estados del spreader ---
    if (action) {
      if (c.phase === "idle" && held.current) {
        release(c.trolleyVel + sway.current.velocity, true);
      } else if (c.phase === "idle") {
        c.phase = "lowering";
      } else if (c.phase === "lowering") {
        c.phase = "raising";
      }
    }

    if (c.phase === "lowering") {
      c.hookY -= LOWER_SPEED * dt;
      const bottom = c.hookY - SPREADER_HALF_H;
      // Solo se baja con el spreader vacío (con carga, la acción es soltar).
      const target = findGrabTarget(candidates.current, hookX, bottom + LOWER_SPEED * dt);
      const floor = target ? target.y + target.halfH : groundTopAt(hookX);
      if (bottom <= floor) {
        c.hookY = floor + SPREADER_HALF_H;
        if (target) {
          const tr = tracked.current.get(target.id);
          if (tr) {
            tr.rb.setBodyType(RB_TYPE_KINEMATIC_POSITION, true);
            scratchRapierVec.x = 0; scratchRapierVec.y = 0; scratchRapierVec.z = 0;
            tr.rb.setLinvel(scratchRapierVec, true);
            tr.rb.setAngvel(scratchRapierVec, true);
            tr.rb.setRotation(_identityQuat, true);
            held.current = tr;
            gameState.thrownIds.current.delete(tr.data.id);
            gameState.setHolding(true);
          }
        }
        c.phase = "raising";
      }
    } else if (c.phase === "raising") {
      c.hookY += RAISE_SPEED * dt;
      if (c.hookY >= HOOK_TOP_Y) {
        c.hookY = HOOK_TOP_Y;
        c.phase = "idle";
      }
    }

    const dist = disturbance.current;
    dist.trolleyX = c.trolleyX;
    dist.hookX = hookX;
    dist.hookY = c.hookY;

    // El ratón ya no conduce la grúa, pero sigue espantando gaviotas y decide
    // el cursor: cruz sobre una gaviota (pista del easter egg), mano sobre un
    // contenedor o sobre el barco (pista de que se puede pinchar).
    _raycaster.setFromCamera(mp, camera);
    const { origin: ro, direction: rd } = _raycaster.ray;
    const overGull = pickGullTarget(ro.x, ro.y, ro.z, rd.x, rd.y, rd.z, gullTargets.values()) !== null;
    let overBox = false;
    if (_raycaster.ray.intersectPlane(_plane, _hit)) {
      dist.pointerX = _hit.x;
      dist.pointerY = _hit.y;
      overBox = !overGull && (pickContainerAt(candidates.current, _hit.x, _hit.y) !== null || pickShipAt(_hit.x, _hit.y));
    }
    const wantCursor = overGull ? "crosshair" : overBox ? "pointer" : "";
    if (wantCursor !== cursor.current) {
      cursor.current = wantCursor;
      gl.domElement.style.cursor = wantCursor;
    }

    craneRef.current?.update(c.trolleyX, hookX, c.hookY);

    const h = held.current;
    if (h) {
      scratchRapierVec.x = hookX;
      scratchRapierVec.y = c.hookY - SPREADER_HALF_H - CONTAINER_HALF_H - 0.02;
      scratchRapierVec.z = 0;
      h.rb.setNextKinematicTranslation(scratchRapierVec);
    }
  });

  // En modo pintado lo estático ya está en la imagen: su 3D solo aporta física y oclusión.
  const showStatic = mode !== "painted";
  const showMoving = mode !== "plate";

  const lightX = palette.orbX * 30;
  const lightY = 10 + palette.orbY * 30;

  return (
    <>
      {showStatic && <color attach="background" args={[palette.skyTop]} />}
      {mode === "painted" && <PaintedFraming />}
      <fog attach="fog" args={[palette.fog, 70, 260]} />
      <hemisphereLight args={[palette.skyLight, palette.groundLight, palette.hemiIntensity]} />
      <directionalLight
        position={showStatic ? [lightX, lightY, 22] : PAINTED_SUN}
        color={palette.sunLight}
        intensity={palette.sunIntensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={14}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0006}
      />

      {showStatic && <PortSky palette={palette} />}
      {showStatic && <PortBay palette={palette} />}
      {!showStatic && <WaterOccluder />}
      {!showStatic && <ComicClouds palette={palette} />}
      {!showStatic && <PaintedLighthouse />}
      {showMoving && <Seagulls palette={palette} flat={!showStatic} disturbance={disturbance} targets={gullTargets} />}
      {showMoving && <GullHunt ref={hunt} outline={palette.outline} onHit={handleGullHit} />}

      <Physics gravity={[0, -GRAVITY, 0]} timeStep={1 / 60} interpolate paused={!physicsActive || physicsPaused}>
        {/* Topes laterales invisibles: nada se escapa del encuadre. */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider position={[-20.5, 4, 0]} args={[0.5, 16, 3]} />
          <CuboidCollider position={[20.5, 4, 0]} args={[0.5, 16, 3]} />
        </RigidBody>

        <Quay palette={palette} showStatic={showStatic} />
        <Ship showStatic={showStatic} showMarker={showMoving} palette={palette} onEnterHold={handleEnterHold} onExitHold={handleExitHold} />
        <Crane ref={craneRef} palette={palette} showStatic={showStatic} showMoving={showMoving} />

        {showMoving && PORT_CONTAINERS.map((def) => (
          <CargoContainer
            key={def.id}
            data={def}
            label={def.label ?? t.nav[def.labelKey ?? "work"]}
            position={[
              def.spawnX,
              restingY(def.spawnX, CONTAINER_HALF_H) + def.tier * CONTAINER_HALF_H * 2,
              0,
            ]}
            palette={palette}
            onRegister={handleRegister}
          />
        ))}
      </Physics>
    </>
  );
}
