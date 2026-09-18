"use client";

import { useEffect, useMemo, useRef, type Ref, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import type { PortPalette } from "./time-of-day";
import { getToonGradient, OUTLINE_THIN } from "./toon";
import {
  PERCHES, isDisturbed, pickPerch, takeoffEase, type Disturbance,
} from "./gull-behaviour";
import {
  FADE_END, RESPAWN_MIN, fadeAt, fallOffset, type GullTarget,
} from "./gull-hunt-logic";

/**
 * Gaviotas patiamarillas del puerto de Vigo.
 *
 * El ala va en DOS tramos con bisagra (brazo + mano), como en las de verdad:
 * la mano va retrasada respecto al brazo, así el aleteo dibuja la "M" en vez
 * de subir y bajar como una tabla. El vuelo es una lemniscata con alabeo hacia
 * el interior de la curva, cabeceo según sube o baja y planeos entre aleteos.
 *
 * Cada ave tiene su máquina de estados: posada → despegue → vuelo → aterrizaje
 * en otro posadero. Se espanta si el carro, el spreader o el cursor se le
 * acercan (ver `gull-behaviour.ts`), como en el puerto de verdad.
 *
 * Easter egg: cada gaviota se registra en `targets` (`GullTarget`) con su
 * posición; si una bala la alcanza (`GullHunt.tsx`) entra en `shot` — se
 * desploma dando vueltas, se desvanece y al rato vuelve entrando por fuera
 * del encuadre. Un disparo (`disturbance.pulse`) espanta a las posadas.
 *
 * Todo por transformaciones de grupo en un `useFrame`: ni clips ni huesos.
 */

interface Flight {
  cx: number; cy: number; cz: number;
  rx: number; rz: number;
  speed: number; phase: number; scale: number;
}

const FLIGHTS: Flight[] = [
  { cx: -6, cy: 6.5, cz: -12, rx: 14, rz: 6, speed: 0.22, phase: 0, scale: 1.15 },
  { cx: 10, cy: 8, cz: -20, rx: 18, rz: 8, speed: 0.17, phase: 2.1, scale: 1.2 },
  { cx: -22, cy: 7, cz: -30, rx: 16, rz: 9, speed: 0.19, phase: 4.2, scale: 1.3 },
  { cx: 30, cy: 14, cz: -45, rx: 20, rz: 10, speed: 0.14, phase: 1.3, scale: 1.45 },
  { cx: -40, cy: 16, cz: -60, rx: 22, rz: 10, speed: 0.12, phase: 3.3, scale: 1.6 },
];

const WHITE = "#f7f5ee";
const GREY = "#aab3c2";

/**
 * Perfil del ala vista desde arriba, dibujado con la ENVERGADURA en +y y la
 * cuerda en x (borde de ataque a +x, salida curva a -x). Así el ala se tumba
 * al horizontal con un solo giro en x, que es además el eje del aleteo: no hay
 * dos ejes peleándose y la mano nunca se separa del brazo.
 */
function wingShape(span: number, chord: number, taper: number) {
  const s = new THREE.Shape();
  s.moveTo(chord * 0.5, 0);
  s.lineTo(chord * taper * 0.5, span);
  s.lineTo(-chord * taper * 0.5, span);
  s.quadraticCurveTo(-chord * 0.9, span * 0.45, -chord * 0.5, 0);
  s.closePath();
  return s;
}

const ARM_SPAN = 0.6;
const HAND_SPAN = 0.68;

function useWingGeometries() {
  return useMemo(() => {
    const extrude = (shape: THREE.Shape) =>
      new THREE.ExtrudeGeometry(shape, { depth: 0.045, bevelEnabled: false });
    return {
      arm: extrude(wingShape(ARM_SPAN, 0.34, 0.9)),
      hand: extrude(wingShape(HAND_SPAN, 0.3, 0.5)),
    };
  }, []);
}

interface WingProps {
  side: 1 | -1;
  palette: PortPalette;
  /** Hombro: lo gira `FlyingGull` para batir. */
  innerRef?: Ref<THREE.Group>;
  /** Codo: la mano, retrasada respecto al brazo. */
  outerRef?: Ref<THREE.Group>;
  flat: boolean;
}

function Wing({ side, palette, innerRef, outerRef, flat }: WingProps) {
  const geo = useWingGeometries();
  const gradient = getToonGradient();
  const o = palette.outline;
  const feather = (color: string) =>
    flat
      ? <meshBasicMaterial color={color} toneMapped={false} />
      : <meshToonMaterial color={color} gradientMap={gradient} />;

  return (
    <group
      ref={innerRef}
      position={[0.04, 0.09, side * 0.1]}
      rotation={[side * (Math.PI / 2), 0, 0]}
    >
      <mesh geometry={geo.arm} position={[0, 0, -0.022]}>
        {feather(GREY)}
        <Outlines thickness={OUTLINE_THIN} color={o} />
      </mesh>
      <group ref={outerRef} position={[0, ARM_SPAN - 0.02, 0]}>
        <mesh geometry={geo.hand} position={[0, 0, -0.022]}>
          {feather(GREY)}
          <Outlines thickness={OUTLINE_THIN} color={o} />
        </mesh>
        {/* Primarias negras con la mota blanca de la patiamarilla */}
        <mesh position={[-0.02, HAND_SPAN - 0.06, 0]}>
          <boxGeometry args={[0.16, 0.18, 0.05]} />
          <meshBasicMaterial color={o} toneMapped={false} />
        </mesh>
        <mesh position={[-0.02, HAND_SPAN - 0.02, 0.03]}>
          <boxGeometry args={[0.05, 0.05, 0.02]} />
          <meshBasicMaterial color={WHITE} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

interface BodyProps {
  palette: PortPalette;
  flat: boolean;
  wings: {
    innerL: Ref<THREE.Group>; outerL: Ref<THREE.Group>;
    innerR: Ref<THREE.Group>; outerR: Ref<THREE.Group>;
    /** Grupo de alas extendidas (vuelo). */
    open: Ref<THREE.Group>;
    /** Grupo de alas plegadas (posada). */
    folded: Ref<THREE.Group>;
  };
}

function GullBody({ palette, flat, wings }: BodyProps) {
  const gradient = getToonGradient();
  const o = palette.outline;
  const body = (color: string) =>
    flat
      ? <meshBasicMaterial color={color} toneMapped={false} />
      : <meshToonMaterial color={color} gradientMap={gradient} />;

  return (
    <group>
      {/* Cuerpo */}
      <mesh rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.85]}>
        <capsuleGeometry args={[0.17, 0.5, 4, 12]} />
        {body(WHITE)}
        <Outlines thickness={OUTLINE_THIN} color={o} />
      </mesh>
      {/* Manto gris sobre el lomo */}
      <mesh position={[-0.05, 0.11, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.7]}>
        <capsuleGeometry args={[0.12, 0.34, 4, 10]} />
        {body(GREY)}
      </mesh>
      {/* Cabeza, ojo y pico con la mota roja */}
      <mesh position={[0.37, 0.12, 0]}>
        <sphereGeometry args={[0.15, 12, 10]} />
        {body(WHITE)}
        <Outlines thickness={OUTLINE_THIN} color={o} />
      </mesh>
      {[-1, 1].map((z) => (
        <mesh key={z} position={[0.44, 0.16, z * 0.09]}>
          <sphereGeometry args={[0.035, 8, 6]} />
          <meshBasicMaterial color={o} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0.57, 0.1, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.055, 0.26, 8]} />
        <meshBasicMaterial color="#ffc93a" toneMapped={false} />
      </mesh>
      <mesh position={[0.64, 0.07, 0]}>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshBasicMaterial color="#e2483a" toneMapped={false} />
      </mesh>
      {/* Cola con la punta oscura */}
      <mesh position={[-0.42, 0.06, 0]} rotation={[0, 0, Math.PI / 2 + 0.2]} scale={[1, 1, 0.35]}>
        <coneGeometry args={[0.17, 0.32, 6]} />
        {body(WHITE)}
        <Outlines thickness={OUTLINE_THIN} color={o} />
      </mesh>

      {/* Alas plegadas (posada) y extendidas (vuelo): se alterna la visibilidad. */}
      <group ref={wings.folded}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[-0.08, 0.06, side * 0.13]} rotation={[0, 0, 0.08]} scale={[1, 0.5, 0.45]}>
            <capsuleGeometry args={[0.1, 0.42, 4, 8]} />
            {body(GREY)}
            <Outlines thickness={OUTLINE_THIN} color={o} />
          </mesh>
        ))}
      </group>
      <group ref={wings.open}>
        <Wing side={1} palette={palette} flat={flat} innerRef={wings.innerL} outerRef={wings.outerL} />
        <Wing side={-1} palette={palette} flat={flat} innerRef={wings.innerR} outerRef={wings.outerR} />
      </group>
    </group>
  );
}

