"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type * as THREE from "three";

import { HOTSPOTS, type HotspotId } from "./street-config";

interface HotspotProps {
  id: HotspotId;
  /** Apuntado aquí o desde su canal en el HUD. */
  active: boolean;
  /** Congela el vaivén de la baliza (`?quieto`). */
  still: boolean;
  /** Caja de click: medida y centro locales. Más grande que el objeto, para
   * que se acierte sin afinar. */
  hitSize: [number, number, number];
  hitCenter: [number, number, number];
  /** Rótulo de la etiqueta (canal) y verbo que aparece al apuntar. */
  label: string;
  action: string;
  onHover: (id: HotspotId) => void;
  /** El puntero ha salido (con margen): quien escucha decide si lo suelta. */
  onLeave: (id: HotspotId) => void;
  onActivate: (id: HotspotId) => void;
  children: ReactNode;
}

const BEACON_BOB = { amp: 0.06, speed: 2.2 } as const;
/**
 * Margen antes de soltar el enfoque. Al acercarse la cámara el objeto se
 * mueve bajo el ratón, y sin margen el puntero "salía" en pleno acercamiento,
 * la cámara volvía, el objeto regresaba bajo el puntero… y en bucle.
 */
const LEAVE_DELAY_MS = 320;
/** Con el objeto enfocado, la zona de hover crece por lo mismo. */
const ACTIVE_HIT_SCALE = 1.7;

/**
 * Objeto de contacto de la calle: coloca su pieza, le pone baliza lima (el
 * mismo código visual que los contenedores clicables del hero) y una etiqueta
 * DOM, y traduce el puntero en `onHover` / `onActivate`.
 *
 * La etiqueta va siempre a la vista: aquí no hay nada que descubrir, cada
 * objeto es un canal y tiene que decir cuál es sin pasar el ratón.
 */
export function Hotspot({
  id,
  active,
  still,
  hitSize,
  hitCenter,
  label,
  action,
  onHover,
  onLeave,
  onActivate,
  children,
}: HotspotProps) {
  const spot = HOTSPOTS[id];
  const beacon = useRef<THREE.Mesh>(null);
  const leaveTimer = useRef<number | null>(null);

  const cancelLeave = () => {
    if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = null;
  };
  useEffect(() => cancelLeave, []);

  useFrame((state) => {
    const b = beacon.current;
    if (!b) return;
    const t = still ? 0 : state.clock.elapsedTime;
    b.position.y = spot.beacon + Math.sin(t * BEACON_BOB.speed) * BEACON_BOB.amp;
    b.rotation.y = t * 1.4;
    const s = active ? 1.35 : 1;
    b.scale.setScalar(s);
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    cancelLeave();
    onHover(id);
  };
  const out = () => {
    cancelLeave();
    leaveTimer.current = window.setTimeout(() => {
      leaveTimer.current = null;
      onLeave(id);
    }, LEAVE_DELAY_MS);
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onActivate(id);
  };

  return (
    <group position={[spot.x, 0, spot.z]} rotation={[0, spot.rotY, 0]}>
      {children}

      {/* Zona de click invisible: se dibuja sin escribir color ni profundidad,
          igual que la de las máquinas de la recreativa. */}
      <mesh
        position={hitCenter}
        scale={active ? ACTIVE_HIT_SCALE : 1}
        onPointerOver={over}
        onPointerOut={out}
        onClick={click}
      >
        <boxGeometry args={hitSize} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>

      <mesh ref={beacon} position={[0, spot.beacon, 0]}>
        <octahedronGeometry args={[0.11, 0]} />
        <meshBasicMaterial color="#c8ff00" toneMapped={false} />
      </mesh>

      <Html
        position={[0, spot.beacon + 0.32, 0]}
        center
        // Por debajo del HUD (z-10) y del Header (z-50): por defecto drei usa
        // un z-index enorme y la etiqueta se pintaba encima de la cápsula.
        zIndexRange={[5, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          data-testid={`street-tag-${id}`}
          data-active={active}
          className={`holo-surface holo-solid whitespace-nowrap px-2.5 py-1 text-center transition-[transform,border-color] duration-[var(--duration)] [transition-timing-function:var(--ease)] ${active ? "-translate-y-1 border-accent" : ""}`}
        >
          <span className="micro-label micro-label-accent block">{label}</span>
          <span
            className={`micro-label block overflow-hidden transition-[max-height,opacity] duration-[var(--duration)] [transition-timing-function:var(--ease)] ${active ? "max-h-6 opacity-100" : "max-h-0 opacity-0"}`}
          >
            {action}
          </span>
        </div>
      </Html>
    </group>
  );
}
