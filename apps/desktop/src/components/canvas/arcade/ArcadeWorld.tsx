"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { ArcadeMachines } from "./ArcadeMachines";
import { ArcadeRoom } from "./ArcadeRoom";
import {
  CAMERA_FOV,
  DOCK,
  EXIT,
  EXIT_CAMERA_Z,
  WALK,
  dockPosition,
  isStill,
  screenCenter,
  type MachineSpec,
} from "./arcade-config";
import type { DoorExitState } from "./ArcadeDoor";
import type { ArcadeMode, ArcadePalette } from "./arcade-mode";

export interface ArcadeWorldProps {
  mode: ArcadeMode;
  palette: ArcadePalette;
  machines: readonly MachineSpec[];
  /** Rótulo de la puerta, ya traducido. */
  doorLabel: string;
  /** Hay un panel del HUD abierto (la lista, la pantalla acoplada): el pasillo
   * no escucha teclas. */
  paused: boolean;
  /** Máquina acoplada (la cámara plantada ante su pantalla), o `null`. */
  selected: number | null;
  onReady?: () => void;
  /** Máquina enfocada (o `null`): la página pinta su ficha en el HUD. */
  onFocusChange: (index: number | null) => void;
  /** El visitante ya ha andado: primer paso del tutorial hecho. */
  onWalked: () => void;
  /** Clic / Enter sobre una máquina: la página la acopla. */
  onSelect: (index: number) => void;
  /** La cámara ha llegado (o ha dejado) la pantalla acoplada: la página
   * enciende la ficha solo cuando el tubo ya está quieto detrás. */
  onDockedChange: (docked: boolean) => void;
  /** Se ha llegado a la puerta: las hojas se abren y la cámara entra. La
   * página retira su chrome para que el último frame sea solo la persiana. */
  onExitStart: () => void;
  /** Toca navegar a /contact. `covered` = la pantalla ya ES la persiana
   * cerrada (la pared de lamas de la sala de neón): la de DOM entra sin
   * animar. Sin movimiento reducido no hay coreografía y llega `false`. */
  onReachDoor: (covered: boolean) => void;
}

/** Suavizado exponencial independiente del framerate (mismo que la plaza). */
function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/** Metros andados a partir de los cuales el primer paso del tutorial está hecho. */
const WALKED_METERS = 1.2;
/** Retardo antes de arrancar el vídeo de la máquina enfocada: andando por el
 * pasillo el foco salta de máquina en máquina y no hay que bajar un vídeo por
 * cada una. */
const VIDEO_DELAY_MS = 320;
/** Suavizado del acople (1/s): llega en ~0,6 s. */
const DOCK_LAMBDA = 5;

/** Curva de la salida: arranca y para suave, para acabar clavada en el encuadre. */
function easeInOutCubic(x: number): number {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Posición guardada al acoplar una máquina: si desde su pantalla se abre la
 * ficha completa, al volver se sigue donde se estaba. */
const STORAGE_KEY = "action-arcade-position";

interface SavedPosition {
  z: number;
  side: -1 | 0 | 1;
}

function readSaved(): SavedPosition | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedPosition;
    return Number.isFinite(parsed.z) ? parsed : null;
  } catch {
    return null;
  }
}

function writeSaved(value: SavedPosition | null) {
  try {
    if (value) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sin almacenamiento (modo privado): se vuelve a empezar por la entrada.
  }
}

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Máquina "de enfrente" en un lado: la más cercana al punto donde cae la mirada. */
function machineOnSide(machines: readonly MachineSpec[], side: -1 | 1, z: number): number | null {
  const target = z - WALK.lookAhead;
  let best: number | null = null;
  let bestDist = Infinity;
  for (const m of machines) {
    if (m.side !== side) continue;
    const d = Math.abs(m.z - target);
    if (d < bestDist) {
      bestDist = d;
      best = m.index;
    }
  }
  return best;
}

