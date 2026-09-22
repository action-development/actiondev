"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import { testimonials } from "@/data/testimonials";
import { PlazaRoom } from "./PlazaRoom";
import { PlazaDoll } from "./PlazaDoll";
import { FOUNTAIN_KEEP_OUT, PLAZA_FRONT_ANGLE, buildDolls, type DollSpec } from "./plaza-config";
import { clampDepth } from "./drag-depth";
import type { PlazaMode } from "./plaza-mode";

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

/**
 * Cámara en reposo: VAIVÉN lento delante del parque, no una órbita completa.
 *
 * Antes daba la vuelta entera (360°). Se acotó a un arco corto centrado
 * enfrente del telón (`PLAZA_FRONT_ANGLE` + 180°) por dos razones:
 * - Da igual sensación de espacio. El parallax entre fuente, muñecos, farolas
 *   y arbolado es lo que hace que la escena se lea como un sitio y no como una
 *   foto, y eso ya lo da un vaivén de ±22°.
 * - Permite decorar el fondo. Con la cámara dando la vuelta hay que resolver
 *   los 360° en 3D; acotada, el horizonte que se ve es siempre el mismo arco y
 *   ahí sí cabe un telón pintado (ver `PlazaBackdrop`).
 *
 * `period` es el ciclo completo de ida y vuelta, en segundos. Largo a
 * propósito: tiene que leerse como una respiración, no como un barrido.
 */
const ORBIT = {
  radius: 11.5,
  height: 3.6,
  lookAt: 0.7,
  /** Centro del vaivén: enfrente del telón. */
  center: PLAZA_FRONT_ANGLE + Math.PI,
  /** Amplitud a cada lado, en radianes (±22°). */
  sweep: 0.384,
  period: 46,
} as const;
/** Cámara enfocando a un muñeco: se planta a un lado de él, a su altura. */
const FOCUS = { distance: 3.4, height: 1.15, lookAt: 0.74, offset: 0.78 } as const;

/**
 * Suavizado exponencial independiente del framerate.
 *
 * Un `lerp(a, b, 0.1)` por frame va al doble de rápido a 120 Hz que a 60 Hz; la
 * cámara se sentiría distinta en cada monitor. Esta forma fija el tiempo de
 * convergencia en segundos, no en frames.
 */
function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/** Diferencia angular mínima con signo, para girar siempre por el lado corto. */
function shortestAngle(from: number, to: number): number {
  return ((((to - from) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
}

export function PlazaWorld({ mode, selectedId, onSelect, onReady, onHoldChange }: PlazaWorldProps) {
  const { camera, gl } = useThree();

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
    })),
  );

  const groups = useRef<(THREE.Group | null)[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

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

  // Vectores de trabajo reutilizados: sin `new` dentro del bucle de render.
  const camTarget = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());
  const lookCurrent = useRef(new THREE.Vector3(0, ORBIT.lookAt, 0));

  const drag = useRef<DragState | null>(null);

  /** Pasa un click en curso a arrastre: el muñeco pasa a la mano. */
  const activateDrag = useCallback(
    (d: DragState) => {
      d.active = true;
      // Arrastrar es jugar, no leer: se cierra la ficha si estaba abierta.
      onSelect(null);
      setHovered(d.id);
      document.body.style.cursor = "grabbing";
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
          if (radius > MAX_RADIUS) {
            d.pos.multiplyScalar(MAX_RADIUS / radius);
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
        // El seleccionado deja de pasear y vuelve a su sitio para la ficha.
        d.target.copy(d.home);
        d.state = "idle";
        d.talkPartner = null;
      } else if (!still) {
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
          } else if (roll < 0.75) {
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
        const step = Math.min(WALK_SPEED * dt, dist);
        d.pos.x += (dx / dist) * step;
        d.pos.y += (dz / dist) * step;
        d.facing += shortestAngle(d.facing, Math.atan2(dx, dz)) * Math.min(1, 6 * dt);
      } else {
        if (d.state === "walking") d.state = "idle";
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

      if (d.state !== prevState) {
        (stateChanges ??= {})[d.spec.id] = d.state;
      }
    }

    // ---- Cámara ----
    const selected = selectedId ? dolls.find((d) => d.spec.id === selectedId) : undefined;

    if (selected) {
      // Plantada SIEMPRE por el lado abierto de la plaza (el de la cámara en
      // reposo), no en la línea centro-muñeco: así la ficha siempre se lee con
      // el parque pintado de fondo y nunca contra el lado sin decorar. El
      // muñeco seleccionado gira hacia la cámara, así que se le sigue viendo
      // la cara desde cualquier sitio en el que esté.
      const fx = Math.cos(ORBIT.center);
      const fz = Math.sin(ORBIT.center);
      camTarget.current.set(
        selected.pos.x + fx * FOCUS.distance,
        FOCUS.height,
        selected.pos.y + fz * FOCUS.distance,
      );
      // La cámara mira a un punto a la DERECHA del muñeco (vector derecho de
      // la vista): el personaje queda en el tercio izquierdo y la ficha,
      // anclada a la derecha, no lo tapa.
      lookTarget.current.set(
        selected.pos.x + fz * FOCUS.offset,
        FOCUS.lookAt,
        selected.pos.y - fx * FOCUS.offset,
      );
      // Se recoloca el vaivén para reanudar desde donde quedó la cámara al
      // cerrar la ficha, sin latigazo.
      orbitAngle.current = Math.atan2(camTarget.current.z, camTarget.current.x);
      sweepPhase.current = Math.asin(
        THREE.MathUtils.clamp(shortestAngle(ORBIT.center, orbitAngle.current) / ORBIT.sweep, -1, 1),
      );
    } else {
      if (!still) {
        sweepPhase.current += ((Math.PI * 2) / ORBIT.period) * dt;
        orbitAngle.current = ORBIT.center + Math.sin(sweepPhase.current) * ORBIT.sweep;
      }
      camTarget.current.set(
        Math.cos(orbitAngle.current) * ORBIT.radius,
        ORBIT.height,
        Math.sin(orbitAngle.current) * ORBIT.radius,
      );
      lookTarget.current.set(0, ORBIT.lookAt, 0);
    }

    const lambda = selected ? 3.2 : 1.6;
    camera.position.x = damp(camera.position.x, camTarget.current.x, lambda, dt);
    camera.position.y = damp(camera.position.y, camTarget.current.y, lambda, dt);
    camera.position.z = damp(camera.position.z, camTarget.current.z, lambda, dt);

    lookCurrent.current.x = damp(lookCurrent.current.x, lookTarget.current.x, lambda, dt);
    lookCurrent.current.y = damp(lookCurrent.current.y, lookTarget.current.y, lambda, dt);
    lookCurrent.current.z = damp(lookCurrent.current.z, lookTarget.current.z, lambda, dt);
    camera.lookAt(lookCurrent.current);

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
      <PlazaRoom mode={mode} still={still} />

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
