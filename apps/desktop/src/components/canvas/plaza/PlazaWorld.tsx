"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import { testimonials } from "@/data/testimonials";
import { PlazaRoom } from "./PlazaRoom";
import { PlazaDoll } from "./PlazaDoll";
import { buildDolls, type DollSpec } from "./plaza-config";

interface PlazaWorldProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onReady?: () => void;
}

/** Estado vivo de cada muñeco. Fuera de React: cambia 60 veces por segundo. */
interface DollRuntime {
  spec: DollSpec;
  /** Posición actual en el suelo. */
  pos: THREE.Vector2;
  /** Destino al que camina. */
  target: THREE.Vector2;
  /** Rotación actual e inercia de giro (radianes). */
  facing: number;
  /** Segundos que quedan del estado actual. */
  timer: number;
  state: "idle" | "walking" | "waving";
}

/** Velocidad de paseo, unidades/segundo. Lento a propósito: es una plaza, no una carrera. */
const WALK_SPEED = 0.55;
/** Radio máximo de deambulación alrededor de su sitio. */
const WANDER_RADIUS = 1.15;

/** Cámara en reposo: órbita lenta alrededor del centro de la plaza. */
const ORBIT = { radius: 11.5, height: 3.6, speed: 0.04, lookAt: 0.7 } as const;
/** Cámara enfocando a un muñeco: se planta delante de él, a su altura. */
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

export function PlazaWorld({ selectedId, onSelect, onReady }: PlazaWorldProps) {
  const { camera } = useThree();

  const specs = useMemo(() => buildDolls(testimonials.map((t) => t.id)), []);

  // Estado vivo: se crea una vez y se muta en `useFrame`. Meterlo en useState
  // provocaría un render por frame y por muñeco.
  const runtime = useRef<DollRuntime[]>(
    specs.map((spec) => ({
      spec,
      pos: new THREE.Vector2(spec.home[0], spec.home[1]),
      target: new THREE.Vector2(spec.home[0], spec.home[1]),
      facing: spec.facing,
      timer: 1 + spec.phase,
      state: "idle" as const,
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
  const orbitAngle = useRef(Math.PI * 0.5);
  const readyFired = useRef(false);

  // Vectores de trabajo reutilizados: sin `new` dentro del bucle de render.
  const camTarget = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());
  const lookCurrent = useRef(new THREE.Vector3(0, ORBIT.lookAt, 0));

  const handleSelect = useCallback(
    (id: string) => (e: ThreeEvent<MouseEvent>) => {
      // Sin esto el click atraviesa al suelo que hay detrás y deselecciona
      // en el mismo gesto.
      e.stopPropagation();
      onSelect(id);
    },
    [onSelect],
  );

  const handleHover = useCallback(
    (id: string | null) => (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHovered(id);
      document.body.style.cursor = id ? "pointer" : "auto";
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

      if (isSelected) {
        // El seleccionado deja de pasear y vuelve a su sitio para la ficha.
        d.target.set(d.spec.home[0], d.spec.home[1]);
        d.state = "idle";
      } else {
        d.timer -= dt;
        if (d.timer <= 0) {
          // Reparto de comportamientos: la mayoría del tiempo quietos, algún
          // paseo corto y saludos ocasionales. Demasiado movimiento y la plaza
          // se lee como un hormiguero.
          const roll = Math.random();
          if (roll < 0.45) {
            d.state = "idle";
            d.timer = 2 + Math.random() * 3;
          } else if (roll < 0.85) {
            d.state = "walking";
            d.timer = 3 + Math.random() * 3;
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * WANDER_RADIUS;
            d.target.set(d.spec.home[0] + Math.cos(a) * r, d.spec.home[1] + Math.sin(a) * r);
          } else {
            d.state = "waving";
            d.timer = 1.6 + Math.random();
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
        // Parado: mira a la cámara, como los personajes de la referencia cuando
        // notan el puntero.
        const toCam = Math.atan2(camera.position.x - d.pos.x, camera.position.z - d.pos.y);
        d.facing += shortestAngle(d.facing, toCam) * Math.min(1, 2.5 * dt);
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
      // Plantada delante del muñeco, en la línea que va del centro hacia él,
      // para que nunca quede otro muñeco tapando al protagonista.
      const len = Math.hypot(selected.pos.x, selected.pos.y) || 1;
      camTarget.current.set(
        selected.pos.x + (selected.pos.x / len) * FOCUS.distance,
        FOCUS.height,
        selected.pos.y + (selected.pos.y / len) * FOCUS.distance,
      );
      // La cámara mira a un punto a la DERECHA del muñeco (vector derecho de
      // la vista, que va hacia el centro): el personaje queda en el tercio
      // izquierdo y la ficha, anclada a la derecha, no lo tapa.
      const rx = selected.pos.y / len;
      const rz = -selected.pos.x / len;
      lookTarget.current.set(
        selected.pos.x + rx * FOCUS.offset,
        FOCUS.lookAt,
        selected.pos.y + rz * FOCUS.offset,
      );
      // Se recoloca el ángulo de órbita para reanudar desde donde quedó la
      // cámara al cerrar la ficha, sin latigazo.
      orbitAngle.current = Math.atan2(camTarget.current.z, camTarget.current.x);
    } else {
      orbitAngle.current += ORBIT.speed * dt;
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
      <PlazaRoom />

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
          onPointerDown={handleSelect(spec.id)}
          onPointerOver={handleHover(spec.id)}
          onPointerOut={handleHover(null)}
        >
          <PlazaDoll
            spec={spec}
            state={selectedId === spec.id ? "focused" : (states[spec.id] ?? "idle")}
            highlighted={hovered === spec.id || selectedId === spec.id}
          />
        </group>
      ))}
    </>
  );
}
