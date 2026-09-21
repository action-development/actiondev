"use client";

import { useRef, useCallback, useEffect, useMemo } from "react";
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
import type { CargoInfo, CraneHint, GameState } from "@/hooks/use-game-state";
import { useT } from "@/lib/i18n";
import { PORT_CONTAINERS } from "@/data/port-containers";
import { clampRow, nearestRowIndex, QUAY_ROWS, SHIP_ROW } from "./port/quay-rows";
import type { PortPalette } from "./port/time-of-day";
import { ComicClouds, PortSky } from "./port/PortSky";
import { Seagulls } from "./port/Seagulls";
import type { Disturbance } from "./port/gull-behaviour";
import { GullHunt, type GullHuntHandle } from "./port/GullHunt";
import { pickGullTarget, type GullTarget } from "./port/gull-hunt-logic";
import { PortBay } from "./port/PortBay";
import { Quay } from "./port/Quay";
import { Ship, type DropState, type ShipHandle } from "./port/Ship";
import { pickShipAt } from "./port/ship-hull";
import { playHornSfx } from "@/lib/hero-sfx";
import { PaintedFraming, WaterOccluder } from "./port/PaintedLayer";
import { PaintedLighthouse } from "./port/PaintedScenery";
import type { SceneMode } from "./port/painted-backdrops";
import { CargoContainer, CONTAINER_HALF_H, type ContainerData } from "./port/CargoContainer";
import { HookGuide, type HookGuideHandle } from "./port/HookGuide";
import { TargetMarker, type TargetMarkerHandle } from "./port/TargetMarker";
import {
  Crane,
  BOOM_TOP_Y,
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
  GRAB_GLIDE_SPEED,
  groundTopAt,
  HOLD_MAX_X,
  HOLD_MIN_X,
  overlapsAny,
  pickContainerAt,
  pickCraneAt,
  QUAY_EDGE_X,
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
 * - **Manual** — A/D/flechas o el mando mueven el carro, W/S (↑/↓) cambian de
 *   FILA del muelle, y la acción (Espacio / E / botón del mando) baja el gancho
 *   y suelta.
 *
 * DOS EJES: el muelle tiene tres filas en z (`port/quay-rows.ts`) y el pórtico
 * ENTERO viaja de una a otra, más lento que el carro. Solo se engancha lo que
 * está en la fila del pórtico, y solo se suelta en la bodega desde `SHIP_ROW`.
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
/** Grupos de colisión de Rapier: todo con todo (el valor por defecto) / con nada. */
const COLLISION_ALL = 0xffffffff;
const COLLISION_NONE = 0;

const GRAVITY = 20;

// Dinámica del carro: sigue al objetivo con velocidad y aceleración limitadas.
// Esa inercia es la que alimenta el balanceo del spreader — y el balanceo es
// lo que convierte "mover un cursor" en "manejar una grúa".
const TROLLEY_MAX_SPEED = 17;
const TROLLEY_ACCEL = 42;
const TROLLEY_GAIN = 3.4;
/** Velocidad a la que A/D desplazan el objetivo (u/s). */
const KEY_TARGET_SPEED = 14;

/**
 * Dinámica del pórtico en profundidad. Mismo modelo que el carro pero MÁS
 * LENTO: un pórtico mueve miles de toneladas sobre los carriles y el carro solo
 * su propio peso. Esa diferencia es la que hace que cambiar de fila se sienta
 * como una decisión y no como un gesto. Sin péndulo en z (v1): el balanceo del
 * spreader sigue siendo solo en x.
 */
const GANTRY_MAX_SPEED = 6;
const GANTRY_ACCEL = 14;
const GANTRY_GAIN = 3.4;

/**
 * Arrastrar la grúa: en horizontal el carro sigue al puntero (con su inercia y
 * balanceo de siempre — solo se mueve el OBJETIVO); en vertical cada
 * `DRAG_ROW_PX` píxeles cambian de fila, arriba = alejarse como con W.
 */
const DRAG_ROW_PX = 90;

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
/** Y en profundidad: el pórtico tiene que haber LLEGADO a la fila, no ir de paso. */
const AUTO_ALIGN_Z = 0.1;

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
  /** Fila (índice de `QUAY_ROWS`) a la que tiene que viajar el pórtico. */
  row: number;
  lowered: boolean;
}

