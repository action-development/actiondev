"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import { testimonials } from "@/data/testimonials";
import { PlazaRoom } from "./PlazaRoom";
import { PlazaDoll } from "./PlazaDoll";
import { FOUNTAIN_KEEP_OUT, buildDolls, type DollSpec } from "./plaza-config";
import {
  CAMERA_SPRING,
  FOCUS,
  INTRO,
  ORBIT,
  fovForAspect,
  shortestAngle,
  smoothDamp,
  type Spring,
} from "./plaza-camera";
import { clampDepth } from "./drag-depth";
import type { PlazaMode } from "./plaza-mode";
import { PlazaLighting } from "./PlazaLighting";
import { FocusFill, focusFillAmount, updateFocusFill } from "./lighting-focus";
import { prefersReducedMotion } from "./plaza-motion";
import { buildDecorLayout } from "./decor/furniture-layout";
import { DECOR_CLEARANCE, planFocus, stepAsideTarget, type FocusView } from "./plaza-focus";

interface PlazaWorldProps {
  /** Día o noche: lo resuelve la página y baja hasta la sala y el mobiliario. */
  mode: PlazaMode;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onReady?: () => void;
  /** Se está llevando un muñeco en la mano. */
  onHoldChange?: (holding: boolean) => void;
}

/** Estado vivo de cada muñeco. Fuera de React: cambia 60 veces por segundo. */
interface DollRuntime {
  spec: DollSpec;
  /** Posición actual en el suelo. */
  pos: THREE.Vector2;
  /** Destino al que camina. */
  target: THREE.Vector2;
  /** Sitio en torno al que deambula. Cambia cuando el usuario lo suelta en otro lado. */
  home: THREE.Vector2;
  /** Rotación actual e inercia de giro (radianes). */
  facing: number;
  /** Segundos que quedan del estado actual. */
  timer: number;
  state: "idle" | "walking" | "waving" | "held" | "talking";
  /** Índice en `runtime` del muñeco con el que está charlando (solo con
   * `state === "talking"`). */
  talkPartner: number | null;
  /** Va con prisa: se está apartando para despejar el plano de un enfocado
   * (`plaza-focus.ts`). Paso ligero hasta llegar. */
  hurry: boolean;
}

/** Distancia máxima entre dos muñecos "idle" para poder engancharse a
 * charlar: más allá se leería como hablar solos al aire. */
const TALK_RADIUS = 3.2;

/** Busca, entre los muñecos libres y quietos, el más cercano a `dolls[index]`
 * dentro de `TALK_RADIUS`. Devuelve -1 si no hay ninguno disponible. */
function findTalkPartner(dolls: DollRuntime[], index: number): number {
  const doll = dolls[index];
  let best = -1;
  let bestDist = TALK_RADIUS;
  for (let j = 0; j < dolls.length; j++) {
    if (j === index || dolls[j].state !== "idle") continue;
    const dist = doll.pos.distanceTo(dolls[j].pos);
    if (dist < bestDist) {
      bestDist = dist;
      best = j;
    }
  }
  return best;
}

/** Velocidad de paseo, unidades/segundo. Lento a propósito: es una plaza, no una carrera. */
const WALK_SPEED = 0.55;
/** Paso ligero al apartarse del plano de un enfocado: tiene que haber
 * despejado más o menos cuando la cámara llega. */
const HURRY_SPEED = 1.5;
/** Radio máximo de deambulación alrededor de su sitio. */
const WANDER_RADIUS = 1.15;

/** Movimiento de puntero (px) a partir del cual un click pasa a ser arrastre. */
const DRAG_THRESHOLD_PX = 6;
/** Tiempo (ms) con el click mantenido a partir del cual se agarra aunque no se mueva.
 * Holgado a propósito: un click normal (incluso lento) debe abrir la ficha, no
 * levantar al muñeco. */
const HOLD_MS = 400;
/** Distancia mínima y máxima a la cámara (en horizontal) del punto agarrado: ni
 * encima del objetivo ni fuera de la zona con anillos. */
const DEPTH_RANGE = { min: 4.6, max: 17 } as const;
/** Radio máximo desde el centro de la plaza: más allá se sale de la retícula. */
const MAX_RADIUS = 11;