type Mode = "perched" | "takeoff" | "cruise" | "approach" | "shot" | "gone";

const TAKEOFF_TIME = 0.9;
const APPROACH_TIME = 2.2;
/** Tras este rato en el aire busca dónde posarse. */
const CRUISE_MIN = 9;
/** Aunque nadie la moleste, de vez en cuando levanta el vuelo sola. */
const RESTLESS_MIN = 22;
const RESTLESS_EXTRA = 26;

interface GullState {
  mode: Mode;
  /** Tiempo dentro del modo actual. */
  t: number;
  perch: number;
  /** Posadero reservado durante la aproximación. */
  target: number;
  from: THREE.Vector3;
  cruiseFor: number;
  restlessAt: number;
  /** 0 = recién despegada, 1 = ya en su órbita. */
  blend: number;
  /** Último disparo visto: al cambiar, la posada levanta el vuelo. */
  seenPulse: number;
  /** Segundos fuera de escena antes de reaparecer tras ser abatida. */
  respawnAt: number;
}

/** Materiales del ave (cuerpo, alas y contornos) para el fundido al ser abatida. */
function collectMaterials(root: THREE.Object3D): THREE.Material[] {
  const out: THREE.Material[] = [];
  root.traverse((o) => {
    const m = (o as THREE.Mesh).material;
    if (m && !Array.isArray(m)) out.push(m);
  });
  return out;
}