interface Tracked {
  rb: RapierRigidBody;
  data: ContainerData;
  spawnX: number;
  /** Fila donde nació: al caerse a la ría vuelve a SU sitio, no al del pórtico. */
  spawnZ: number;
  /** Nivel en su pila: al reaparecer vuelve a su sitio, no al suelo. */
  tier: number;
  cand: GrabCandidate;
}

const _hit = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _ndc = new THREE.Vector2();
/**
 * Un plano por fila del muelle, de delante hacia atrás. El hit-test del click
 * corta el rayo contra cada uno y pregunta solo por los contenedores de esa
 * profundidad: gana el primero que acierta, que es el que tapa a los demás.
 * Módulo (no por frame): cero reservas en el bucle.
 */
const ROW_PLANES = QUAY_ROWS.map((z) => new THREE.Plane(new THREE.Vector3(0, 0, 1), -z));
/** Plano de la fila del barco: el de siempre (z = 0), para barco y gaviotas. */
const _plane = ROW_PLANES[SHIP_ROW];
/** Plano de la grúa: el pórtico viaja en z, así que su `constant` se reescribe al usarlo. */
const _cranePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const _identityQuat = { x: 0, y: 0, z: 0, w: 1 };

/**
 * Altura desde la que reaparece un contenedor que se ha ido a la ría. Un salto
 * corto sobre su hueco, no una caída desde las nubes: al cargar la web los
 * contenedores YA están puestos en el muelle.
 */
const RESPAWN_DROP = 2;

/**
 * Demostración en reposo ("attract mode" de recreativa): si nadie toca nada en
 * este tiempo y aún no se ha cargado ningún contenedor, la grúa se planta sola
 * sobre `DEMO_TARGET_ID` y la flecha holográfica lo señala. NO lo engancha: es
 * una invitación, no una maniobra. Una vez por visita.
 */