/**
 * El pasillo en primera persona.
 *
 * La cámara va sobre raíles: `z` es lo único que cambia al andar (el eje del
 * pasillo), y la cabeza mira al frente o a un lado. Todo el estado vivo va en
 * refs y se muta en `useFrame`; a React solo sube lo que cambia pocas veces
 * (qué máquina está enfocada).
 *
 * Controles: ↑/W y ↓/S andan (también la rueda y, en táctil, arrastrar en
 * vertical); ←/A y →/D giran la cabeza a la fila de ese lado (izquierda ←
 * centro → derecha); Enter/Espacio o un clic ACOPLAN la máquina enfocada: la
 * cámara se planta ante su pantalla y la página enciende la ficha encima.
 * Acoplado, el pasillo está en pausa y las teclas son de la pantalla
 * (`arcade/ArcadeScreen`); al soltar, la cámara vuelve al raíl mirando a esa
 * misma máquina.
 */
export function ArcadeWorld({
  mode,
  palette,
  machines,
  doorLabel,
  paused,
  selected,
  onReady,
  onFocusChange,
  onWalked,
  onSelect,
  onDockedChange,
  onExitStart,
  onReachDoor,
}: ArcadeWorldProps) {
  const { camera, gl } = useThree();
  const still = useMemo(() => isStill(), []);
  const reduced = useMemo(() => typeof window !== "undefined" && reducedMotion(), []);

  // Posición inicial: la guardada al entrar en un proyecto, o la entrada.
  const saved = useMemo(() => (typeof window === "undefined" ? null : readSaved()), []);
  const z = useRef(saved ? THREE.MathUtils.clamp(saved.z, WALK.doorZ + 3, WALK.startZ) : WALK.startZ);
  const velocity = useRef(0);
  const side = useRef<-1 | 0 | 1>(saved?.side ?? 0);
  const keys = useRef({ forward: false, back: false });
  const autoWalk = useRef(false);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const bob = useRef(0);
  const startZ = useRef(z.current);
  const walkedFired = useRef(false);
  const readyFired = useRef(false);
  const doorFired = useRef(false);
  /** Acoplado: ¿la cámara ya llegó a la pantalla? */
  const docked = useRef(false);
  /** Recién soltada una máquina: la cámara vuelve al raíl con suavizado en vez
   * de saltar. */
  const returning = useRef(false);
  const railPos = useRef(new THREE.Vector3());
  /** Salida por la puerta: segundos desde que empezó (`null` = no ha empezado),
   * de dónde partía la cámara y si el frame final ya se pintó. */
  const exitT = useRef<number | null>(null);
  const exitFrom = useRef<{ y: number; z: number; yaw: number; pitch: number }>({ y: WALK.eyeHeight, z: WALK.doorZ, yaw: 0, pitch: 0 });
  const exitPainted = useRef(false);
  const doorExit = useRef<DoorExitState>({ open: 0 });

  const [hovered, setHovered] = useState<number | null>(null);
  const [doorHover, setDoorHover] = useState(false);
  const [sideFocus, setSideFocus] = useState<number | null>(null);
  const focused = selected ?? hovered ?? sideFocus;
  const [playing, setPlaying] = useState<number | null>(null);

  // Lo de dentro de `useFrame` y de los listeners lee siempre lo último.
  const focusedRef = useRef(focused);
  const pausedRef = useRef(paused);
  const selectedRef = useRef(selected);
  useEffect(() => {
    focusedRef.current = focused;
    onFocusChange(focused);
  }, [focused, onFocusChange]);
  useEffect(() => {
    pausedRef.current = paused;
    if (paused) keys.current = { forward: false, back: false };
  }, [paused]);

  // Acoplar / soltar. Al acoplar, el raíl se deja YA delante de esa máquina y
  // mirando a su fila: es a donde vuelve la cámara al soltar, así el visitante
  // reaparece en el pasillo frente a lo que estaba viendo.
  useEffect(() => {
    const wasDocked = selectedRef.current !== null;
    selectedRef.current = selected;
    docked.current = false;
    onDockedChange(false);
    if (selected === null) {
      if (wasDocked) returning.current = true;
      return;
    }
    const m = machines[selected];
    if (!m) return;
    setHovered(null);
    velocity.current = 0;
    autoWalk.current = false;
    side.current = m.side;
    z.current = THREE.MathUtils.clamp(m.z + WALK.lookAhead, WALK.doorZ + 1, WALK.startZ);
    writeSaved({ z: z.current, side: side.current });
  }, [selected, machines, onDockedChange]);

  // El vídeo llega con retardo respecto al foco (ver `VIDEO_DELAY_MS`). Acoplado
  // no hace falta: la pantalla la tapa la ficha, que trae su propio vídeo.
  useEffect(() => {
    const next = selected === null ? focused : null;
    const id = window.setTimeout(() => setPlaying(next), next === null ? 0 : VIDEO_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [focused, selected]);

  useEffect(() => {
    document.body.style.cursor = hovered !== null || doorHover ? "pointer" : "auto";
  }, [hovered, doorHover]);
  useEffect(() => () => void (document.body.style.cursor = "auto"), []);

  const activate = useCallback(
    (index: number) => {
      if (doorFired.current || selectedRef.current !== null || !machines[index]) return;
      onSelect(index);
    },
    [machines, onSelect],
  );

  const goToDoor = useCallback(() => {
    if (selectedRef.current !== null) return;
    side.current = 0;
    autoWalk.current = true;
  }, []);

  // Teclado.
  useEffect(() => {
    const isField = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

    const onDown = (e: KeyboardEvent) => {
      if (pausedRef.current || e.metaKey || e.ctrlKey || e.altKey || isField(e.target)) return;
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          keys.current.forward = true;
          break;
        case "ArrowDown":
        case "KeyS":
          keys.current.back = true;
          autoWalk.current = false;
          break;
        case "ArrowLeft":
        case "KeyA":
          if (!e.repeat) side.current = Math.max(-1, side.current - 1) as -1 | 0 | 1;
          break;
        case "ArrowRight":
        case "KeyD":
          if (!e.repeat) side.current = Math.min(1, side.current + 1) as -1 | 0 | 1;
          break;
        case "Enter":
        case "Space": {
          // Un botón o enlace del HUD con el foco se activa a sí mismo.
          if (e.target instanceof HTMLElement && e.target.closest("a,button")) return;
          if (focusedRef.current !== null) activate(focusedRef.current);
          break;
        }
        case "Escape":
          side.current = 0;
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp" || e.code === "KeyW") keys.current.forward = false;
      if (e.code === "ArrowDown" || e.code === "KeyS") keys.current.back = false;
    };
    const onBlur = () => (keys.current = { forward: false, back: false });

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [activate]);

  // Rueda y táctil, sobre el propio canvas.
  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      if (pausedRef.current) return;
      e.preventDefault();
      velocity.current = THREE.MathUtils.clamp(
        // Invertido a propósito (decisión del cliente): rueda hacia ARRIBA =
        // avanzar, como empujar el pasillo hacia delante; hacia abajo, retroceder.
        velocity.current - e.deltaY * WALK.wheelImpulse,
        -WALK.maxSpeed,
        WALK.maxSpeed,
      );
    };

    // Táctil: arrastrar en vertical anda; un barrido horizontal cambia de fila.
    let touch: { id: number; x: number; y: number; dx: number } | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      touch = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0 };
    };
    const onMove = (e: PointerEvent) => {
      if (!touch || e.pointerId !== touch.id || pausedRef.current) return;
      const dy = e.clientY - touch.y;
      touch.dx += e.clientX - touch.x;
      touch.x = e.clientX;
      touch.y = e.clientY;
      // Dedo hacia arriba = avanzar (como empujar el pasillo hacia atrás).
      z.current = THREE.MathUtils.clamp(z.current + dy * 0.025, WALK.doorZ, WALK.startZ);
      if (Math.abs(touch.dx) > 60) {
        const step = touch.dx < 0 ? 1 : -1;
        side.current = THREE.MathUtils.clamp(side.current + step, -1, 1) as -1 | 0 | 1;
        touch.dx = 0;
      }
    };
    const onUp = (e: PointerEvent) => {
      if (touch && e.pointerId === touch.id) touch = null;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [gl]);

  // Orden de Euler para primera persona: primero el giro de cabeza, luego el cabeceo.
  useEffect(() => {
    camera.rotation.order = "YXZ";
  }, [camera]);

  // Franjas laterales del ratón (ver `WALK.edge*`). Solo ratón: en táctil el
  // cambio de fila ya es el barrido horizontal.
  const mouseActive = useRef(false);
  const edge = useRef({ armed: true, hold: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouseActive.current = e.pointerType === "mouse";
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const lookDir = useRef(new THREE.Vector3());

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);

    // ── Salida: se abren las hojas y la cámara entra en la sala de neón ──
    // Acaba de frente a la pared de lamas, a los ojos y con el `fov` de
    // siempre: ese frame es la persiana cerrada. Se avisa al SIGUIENTE, para
    // que la persiana DOM caiga sobre un frame que ya está en pantalla.
    if (exitT.current !== null) {
      if (exitPainted.current) {
        if (exitT.current >= 0) {
          exitT.current = -1;
          onReachDoor(true);
        }
        return;
      }
      const t = (exitT.current += dt);
      const cam = camera as THREE.PerspectiveCamera;
      doorExit.current.open = easeInOutCubic(t / EXIT.open);
      const head = easeInOutCubic(t / EXIT.dollyDelay / 1.6);
      const run = easeInOutCubic((t - EXIT.dollyDelay) / EXIT.dolly);
      const from = exitFrom.current;
      camera.position.set(
        0,
        THREE.MathUtils.lerp(from.y, WALK.eyeHeight, head),
        THREE.MathUtils.lerp(from.z, EXIT_CAMERA_Z, run),
      );
      yaw.current = THREE.MathUtils.lerp(from.yaw, 0, head);
      pitch.current = THREE.MathUtils.lerp(from.pitch, 0, head);
      camera.rotation.set(pitch.current, yaw.current, 0);
      cam.fov = CAMERA_FOV + EXIT.fovKick * Math.sin(Math.PI * run);
      cam.updateProjectionMatrix();
      if (run >= 1) exitPainted.current = true;
      return;
    }

    // ── Acoplado: la cámara de frente a la pantalla, sin mirada libre ──
    const sel = selectedRef.current;
    const dockM = sel === null ? undefined : machines[sel];
    if (dockM) {
      const sc = screenCenter(dockM);
      const target = dockPosition(dockM, state.size.width / state.size.height, (camera as THREE.PerspectiveCamera).fov);
      // La orientación sale de la posición FINAL, no de la actual: así la
      // cámara acaba exactamente sobre la normal y el DOM cae encima del tubo.
      lookDir.current.set(sc.x - target.x, sc.y - target.y, sc.z - target.z);
      const targetYaw = Math.atan2(-lookDir.current.x, -lookDir.current.z);
      const targetPitch = Math.atan2(lookDir.current.y, Math.hypot(lookDir.current.x, lookDir.current.z));
      const k = reduced ? 1e3 : DOCK_LAMBDA;
      camera.position.x = damp(camera.position.x, target.x, k, dt);
      camera.position.y = damp(camera.position.y, target.y, k, dt);
      camera.position.z = damp(camera.position.z, target.z, k, dt);
      yaw.current = damp(yaw.current, targetYaw, k * 1.4, dt);
      pitch.current = damp(pitch.current, targetPitch, k * 1.4, dt);
      camera.rotation.set(pitch.current, yaw.current, 0);

      const arrived =
        Math.hypot(camera.position.x - target.x, camera.position.y - target.y, camera.position.z - target.z) <
          DOCK.arrive && Math.abs(yaw.current - targetYaw) < 0.01;
      if (arrived !== docked.current) {
        docked.current = arrived;
        onDockedChange(arrived);
      }
      return;
    }

    // ── Andar ──
    const input = autoWalk.current
      ? 1
      : (keys.current.forward ? 1 : 0) - (keys.current.back ? 1 : 0);
    if (input !== 0) {
      velocity.current += input * WALK.accel * dt;
    } else {
      velocity.current = damp(velocity.current, 0, WALK.friction, dt);
    }
    velocity.current = THREE.MathUtils.clamp(velocity.current, -WALK.maxSpeed, WALK.maxSpeed);
    z.current = THREE.MathUtils.clamp(z.current - velocity.current * dt, WALK.doorZ, WALK.startZ);
    if (z.current === WALK.startZ && velocity.current < 0) velocity.current = 0;

    if (!walkedFired.current && Math.abs(z.current - startZ.current) > WALKED_METERS) {
      walkedFired.current = true;
      onWalked();
    }

    if (!doorFired.current && z.current <= WALK.doorZ + 0.001) {
      doorFired.current = true;
      velocity.current = 0;
      // Por la puerta se sale del pasillo: al volver se empieza por la entrada.
      writeSaved(null);
      if (reduced) {
        onReachDoor(false);
      } else {
        exitFrom.current = {
          y: camera.position.y,
          z: camera.position.z,
          yaw: yaw.current,
          pitch: pitch.current,
        };
        exitT.current = 0;
        setHovered(null);
        setDoorHover(false);
        onExitStart();
        return;
      }
    }

    // ── Franjas laterales: el ratón en el borde = pulsar ← / → ──
    if (mouseActive.current && !pausedRef.current) {
      const { x, y } = state.pointer;
      const e = edge.current;
      const zone = Math.abs(y) > WALK.edgeMaxY ? 0 : x > WALK.edgeEnter ? 1 : x < -WALK.edgeEnter ? -1 : 0;
      if (Math.abs(x) < WALK.edgeExit) {
        e.armed = true;
        e.hold = 0;
      } else if (zone !== 0 && e.armed) {
        e.hold += dt;
        if (e.hold >= WALK.edgeDwell) {
          side.current = THREE.MathUtils.clamp(side.current + zone, -1, 1) as -1 | 0 | 1;
          e.armed = false;
        }
      } else {
        e.hold = 0;
      }
    }

    // ── Foco por la fila a la que se mira ──
    const nextSideFocus = side.current === 0 ? null : machineOnSide(machines, side.current, z.current);
    if (nextSideFocus !== sideFocus) setSideFocus(nextSideFocus);

    // Imán: mirando a una fila sin andar, el pasillo te planta delante de la
    // máquina enfocada. Sin él, al pulsar ← en la entrada la primera máquina
    // quedaba cuatro metros por delante y su pantalla se veía de canto.
    if (nextSideFocus !== null && input === 0 && Math.abs(velocity.current) < 0.3) {
      const docked = THREE.MathUtils.clamp(machines[nextSideFocus].z + WALK.lookAhead, WALK.doorZ + 1, WALK.startZ);
      z.current = damp(z.current, docked, 3.2, dt);
    }

    // ── Cabeza ──
    const speed = Math.abs(velocity.current) / WALK.maxSpeed;
    bob.current += dt * (4 + 6 * speed);
    railPos.current.set(0, WALK.eyeHeight + Math.sin(bob.current * 2) * 0.022 * speed, z.current);
    if (returning.current && !reduced) {
      camera.position.lerp(railPos.current, 1 - Math.exp(-DOCK_LAMBDA * dt));
      if (camera.position.distanceTo(railPos.current) < 0.01) returning.current = false;
    } else {
      returning.current = false;
      camera.position.copy(railPos.current);
    }

    let targetYaw = 0;
    let targetPitch = -0.02;
    const lookAt = side.current !== 0 && nextSideFocus !== null ? machines[nextSideFocus] : null;
    if (lookAt) {
      const sc = screenCenter(lookAt);
      const dx = sc.x - camera.position.x;
      const dz = sc.z - camera.position.z;
      targetYaw = Math.atan2(-dx, -dz);
      targetPitch = Math.atan2(sc.y - camera.position.y, Math.hypot(dx, dz));
    }
    if (!still) {
      targetYaw -= state.pointer.x * WALK.mouseYaw;
      targetPitch += state.pointer.y * WALK.mousePitch;
    }
    yaw.current = damp(yaw.current, targetYaw, 6, dt);
    pitch.current = damp(pitch.current, targetPitch, 6, dt);
    camera.rotation.set(pitch.current, yaw.current, 0);

    if (!readyFired.current) {
      readyFired.current = true;
      // Tras el primer frame pintado, no en el mount: si no, la persiana se
      // recogería antes de que hubiera nada detrás.
      onReady?.();
    }
  });

  return (
    <>
      <ArcadeRoom
        mode={mode}
        palette={palette}
        doorLabel={doorLabel}
        doorHovered={doorHover}
        doorExit={doorExit}
        reduced={reduced}
        onDoor={goToDoor}
        onDoorHover={setDoorHover}
      />
      <ArcadeMachines
        machines={machines}
        palette={palette}
        focused={focused}
        playing={playing}
        onHover={setHovered}
        onActivate={activate}
      />
    </>
  );
}