function setOpacity(materials: THREE.Material[], opacity: number) {
  for (const m of materials) {
    m.transparent = opacity < 1;
    m.opacity = opacity;
  }
}

const _from = new THREE.Vector3();
const _to = new THREE.Vector3();

function Gull({
  flight, palette, flat, startPerch, taken, disturbance, seed, targets,
}: {
  flight: Flight;
  palette: PortPalette;
  flat: boolean;
  /** -1 = nace volando y no se posa. */
  startPerch: number;
  taken: Set<number>;
  disturbance: RefObject<Disturbance>;
  seed: number;
  targets?: Map<number, GullTarget>;
}) {
  const root = useRef<THREE.Group>(null);
  const innerL = useRef<THREE.Group>(null);
  const innerR = useRef<THREE.Group>(null);
  const outerL = useRef<THREE.Group>(null);
  const outerR = useRef<THREE.Group>(null);
  const open = useRef<THREE.Group>(null);
  const folded = useRef<THREE.Group>(null);
  const legs = useRef<THREE.Group>(null);

  const st = useRef<GullState>({
    mode: startPerch >= 0 ? "perched" : "cruise",
    t: 0,
    perch: startPerch,
    target: -1,
    from: new THREE.Vector3(),
    cruiseFor: CRUISE_MIN + (seed % 7),
    restlessAt: RESTLESS_MIN + (seed % 13),
    blend: startPerch >= 0 ? 0 : 1,
    seenPulse: 0,
    respawnAt: RESPAWN_MIN + (seed % 5),
  });
  const materials = useRef<THREE.Material[] | null>(null);

  // Reserva el posadero inicial una sola vez.
  if (startPerch >= 0 && !taken.has(startPerch)) taken.add(startPerch);

  // Registro como blanco del easter egg: la bala llama a `shoot`.
  useEffect(() => {
    if (!targets) return;
    const target: GullTarget = {
      id: seed,
      x: 0, y: 999, z: 0,
      radius: 0.75 * flight.scale,
      alive: true,
      shoot: () => {
        const c = st.current;
        if (c.mode === "shot" || c.mode === "gone") return;
        if (c.mode === "perched") taken.delete(c.perch);
        if (c.mode === "approach") taken.delete(c.target);
        c.target = -1;
        c.mode = "shot";
        c.t = 0;
        target.alive = false;
        if (root.current) {
          c.from.copy(root.current.position);
          materials.current ??= collectMaterials(root.current);
        }
      },
    };
    targets.set(seed, target);
    return () => { targets.delete(seed); };
  }, [targets, seed, flight.scale, taken]);

  useFrame((state, delta) => {
    const g = root.current;
    if (!g) return;
    const dt = Math.min(delta, 1 / 20);
    const clock = state.clock.elapsedTime;
    const c = st.current;
    const d = disturbance.current;
    c.t += dt;

    // --- Vuelo en lemniscata: posición y tangente
    const t = clock * flight.speed + flight.phase;
    const fx = flight.cx + Math.cos(t) * flight.rx;
    const fz = flight.cz + Math.sin(2 * t) * 0.5 * flight.rz;
    const fy = flight.cy + Math.sin(t * 3) * 0.6;

    let armAmp = 0.62;
    let flapRate = 7.5;
    let gliding = Math.sin(clock * 0.45 + flight.phase * 2) > 0.1;

    if (c.mode === "perched") {
      const perch = PERCHES[c.perch];
      g.position.set(perch.pos[0], perch.pos[1], perch.pos[2]);
      const base = perch.facing === 1 ? 0 : Math.PI;
      // Mira a un lado y a otro, a golpes, como hacen.
      g.rotation.set(0, base + (Math.sin(clock * 0.7 + seed) > 0 ? 0.45 : -0.4), 0);
      const startled = d && d.pulse !== c.seenPulse;
      if ((d && isDisturbed(perch, d)) || startled || c.t > c.restlessAt) {
        taken.delete(c.perch);
        c.from.copy(g.position);
        c.mode = "takeoff";
        c.t = 0;
      }
    } else if (c.mode === "takeoff") {
      const k = takeoffEase(c.t / TAKEOFF_TIME);
      const away = PERCHES[c.perch]?.facing ?? 1;
      g.position.set(
        c.from.x + away * 2.6 * k,
        c.from.y + 2.4 * k,
        c.from.z + 1.2 * k,
      );
      g.rotation.set(-0.25 * (1 - k), away === 1 ? 0 : Math.PI, 0.1 * Math.sin(clock * 12));
      armAmp = 0.95;
      flapRate = 11;
      gliding = false;
      if (c.t >= TAKEOFF_TIME) {
        c.mode = "cruise";
        c.t = 0;
        c.blend = 0;
        c.cruiseFor = CRUISE_MIN + (seed % 7);
        c.from.copy(g.position);
      }
    } else if (c.mode === "cruise") {
      // Entra en su órbita suavemente desde donde acabó el despegue.
      c.blend = Math.min(1, c.blend + dt / 1.6);
      const b = c.blend * c.blend * (3 - 2 * c.blend);
      g.position.set(
        THREE.MathUtils.lerp(c.from.x, fx, b),
        THREE.MathUtils.lerp(c.from.y, fy, b),
        THREE.MathUtils.lerp(c.from.z, fz, b),
      );
      const dx = -Math.sin(t) * flight.rx;
      const dz = Math.cos(2 * t) * flight.rz;
      g.rotation.y = Math.atan2(-dz, dx);
      const turn = Math.cos(t) * 0.5 + Math.sin(2 * t) * 0.25;
      g.rotation.z = THREE.MathUtils.clamp(turn, -0.6, 0.6);
      g.rotation.x = -Math.cos(t * 3) * 0.12;
      if (startPerch >= 0 && c.t > c.cruiseFor && d) {
        const spot = pickPerch(taken, d, g.position.x);
        if (spot >= 0) {
          taken.add(spot);
          c.target = spot;
          c.from.copy(g.position);
          c.mode = "approach";
          c.t = 0;
        } else {
          c.cruiseFor += 4;
        }
      }
    } else if (c.mode === "shot") {
      // Abatida: un respingo, cae dando vueltas y se desvanece en el aire.
      g.position.set(
        c.from.x + (seed % 2 ? 1 : -1) * 0.6 * c.t,
        c.from.y + fallOffset(c.t),
        c.from.z,
      );
      g.rotation.x += 4.5 * dt;
      g.rotation.z += 6 * dt;
      if (materials.current) setOpacity(materials.current, fadeAt(c.t));
      if (c.t >= FADE_END) {
        c.mode = "gone";
        c.t = 0;
        g.visible = false;
        if (materials.current) setOpacity(materials.current, 1);
      }
    } else if (c.mode === "gone") {
      // Fuera de escena. Vuelve entrando por el lateral hacia su órbita.
      if (c.t >= c.respawnAt) {
        const side = Math.cos(t) >= 0 ? 1 : -1;
        c.from.set(flight.cx + side * (flight.rx + 40), flight.cy + 5, flight.cz);
        g.rotation.set(0, 0, 0);
        g.visible = true;
        c.mode = "cruise";
        c.t = 0;
        c.blend = 0;
        c.cruiseFor = CRUISE_MIN + (seed % 7);
        const target = targets?.get(seed);
        if (target) target.alive = true;
      }
    } else {
      // Aproximación: arco descendente hasta el posadero, frenando con las alas.
      const perch = PERCHES[c.target];
      const k = Math.min(1, c.t / APPROACH_TIME);
      const e = k * k * (3 - 2 * k);
      _from.copy(c.from);
      _to.set(perch.pos[0], perch.pos[1], perch.pos[2]);
      g.position.lerpVectors(_from, _to, e);
      g.position.y += Math.sin(Math.PI * e) * 1.4;
      const dirX = _to.x - _from.x;
      g.rotation.set(0.12 * (1 - e), dirX >= 0 ? 0 : Math.PI, 0);
      armAmp = 0.35 + 0.35 * (1 - e);
      flapRate = 5.5;
      gliding = false;
      if (k >= 1) {
        c.perch = c.target;
        c.target = -1;
        c.mode = "perched";
        c.t = 0;
        c.restlessAt = RESTLESS_MIN + ((seed * 7) % RESTLESS_EXTRA);
      }
    }

    if (d) c.seenPulse = d.pulse;
    const target = targets?.get(seed);
    if (target) {
      target.x = g.position.x;
      target.y = g.position.y;
      target.z = g.position.z;
    }

    // Abatida: alas plegadas y patas fuera, panza arriba de cómic.
    const perched = c.mode === "perched" || c.mode === "shot";
    if (open.current) open.current.visible = !perched;
    if (folded.current) folded.current.visible = perched;
    if (legs.current) legs.current.visible = perched;

    if (!perched) {
      const beat = Math.sin(clock * flapRate + flight.phase);
      const arm = gliding ? 0.08 : beat * armAmp;
      // La mano va retrasada: es lo que dibuja la "M" del aleteo.
      const hand = gliding ? -0.12 : Math.sin(clock * flapRate + flight.phase - 0.8) * (armAmp + 0.13);
      // rotation.x = ±(π/2 − batido): el ala sube al reducir el ángulo.
      if (innerL.current) innerL.current.rotation.x = Math.PI / 2 - arm;
      if (innerR.current) innerR.current.rotation.x = -(Math.PI / 2 - arm);
      if (outerL.current) outerL.current.rotation.x = -hand;
      if (outerR.current) outerR.current.rotation.x = hand;
    }
  });

  return (
    <group ref={root} scale={flight.scale}>
      <GullBody
        palette={palette}
        flat={flat}
        wings={{ innerL, outerL, innerR, outerR, open, folded }}
      />
      <group ref={legs}>
        {[-0.08, 0.08].map((z) => (
          <mesh key={z} position={[0.08, -0.26, z]}>
            <boxGeometry args={[0.05, 0.22, 0.05]} />
            <meshBasicMaterial color="#e9a13a" toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

const FAR_AWAY: Disturbance = { trolleyX: 999, hookX: 999, hookY: 999, pointerX: 999, pointerY: 999, pulse: 0 };

export function Seagulls({
  palette,
  flat = false,
  disturbance,
  targets,
}: {
  palette: PortPalette;
  flat?: boolean;
  /** Qué hay cerca (carro, spreader, cursor). Sin esto nunca se asustan. */
  disturbance?: RefObject<Disturbance>;
  /** Registro de blancos del easter egg (`GullHunt`). Sin esto no se pueden abatir. */
  targets?: Map<number, GullTarget>;
}) {
  const fallback = useRef<Disturbance>(FAR_AWAY);
  const taken = useRef(new Set<number>()).current;
  // De noche vuelan menos — solo las dos más cercanas.
  const flights = palette.lamps > 0.9 ? FLIGHTS.slice(0, 2) : FLIGHTS;

  return (
    <group>
      {flights.map((f, i) => (
        <Gull
          key={i}
          seed={i * 5 + 3}
          flight={f}
          palette={palette}
          flat={flat}
          // Las dos primeras nacen posadas; el resto, volando.
          startPerch={i < 3 ? i : -1}
          taken={taken}
          disturbance={disturbance ?? fallback}
          targets={targets}
        />
      ))}
    </group>
  );
}