const DEMO_AFTER_S = 8;
const DEMO_TARGET_ID = "projects";
/** Etiqueta flotante: cuánto por encima del techo del contenedor se ancla. */
const TAG_LIFT = 0.45;
/** Pórtico "en la fila del barco" a efectos de la pista de soltar. */
const SHIP_ROW_Z_TOL = 0.5;
const _tagPos = new THREE.Vector3();

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
  /** Arrastre de la grúa en curso: dónde agarró el carro y de qué fila salió. */
  const drag = useRef({ active: false, offsetX: 0, startNdcY: 0, startRow: SHIP_ROW });
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
    // Una fila cada vez, de delante hacia atrás: el primero que acierta es el
    // que el visitante está viendo, porque tapa a los de detrás.
    for (let r = 0; r < ROW_PLANES.length; r++) {
      if (!_raycaster.ray.intersectPlane(ROW_PLANES[r], _hit)) continue;
      const box = pickContainerAt(candidates.current, _hit.x, _hit.y, QUAY_ROWS[r]);
      if (box) {
        autoRequest.current = box.id;
        return true;
      }
    }
    // Click sobre la grúa (carro, cabina, spreader) → agarrarla para arrastrarla.
    // Va DESPUÉS de los contenedores: si una caja tapa la zona, gana la caja.
    {
      const c = crane.current;
      _cranePlane.constant = -c.gantryZ;
      if (
        _raycaster.ray.intersectPlane(_cranePlane, _hit) &&
        pickCraneAt(_hit.x, _hit.y, c.trolleyX, c.trolleyX + sway.current.offset, c.hookY - SPREADER_HALF_H, BOOM_TOP_Y)
      ) {
        drag.current = { active: true, offsetX: c.trolleyX - _hit.x, startNdcY: _ndc.y, startRow: c.rowIndex };
        return true;
      }
    }
    // Click sobre el barco → bocina de zarpar. Tampoco baja el gancho.
    if (_raycaster.ray.intersectPlane(_plane, _hit) && pickShipAt(_hit.x, _hit.y)) {
      playHornSfx();
      return true;
    }
    // Ronda de caza: un click que no acierta a nada NO baja/sube el gancho (los
    // fallos al disparar lo movían sin querer). Sólo actúa dándole a un
    // contenedor (arriba); Espacio/E siguen funcionando.
    return gameState.gullRush.current.active;
  };
  const handleGullHit = useCallback(() => gameState.notifyGullKill(), [gameState]);

  const actions = useActionQueue(gl.domElement, clickIntercept);

  // Soltar la grúa: en `window` para que valga aunque el botón se suelte fuera del canvas.
  useEffect(() => {
    const stop = () => { drag.current.active = false; };
    window.addEventListener("mouseup", stop);
    window.addEventListener("blur", stop);
    return () => {
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("blur", stop);
    };
  }, []);

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

  /** Nombre visible y destino de cada contenedor, para la HUD. */
  const cargoInfo = useMemo(
    () =>
      new Map<string, CargoInfo>(
        PORT_CONTAINERS.map((d) => [d.id, { id: d.id, label: d.label ?? t.nav[d.labelKey ?? "work"], href: d.href }]),
      ),
    [t],
  );
  const cargoInfoRef = useRef(cargoInfo);
  cargoInfoRef.current = cargoInfo;

  const craneRef = useRef<CraneHandle>(null);
  /** Halo de hover + flecha que señala (visual, fuera de Physics). */
  const markerRef = useRef<TargetMarkerHandle>(null);
  /** Guía holográfica bajo el spreader: se le escribe una vez por frame. */
  const guideRef = useRef<HookGuideHandle>(null);

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
      const z = QUAY_ROWS[clampRow(def.row)];
      map.set(id, {
        rb,
        data: def,
        spawnX: def.spawnX,
        spawnZ: z,
        tier: def.tier,
        cand: { id, x: 0, y: 0, z, halfW: def.halfW, halfH: CONTAINER_HALF_H },
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
    // Profundidad: la fila es un entero (lo que se pulsa) y `gantryZ` su
    // traducción continua (lo que se ve), que llega con retraso.
    rowIndex: SHIP_ROW,
    gantryZ: QUAY_ROWS[SHIP_ROW],
    gantryVel: 0,
    targetZ: QUAY_ROWS[SHIP_ROW],
  });
  /** Flancos de W/S: cambiar de fila es un pulso, no un "mantener". */
  const rowKeyHeld = useRef(false);
  const shipRef = useRef<ShipHandle>(null);
  /** Último estado enviado a la flecha de la bodega: evita escribir uniforms cada frame. */
  const markerDim = useRef(false);
  // Últimos valores enviados a la HUD DOM: solo se notifica al CAMBIAR.
  const hoverId = useRef<string | null>(null);
  const lastHint = useRef<CraneHint>(null);
  const lastRow = useRef(-1);
  /** Reposo y demostración (ver `DEMO_AFTER_S`). */
  const idle = useRef({ t: 0, demoDone: false, pointing: false, loaded: false });
  const sway = useRef<SwayState>({ offset: 0, velocity: 0 });
  const held = useRef<Tracked | null>(null);
  /**
   * Desfase del contenedor agarrado respecto al spreader. Se engancha de
   * refilón, así que al agarrar no está centrado: en vez de teletransportarlo
   * (lo metía dentro del vecino y salía disparado) se desliza a `GRAB_GLIDE_SPEED`
   * hasta cero. Mientras tanto va en modo `ghost` — sin colisión con nada — y
   * solo se solidifica cuando ya está centrado y no solapa con ningún otro.
   */
  const grab = useRef({ dx: 0, dz: 0, ghost: false });
  const auto = useRef<AutoRun | null>(null);

  const release = useCallback((velX: number, counts: boolean) => {
    const h = held.current;
    if (!h) return;
    // Soltar en modo fantasma lo dejaría atravesando el suelo.
    h.rb.collider(0).setCollisionGroups(COLLISION_ALL);
    grab.current.ghost = false;
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
    idle.current.loaded = true;
    // Confirmación ANTES de la persiana: aviso "rumbo a…" (HeroHud) y, si hay
    // destino real, bocina de zarpar. Un "#…" (página aún no hecha) solo avisa
    // "próximamente" — sin esto cargarlo parecía un fallo.
    const info = cargoInfoRef.current.get(data.id);
    if (info) gameState.notifyCargo(info);
    if (!data.href.startsWith("/")) return;
    playHornSfx();
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
      drag.current.active = false;
      if (c.phase === "lowering") c.phase = "raising";
      rowKeyHeld.current = false;
      guideRef.current?.update(c.trolleyX, c.hookY, c.gantryZ, null, groundTopAt(c.trolleyX), false);
      markerRef.current?.update(null, null);
      if (hoverId.current !== null) {
        hoverId.current = null;
        gameState.onHover.current?.(null);
      }
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

    // --- Entrada: cambio de FILA. Discreto: un pulso = una fila. ---
    // El mando encola con signo; el teclado se lee por FLANCO (mantener W no
    // recorre el muelle entero, que es lo que pasaba si se leyera el estado).
    let rowDelta = remoteInput.rowDelta;
    remoteInput.rowDelta = 0;
    const up = k.has("KeyW") || k.has("ArrowUp");
    const down = k.has("KeyS") || k.has("ArrowDown");
    if (up || down) {
      if (!rowKeyHeld.current) rowDelta += up ? 1 : -1;
      rowKeyHeld.current = true;
    } else {
      rowKeyHeld.current = false;
    }

    // Tocar los mandos manda sobre la maniobra automática.
    const dragging = drag.current.active;
    const touched = left || right || action || rowDelta !== 0 || dragging;
    if (touched) auto.current = null;

    // --- Reposo → demostración. Cualquier entrada (o un click en un
    // contenedor) cuenta como "está jugando" y apaga la flecha de la demo. ---
    const rest = idle.current;
    // En plena ronda de caza disparar no cuenta como tocar la grúa: sin demo en reposo.
    if (touched || autoRequest.current || gameState.gullRush.current.active) {
      rest.t = 0;
      rest.pointing = false;
    } else if (!held.current && !auto.current && c.phase === "idle") {
      rest.t += dt;
      if (!rest.demoDone && !rest.loaded && rest.t > DEMO_AFTER_S) {
        const demo = tracked.current.get(DEMO_TARGET_ID);
        rest.demoDone = true;
        if (demo) {
          // Solo coloca el objetivo: la inercia del carro y del pórtico hacen
          // el resto, y la guía del gancho se "engancha" visualmente sola.
          c.targetX = demo.cand.x;
          c.rowIndex = nearestRowIndex(demo.cand.z ?? 0);
          rest.pointing = true;
        }
      }
    }
    if (left || right) c.targetX += (right ? 1 : -1) * KEY_TARGET_SPEED * dt;
    if (rowDelta !== 0) c.rowIndex = clampRow(c.rowIndex + rowDelta);
    if (dragging) {
      // Solo se coloca el OBJETIVO: el carro llega con su inercia y el spreader
      // se balancea, como con las teclas. La fila sale de cuánto se ha subido
      // o bajado el puntero desde que se agarró.
      _cranePlane.constant = -c.gantryZ;
      _raycaster.setFromCamera(mp, camera);
      if (_raycaster.ray.intersectPlane(_cranePlane, _hit)) c.targetX = _hit.x + drag.current.offsetX;
      const rowSteps = Math.round(((mp.y - drag.current.startNdcY) * window.innerHeight) / 2 / DRAG_ROW_PX);
      c.rowIndex = clampRow(drag.current.startRow + rowSteps);
    }

    // --- Maniobra automática (click en un contenedor) ---
    if (autoRequest.current) {
      const id = autoRequest.current;
      autoRequest.current = null;
      // Con algo colgando, el click significa "llévalo al barco".
      if (held.current) {
        auto.current = { id: held.current.data.id, phase: "drop", row: SHIP_ROW, lowered: true };
      } else {
        const tr = tracked.current.get(id);
        // La fila se toma de DÓNDE ESTÁ, no de dónde nació: puede haberse
        // soltado en otra.
        if (tr) auto.current = { id, phase: "pick", row: nearestRowIndex(tr.cand.z ?? 0), lowered: false };
      }
    }

    const run = auto.current;
    if (run) {
      if (held.current) {
        run.phase = "drop";
        run.row = SHIP_ROW; // la bodega solo está en la fila del barco
      }
      // Posición del gancho al final del frame anterior: sirve para saber si
      // la vertical ya está sobre el objetivo.
      const hookNow = c.trolleyX + sway.current.offset;
      const calm = Math.abs(c.trolleyVel) < AUTO_CALM_VEL && Math.abs(sway.current.velocity) < AUTO_CALM_VEL;
      // La maniobra manda también en profundidad: primero se planta en la fila.
      c.rowIndex = run.row;
      const onRow =
        Math.abs(c.gantryZ - QUAY_ROWS[run.row]) < AUTO_ALIGN_Z && Math.abs(c.gantryVel) < AUTO_CALM_VEL;

      if (run.phase === "pick") {
        const tr = tracked.current.get(run.id);
        if (!tr || (run.lowered && c.phase === "idle")) {
          auto.current = null; // desapareció, o bajó y volvió de vacío
        } else {
          c.targetX = tr.cand.x;
          if (c.phase === "idle" && calm && onRow && Math.abs(hookNow - tr.cand.x) < AUTO_ALIGN_X) {
            run.lowered = true;
            action = true; // → lowering
          }
        }
      } else if (!held.current) {
        auto.current = null; // ya está soltado
      } else {
        c.targetX = SHIP_DROP_X;
        if (c.phase === "idle" && calm && onRow && Math.abs(hookNow - SHIP_DROP_X) < AUTO_ALIGN_X) {
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

    // --- Pórtico en profundidad: misma inercia, más pesada. Sin péndulo en z. ---
    c.targetZ = QUAY_ROWS[c.rowIndex];
    const desiredZ = Math.min(Math.max((c.targetZ - c.gantryZ) * GANTRY_GAIN, -GANTRY_MAX_SPEED), GANTRY_MAX_SPEED);
    c.gantryVel = approach(c.gantryVel, desiredZ, GANTRY_ACCEL * dt);
    c.gantryZ += c.gantryVel * dt;

    // --- Refresca candidatos con la física actual ---
    for (const tr of tracked.current.values()) {
      const p = tr.rb.translation();
      tr.cand.x = p.x;
      tr.cand.y = p.y;
      tr.cand.z = p.z;
      if (p.y < SINK_Y && tr !== held.current) {
        scratchRapierVec.x = tr.spawnX;
        scratchRapierVec.y =
          restingY(tr.spawnX, CONTAINER_HALF_H) + tr.tier * CONTAINER_HALF_H * 2 + RESPAWN_DROP;
        scratchRapierVec.z = tr.spawnZ;
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
      const target = findGrabTarget(candidates.current, hookX, bottom + LOWER_SPEED * dt, c.gantryZ);
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
            // Agarrado de refilón: conserva el desfase y sin colisión hasta centrarse.
            grab.current.dx = tr.cand.x - hookX;
            grab.current.dz = (tr.cand.z ?? 0) - c.gantryZ;
            grab.current.ghost = true;
            tr.rb.collider(0).setCollisionGroups(COLLISION_NONE);
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

    /*
     * Guía holográfica del gancho. Se dibuja cuando SIRVE para decidir: con el
     * spreader vacío y parado (`idle`) o mientras baja. Subiendo o con carga no
     * aporta nada — ahí ya no se elige presa — y sería ruido sobre el dibujo.
     *
     * El objetivo es el MISMO que usa `lowering` para enganchar (`findGrabTarget`
     * con la fila del pórtico), así que lo que se pinta es literalmente lo que
     * se va a agarrar, no una aproximación. En `idle` el fondo del spreader está
     * arriba del todo y la función filtra solo por x/z y se queda con el techo
     * más alto: devuelve el de la cima de la pila, que es el enganchable.
     */
    // Solo sobre el muelle: sobre el agua o el barco no hay nada que elegir y
    // los hilos colgando al vacío eran ruido.
    const showGuide = held.current === null && c.phase !== "raising" && hookX <= QUAY_EDGE_X;
    const guideTarget = showGuide
      ? findGrabTarget(candidates.current, hookX, c.hookY - SPREADER_HALF_H, c.gantryZ)
      : null;
    guideRef.current?.update(hookX, c.hookY, c.gantryZ, guideTarget, groundTopAt(hookX), showGuide);

    const dist = disturbance.current;
    dist.trolleyX = c.trolleyX;
    dist.hookX = hookX;
    dist.hookY = c.hookY;
    // Las gaviotas se posan en la grúa (que viaja en z) y en los techos de los
    // contenedores: necesitan saber dónde está todo ESTE frame.
    dist.gantryZ = c.gantryZ;
    dist.gantryVel = c.gantryVel;
    dist.containers = candidates.current;
    dist.heldId = held.current ? held.current.data.id : null;

    // El ratón ya no conduce la grúa, pero sigue espantando gaviotas y decide
    // el cursor: cruz sobre una gaviota (pista del easter egg), mano sobre un
    // contenedor o sobre el barco (pista de que se puede pinchar).
    _raycaster.setFromCamera(mp, camera);
    const { origin: ro, direction: rd } = _raycaster.ray;
    const overGull = pickGullTarget(ro.x, ro.y, ro.z, rd.x, rd.y, rd.z, gullTargets.values()) !== null;
    let overBox = false;
    let hovered: GrabCandidate | null = null;
    // El puntero para las gaviotas sigue leyéndose en la fila del barco.
    if (_raycaster.ray.intersectPlane(_plane, _hit)) {
      dist.pointerX = _hit.x;
      dist.pointerY = _hit.y;
      overBox = !overGull && pickShipAt(_hit.x, _hit.y);
    }
    // Contenedores: mismo recorrido de filas que el click, para que el cursor
    // no mienta sobre lo que se puede pinchar.
    if (!overGull && !overBox) {
      for (let r = 0; r < ROW_PLANES.length && !overBox; r++) {
        if (!_raycaster.ray.intersectPlane(ROW_PLANES[r], _hit)) continue;
        hovered = pickContainerAt(candidates.current, _hit.x, _hit.y, QUAY_ROWS[r]);
        overBox = hovered !== null;
      }
    }
    // Cabina / carro / spreader: se pueden agarrar y arrastrar.
    let overCrane = false;
    if (!overGull && !overBox && !dragging) {
      _cranePlane.constant = -c.gantryZ;
      overCrane =
        _raycaster.ray.intersectPlane(_cranePlane, _hit) !== null &&
        pickCraneAt(_hit.x, _hit.y, c.trolleyX, hookX, c.hookY - SPREADER_HALF_H, BOOM_TOP_Y);
    }
    const wantCursor = dragging ? "grabbing" : overGull ? "crosshair" : overBox ? "pointer" : overCrane ? "grab" : "";
    if (wantCursor !== cursor.current) {
      cursor.current = wantCursor;
      gl.domElement.style.cursor = wantCursor;
    }

    craneRef.current?.update(c.trolleyX, hookX, c.hookY, c.gantryZ);

    const h = held.current;
    if (h) {
      const g = grab.current;
      g.dx = approach(g.dx, 0, GRAB_GLIDE_SPEED * dt);
      g.dz = approach(g.dz, 0, GRAB_GLIDE_SPEED * dt);
      scratchRapierVec.x = hookX + g.dx;
      scratchRapierVec.y = c.hookY - SPREADER_HALF_H - CONTAINER_HALF_H - 0.02;
      // La carga viaja en la fila del pórtico. Un cuerpo cinemático IGNORA el
      // bloqueo de traslación en z, así que aquí la z sí se mueve; al soltarlo
      // vuelve a dinámico y el bloqueo lo deja clavado en esa fila.
      scratchRapierVec.z = c.gantryZ + g.dz;
      h.rb.setNextKinematicTranslation(scratchRapierVec);
      if (g.ghost && g.dx === 0 && g.dz === 0) {
        const others: GrabCandidate[] = [];
        for (const tr of tracked.current.values()) if (tr !== h) others.push(tr.cand);
        const free = !overlapsAny(
          { x: scratchRapierVec.x, y: scratchRapierVec.y, z: scratchRapierVec.z, halfW: h.cand.halfW, halfH: h.cand.halfH },
          others,
        );
        if (free) {
          h.rb.collider(0).setCollisionGroups(COLLISION_ALL);
          g.ghost = false;
        }
      }
    }

    // Flecha de la bodega atenuada cuando la carga está fuera de la fila del
    // barco: desde ahí no se puede soltar dentro.
    const dim = h !== null && c.rowIndex !== SHIP_ROW;
    if (dim !== markerDim.current) {
      markerDim.current = dim;
      shipRef.current?.setDimmed(dim);
    }

    /*
     * --- HUD de ayuda ---
     * Con carga: hueco fantasma en la bodega + pista de texto (fila / llévala /
     * suelta). "Encima de la bodega" = el contenedor entero cabe entre sus
     * mamparos a esta x, que es cuando soltar entra de verdad. Durante la
     * maniobra automática no hay pista: la grúa ya sabe lo que hace.
     */
    let drop: DropState = "hidden";
    let hint: CraneHint = null;
    if (h) {
      const inShipRow = c.rowIndex === SHIP_ROW && Math.abs(c.gantryZ - QUAY_ROWS[SHIP_ROW]) < SHIP_ROW_Z_TOL;
      const overHold = hookX >= HOLD_MIN_X + h.cand.halfW * 0.6 && hookX <= HOLD_MAX_X - h.cand.halfW * 0.6;
      drop = !inShipRow ? "dim" : overHold ? "ready" : "target";
      if (!auto.current) hint = drop === "dim" ? "row" : drop === "ready" ? "release" : "carry";
    }
    shipRef.current?.setDrop(drop, h ? h.cand.halfW : 1.3, hookX);
    if (hint !== lastHint.current) {
      lastHint.current = hint;
      gameState.onHint.current?.(hint);
    }
    if (c.rowIndex !== lastRow.current) {
      lastRow.current = c.rowIndex;
      gameState.onRow.current?.(c.rowIndex);
    }

    // Hover: halo + etiqueta flotante. Vale el puntero o, si no hay, el
    // contenedor que la grúa tiene justo debajo (el mismo de la guía del
    // gancho): "estás sobre ESTE". Con carga colgando no — ahí un click ya no
    // elige contenedor, significa "llévalo al barco".
    const hover = h ? null : hovered ?? guideTarget;
    const hid = hover ? hover.id : null;
    if (hid !== hoverId.current) {
      hoverId.current = hid;
      gameState.onHover.current?.(hid ? cargoInfoRef.current.get(hid) ?? null : null);
    }
    const tag = gameState.hoverTagEl.current;
    if (hover && tag) {
      _tagPos.set(hover.x, hover.y + hover.halfH + TAG_LIFT, hover.z ?? 0).project(camera);
      const px = ((_tagPos.x + 1) / 2) * gl.domElement.clientWidth;
      const py = ((1 - _tagPos.y) / 2) * gl.domElement.clientHeight;
      tag.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
    }

    // Flecha que señala: la pide el tutorial (DOM) o la demostración en reposo.
    // Nunca sobre lo que ya cuelga del gancho.
    const pointId = gameState.pointAt.current ?? (rest.pointing ? DEMO_TARGET_ID : null);
    const pointTr = pointId && !h ? tracked.current.get(pointId) : undefined;
    markerRef.current?.update(hover, pointTr ? pointTr.cand : null);
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
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={16}
        shadow-camera-bottom={-14}
        shadow-bias={-0.0006}
      />

      {showStatic && <PortSky palette={palette} />}
      {showStatic && <PortBay palette={palette} />}
      {!showStatic && <WaterOccluder />}
      {!showStatic && <ComicClouds palette={palette} />}
      {!showStatic && <PaintedLighthouse />}
      {showMoving && <Seagulls palette={palette} flat={!showStatic} disturbance={disturbance} targets={gullTargets} rush={gameState.gullRush} />}
      {showMoving && <GullHunt ref={hunt} outline={palette.outline} onHit={handleGullHit} />}
      {/* Guía del gancho: va FUERA de <Physics> a propósito — es luz, no materia. */}
      {showMoving && <HookGuide ref={guideRef} />}
      {showMoving && <TargetMarker ref={markerRef} />}

      <Physics gravity={[0, -GRAVITY, 0]} timeStep={1 / 60} interpolate paused={!physicsActive || physicsPaused}>
        {/* Topes laterales invisibles: nada se escapa del encuadre. */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider position={[-20.5, 4, 0]} args={[0.5, 16, 5]} />
          <CuboidCollider position={[20.5, 4, 0]} args={[0.5, 16, 5]} />
        </RigidBody>

        <Quay palette={palette} showStatic={showStatic} />
        <Ship ref={shipRef} showStatic={showStatic} showMarker={showMoving} palette={palette} onEnterHold={handleEnterHold} onExitHold={handleExitHold} />
        <Crane ref={craneRef} palette={palette} showStatic={showStatic} showMoving={showMoving} />

        {showMoving && PORT_CONTAINERS.map((def) => (
          <CargoContainer
            key={def.id}
            data={def}
            label={def.label ?? t.nav[def.labelKey ?? "work"]}
            position={[
              def.spawnX,
              restingY(def.spawnX, CONTAINER_HALF_H) + def.tier * CONTAINER_HALF_H * 2,
              QUAY_ROWS[clampRow(def.row)],
            ]}
            palette={palette}
            onRegister={handleRegister}
          />
        ))}
      </Physics>
    </>
  );
}