/** El puntero se limita a este margen del canvas (NDC): el muñeco puede llegar
 * a los bordes visibles, pero no se sale de plano aunque el ratón lo haga. */
const DRAG_NDC_LIMIT = 0.8;
/** Tope superior propio: hacia arriba el rayo del puntero corta el suelo cada
 * vez más rasante y, pegado al horizonte, la profundidad se dispara. Marca el
 * final útil del recorrido (`DEPTH_RANGE` remata lo que se escape). */
const DRAG_NDC_TOP = 0.2;

/** Estado de un click en curso sobre un muñeco. Fuera de React: cambia por frame. */
interface DragState {
  id: string;
  index: number;
  pointerId: number;
  startX: number;
  startY: number;
  startT: number;
  /** false = aún es un click (se seleccionaría al soltar); true = arrastre. */
  active: boolean;
  /** Punto del mundo que se tiene agarrado (sigue al puntero por el plano de
   * arrastre). Su altura no cambia en todo el gesto: es la del agarre. */
  point: THREE.Vector3;
  /** Posición actual del puntero en NDC. */
  ndc: THREE.Vector2;
  /** Desfase en planta entre el punto agarrado y el origen del muñeco
   * (`x`, `y` = z, misma convención que `DollRuntime.pos`). */
  offset: THREE.Vector2;
}

// Trabajo del raycast al plano de arrastre: singletons para no alocar por frame.
const _ray = new THREE.Raycaster();
const _plane = new THREE.Plane();
const _hit = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

/**
 * Intersección del puntero (NDC) con el plano de arrastre: HORIZONTAL (paralelo
 * al suelo) y pasando por `point`, o sea a la altura a la que se agarró al
 * muñeco. Así el puntero da los dos únicos ejes del gesto: izquierda/derecha =
 * lado, arriba/abajo = profundidad (más lejos / más cerca). La altura no es un
 * eje: los muñecos no se despegan del suelo.
 *
 * Devuelve `null` si el rayo no llega a cortar el plano (puntero por encima del
 * horizonte); el frame se queda como estaba.
 */
function pointerOnGrabPlane(camera: THREE.Camera, ndc: THREE.Vector2, point: THREE.Vector3): THREE.Vector3 | null {
  _plane.setFromNormalAndCoplanarPoint(_up, point);
  _ray.setFromCamera(ndc, camera);
  return _ray.ray.intersectPlane(_plane, _hit);
}

