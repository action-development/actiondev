"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DOLL, PLAZA_PALETTE, type DollSpec } from "./plaza-config";
import { PLAZA_PALETTES, currentPlazaMode, type PlazaMode } from "./plaza-mode";
import { prefersReducedMotion } from "./plaza-motion";
import { blinkCurve, createHeadMaterial, setFaceRig } from "./doll/face-material";
import { getGlowTexture } from "./plaza-textures";
import { DOLL_RIG, getDollGeos } from "./doll/doll-geometry";
import { outfitFor } from "./doll/doll-outfit";
import {
  getBodyMaterial,
  getOutlineSoft,
  getOutlineStrong,
  getSelectionRing,
  outlineRes,
  setDollRim,
} from "./doll/doll-material";
import { BUBBLE_FRAMES, getBubbleAtlas } from "./doll/doll-bubble";
import { clamp, damp, smoothstep, softTriangle, stepSpring, type Spring } from "./doll/doll-math";

/**
 * Muñeco de la plaza de reseñas: cabezón + cuerpo de juguete, mate y
 * redondeado, de proporciones de avatar de consola (solo proporciones y
 * técnica, nunca marcas).
 *
 * Esta pieza dibuja y anima al muñeco EN LOCAL. La posición/rotación en el
 * suelo (`spec.home`, `facing`) las aplica el padre envolviéndolo en su
 * propio `<group>`.
 *
 * Animación: TODAS las articulaciones se suavizan con `damp` exponencial hacia
 * la pose objetivo (nada cambia de pose "en seco"), salvo el ciclo de paso,
 * que va directo de la fase (su amplitud sí se suaviza) para que el pie de
 * apoyo no patine ni se hunda. Ver `useFrame`.
 */

export interface PlazaDollProps {
  spec: DollSpec;
  /** Estado de animación que decide el mundo (lo pasa el padre). */
  state?: "idle" | "walking" | "waving" | "focused" | "held" | "talking";
  /** true con puntero encima, seleccionado o agarrado → feedback visual. */
  highlighted?: boolean;
  /** Día o noche: ajusta rim y opacidad de la sombra de contacto. */
  mode?: PlazaMode;
  /** Grupo del interlocutor mientras charlan: el muñeco le mira a él (no a la
   * cámara) y se reparten los turnos de palabra. Opcional. */
  partnerRef?: React.RefObject<THREE.Object3D | null>;
}

// --- Parámetros de pose / movimiento -------------------------------------

const POP_DURATION = 0.6;
/** Escalonado de la aparición: cada muñeco entra con un retraso derivado de su fase. */
const POP_STAGGER = 0.9;

/** Lo que se despega del suelo un muñeco agarrado (unidades locales). Sin eje
 * de altura en el arrastre: es solo "en la mano". */
const HELD_LIFT = 0.22;
const HELD_ARM_BASE = -2.45;
const HELD_ARM_SWING = 0.55;
const HELD_FLAP = 14;
/** Altura (local) del punto por el que se le "sujeta": el péndulo gira ahí. */
const HELD_PIVOT_Y = 1.3;

/** Amplitud de zancada (rad) y del balanceo de brazos al andar. */
const LEG_AMP = 0.5;
const ARM_AMP = 0.55;
const LEAN = 0.07; // ~4° hacia delante al andar
/** Cuánto sube el pie en el aire (el apoyo queda a ras de suelo). */
const FOOT_LIFT = 0.035;
const GRAVITY = 14;

/** Separación de los brazos respecto al torso (rad) colgando. */
const ARM_SPLAY = 0.1;
const HEAD_YAW_MAX = 1.05; // ±60°

/** Punta del bocadillo: justo sobre la coronilla. Derivado de `DOLL`. */
const BUBBLE_BASE_Y = DOLL.head.y + DOLL.head.radius * DOLL.head.scale[1] + 0.03;
const BUBBLE_SCALE = 0.42;

/** Pose suavizada: valores que se acercan a su objetivo con `damp`. */
interface Pose {
  armLx: number;
  armRx: number;
  armLz: number;
  armRz: number;
  elbowL: number;
  elbowR: number;
  foreLz: number;
  foreRz: number;
  legL: number;
  legR: number;
  headYaw: number;
  headPitch: number;
  headRoll: number;
  lean: number;
  roll: number;
  swayX: number;
}

