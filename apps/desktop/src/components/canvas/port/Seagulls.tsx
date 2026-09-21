"use client";

import { useEffect, useRef, type Ref, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import type { PortPalette } from "./time-of-day";
import { getToonGradient, OUTLINE_THIN } from "./toon";
import {
  PERCHES, isDisturbed, pickPerch, resolvePerch, takeoffEase, type Disturbance, type PerchPoint,
} from "./gull-behaviour";
import {
  FADE_END, RESPAWN_MIN, fadeAt, fallOffset, type GullTarget,
} from "./gull-hunt-logic";
import { rushRespawn, rushStagger, type GullRush } from "./gull-rush";
import {
  ALERT_RED, DIVE_DEPTH, DIVE_PICK, DIVE_SCALE, DIVE_TIME, alertStagger, claimDive, type GullAlert,
} from "./lighthouse-alert";
import { playCrashSfx } from "@/lib/hero-sfx";

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
 * Ronda de caza (`gull-rush.ts`): mientras dura la cuenta atrás de 30 s entran
 * las gaviotas EXTRA (`EXTRA_FLIGHTS`, escalonadas) y las abatidas vuelven casi
 * al instante. Al acabar, las extra se desvanecen en el aire (`leave`).
 *
 * Alerta del faro (`lighthouse-alert.ts`): además de las extra entra el
 * enjambre `ALERT_FLIGHTS`, TODAS sacan los ojos rojos y, por turnos
 * (`claimDive`), una se lanza contra la cámara hasta estrellarse en el cristal
 * (modo `dive` → `onScreenHit`, que agrieta la pantalla desde el DOM).
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

/**
 * Gaviotas EXTRA de la ronda de caza. No existen fuera de ella: nacen "gone" y
 * entran por los laterales cuando arranca la cuenta atrás. Más cerca y más
 * bajas que las de siempre para que haya blancos de sobra en el encuadre.
 */
const EXTRA_FLIGHTS: Flight[] = [
  { cx: 4, cy: 5, cz: -9, rx: 12, rz: 5, speed: 0.26, phase: 0.7, scale: 1.1 },
  { cx: -12, cy: 9, cz: -16, rx: 15, rz: 7, speed: 0.21, phase: 2.9, scale: 1.2 },
  { cx: 18, cy: 6, cz: -24, rx: 16, rz: 8, speed: 0.24, phase: 5.0, scale: 1.3 },
  { cx: -28, cy: 11, cz: -34, rx: 18, rz: 9, speed: 0.18, phase: 1.8, scale: 1.4 },
  { cx: 24, cy: 10, cz: -38, rx: 19, rz: 9, speed: 0.16, phase: 0.2, scale: 1.5 },
];

/**
 * Enjambre de la ALERTA DEL FARO. Aún más cerca y más bajas que las de la
 * ronda: durante la alerta hay que verles los ojos rojos, y son las que mejor
 * se lanzan contra la pantalla porque ya vuelan en primer plano.
 */
const ALERT_FLIGHTS: Flight[] = [
  { cx: -2, cy: 4, cz: -7, rx: 10, rz: 4, speed: 0.3, phase: 1.1, scale: 1.05 },
  { cx: 8, cy: 7, cz: -11, rx: 13, rz: 6, speed: 0.27, phase: 3.4, scale: 1.15 },
  { cx: -16, cy: 5.5, cz: -13, rx: 14, rz: 6, speed: 0.29, phase: 5.6, scale: 1.2 },
  { cx: 14, cy: 12, cz: -18, rx: 15, rz: 7, speed: 0.23, phase: 2.2, scale: 1.25 },
  { cx: -24, cy: 8.5, cz: -22, rx: 17, rz: 8, speed: 0.25, phase: 4.7, scale: 1.3 },
  { cx: 0, cy: 14, cz: -26, rx: 18, rz: 8, speed: 0.2, phase: 0.5, scale: 1.35 },
];

const WHITE = "#f7f5ee";
/** Manto gris azulado de la patiamarilla adulta. */
const GREY = "#9fa9ba";
const INK_TIP = "#1b1b22";
const YELLOW = "#ffc93a";
/** Patas amarillas: es lo que le da el nombre (Larus michahellis). */
const LEG_YELLOW = "#f2b82e";
const GONYS_RED = "#e2483a";
/** Iris en calma. Durante la alerta del faro pasa a `ALERT_RED`. */
const EYE_IRIS = "#f4e6a6";
/**
 * Los dos colores del iris ya como `THREE.Color`, a nivel de módulo: se
 * comparan y se copian cada frame (ver el bucle de la alerta), así que no
 * pueden reservarse por gaviota ni por frame.
 */
const EYE_CALM_RGB = new THREE.Color(EYE_IRIS);
const EYE_ANGRY_RGB = new THREE.Color(ALERT_RED);

/**
 * Altura de las PATAS en unidades de modelo: del origen del ave (centro del
 * cuerpo) a la planta de los pies. Posada, el origen va a `superficie −
 * FOOT_Y × escala` — así apoya justo encima, ni hundida ni flotando, sea cual
 * sea su tamaño.
 */
const FOOT_Y = -0.4;
/**
 * Escala del ave cuando está en el muelle o en la grúa. Las que vuelan lejos
 * (z −12 … −60) llevan escala mayor para leerse; posadas a z ≈ 0 esa escala
 * las convertía en albatros junto a un contenedor. Despegue y aterrizaje
 * interpolan entre las dos.
 */
const PERCH_SCALE = 0.78;

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

function polyShape(points: [number, number][]) {
  const s = new THREE.Shape();
  s.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) s.lineTo(points[i][0], points[i][1]);
  s.closePath();
  return s;
}