export function PlazaWorld({ mode, selectedId, onSelect, onReady, onHoldChange }: PlazaWorldProps) {
  const { camera, gl, size } = useThree();

  const specs = useMemo(
    () => buildDolls(testimonials.map((t) => ({ id: t.id, gender: t.gender }))),
    []
  );

  /**
   * `?quieto` — congela el paseo de los muñecos y la órbita de la cámara.
   *
   * Mismo patrón que `?hora=` / `?plate` del hero. La plaza viva es imposible
   * de apuntar desde un test (un muñeco se aparta entre que se localiza y se
   * pulsa) y no da dos capturas iguales; con esto la escena es determinista.
   */
  const still = useMemo(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("quieto"),
    [],
  );

  /**
   * `?angulo=<grados>` — ángulo desde el que se congela la órbita (0 = eje +X,
   * 90 = de frente). Solo tiene sentido junto a `?quieto`, que es lo que la
   * detiene. Sirve para mirar la plaza desde donde haga falta sin esperar a
   * que la órbita pase por ahí: revisar el mobiliario de un lado, o cubrir
   * varios ángulos en regresión visual con capturas deterministas.
   */
  /** `prefers-reduced-motion`: sin entrada, sin vaivén ni paseo, y los
   * cambios de plano de la cámara son corte, no travelling. */
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  /** Nada se mueve solo: ni la cámara en reposo ni los muñecos. */
  const frozen = still || reducedMotion;

  /** Mobiliario como obstáculo para la cámara de foco. Mismo layout que el
   * que se monta (`buildDecorLayout`), no una copia a mano. */
  const decorObstacles = useMemo(
    () =>
      buildDecorLayout().map((d) => ({
        pos: new THREE.Vector2(d.pos[0], d.pos[1]),
        clearance: DECOR_CLEARANCE[d.kind] * d.scale,
      })),
    [],
  );

  const startAngle = useMemo(() => {
    if (typeof window === "undefined") return null;
    const raw = new URLSearchParams(window.location.search).get("angulo");
    if (raw === null) return null;
    const deg = Number(raw);
    return Number.isFinite(deg) ? THREE.MathUtils.degToRad(deg) : null;
  }, []);

  // Estado vivo: se crea una vez y se muta en `useFrame`. Meterlo en useState
  // provocaría un render por frame y por muñeco.
  const runtime = useRef<DollRuntime[]>(
    specs.map((spec) => ({
      spec,
      pos: new THREE.Vector2(spec.home[0], spec.home[1]),
      target: new THREE.Vector2(spec.home[0], spec.home[1]),
      home: new THREE.Vector2(spec.home[0], spec.home[1]),
      facing: spec.facing,
      timer: 1 + spec.phase,
      state: "idle" as const,
      talkPartner: null,
      hurry: false,
    })),
  );

  const groups = useRef<(THREE.Group | null)[]>([]);
  /**
   * Interlocutor de cada muñeco mientras charla: `PlazaDoll` lo mira y se
   * reparten los turnos. Un objeto ref ESTABLE por muñeco (la prop no cambia
   * nunca) cuyo `current` se reescribe por frame — sin renders.
   */
  const partnerRefs = useRef(specs.map(() => ({ current: null as THREE.Object3D | null })));
  const [hovered, setHovered] = useState<string | null>(null);
  /** Se lleva un muñeco en la mano: lo necesita el suelo (anillos guía). */
  const [holding, setHolding] = useState(false);

  /**
   * Estado de animación por muñeco, espejado en React.
   *
   * El paseo vive en `runtime` (mutado por frame, sin render), pero `PlazaDoll`
   * necesita saber si anda, saluda o está quieto. Solo se sincroniza cuando un
   * muñeco CAMBIA de estado — unas pocas veces por segundo entre los seis, no
   * un render por frame.
   */
  const [states, setStates] = useState<Record<string, DollRuntime["state"]>>({});

  // Ángulo de la órbita en reposo. Se acumula en vez de derivarse del reloj
  // para poder congelarlo al enfocar y reanudar sin salto.
  const orbitAngle = useRef(startAngle ?? ORBIT.center);
  /** Fase del vaivén. Se guarda aparte del ángulo para poder retomarlo sin
   * salto después de cerrar una ficha. */
  const sweepPhase = useRef(0);
  const readyFired = useRef(false);

  /**
   * Estado de la cámara: muelles críticos (`smoothDamp`) en coordenadas
   * CILÍNDRICAS alrededor de un pivote — radio horizontal, azimut y altura —,
   * más el pivote y el encuadre (dónde cae el pivote en pantalla, en NDC).
   *
   * Por qué así y no un `damp` de la posición en cartesianas: interpolar en
   * línea recta llevaba la cámara por encima de la fuente al enfocar a alguien
   * del otro lado, y el `damp` exponencial arranca a velocidad máxima — el
   * salto al hacer clic. Girando alrededor del pivote la cámara describe un
   * arco, y el muelle arranca desde parado y se posa sin rebote.
   */
  const cam = useRef<{
    px: Spring;
    py: Spring;
    pz: Spring;
    radius: Spring;
    azimuth: Spring;
    height: Spring;
    sx: Spring;
    sy: Spring;
  } | null>(null);
  /** Segundos de entrada transcurridos (incluida la espera inicial). Arranca
   * acabada si nada se puede mover. */
  const introClock = useRef(frozen ? INTRO.delay + INTRO.seconds : 0);
  /** Selección para la que se calculó `focusAzimuth`. */
  const focusFor = useRef<string | null>(null);
  const focusAzimuth = useRef<number>(ORBIT.center);
  const wasSelected = useRef(false);
  const lookCurrent = useRef(new THREE.Vector3(0, ORBIT.lookAt, 0));
  const _right = useRef(new THREE.Vector3());
  const _pivot = useRef(new THREE.Vector3());
  /** Relleno de retrato del enfocado (`lighting-focus.tsx`). */
  const fillRef = useRef<THREE.SpotLight>(null);

  const drag = useRef<DragState | null>(null);

  /** Pasa un click en curso a arrastre: el muñeco pasa a la mano. */
  const activateDrag = useCallback(
    (d: DragState) => {
      d.active = true;
      // Arrastrar es jugar, no leer: se cierra la ficha si estaba abierta.
      onSelect(null);
      setHovered(d.id);
      document.body.style.cursor = "grabbing";
      setHolding(true);
      onHoldChange?.(true);
      const doll = runtime.current[d.index];
      const hit = pointerOnGrabPlane(camera, d.ndc, d.point);
      // Desfase respecto al punto agarrado: sin él el muñeco saltaría a
      // colocar su origen bajo el puntero.
      if (hit) {
        d.point.x = hit.x;
        d.point.z = hit.z;
        d.offset.set(hit.x - doll.pos.x, hit.z - doll.pos.y);
      }
    },
    [camera, onSelect, onHoldChange],
  );

  const handlePointerDown = useCallback(
    (id: string, index: number) => (e: ThreeEvent<PointerEvent>) => {
      // Sin esto el click atraviesa al suelo que hay detrás y deselecciona
      // en el mismo gesto.
      e.stopPropagation();
      if (e.pointerType === "mouse" && e.button !== 0) return;
      drag.current = {
        id,
        index,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startT: performance.now(),
        active: false,
        point: e.point.clone(),
        ndc: new THREE.Vector2(e.pointer.x, e.pointer.y),
        offset: new THREE.Vector2(),
      };
    },
    [],
  );

  // El seguimiento del puntero va en `window` (no en el muñeco): mientras se
  // arrastra, el puntero puede salirse de su malla un instante y R3F dejaría de
  // avisar. El click sin arrastre se resuelve al soltar, no al pulsar.
  useEffect(() => {
    const el = gl.domElement;

    /** Puntero (px de pantalla) → NDC del canvas, acotado a los márgenes de
     * arrastre. */
    const toNdcX = (clientX: number) => {
      const r = el.getBoundingClientRect();
      return THREE.MathUtils.clamp(
        ((clientX - r.left) / r.width) * 2 - 1,
        -DRAG_NDC_LIMIT,
        DRAG_NDC_LIMIT,
      );
    };
    const toNdcY = (clientY: number) => {
      const r = el.getBoundingClientRect();
      return THREE.MathUtils.clamp(
        -((clientY - r.top) / r.height) * 2 + 1,
        -DRAG_NDC_LIMIT,
        DRAG_NDC_TOP,
      );
    };

    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.pointerId) return;
      d.ndc.x = toNdcX(e.clientX);
      d.ndc.y = toNdcY(e.clientY);
      if (!d.active && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > DRAG_THRESHOLD_PX) {
        activateDrag(d);
      }
    };

    const end = (e: PointerEvent, cancelled: boolean) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.pointerId) return;
      drag.current = null;
      if (d.active) {
        // El muñeco sigue bajo el puntero: se queda el cursor de "agarrar".
        document.body.style.cursor = "grab";
        setHolding(false);
        onHoldChange?.(false);
      } else if (!cancelled) {
        onSelect(d.id);
      }
    };
    const onUp = (e: PointerEvent) => end(e, false);
    const onCancel = (e: PointerEvent) => end(e, true);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      drag.current = null;
      onHoldChange?.(false);
    };
  }, [gl, activateDrag, onSelect, onHoldChange]);

  const handleHover = useCallback(
    (id: string | null) => (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      // Mientras se arrastra manda el cursor "grabbing" y el muñeco agarrado.
      if (drag.current?.active) return;
      setHovered(id);
      document.body.style.cursor = id ? "grab" : "auto";
    },
    [],
  );

  useFrame((state, delta) => {
    // Delta acotado: al volver de una pestaña en segundo plano llega un salto
    // de varios segundos y los muñecos se teletransportarían.
    const dt = Math.min(delta, 0.05);
    const dolls = runtime.current;
    let stateChanges: Record<string, DollRuntime["state"]> | null = null;

    for (let i = 0; i < dolls.length; i++) {
      const d = dolls[i];
      const group = groups.current[i];
      if (!group) continue;

      const isSelected = d.spec.id === selectedId;
      const prevState = d.state;

      const dr = drag.current;
      // Click mantenido sin mover el puntero: también cuenta como agarrar.
      if (dr && !dr.active && dr.index === i && performance.now() - dr.startT > HOLD_MS) {
        activateDrag(dr);
      }
      const isHeld = dr?.active === true && dr.index === i;

      // Si el compañero de charla dejó de charlar (lo agarraron, se
      // seleccionó o ya cumplió su propio timer) sin que a este le tocara
      // procesarlo en el mismo frame, cortar la charla aquí — si no, se queda
      // mirando y con el bocadillo puesto sin nadie delante.
      if (d.state === "talking" && !isHeld && !isSelected) {
        const partner = d.talkPartner !== null ? dolls[d.talkPartner] : null;
        if (!partner || partner.state !== "talking" || partner.talkPartner !== i) {
          d.state = "idle";
          d.talkPartner = null;
        }
      }

      if (isHeld) {
        // Sigue al puntero por el plano horizontal que pasa por el punto
        // agarrado: izquierda/derecha = lado, arriba/abajo = profundidad. No
        // hay más ejes — el muñeco nunca se despega del suelo.
        const hit = pointerOnGrabPlane(camera, dr.ndc, dr.point);
        if (hit) {
          dr.point.x = hit.x;
          dr.point.z = hit.z;
          // Cerca del horizonte el corte con el plano se va a cientos de
          // unidades: hay que acotar lo lejos y lo cerca que puede llegar.
          camera.getWorldDirection(_dir);
          clampDepth(dr.point, _dir, camera.position, DEPTH_RANGE);
          d.pos.set(dr.point.x - dr.offset.x, dr.point.z - dr.offset.y);
          const radius = d.pos.length();
          // Dos topes radiales: el borde de la retícula y la fuente. Sin el
          // segundo, un muñeco soltado dentro del pilón se quedaba a vivir en
          // el agua (su sitio de soltar pasa a ser su casa). Se empuja fuera
          // por el lado por el que entraba.
          const clamped = THREE.MathUtils.clamp(radius, FOUNTAIN_KEEP_OUT, MAX_RADIUS);
          if (clamped !== radius) {
            if (radius < 1e-4) d.pos.set(FOUNTAIN_KEEP_OUT, 0);
            else d.pos.multiplyScalar(clamped / radius);
            // El recorte vuelve al punto agarrado: sin esto, seguir empujando
            // contra el borde acumula viaje muerto y al tirar de vuelta el
            // muñeco tarda en reaccionar.
            dr.point.x = d.pos.x + dr.offset.x;
            dr.point.z = d.pos.y + dr.offset.y;
          }
        }
        d.target.copy(d.pos);
        d.state = "held";
        d.talkPartner = null;
      } else if (d.state === "held") {
        // Soltado justo donde estaba: ese sitio pasa a ser su nueva "casa".
        d.home.copy(d.pos);
        d.target.copy(d.pos);
        d.state = "idle";
        d.timer = 1.2;
      } else if (isSelected) {
        // El seleccionado deja de pasear y se queda donde está: el plano de
        // foco (`plaza-focus.ts`) se calcula con esa posición.
        d.target.copy(d.pos);
        d.state = "idle";
        d.talkPartner = null;
      } else if (!frozen) {
        d.timer -= dt;
        if (d.timer <= 0) {
          // Reparto de comportamientos: la mayoría del tiempo quietos, algún
          // paseo corto, saludos ocasionales y, si hay algún vecino libre
          // cerca, una charla entre los dos. Demasiado movimiento y la plaza
          // se lee como un hormiguero.
          const roll = Math.random();
          if (roll < 0.4) {
            d.state = "idle";
            d.timer = 2 + Math.random() * 3;
          } else if (roll < 0.75 && !selectedId) {
            // Con alguien enfocado nadie echa a andar: podría meterse en el
            // plano que se acaba de despejar.
            d.state = "walking";
            d.timer = 3 + Math.random() * 3;
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * WANDER_RADIUS;
            d.target.set(d.home.x + Math.cos(a) * r, d.home.y + Math.sin(a) * r);
            // Nadie pasea por dentro de la fuente: el destino se empuja fuera
            // del pilón por el lado por el que iba.
            const dist = d.target.length();
            if (dist < FOUNTAIN_KEEP_OUT) {
              if (dist < 1e-4) d.target.set(FOUNTAIN_KEEP_OUT, 0);
              else d.target.multiplyScalar(FOUNTAIN_KEEP_OUT / dist);
            }
          } else if (roll < 0.94) {
            // (También cae aquí el paseo cancelado por un enfocado.)
            d.state = "waving";
            d.timer = 1.6 + Math.random();
          } else {
            const partnerIndex = findTalkPartner(dolls, i);
            if (partnerIndex !== -1) {
              const duration = 3 + Math.random() * 2.5;
              d.state = "talking";
              d.timer = duration;
              d.talkPartner = partnerIndex;
              d.target.copy(d.pos);
              const partner = dolls[partnerIndex];
              partner.state = "talking";
              partner.timer = duration;
              partner.talkPartner = i;
              partner.target.copy(partner.pos);
            } else {
              // Sin nadie cerca con quien charlar: se queda en un saludo.
              d.state = "waving";
              d.timer = 1.6 + Math.random();
            }
          }
        }
      }

      // Avance hacia el destino.
      const dx = d.target.x - d.pos.x;
      const dz = d.target.y - d.pos.y;
      const dist = Math.hypot(dx, dz);
      if (d.state === "walking" && dist > 0.04) {
        const step = Math.min((d.hurry ? HURRY_SPEED : WALK_SPEED) * dt, dist);
        d.pos.x += (dx / dist) * step;
        d.pos.y += (dz / dist) * step;
        d.facing += shortestAngle(d.facing, Math.atan2(dx, dz)) * Math.min(1, 6 * dt);
      } else {
        if (d.state === "walking") d.state = "idle";
        d.hurry = false;
        const partner = d.state === "talking" && d.talkPartner !== null ? dolls[d.talkPartner] : null;
        if (partner) {
          // Charlando: se miran entre ellos, no a la cámara.
          const toPartner = Math.atan2(partner.pos.x - d.pos.x, partner.pos.y - d.pos.y);
          d.facing += shortestAngle(d.facing, toPartner) * Math.min(1, 3 * dt);
        } else {
          // Parado: mira a la cámara, como los personajes de la referencia
          // cuando notan el puntero.
          const toCam = Math.atan2(camera.position.x - d.pos.x, camera.position.z - d.pos.y);
          d.facing += shortestAngle(d.facing, toCam) * Math.min(1, 2.5 * dt);
        }
      }

      group.position.set(d.pos.x, 0, d.pos.y);
      group.rotation.y = d.facing;
      partnerRefs.current[i].current =
        d.state === "talking" && d.talkPartner !== null ? (groups.current[d.talkPartner] ?? null) : null;

      if (d.state !== prevState) {
        (stateChanges ??= {})[d.spec.id] = d.state;
      }
    }

    // ---- Cámara ----
    const selected = selectedId ? dolls.find((d) => d.spec.id === selectedId) : undefined;
    const aspect = size.width / Math.max(size.height, 1);
    const persp = camera as THREE.PerspectiveCamera;

    // FOV horizontal constante (ver `fovForAspect`).
    const fov = fovForAspect(aspect);
    if (Math.abs(persp.fov - fov) > 1e-3) {
      persp.fov = fov;
      persp.updateProjectionMatrix();
    }

    // Entrada: acercamiento con ease-out cúbico hasta la pose de reposo.
    // Seleccionar a alguien a mitad la corta (el muelle sigue desde ahí).
    if (selected) introClock.current = INTRO.delay + INTRO.seconds;
    introClock.current += dt;
    const introT = THREE.MathUtils.clamp((introClock.current - INTRO.delay) / INTRO.seconds, 0, 1);
    const away = Math.pow(1 - introT, 3);

    // Destino (pivote, cilíndricas y encuadre) del frame.
    let tx: number;
    let ty: number;
    let tz: number;
    let tRadius: number;
    let tAzimuth: number;
    let tHeight: number;
    let tsx = 0;
    let tsy = 0;

    if (selected) {
      // Plano decidido UNA vez por selección (ver `plaza-focus.ts`), donde
      // está el muñeco: seleccionado deja de andar y se queda ahí.
      if (focusFor.current !== selected.spec.id) {
        focusFor.current = selected.spec.id;
        const screen = size.width >= FOCUS.wideFrom ? FOCUS.screen.wide : FOCUS.screen.narrow;
        const view: FocusView = {
          tanHalfH: Math.tan(THREE.MathUtils.degToRad(persp.fov / 2)) * aspect,
          screenX: screen.x,
        };
        const others = dolls.filter((o) => o !== selected);
        const plan = planFocus(
          selected.pos,
          others.map((o) => o.pos),
          decorObstacles,
          view,
        );
        focusAzimuth.current = plan.azimuth;
        // Los que siguen estorbando en ese plano le hacen sitio: andan con
        // paso ligero hasta salir del encuadre (o a segundo plano), y ese
        // sitio pasa a ser su casa, como al soltarlos con la mano.
        for (const i of plan.intruders) {
          const o = others[i];
          if (o.state === "held") continue;
          const aside = stepAsideTarget(o.pos, selected.pos, plan.azimuth, view);
          o.target.copy(aside);
          o.home.copy(aside);
          o.state = "walking";
          o.hurry = true;
          o.timer = 4;
          o.talkPartner = null;
          (stateChanges ??= {})[o.spec.id] = "walking";
        }
      }
      tx = selected.pos.x;
      ty = FOCUS.pivotY;
      tz = selected.pos.y;
      tRadius = FOCUS.distance;
      tAzimuth = focusAzimuth.current;
      tHeight = FOCUS.height;
      const screen = size.width >= FOCUS.wideFrom ? FOCUS.screen.wide : FOCUS.screen.narrow;
      tsx = screen.x;
      tsy = screen.y;
      // Se recoloca el vaivén para reanudar desde donde quedó la cámara al
      // cerrar la ficha, sin latigazo (acotado al arco del vaivén).
      const camAngle = Math.atan2(
        tz + Math.sin(tAzimuth) * tRadius,
        tx + Math.cos(tAzimuth) * tRadius,
      );
      orbitAngle.current = ORBIT.center + THREE.MathUtils.clamp(
        shortestAngle(ORBIT.center, camAngle),
        -ORBIT.sweep,
        ORBIT.sweep,
      );
      sweepPhase.current = Math.asin(shortestAngle(ORBIT.center, orbitAngle.current) / ORBIT.sweep);
    } else {
      focusFor.current = null;
      if (!frozen) {
        sweepPhase.current += ((Math.PI * 2) / ORBIT.period) * dt;
        orbitAngle.current = ORBIT.center + Math.sin(sweepPhase.current) * ORBIT.sweep;
      }
      tx = 0;
      ty = ORBIT.lookAt;
      tz = 0;
      tRadius = ORBIT.radius + INTRO.extraRadius * away;
      tAzimuth = orbitAngle.current;
      tHeight = ORBIT.height + INTRO.extraHeight * away;
    }

    if (!cam.current) {
      // Primer frame: la cámara nace en el destino, parada.
      const at = (value: number): Spring => ({ value, velocity: 0 });
      cam.current = {
        px: at(tx),
        py: at(ty),
        pz: at(tz),
        radius: at(tRadius),
        azimuth: at(tAzimuth),
        height: at(tHeight),
        sx: at(tsx),
        sy: at(tsy),
      };
    }
    const c = cam.current;
    // El azimut se persigue por el lado corto: el destino se desenrolla
    // respecto al valor actual en vez de saltar de 359° a 0°.
    tAzimuth = c.azimuth.value + shortestAngle(c.azimuth.value, tAzimuth);

    if (introT < 1) {
      // Durante la entrada manda la curva, no el muelle (si no, el muelle se
      // comería medio acercamiento). La velocidad se mantiene al día para que
      // el relevo al muelle al acabar —o al cortarla con un clic— no tenga
      // tirón.
      const drive = (s: Spring, v: number) => {
        s.velocity = dt > 0 ? (v - s.value) / dt : 0;
        s.value = v;
      };
      drive(c.px, tx);
      drive(c.py, ty);
      drive(c.pz, tz);
      drive(c.radius, tRadius);
      drive(c.azimuth, tAzimuth);
      drive(c.height, tHeight);
      drive(c.sx, tsx);
      drive(c.sy, tsy);
    } else {
      // Con reduced-motion los cambios de plano son corte.
      const t = reducedMotion
        ? 1e-4
        : selected
          ? CAMERA_SPRING.focus
          : wasSelected.current
            ? CAMERA_SPRING.release
            : CAMERA_SPRING.follow;
      smoothDamp(c.px, tx, t, dt);
      smoothDamp(c.py, ty, t, dt);
      smoothDamp(c.pz, tz, t, dt);
      smoothDamp(c.radius, tRadius, t, dt);
      smoothDamp(c.azimuth, tAzimuth, t, dt);
      smoothDamp(c.height, tHeight, t, dt);
      smoothDamp(c.sx, tsx, t, dt);
      smoothDamp(c.sy, tsy, t, dt);
      // Tras soltar una ficha, el muelle lento dura hasta llegar al parque;
      // después vuelve al de seguir el vaivén.
      if (!selected && wasSelected.current && Math.abs(c.radius.value - tRadius) < 0.05) {
        wasSelected.current = false;
      }
    }
    if (selected) wasSelected.current = true;

    camera.position.set(
      c.px.value + Math.cos(c.azimuth.value) * c.radius.value,
      c.height.value,
      c.pz.value + Math.sin(c.azimuth.value) * c.radius.value,
    );

    // Encuadre: para que el pivote caiga en (sx, sy) de pantalla, se mira a
    // un punto desplazado en el plano de la imagen. Con la ficha a la derecha,
    // el muñeco queda a la izquierda del centro sin que ella lo tape.
    const dist = camera.position.distanceTo(lookCurrent.current.set(c.px.value, c.py.value, c.pz.value));
    const halfV = Math.tan(THREE.MathUtils.degToRad(persp.fov / 2));
    const right = _right.current.set(Math.sin(c.azimuth.value), 0, -Math.cos(c.azimuth.value));
    lookCurrent.current.addScaledVector(right, -c.sx.value * dist * halfV * aspect);
    lookCurrent.current.y -= c.sy.value * dist * halfV;
    camera.lookAt(lookCurrent.current);

    // Relleno de foco: su fundido va pegado al radio del muelle, así que
    // entra y sale con el propio travelling, sin saltos.
    updateFocusFill(
      fillRef.current,
      mode,
      camera.position,
      _pivot.current.set(c.px.value, c.py.value, c.pz.value),
      focusFillAmount(c.radius.value, ORBIT.radius, FOCUS.distance),
    );

    if (stateChanges) {
      const changes = stateChanges;
      setStates((prev) => ({ ...prev, ...changes }));
    }

    if (!readyFired.current) {
      readyFired.current = true;
      // Tras el primer frame pintado: si avisásemos en el mount, el loader se
      // iría antes de que hubiera nada en pantalla.
      onReady?.();
    }
    void state;
  });

  return (
    <>
      {/* Niebla, IBL y luces: hijas directas de la escena. */}
      <PlazaLighting mode={mode} />
      <FocusFill mode={mode} ref={fillRef} />
      <PlazaRoom mode={mode} still={still} holding={holding} />

      {/* Suelo invisible que captura el click "al vacío" para cerrar la ficha. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerDown={() => onSelect(null)}
        visible={false}
      >
        <planeGeometry args={[120, 120]} />
        <meshBasicMaterial />
      </mesh>

      {specs.map((spec, i) => (
        <group
          key={spec.id}
          ref={(el) => {
            groups.current[i] = el;
          }}
          position={[spec.home[0], 0, spec.home[1]]}
          rotation={[0, spec.facing, 0]}
          onPointerDown={handlePointerDown(spec.id, i)}
          onPointerOver={handleHover(spec.id)}
          onPointerOut={handleHover(null)}
        >
          <PlazaDoll
            spec={spec}
            mode={mode}
            partnerRef={partnerRefs.current[i]}
            state={
              states[spec.id] === "held" ? "held" : selectedId === spec.id ? "focused" : (states[spec.id] ?? "idle")
            }
            highlighted={hovered === spec.id || selectedId === spec.id || states[spec.id] === "held"}
          />
        </group>
      ))}
    </>
  );
}