const POSE_ZERO: Pose = {
  armLx: 0,
  armRx: 0,
  armLz: ARM_SPLAY,
  armRz: ARM_SPLAY,
  elbowL: -0.1,
  elbowR: -0.1,
  foreLz: 0,
  foreRz: 0,
  legL: 0,
  legR: 0,
  headYaw: 0,
  headPitch: 0,
  headRoll: 0,
  lean: 0,
  roll: 0,
  swayX: 0,
};

/** Elastic-out (easings.net), a mano para no traer GSAP a un `useFrame`. */
function elasticOut(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c4 = (2 * Math.PI) / 3;
  return 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

// Vectores de trabajo del bucle (sin alocar por frame).
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

let shadowGeo: THREE.CircleGeometry | null = null;
function getShadowGeo(): THREE.CircleGeometry {
  shadowGeo ??= new THREE.CircleGeometry(DOLL.shadowRadius * 1.45, 32);
  return shadowGeo;
}

/** Pieza rígida: la malla + su contorno (invisible salvo que haga falta).
 * El contorno no se raycastea: el área de click es la del cuerpo. */
function Part({
  geometry,
  material,
  outline,
  cast = false,
  position,
  meshRef,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  outline: THREE.Material | null;
  cast?: boolean;
  position?: [number, number, number];
  meshRef?: React.Ref<THREE.Mesh>;
}) {
  return (
    <>
      <mesh ref={meshRef} geometry={geometry} material={material} castShadow={cast} position={position} />
      <mesh
        geometry={geometry}
        material={outline ?? getOutlineSoft()}
        visible={outline !== null}
        position={position}
        raycast={() => null}
      />
    </>
  );
}

export function PlazaDoll({ spec, state = "idle", highlighted = false, mode, partnerRef }: PlazaDollProps) {
  const resolvedMode = mode ?? currentPlazaMode();
  const outfit = useMemo(() => outfitFor(spec), [spec]);
  const geos = useMemo(() => getDollGeos(spec, outfit), [spec, outfit]);

  const body = getBodyMaterial();
  // Cabeza: material de cara en shader (ojos, cejas y boca SDF sobre las UV de
  // la esfera, con párpado y mirada reales). Uno por muñeco: sus uniforms son suyos.
  const headMat = useMemo(
    () => createHeadMaterial(spec.face, spec.skin, { roughness: 0.58, selfLight: 0.02 }),
    [spec.face, spec.skin],
  );
  const shadowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: getGlowTexture(),
        color: PLAZA_PALETTE.shadow,
        transparent: true,
        opacity: PLAZA_PALETTES[resolvedMode].shadowOpacity,
        depthWrite: false,
      }),
    [resolvedMode],
  );
  const bubbleMat = useMemo(() => {
    const map = getBubbleAtlas().clone();
    map.repeat.set(1 / BUBBLE_FRAMES, 1);
    map.needsUpdate = true;
    return new THREE.SpriteMaterial({ map, transparent: true, opacity: 0, depthTest: true, depthWrite: false, toneMapped: false });
  }, []);
  const ring = getSelectionRing();

  useEffect(() => {
    setDollRim(resolvedMode);
  }, [resolvedMode]);
  useEffect(() => () => headMat.dispose(), [headMat]);
  useEffect(() => () => shadowMat.dispose(), [shadowMat]);
  useEffect(
    () => () => {
      bubbleMat.map?.dispose();
      bubbleMat.dispose();
    },
    [bubbleMat],
  );

  // Animación congelada con `?quieto` o `prefers-reduced-motion`: pose
  // determinista (tiempo fijo, sin idle, sin parpadeo, sin saltitos).
  const frozen = useMemo(
    () => prefersReducedMotion() || (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("quieto")),
    [],
  );

  // --- Refs de la jerarquía ---
  const rootRef = useRef<THREE.Group>(null);
  const hopRef = useRef<THREE.Group>(null);
  const swingRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const legsRef = useRef<THREE.Group>(null);
  const upperRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);
  const foreLRef = useRef<THREE.Group>(null);
  const foreRRef = useRef<THREE.Group>(null);
  const legLRef = useRef<THREE.Group>(null);
  const legRRef = useRef<THREE.Group>(null);
  const shoeLRef = useRef<THREE.Group>(null);
  const shoeRRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const bubbleRef = useRef<THREE.Sprite>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // --- Estado mutable del bucle (fuera de React) ---
  const sim = useRef({
    pose: { ...POSE_ZERO } as Pose,
    popClock: 0,
    walkPhase: 0,
    legAmp: 0,
    wHeld: 0,
    wTalk: 0,
    wFocus: 0,
    wWave: 0,
    speaking: 0,
    prevPos: new THREE.Vector3(),
    havePrev: false,
    vel: new THREE.Vector3(),
    // Péndulo del agarre y squash/stretch.
    swingX: { x: 0, v: 0 } as Spring,
    swingZ: { x: 0, v: 0 } as Spring,
    squash: { x: 1, v: 0 } as Spring,
    hop: { phase: "idle" as "idle" | "anticipate" | "air", t: 0, y: 0, v: 0, power: 1.5 },
    eyeX: 0,
    eyeY: 0,
    mouth: 0,
    smile: 0,
    wasHeld: false,
    wasHover: false,
    wasFocused: false,
    blink: { next: 1.2 + (spec.phase % 3), t: 1, double: false, amt: 0 },
  });

  /** Disparo del saltito (hover / seleccionar): anticipación y salto. */
  const triggerHop = (power: number) => {
    const s = sim.current;
    if (frozen || s.hop.phase !== "idle") return;
    s.hop.phase = "anticipate";
    s.hop.t = 0;
    s.hop.power = power;
  };

  // El grupo padre es quien se mueve por el suelo y quien rota: se le deja
  // anotado a quién representa para que el interlocutor pueda reconocerle.
  useEffect(() => {
    const parent = rootRef.current?.parent;
    if (parent) parent.userData.dollId = spec.id;
  }, [spec.id]);

  useFrame((fs, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const root = rootRef.current;
    if (!root || dt <= 0) return;
    const s = sim.current;
    const P = s.pose;
    const clock = fs.clock.elapsedTime;
    const t = frozen ? spec.phase : clock + spec.phase;
    const parent = root.parent;

    // Resolución del buffer para el ancho constante en px del contorno.
    fs.gl.getDrawingBufferSize(outlineRes.value);

    // --- Aparición escalonada con rebote ---
    s.popClock += dt;
    const popDelay = frozen ? 0 : (spec.phase / (Math.PI * 2)) * POP_STAGGER;
    const pop = frozen ? 1 : elasticOut(clamp((s.popClock - popDelay) / POP_DURATION, 0, 1));
    root.scale.setScalar(Math.max(pop, 0) * spec.scale);
    root.visible = pop > 0.001;

    // --- Estado ---
    const held = state === "held";
    const focused = state === "focused";
    const talking = state === "talking";
    const walking = state === "walking";
    const waving = state === "waving";
    const hover = highlighted && !held && !focused;

    // --- Velocidad real del grupo padre (para el paso y el péndulo) ---
    let speed = 0;
    let lvx = 0;
    let lvz = 0;
    if (parent) {
      if (!s.havePrev) {
        s.prevPos.copy(parent.position);
        s.havePrev = true;
      }
      const vx = (parent.position.x - s.prevPos.x) / dt;
      const vz = (parent.position.z - s.prevPos.z) / dt;
      s.prevPos.copy(parent.position);
      s.vel.x = damp(s.vel.x, vx, 12, dt);
      s.vel.z = damp(s.vel.z, vz, 12, dt);
      const ry = parent.rotation.y;
      lvx = s.vel.x * Math.cos(ry) - s.vel.z * Math.sin(ry);
      lvz = s.vel.x * Math.sin(ry) + s.vel.z * Math.cos(ry);
      speed = Math.hypot(s.vel.x, s.vel.z) / spec.scale;
    }

    // --- Pesos de estado (suavizados) ---
    s.wHeld = damp(s.wHeld, held ? 1 : 0, 9, dt);
    s.wTalk = damp(s.wTalk, talking ? 1 : 0, 6, dt);
    s.wFocus = damp(s.wFocus, focused ? 1 : 0, 6, dt);
    s.wWave = damp(s.wWave, waving ? 1 : 0, 7, dt);

    // --- Disparadores de un solo uso ---
    if (hover && !s.wasHover) triggerHop(1.5);
    if (focused && !s.wasFocused) triggerHop(1.7);
    if (!held && s.wasHeld && !frozen) {
      // Al soltar: lo que estaba en el aire cae con gravedad y aplasta al tocar.
      s.hop.phase = "air";
      s.hop.y = HELD_LIFT * s.wHeld;
      s.hop.v = 0;
    }
    s.wasHover = hover;
    s.wasFocused = focused;
    s.wasHeld = held;

    // --- Ciclo de paso: frecuencia derivada de la velocidad real ---
    // El pie de apoyo barre `2·L·sin(A)` en media zancada, así que
    //   f(ciclos/s) = v / (4·L·sin(A))
    // y con eso el pie no patina, vaya a la velocidad que vaya el padre.
    s.legAmp = damp(s.legAmp, walking ? LEG_AMP : 0, 8, dt);
    const ampEff = Math.max(s.legAmp, 0.18);
    const freq = Math.min(speed / (4 * DOLL_RIG.legLength * Math.sin(ampEff)), 3.4);
    if (s.legAmp > 0.02) s.walkPhase += Math.PI * 2 * freq * dt;
    const walkW = s.legAmp / LEG_AMP;
    const tri = softTriangle(s.walkPhase);
    const legWalk = s.legAmp * tri;
    const armWalk = ARM_AMP * walkW * tri;

    // --- Mirada: la cabeza se adelanta al cuerpo ---
    let lookYaw = 0;
    let lookPitch = 0;
    if (parent) {
      const partner = talking ? (partnerRef?.current ?? null) : null;
      if (partner) partner.getWorldPosition(_v);
      else _v.copy(fs.camera.position);
      parent.worldToLocal(_w.copy(_v));
      const headH = DOLL.head.y * spec.scale;
      lookYaw = clamp(Math.atan2(_w.x, _w.z), -HEAD_YAW_MAX, HEAD_YAW_MAX);
      lookPitch = clamp(Math.atan2(headH - _w.y, Math.hypot(_w.x, _w.z)), -0.35, 0.3);
    }

    // --- Turnos de palabra al charlar ---
    let speakTarget = 0;
    if (talking) {
      const pid: unknown = partnerRef?.current?.userData?.dollId;
      const first = typeof pid === "string" ? spec.id < pid : spec.phase < Math.PI;
      const turn = Math.sin((frozen ? 0 : clock) * ((Math.PI * 2) / 3.8) + (first ? 0 : Math.PI));
      speakTarget = smoothstep(-0.25, 0.25, turn);
    }
    s.speaking = damp(s.speaking, speakTarget, 8, dt);
    const sp = s.speaking * s.wTalk;
    const listen = (1 - s.speaking) * s.wTalk;

    // --- Objetivos de pose (base, suavizados) ---
    const breathe = frozen ? 0 : Math.sin(t * 1.3);
    let tArmLx = breathe * 0.03;
    let tArmRx = -breathe * 0.03;
    let tArmLz = ARM_SPLAY;
    let tArmRz = ARM_SPLAY;
    let tElbowL = -0.1;
    let tElbowR = -0.1;
    const tForeLz = 0;
    let tForeRz = 0;
    let tLegL = 0;
    let tLegR = 0;
    let tHeadRoll = frozen ? 0 : Math.sin(t * 0.7) * 0.03;
    let tHeadPitch = lookPitch;
    let headYawTarget = lookYaw;
    let tLean = 0;
    let tRoll = 0;
    let tSway = 0;

    // Idle: cambios de peso lentos.
    if (!frozen && !walking && !held) {
      tSway = Math.sin(t * 0.45) * 0.014;
      tRoll = -tSway * 1.6;
      headYawTarget += Math.sin(t * 0.5) * 0.12 + Math.sin(t * 1.3) * 0.05;
    }

    if (walking) {
      // Anda mirando al frente con un vistazo a cámara.
      headYawTarget = lookYaw * 0.35;
      tHeadPitch = lookPitch * 0.3;
      tHeadRoll *= 0.4;
      tElbowL = -(0.12 + 0.22 * Math.max(0, -tri)) * walkW - 0.1 * (1 - walkW);
      tElbowR = -(0.12 + 0.22 * Math.max(0, tri)) * walkW - 0.1 * (1 - walkW);
      tLean = LEAN;
    }

    // Saludo: el brazo se abre al LATERAL (rotación Z, no X: en X empujaba la
    // mano hacia la cámara) y la muñeca ondea.
    if (s.wWave > 0.01) {
      const w = s.wWave;
      tArmRz = THREE.MathUtils.lerp(tArmRz, 2.4 + Math.sin(t * 3) * 0.05, w);
      tArmRx = THREE.MathUtils.lerp(tArmRx, -0.15, w);
      tElbowR = THREE.MathUtils.lerp(tElbowR, 0, w);
      tForeRz = THREE.MathUtils.lerp(tForeRz, 0.4 + Math.sin(t * 8) * 0.42, w);
      tHeadRoll += 0.06 * w;
    }

    // Hablando: gestos con los brazos por turnos + asentimientos.
    if (s.wTalk > 0.01) {
      const g1 = Math.max(0, Math.sin(t * 2.1 + 0.4));
      const g2 = Math.max(0, Math.sin(t * 1.7 + 2.3));
      tArmRx = THREE.MathUtils.lerp(tArmRx, -0.55 - 0.35 * g1, sp);
      tElbowR = THREE.MathUtils.lerp(tElbowR, -(0.9 + 0.4 * g1), sp);
      tArmLx = THREE.MathUtils.lerp(tArmLx, -0.3 * g2, sp);
      tElbowL = THREE.MathUtils.lerp(tElbowL, -(0.6 + 0.5 * g2), sp);
      tArmRz = THREE.MathUtils.lerp(tArmRz, 0.28, sp);
      tHeadPitch += Math.sin(t * 6.2) * 0.07 * sp + Math.sin(t * 1.2) * 0.05 * listen;
      tHeadRoll += Math.sin(t * 1.7) * 0.05 * sp;
    }

    // Seleccionado: cara a cámara, hombros relajados y mano algo abierta.
    if (s.wFocus > 0.01) {
      const f = s.wFocus;
      headYawTarget = THREE.MathUtils.lerp(headYawTarget, lookYaw, f);
      tHeadPitch = THREE.MathUtils.lerp(tHeadPitch, lookPitch - 0.04, f);
      tHeadRoll *= 1 - 0.8 * f;
      tArmRx = THREE.MathUtils.lerp(tArmRx, -0.12, f);
      tArmRz = THREE.MathUtils.lerp(tArmRz, 0.2, f);
      tElbowR = THREE.MathUtils.lerp(tElbowR, -0.25, f);
    }

    // Agarrado: brazos en alto agitándose, piernas colgando.
    if (s.wHeld > 0.01) {
      const h = s.wHeld;
      const flap = clock * HELD_FLAP + spec.phase;
      tArmLx = THREE.MathUtils.lerp(tArmLx, HELD_ARM_BASE + Math.sin(flap) * HELD_ARM_SWING, h);
      tArmRx = THREE.MathUtils.lerp(tArmRx, HELD_ARM_BASE + Math.sin(flap + 2.4) * HELD_ARM_SWING, h);
      const splay = ARM_SPLAY + 0.45 + Math.sin(flap * 0.5) * 0.2;
      tArmLz = THREE.MathUtils.lerp(tArmLz, splay, h);
      tArmRz = THREE.MathUtils.lerp(tArmRz, splay, h);
      tElbowL = THREE.MathUtils.lerp(tElbowL, -0.3, h);
      tElbowR = THREE.MathUtils.lerp(tElbowR, -0.3, h);
      tLegL = THREE.MathUtils.lerp(tLegL, Math.sin(flap * 0.7) * 0.4, h);
      tLegR = THREE.MathUtils.lerp(tLegR, -Math.sin(flap * 0.7) * 0.4, h);
      headYawTarget *= 1 - h;
      tHeadPitch *= 1 - h;
      tHeadRoll += Math.sin(flap * 0.5) * 0.1 * h;
    }

    // Suavizado de TODAS las articulaciones hacia su objetivo.
    P.armLx = damp(P.armLx, tArmLx, 13, dt);
    P.armRx = damp(P.armRx, tArmRx, 13, dt);
    P.armLz = damp(P.armLz, tArmLz, 12, dt);
    P.armRz = damp(P.armRz, tArmRz, 12, dt);
    P.elbowL = damp(P.elbowL, tElbowL, 14, dt);
    P.elbowR = damp(P.elbowR, tElbowR, 14, dt);
    P.foreLz = damp(P.foreLz, tForeLz, 14, dt);
    P.foreRz = damp(P.foreRz, tForeRz, 14, dt);
    P.legL = damp(P.legL, tLegL, 14, dt);
    P.legR = damp(P.legR, tLegR, 14, dt);
    P.headYaw = damp(P.headYaw, headYawTarget, 7, dt);
    P.headPitch = damp(P.headPitch, tHeadPitch, 8, dt);
    P.headRoll = damp(P.headRoll, tHeadRoll, 9, dt);
    P.lean = damp(P.lean, tLean, 7, dt);
    P.roll = damp(P.roll, tRoll, 4, dt);
    P.swayX = damp(P.swayX, tSway, 4, dt);

    // --- Saltito / caída: física del salto + squash & stretch con muelle ---
    const hop = s.hop;
    let sqTarget = 1;
    if (hop.phase === "anticipate") {
      hop.t += dt;
      sqTarget = 0.86;
      if (hop.t > 0.09) {
        hop.phase = "air";
        hop.v = hop.power;
        hop.y = 0.0001;
      }
    } else if (hop.phase === "air") {
      hop.v -= GRAVITY * dt;
      hop.y += hop.v * dt;
      sqTarget = 1 + Math.min(0.06, Math.abs(hop.v) * 0.04);
      if (hop.y <= 0 && hop.v < 0) {
        hop.y = 0;
        hop.v = 0;
        hop.phase = "idle";
        // Aterrizaje: aplasta y el muelle devuelve con rebote.
        s.squash.x = 0.82;
        s.squash.v = 0;
      }
    }
    stepSpring(s.squash, sqTarget, 220, 15, dt);
    const sqY = s.squash.x;
    const sqXZ = 1 / Math.sqrt(Math.max(sqY, 0.5));

    // --- Péndulo del agarre: el cuerpo cuelga y se retrasa respecto a la mano ---
    stepSpring(s.swingX, held ? clamp(lvz * 0.35, -0.5, 0.5) : 0, 70, 5.5, dt);
    stepSpring(s.swingZ, held ? clamp(-lvx * 0.35, -0.5, 0.5) : 0, 70, 5.5, dt);

    // --- Aplicar ---
    const liftHeld = HELD_LIFT * s.wHeld;
    const air = hop.y + liftHeld;

    // Altura de cadera: el ciclo de paso baja la cadera lo que el pie de apoyo
    // se aleja de la vertical (máximo en el contacto, mínimo con la pierna recta).
    const hipDrop = DOLL_RIG.legLength * (Math.cos(legWalk) - 1);
    if (hopRef.current) {
      hopRef.current.position.set(P.swayX, air + hipDrop, 0);
    }
    if (swingRef.current) {
      swingRef.current.rotation.set(s.swingX.x, 0, s.swingZ.x);
    }
    if (bodyRef.current) {
      bodyRef.current.scale.set(sqXZ, sqY, sqXZ);
    }

    // Contragiro: caderas y hombros giran en sentido opuesto al andar.
    const pelvisYaw = 0.1 * walkW * tri;
    const chestYaw = -pelvisYaw * 0.85;
    if (legsRef.current) legsRef.current.rotation.y = pelvisYaw;
    if (upperRef.current) {
      upperRef.current.rotation.set(P.lean + (frozen ? 0 : Math.sin(t * 1.1) * 0.006), chestYaw, P.roll + 0.03 * walkW * tri);
    }
    if (torsoRef.current) torsoRef.current.scale.y = 1 + (frozen || walking ? 0 : Math.sin(t * 1.1) * 0.014);

    if (headRef.current) {
      // La cabeza compensa el giro del pecho: mira donde debe, no donde mira el tronco.
      headRef.current.rotation.set(P.headPitch, clamp(P.headYaw - chestYaw, -HEAD_YAW_MAX, HEAD_YAW_MAX), P.headRoll);
    }

    // Brazos: balanceo en oposición a la pierna del mismo lado.
    if (armLRef.current) armLRef.current.rotation.set(P.armLx + armWalk, 0, -P.armLz);
    if (armRRef.current) armRRef.current.rotation.set(P.armRx - armWalk, 0, P.armRz);
    if (foreLRef.current) foreLRef.current.rotation.set(P.elbowL, 0, -P.foreLz);
    if (foreRRef.current) foreRRef.current.rotation.set(P.elbowR, 0, P.foreRz);

    // Piernas: la que avanza se levanta; la de apoyo queda a ras.
    const legAngL = P.legL - legWalk;
    const legAngR = P.legR + legWalk;
    const swingL = Math.max(0, Math.cos(s.walkPhase)) * walkW;
    const swingR = Math.max(0, -Math.cos(s.walkPhase)) * walkW;
    if (legLRef.current) {
      legLRef.current.rotation.x = legAngL;
      legLRef.current.position.y = DOLL_RIG.hipY + FOOT_LIFT * swingL;
    }
    if (legRRef.current) {
      legRRef.current.rotation.x = legAngR;
      legRRef.current.position.y = DOLL_RIG.hipY + FOOT_LIFT * swingR;
    }
    // El zapato se mantiene casi plano contra el suelo.
    if (shoeLRef.current) shoeLRef.current.rotation.x = -legAngL * 0.85;
    if (shoeRRef.current) shoeRRef.current.rotation.x = -legAngR * 0.85;

    // --- Cara: parpadeo (doble ocasional), mirada y boca ---
    // Congelado (`?quieto` / reduced-motion): no se toca el rig → ojos abiertos,
    // mirada al frente, boca en reposo. Determinista.
    if (!frozen) {
      const b = s.blink;
      b.t += dt;
      if (b.t >= b.next) {
        b.t = 0;
        b.next = 2.4 + ((spec.phase * 7 + clock * 1.7) % 3.6);
        // Una de cada seis veces, doble parpadeo.
        b.double = Math.sin(spec.phase * 13 + clock) > 0.66;
      }
      b.amt = Math.max(blinkCurve(b.t), b.double ? blinkCurve(b.t - 0.27) : 0);

      // Los ojos hacen el resto del giro que la cabeza (limitada a ±60°) no alcanza.
      const eyeX = clamp((lookYaw - P.headYaw) / 0.6, -1, 1);
      const eyeY = clamp(-(lookPitch - P.headPitch) / 0.4, -1, 1);
      s.eyeX = damp(s.eyeX, held ? 0 : eyeX, 16, dt);
      s.eyeY = damp(s.eyeY, held ? 0 : eyeY, 16, dt);
      // Boca: habla (turno) o grita (agarrado); sonríe al saludar / ser elegido.
      const chat = 0.55 * Math.abs(Math.sin(t * 9.5)) + 0.45 * Math.abs(Math.sin(t * 5.3 + 1));
      const talkT = Math.max(sp > 0.4 ? chat * sp : 0, s.wHeld * (0.55 + 0.4 * Math.abs(Math.sin(clock * 8))));
      s.mouth = damp(s.mouth, talkT, 18, dt);
      const smileT = clamp(0.85 * s.wWave + 0.65 * s.wFocus + (hover ? 0.4 : 0) + 0.25 * s.wTalk, 0, 1);
      s.smile = damp(s.smile, smileT, 6, dt);
      setFaceRig(headMat, { blink: b.amt, lookX: s.eyeX, lookY: s.eyeY, talk: s.mouth, smile: s.smile });
    }

    // --- Sombra de contacto y anillo de selección ---
    if (shadowRef.current) {
      shadowRef.current.scale.setScalar((1 / (1 + air * 0.5)) * (0.5 + 0.5 * sqXZ));
      shadowMat.opacity = PLAZA_PALETTES[resolvedMode].shadowOpacity / (1 + air * 0.9);
    }
    if (ringRef.current) {
      ringRef.current.visible = s.wFocus > 0.02;
      const pulse = 1 + (frozen ? 0 : Math.sin(clock * 3) * 0.03);
      ringRef.current.scale.setScalar(pulse * (0.7 + 0.3 * s.wFocus));
      // Pulso muy sutil de opacidad (un solo anillo visible a la vez: el material es compartido).
      if (s.wFocus > 0.02) ring.material.opacity = (0.5 + (frozen ? 0 : Math.sin(clock * 3) * 0.1)) * s.wFocus;
    }

    // --- Bocadillo: lo enseña el que habla ---
    if (bubbleRef.current) {
      const show = sp;
      bubbleRef.current.visible = show > 0.02;
      bubbleRef.current.position.y = BUBBLE_BASE_Y + (frozen ? 0 : Math.sin(t * 3) * 0.015) * show;
      bubbleRef.current.scale.setScalar(BUBBLE_SCALE * (0.6 + 0.4 * show));
      bubbleMat.opacity = show;
      const frame = Math.floor(clock * 3) % BUBBLE_FRAMES;
      if (bubbleMat.map) bubbleMat.map.offset.x = frame / BUBBLE_FRAMES;
    }
  });

  // --- Contorno: hover = fino y translúcido; seleccionado/agarrado = sólido ---
  const outline: THREE.Material | null =
    state === "held" || state === "focused" ? getOutlineStrong() : highlighted ? getOutlineSoft() : null;

  const head = DOLL.head;
  const R = DOLL_RIG;

  return (
    <group ref={rootRef} scale={0}>
      <group ref={hopRef}>
        <group ref={swingRef} position={[0, HELD_PIVOT_Y, 0]}>
          <group ref={bodyRef} position={[0, -HELD_PIVOT_Y, 0]}>
            {/* --- Piernas (pelvis) --- */}
            <group ref={legsRef}>
              {([-1, 1] as const).map((side) => (
                <group
                  key={`leg${side}`}
                  ref={side < 0 ? legLRef : legRRef}
                  position={[side * R.hipX, R.hipY, 0]}
                >
                  <Part geometry={geos.leg} material={body} outline={outline} cast />
                  <group ref={side < 0 ? shoeLRef : shoeRRef} position={[0, -R.ankle, 0]}>
                    <Part geometry={geos.shoe} material={body} outline={outline} />
                  </group>
                </group>
              ))}
            </group>

            {/* --- Tronco: pivota en la cintura (inclinación y contragiro) --- */}
            <group ref={upperRef} position={[0, R.waistY, 0]}>
              <group ref={torsoRef}>
                <Part geometry={geos.torso} material={body} outline={outline} cast />
              </group>

              {/* Cabeza: esfera deformada con la cara en sus UV + pelo/nariz/orejas */}
              <group ref={headRef} position={[0, head.y - R.waistY, 0]}>
                <Part geometry={geos.head} material={headMat} outline={outline} cast />
                <Part geometry={geos.headgear} material={body} outline={outline} cast />
              </group>

              {/* Brazos: hombro + codo */}
              {([-1, 1] as const).map((side) => (
                <group
                  key={`arm${side}`}
                  ref={side < 0 ? armLRef : armRRef}
                  position={[side * R.shoulderX, R.shoulderY - R.waistY, 0]}
                >
                  <Part geometry={geos.upperArm} material={body} outline={outline} cast />
                  <group ref={side < 0 ? foreLRef : foreRRef} position={[0, -R.upperArm, 0]}>
                    <Part geometry={side < 0 ? geos.foreArmL : geos.foreArmR} material={body} outline={outline} />
                  </group>
                </group>
              ))}
            </group>
          </group>
        </group>
      </group>

      {/* --- Sombra de contacto: se queda en el suelo --- */}
      <mesh ref={shadowRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={getShadowGeo()} material={shadowMat} />
      {/* --- Anillo de selección en el suelo --- */}
      <mesh
        ref={ringRef}
        position={[0, 0.014, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={ring.geometry}
        material={ring.material}
        visible={false}
        raycast={() => null}
      />
      {/* --- Bocadillo de "hablando": sprite anclado por la punta de la cola --- */}
      <sprite
        ref={bubbleRef}
        center={[0.5, 0]}
        position={[0, BUBBLE_BASE_Y, 0]}
        material={bubbleMat}
        visible={false}
        renderOrder={10}
        raycast={() => null}
      />
    </group>
  );
}