const ARM_SPAN = 0.6;
const HAND_SPAN = 0.68;
/** Fracción de la mano (desde la punta) que es negra: las primarias. */
const TIP_FRACTION = 0.42;

interface GullGeometries {
  body: THREE.BufferGeometry;
  arm: THREE.BufferGeometry;
  hand: THREE.BufferGeometry;
  handTip: THREE.BufferGeometry;
  foldWing: THREE.BufferGeometry;
  foldTip: THREE.BufferGeometry;
  beakUpper: THREE.BufferGeometry;
  beakLower: THREE.BufferGeometry;
  foot: THREE.BufferGeometry;
}

/**
 * Geometrías COMPARTIDAS por todas las gaviotas (una sola vez por página):
 * son 5 aves con el mismo cuerpo, no tiene sentido tener 5 copias en la GPU.
 * No se liberan — viven lo que vive el hero, igual que el gradiente toon.
 */
let gullGeo: GullGeometries | null = null;
function getGullGeometries(): GullGeometries {
  if (gullGeo) return gullGeo;
  const thin = (shape: THREE.Shape, depth: number) => {
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    g.translate(0, 0, -depth / 2);
    return g;
  };

  // Cuerpo en huso: pecho lleno, espalda recta y cola afilada. Torno sobre y
  // (de la cola a +y el pecho) y luego tumbado para que +y pase a ser +x.
  const body = new THREE.LatheGeometry(
    [
      [0, -0.62], [0.05, -0.5], [0.11, -0.32], [0.17, -0.1],
      [0.19, 0.05], [0.17, 0.2], [0.12, 0.3], [0, 0.36],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    14,
  );
  body.rotateZ(-Math.PI / 2);

  // Mano gris hasta donde empiezan las primarias; la punta negra es otra pieza
  // del MISMO contorno, así el corte coincide.
  const handTaper = 0.5;
  const handChord = 0.3;
  const cut = HAND_SPAN * (1 - TIP_FRACTION);
  const chordAtCut = handChord * (1 - (1 - handTaper) * (cut / HAND_SPAN));
  const hand = thin(wingShape(cut + 0.01, handChord, chordAtCut / handChord), 0.045);
  const handTip = thin(wingShape(HAND_SPAN - cut, chordAtCut, (handChord * handTaper) / chordAtCut), 0.05);
  handTip.translate(0, cut, 0);

  // Ala plegada de perfil: hoja gris sobre el costado y primarias negras que
  // se cruzan por encima de la cola blanca, como en la patiamarilla.
  const foldWing = thin(
    polyShape([
      [0.22, 0.1], [0.12, 0.17], [-0.05, 0.19], [-0.25, 0.16],
      [-0.4, 0.1], [-0.36, 0.04], [-0.18, -0.02], [0.08, -0.01],
    ]),
    0.035,
  );
  const foldTip = thin(
    polyShape([[-0.3, 0.13], [-0.55, 0.1], [-0.74, 0.055], [-0.72, 0.03], [-0.5, 0.03], [-0.32, 0.05]]),
    0.04,
  );

  // Pico fuerte, amarillo, con la punta en gancho; la mandíbula inferior va
  // aparte para poder abrirla en el grito.
  const beakUpper = thin(
    polyShape([[0, 0.045], [0.12, 0.04], [0.21, 0.025], [0.255, 0], [0.245, -0.022], [0.22, -0.01], [0, -0.005]]),
    0.07,
  );
  const beakLower = thin(
    polyShape([[0, -0.005], [0.2, -0.012], [0.17, -0.03], [0.13, -0.047], [0, -0.04]]),
    0.06,
  );

  // Pie palmeado: tres dedos en abanico hacia delante, tumbado sobre el suelo.
  const foot = thin(polyShape([[-0.03, 0], [0.1, 0.06], [0.08, 0.02], [0.12, 0], [0.08, -0.02], [0.1, -0.06]]), 0.02);
  foot.rotateX(-Math.PI / 2);

  gullGeo = {
    body,
    arm: thin(wingShape(ARM_SPAN, 0.34, 0.9), 0.045),
    hand,
    handTip,
    foldWing,
    foldTip,
    beakUpper,
    beakLower,
    foot,
  };
  return gullGeo;
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
  const geo = getGullGeometries();
  const gradient = getToonGradient();
  const o = palette.outline;
  const feather = (color: string) =>
    flat
      ? <meshBasicMaterial color={color} toneMapped={false} side={THREE.DoubleSide} />
      : <meshToonMaterial color={color} gradientMap={gradient} side={THREE.DoubleSide} />;

  return (
    <group
      ref={innerRef}
      position={[0.04, 0.09, side * 0.1]}
      rotation={[side * (Math.PI / 2), 0, 0]}
    >
      <mesh geometry={geo.arm}>
        {feather(GREY)}
        <Outlines thickness={OUTLINE_THIN} color={o} />
      </mesh>
      <group ref={outerRef} position={[0, ARM_SPAN - 0.02, 0]}>
        <mesh geometry={geo.hand}>
          {feather(GREY)}
          <Outlines thickness={OUTLINE_THIN} color={o} />
        </mesh>
        {/* Primarias negras con los "espejos" blancos de la patiamarilla */}
        <mesh geometry={geo.handTip}>
          <meshBasicMaterial color={INK_TIP} toneMapped={false} side={THREE.DoubleSide} />
          <Outlines thickness={OUTLINE_THIN} color={o} />
        </mesh>
        {[0.52, 0.64].map((y) => (
          <mesh key={y} position={[-0.03, y, 0]} scale={[1, 1, 0.5]}>
            <sphereGeometry args={[0.03, 8, 6]} />
            <meshBasicMaterial color={WHITE} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

interface BodyRefs {
  innerL: Ref<THREE.Group>; outerL: Ref<THREE.Group>;
  innerR: Ref<THREE.Group>; outerR: Ref<THREE.Group>;
  /** Grupo de alas extendidas (vuelo). */
  open: Ref<THREE.Group>;
  /** Grupo de alas plegadas (posada). */
  folded: Ref<THREE.Group>;
  /** Tronco (respira posada). */
  torso: Ref<THREE.Group>;
  /** Cabeza: mira a los lados y echa atrás para gritar. */
  head: Ref<THREE.Group>;
  /** Mandíbula inferior: se abre en el grito. */
  jaw: Ref<THREE.Group>;
  /** Patas: fuera posada, al aterrizar y abatida; recogidas en vuelo. */
  legs: Ref<THREE.Group>;
  /** Los dos iris: se tiñen de rojo durante la alerta del faro. */
  iris: RefObject<(THREE.MeshBasicMaterial | null)[]>;
}

function GullBody({ palette, flat, refs }: { palette: PortPalette; flat: boolean; refs: BodyRefs }) {
  const geo = getGullGeometries();
  const gradient = getToonGradient();
  const o = palette.outline;
  const paint = (color: string) =>
    flat
      ? <meshBasicMaterial color={color} toneMapped={false} />
      : <meshToonMaterial color={color} gradientMap={gradient} />;

  return (
    <group>
      <group ref={refs.torso}>
        {/* Cuerpo en huso */}
        <mesh geometry={geo.body} scale={[1, 0.95, 0.85]} castShadow>
          {paint(WHITE)}
          <Outlines thickness={OUTLINE_THIN} color={o} />
        </mesh>
        {/* Manto gris sobre el lomo */}
        <mesh position={[-0.1, 0.12, 0]} rotation={[0, 0, Math.PI / 2 + 0.06]} scale={[1, 1, 0.78]}>
          <capsuleGeometry args={[0.1, 0.36, 4, 10]} />
          {paint(GREY)}
        </mesh>

        {/* Alas plegadas (posada): hoja gris + primarias negras cruzadas sobre la cola */}
        <group ref={refs.folded}>
          {[-1, 1].map((side) => (
            <group key={side} position={[0, 0, side * 0.155]}>
              <mesh geometry={geo.foldWing}>
                {paint(GREY)}
                <Outlines thickness={OUTLINE_THIN} color={o} />
              </mesh>
              <mesh geometry={geo.foldTip} position={[0, 0, side * 0.01]}>
                <meshBasicMaterial color={INK_TIP} toneMapped={false} />
                <Outlines thickness={OUTLINE_THIN} color={o} />
              </mesh>
              {/* Espejo blanco en la primaria y media luna blanca de las terciarias */}
              <mesh position={[-0.62, 0.065, side * 0.035]} scale={[1.3, 0.8, 0.4]}>
                <sphereGeometry args={[0.022, 8, 6]} />
                <meshBasicMaterial color={WHITE} toneMapped={false} />
              </mesh>
              <mesh position={[-0.26, 0.16, side * 0.02]} rotation={[0, 0, -0.2]}>
                <boxGeometry args={[0.2, 0.022, 0.02]} />
                <meshBasicMaterial color={WHITE} toneMapped={false} />
              </mesh>
            </group>
          ))}
        </group>

        <group ref={refs.open}>
          <Wing side={1} palette={palette} flat={flat} innerRef={refs.innerL} outerRef={refs.outerL} />
          <Wing side={-1} palette={palette} flat={flat} innerRef={refs.innerR} outerRef={refs.outerR} />
        </group>
      </group>

      {/* Cabeza: pivota en el cuello */}
      <group ref={refs.head} position={[0.28, 0.13, 0]}>
        <mesh position={[0.07, 0.05, 0]} scale={[1.12, 1, 0.92]}>
          <sphereGeometry args={[0.14, 14, 10]} />
          {paint(WHITE)}
          <Outlines thickness={OUTLINE_THIN} color={o} />
        </mesh>
        {/* Ojo: anillo orbital rojo, iris amarillo pálido y pupila — a los dos lados */}
        {[-1, 1].map((side, i) => (
          <group key={side} position={[0.14, 0.09, side * 0.1]}>
            <mesh>
              <sphereGeometry args={[0.032, 10, 8]} />
              <meshBasicMaterial color={GONYS_RED} toneMapped={false} />
            </mesh>
            <mesh position={[0.004, 0, side * 0.012]}>
              <sphereGeometry args={[0.026, 10, 8]} />
              <meshBasicMaterial
                ref={(el) => { refs.iris.current[i] = el; }}
                color={EYE_IRIS}
                toneMapped={false}
              />
            </mesh>
            <mesh position={[0.008, 0.002, side * 0.03]}>
              <sphereGeometry args={[0.012, 8, 6]} />
              <meshBasicMaterial color={o} toneMapped={false} />
            </mesh>
          </group>
        ))}
        {/* Pico: superior fija, inferior con bisagra */}
        <group position={[0.2, 0.02, 0]}>
          <mesh geometry={geo.beakUpper}>
            <meshBasicMaterial color={YELLOW} toneMapped={false} />
            <Outlines thickness={OUTLINE_THIN} color={o} />
          </mesh>
          <group ref={refs.jaw}>
            <mesh geometry={geo.beakLower}>
              <meshBasicMaterial color={YELLOW} toneMapped={false} />
              <Outlines thickness={OUTLINE_THIN} color={o} />
            </mesh>
            {/* Mancha roja del gonys: lo que pican los pollos para pedir comida */}
            {[-1, 1].map((side) => (
              <mesh key={side} position={[0.145, -0.03, side * 0.028]} scale={[1.2, 1, 0.5]}>
                <sphereGeometry args={[0.02, 8, 6]} />
                <meshBasicMaterial color={GONYS_RED} toneMapped={false} />
              </mesh>
            ))}
          </group>
        </group>
      </group>

      {/* Patas amarillas palmeadas: la planta queda EXACTAMENTE en FOOT_Y */}
      <group ref={refs.legs}>
        {[-0.075, 0.075].map((z) => (
          <group key={z} position={[0.04, 0, z]}>
            <mesh position={[0, -0.28, 0]} rotation={[0, 0, -0.08]}>
              <cylinderGeometry args={[0.02, 0.024, 0.24, 6]} />
              <meshBasicMaterial color={LEG_YELLOW} toneMapped={false} />
            </mesh>
            <mesh geometry={geo.foot} position={[0.01, FOOT_Y + 0.01, 0]}>
              <meshBasicMaterial color={LEG_YELLOW} toneMapped={false} />
              <Outlines thickness={OUTLINE_THIN} color={o} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/**
 * `leave`: gaviota de enjambre que se desvanece en el aire al acabar su evento.
 * `dive`: embestida contra la pantalla durante la alerta del faro.
 */
type Mode = "perched" | "takeoff" | "cruise" | "approach" | "shot" | "gone" | "leave" | "dive";

/**
 * A qué bandada pertenece. Las de enjambre sólo existen mientras dura SU
 * evento; fuera de él viven en `gone` y ni siquiera se pueden abatir.
 */
type Swarm = "extra" | "alert";

const TAKEOFF_TIME = 0.9;
const APPROACH_TIME = 2.2;
/** Tras este rato en el aire busca dónde posarse. */
const CRUISE_MIN = 9;
/** Aunque nadie la moleste, de vez en cuando levanta el vuelo sola. */
const RESTLESS_MIN = 22;
const RESTLESS_EXTRA = 26;
/** Si el contenedor bajo sus patas se mueve más que esto en un frame, se va. */
const SHOVE = 0.05;
/** Grito ("long call"): cabeza atrás y pico abierto, de vez en cuando. */
const CALL_TIME = 1.3;
const CALL_EVERY = 7;
/** Fracción de la aproximación a partir de la cual saca las patas. */
const GEAR_DOWN = 0.55;

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
  /** Escala actual (vuelo ↔ posada). */
  scale: number;
  /** Escala con la que empezó el despegue o la aproximación. */
  scaleFrom: number;
  /** Último apoyo visto (para notar que el contenedor se mueve). */
  last: THREE.Vector3;
  /** Próximo grito (s dentro de `perched`). */
  callAt: number;
  /** Punto de impacto de la embestida (mundo, delante de la cámara). */
  to: THREE.Vector3;
  /** Ese mismo punto en NDC: es lo que necesita la grieta del DOM. */
  ndcX: number;
  ndcY: number;
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
const _dir = new THREE.Vector3();
const _pt: PerchPoint = { x: 0, y: 0, z: 0 };

function Gull({
  flight, palette, flat, startPerch, taken, disturbance, seed, targets, swarm, rush, alert, onScreenHit,
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
  /** Bandada de evento: sólo existe mientras dure el suyo (ronda o alerta). */
  swarm?: Swarm;
  rush?: RefObject<GullRush>;
  alert?: RefObject<GullAlert>;
  /** Se estrelló contra la pantalla, en NDC. Lo recoge el overlay de la grieta. */
  onScreenHit?: (ndcX: number, ndcY: number) => void;
}) {
  const root = useRef<THREE.Group>(null);
  const innerL = useRef<THREE.Group>(null);
  const innerR = useRef<THREE.Group>(null);
  const outerL = useRef<THREE.Group>(null);
  const outerR = useRef<THREE.Group>(null);
  const open = useRef<THREE.Group>(null);
  const folded = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const jaw = useRef<THREE.Group>(null);
  const legs = useRef<THREE.Group>(null);
  const iris = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  /** Retraso con el que entra en escena su bandada (la alerta llena el cielo antes). */
  const stagger = swarm === "alert" ? alertStagger(seed) : rushStagger(seed);

  const st = useRef<GullState>({
    mode: swarm ? "gone" : startPerch >= 0 ? "perched" : "cruise",
    t: 0,
    perch: startPerch,
    target: -1,
    from: new THREE.Vector3(),
    cruiseFor: CRUISE_MIN + (seed % 7),
    restlessAt: RESTLESS_MIN + (seed % 13),
    blend: startPerch >= 0 ? 0 : 1,
    seenPulse: 0,
    respawnAt: swarm ? stagger : RESPAWN_MIN + (seed % 5),
    scale: startPerch >= 0 ? PERCH_SCALE : flight.scale,
    scaleFrom: flight.scale,
    last: new THREE.Vector3(Number.NaN, 0, 0),
    callAt: 3 + (seed % CALL_EVERY),
    to: new THREE.Vector3(),
    ndcX: 0,
    ndcY: 0,
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
      alive: !swarm,
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
  }, [targets, seed, flight.scale, taken, swarm]);

  useFrame((state, delta) => {
    const g = root.current;
    if (!g) return;
    const dt = Math.min(delta, 1 / 20);
    const clock = state.clock.elapsedTime;
    const c = st.current;
    const d = disturbance.current;
    const rushing = !!rush?.current.active;
    const alerting = !!alert?.current.active;
    /** ¿Está abierto el evento de SU bandada? Las de siempre vuelan pase lo que pase. */
    const swarming = swarm === "alert" ? alerting : swarm === "extra" ? rushing : true;
    c.t += dt;

    if (swarm) {
      if (c.mode === "gone" && !swarming) {
        // Fuera de su evento: espera, con el reloj a cero para el escalonado del próximo.
        c.t = 0;
        c.respawnAt = stagger;
      } else if (c.mode === "cruise" && !swarming) {
        // Se acabó: se desvanece donde esté y ya no se puede abatir.
        c.mode = "leave";
        c.t = 0;
        const own = targets?.get(seed);
        if (own) own.alive = false;
        materials.current ??= collectMaterials(g);
      }
    }

    /*
     * Ojos rojos mientras dura la alerta del faro — todas, no sólo el enjambre.
     *
     * Se compara contra el color REAL del material, sin recordar la última
     * transición. Es a propósito: un flanco ("ha cambiado, píntalo") se pierde
     * si el estado de React se reinicia sin que se reinicie el material — lo
     * que pasa con la recarga en caliente en desarrollo — y el ojo se queda
     * rojo para siempre. Así converge solo, venga de donde venga. Son dos
     * comparaciones por ave y frame: nada.
     */
    const eye = alerting ? EYE_ANGRY_RGB : EYE_CALM_RGB;
    for (const m of iris.current) if (m && !m.color.equals(eye)) m.color.copy(eye);

    // Embestida contra la pantalla: por turnos (`claimDive` hace de semáforo
    // entre aves), y sólo desde el vuelo de crucero — una posada no se lanza.
    if (alert && c.mode === "cruise" && Math.random() < DIVE_PICK && claimDive(alert.current, clock)) {
      c.from.copy(g.position);
      c.scaleFrom = c.scale;
      c.mode = "dive";
      c.t = 0;
      // Sitio del cristal al que va: cualquiera menos los bordes, que quedan
      // medio fuera de encuadre y la grieta no se leería entera.
      c.ndcX = (Math.random() - 0.5) * 1.3;
      c.ndcY = (Math.random() - 0.5) * 1.0;
      _dir.set(c.ndcX, c.ndcY, 0.5).unproject(state.camera).sub(state.camera.position).normalize();
      c.to.copy(state.camera.position).addScaledVector(_dir, DIVE_DEPTH);
    }

    // --- Vuelo en lemniscata: posición y tangente
    const t = clock * flight.speed + flight.phase;
    const fx = flight.cx + Math.cos(t) * flight.rx;
    const fz = flight.cz + Math.sin(2 * t) * 0.5 * flight.rz;
    const fy = flight.cy + Math.sin(t * 3) * 0.6;

    let armAmp = 0.62;
    let flapRate = 7.5;
    let gliding = Math.sin(clock * 0.45 + flight.phase * 2) > 0.1;
    /** Patas fuera: posada, abatida o en el tramo final del aterrizaje. */
    let gear = false;
    let headYaw = 0;
    let headPitch = 0;
    let jawOpen = 0;
    let breathe = 0;

    const takeOff = () => {
      taken.delete(c.perch);
      c.from.copy(g.position);
      c.scaleFrom = c.scale;
      c.mode = "takeoff";
      c.t = 0;
      c.last.x = Number.NaN;
    };

    if (c.mode === "perched") {
      const perch = PERCHES[c.perch];
      const startled = d && d.pulse !== c.seenPulse;
      const grounded = !!d && resolvePerch(perch, d, _pt);
      // ¿Se ha movido el apoyo de golpe? (el contenedor lo empujan o lo arrastra
      // el spreader). La grúa en marcha ya la cubre `isDisturbed`.
      const shoved =
        grounded && perch.kind === "container" && !Number.isNaN(c.last.x) &&
        Math.abs(_pt.x - c.last.x) + Math.abs(_pt.y - c.last.y) > SHOVE;
      if (!grounded || shoved || (d && isDisturbed(perch, d)) || startled || c.t > c.restlessAt) {
        takeOff();
      } else {
        c.last.set(_pt.x, _pt.y, _pt.z);
        c.scale = PERCH_SCALE;
        g.position.set(_pt.x, _pt.y - FOOT_Y * c.scale, _pt.z);
        const base = perch.facing === 1 ? 0 : Math.PI;
        g.rotation.set(0, base + Math.sin(clock * 0.21 + seed) * 0.12, 0);
        // Mira a un lado y a otro, a golpes, como hacen.
        headYaw = Math.sin(clock * 0.7 + seed) > 0 ? 0.5 : -0.45;
        breathe = Math.sin(clock * 2.1 + seed) * 0.025;
        gear = true;
        // Grito: cabeza atrás, pico abierto y cerrándose a golpes.
        const since = c.t - c.callAt;
        if (since > 0 && since < CALL_TIME) {
          const env = Math.sin((Math.PI * since) / CALL_TIME);
          headPitch = 0.75 * env;
          headYaw = 0;
          jawOpen = env * (0.35 + 0.15 * Math.sin(since * 26));
        } else if (since >= CALL_TIME) {
          c.callAt = c.t + CALL_EVERY + ((seed * 3) % 5);
        }
      }
    }

    if (c.mode === "takeoff") {
      const k = takeoffEase(c.t / TAKEOFF_TIME);
      const away = PERCHES[c.perch]?.facing ?? 1;
      g.position.set(
        c.from.x + away * 2.6 * k,
        c.from.y + 2.4 * k,
        c.from.z + 1.2 * k,
      );
      g.rotation.set(-0.25 * (1 - k), away === 1 ? 0 : Math.PI, 0.1 * Math.sin(clock * 12));
      c.scale = THREE.MathUtils.lerp(c.scaleFrom, flight.scale, k);
      armAmp = 0.95;
      flapRate = 11;
      gliding = false;
      gear = k < 0.35; // recoge las patas nada más soltarse
      if (c.t >= TAKEOFF_TIME) {
        c.mode = "cruise";
        c.t = 0;
        c.blend = 0;
        c.cruiseFor = CRUISE_MIN + (seed % 7);
        c.from.copy(g.position);
      }
    } else if (c.mode === "cruise" || c.mode === "leave") {
      // Entra en su órbita suavemente desde donde acabó el despegue.
      c.blend = Math.min(1, c.blend + dt / 1.6);
      const b = c.blend * c.blend * (3 - 2 * c.blend);
      g.position.set(
        THREE.MathUtils.lerp(c.from.x, fx, b),
        THREE.MathUtils.lerp(c.from.y, fy, b),
        THREE.MathUtils.lerp(c.from.z, fz, b),
      );
      c.scale = flight.scale;
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
          c.scaleFrom = c.scale;
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
      gear = true;
      if (materials.current) setOpacity(materials.current, fadeAt(c.t));
      if (c.t >= FADE_END) {
        c.mode = "gone";
        c.t = 0;
        // En plena ronda (o alerta) vuelve casi al instante; fuera, al rato.
        c.respawnAt = rushing || alerting ? rushRespawn(seed) : RESPAWN_MIN + (seed % 5);
        g.visible = false;
        if (materials.current) setOpacity(materials.current, 1);
      }
    } else if (c.mode === "gone") {
      // Fuera de escena. Vuelve entrando por el lateral hacia su órbita.
      if (c.t >= c.respawnAt && (!swarm || swarming)) {
        const side = Math.cos(t) >= 0 ? 1 : -1;
        c.from.set(flight.cx + side * (flight.rx + 40), flight.cy + 5, flight.cz);
        // La posición se PLANTA aquí, no se deja para el frame siguiente. La
        // cadena de modos es un `else if` y `cruise` va por delante de `gone`,
        // así que el frame del respawn ya no pasa por el lerp de la órbita: sin
        // esto el ave se hacía visible un frame entero donde la dejó su vida
        // anterior — el origen (0,0,0), en mitad del encuadre, la primera vez;
        // el punto del choque contra el cristal o su última órbita después — y
        // saltaba al lateral al siguiente. Eso era el popping del enjambre de
        // la alerta del faro: seis parpadeos escalonados en un segundo.
        g.position.copy(c.from);
        g.rotation.set(0, 0, 0);
        g.visible = true;
        c.mode = "cruise";
        c.t = 0;
        c.blend = 0;
        c.scale = flight.scale;
        c.cruiseFor = CRUISE_MIN + (seed % 7);
        const target = targets?.get(seed);
        if (target) target.alive = true;
      }
    } else if (c.mode === "approach") {
      // Aproximación: arco descendente hasta el posadero, frenando con las
      // alas. El destino se recalcula CADA frame: la grúa puede estar viajando
      // de fila o el contenedor moviéndose. Si deja de existir, aborta.
      const perch = PERCHES[c.target];
      if (!d || !resolvePerch(perch, d, _pt) || isDisturbed(perch, d)) {
        taken.delete(c.target);
        c.target = -1;
        c.from.copy(g.position);
        c.mode = "cruise";
        c.t = 0;
        c.blend = 0;
      } else {
        const k = Math.min(1, c.t / APPROACH_TIME);
        const e = k * k * (3 - 2 * k);
        c.scale = THREE.MathUtils.lerp(c.scaleFrom, PERCH_SCALE, e);
        _from.copy(c.from);
        _to.set(_pt.x, _pt.y - FOOT_Y * c.scale, _pt.z);
        g.position.lerpVectors(_from, _to, e);
        g.position.y += Math.sin(Math.PI * e) * 1.4;
        const dirX = _to.x - _from.x;
        // Al final se encabrita: cuerpo arriba y alas frenando.
        g.rotation.set(0, dirX >= 0 ? 0 : Math.PI, 0.35 * Math.max(0, e - 0.6) / 0.4);
        armAmp = 0.35 + 0.45 * Math.max(0, e - 0.5);
        flapRate = 5.5 + 5 * Math.max(0, e - 0.7);
        gliding = false;
        gear = e > GEAR_DOWN;
        if (k >= 1) {
          c.perch = c.target;
          c.target = -1;
          c.mode = "perched";
          c.t = 0;
          c.restlessAt = RESTLESS_MIN + ((seed * 7) % RESTLESS_EXTRA);
          c.callAt = 2 + (seed % 4);
          c.last.x = Number.NaN;
        }
      }
    } else if (c.mode === "dive") {
      // Rompe la cuarta pared: se viene encima acelerando y creciendo, y al
      // llegar al cristal desaparece detrás de la grieta (la pinta el DOM).
      // Sigue siendo un blanco válido: dispararle antes del impacto la para.
      const k = Math.min(1, c.t / DIVE_TIME);
      const e = k * k;
      g.position.lerpVectors(c.from, c.to, e);
      c.scale = THREE.MathUtils.lerp(c.scaleFrom, DIVE_SCALE, e);
      const cam = state.camera.position;
      const toCamX = cam.x - g.position.x;
      const toCamZ = cam.z - g.position.z;
      g.rotation.set(
        Math.sin(clock * 22) * 0.3, // cabeceo rabioso
        Math.atan2(-toCamZ, toCamX), // de morro a la cámara (el cuerpo mira a +x)
        Math.atan2(cam.y - g.position.y, Math.hypot(toCamX, toCamZ)),
      );
      armAmp = 1.05;
      flapRate = 15;
      gliding = false;
      headYaw = 0;
      jawOpen = 0.4; // viene gritando
      if (k >= 1) {
        onScreenHit?.(c.ndcX, c.ndcY);
        playCrashSfx();
        c.mode = "gone";
        c.t = 0;
        c.respawnAt = rushRespawn(seed);
        g.visible = false;
        const own = targets?.get(seed);
        if (own) own.alive = false;
      }
    }

    if (c.mode === "leave") {
      if (materials.current) setOpacity(materials.current, fadeAt(c.t));
      if (c.t >= FADE_END) {
        c.mode = "gone";
        c.t = 0;
        c.respawnAt = stagger;
        g.visible = false;
        if (materials.current) setOpacity(materials.current, 1);
      }
    }

    g.scale.setScalar(c.scale);

    if (d) c.seenPulse = d.pulse;
    const target = targets?.get(seed);
    if (target) {
      target.x = g.position.x;
      target.y = g.position.y;
      target.z = g.position.z;
      // El radio va con la escala del momento: una que embiste es un blanco
      // enorme (y se la puede parar de un tiro), una posada es pequeña.
      target.radius = 0.75 * c.scale;
    }

    // Abatida: alas plegadas y patas fuera, panza arriba de cómic.
    const perched = c.mode === "perched" || c.mode === "shot";
    if (open.current) open.current.visible = !perched;
    if (folded.current) folded.current.visible = perched;
    if (legs.current) legs.current.visible = gear;
    if (torso.current) torso.current.scale.y = 1 + breathe;
    if (head.current) {
      head.current.rotation.y = headYaw;
      head.current.rotation.z = headPitch;
    }
    if (jaw.current) jaw.current.rotation.z = -jawOpen;

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
    <group ref={root} scale={st.current.scale} visible={!swarm}>
      <GullBody
        palette={palette}
        flat={flat}
        refs={{ innerL, outerL, innerR, outerR, open, folded, torso, head, jaw, legs, iris }}
      />
    </group>
  );
}

const FAR_AWAY: Disturbance = { trolleyX: 999, hookX: 999, hookY: 999, pointerX: 999, pointerY: 999, pulse: 0 };

export function Seagulls({
  palette,
  flat = false,
  disturbance,
  targets,
  rush,
  alert,
  onScreenHit,
}: {
  palette: PortPalette;
  flat?: boolean;
  /** Qué hay cerca (carro, spreader, pórtico, contenedores, cursor). Sin esto nunca se asustan. */
  disturbance?: RefObject<Disturbance>;
  /** Registro de blancos del easter egg (`GullHunt`). Sin esto no se pueden abatir. */
  targets?: Map<number, GullTarget>;
  /** Ronda de caza en curso: trae las gaviotas extra y acorta la reaparición. */
  rush?: RefObject<GullRush>;
  /** Alerta del faro: ojos rojos, enjambre propio y embestidas a la pantalla. */
  alert?: RefObject<GullAlert>;
  onScreenHit?: (ndcX: number, ndcY: number) => void;
}) {
  const fallback = useRef<Disturbance>(FAR_AWAY);
  const taken = useRef(new Set<number>()).current;
  // De noche vuelan menos — solo las dos más cercanas.
  const night = palette.lamps > 0.9;
  const flights = night ? FLIGHTS.slice(0, 2) : FLIGHTS;
  const extras = night ? EXTRA_FLIGHTS.slice(0, 2) : EXTRA_FLIGHTS;

  return (
    <group>
      {flights.map((f, i) => (
        <Gull
          key={i}
          seed={i * 5 + 3}
          flight={f}
          palette={palette}
          flat={flat}
          // Las tres primeras nacen posadas en la pluma (posaderos 0-2, que
          // siempre existen); el resto, volando.
          startPerch={i < 3 ? i : -1}
          taken={taken}
          disturbance={disturbance ?? fallback}
          targets={targets}
          rush={rush}
          alert={alert}
          onScreenHit={onScreenHit}
        />
      ))}
      {extras.map((f, i) => (
        <Gull
          key={`extra-${i}`}
          seed={100 + i * 5 + 3}
          flight={f}
          palette={palette}
          flat={flat}
          startPerch={-1}
          taken={taken}
          disturbance={disturbance ?? fallback}
          targets={targets}
          swarm="extra"
          rush={rush}
          alert={alert}
          onScreenHit={onScreenHit}
        />
      ))}
      {/* Enjambre de la alerta del faro: aquí NO se recorta de noche — la
          gracia del easter egg es que el cielo se llene, sea la hora que sea. */}
      {ALERT_FLIGHTS.map((f, i) => (
        <Gull
          key={`alert-${i}`}
          seed={200 + i * 5 + 3}
          flight={f}
          palette={palette}
          flat={flat}
          startPerch={-1}
          taken={taken}
          disturbance={disturbance ?? fallback}
          targets={targets}
          swarm="alert"
          rush={rush}
          alert={alert}
          onScreenHit={onScreenHit}
        />
      ))}
    </group>
  );
}
