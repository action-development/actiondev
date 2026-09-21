"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LIGHTHOUSE } from "./PortBay";
import { LighthouseBeam } from "./LighthouseBeam";
import type { GullAlert } from "./lighthouse-alert";

/**
 * Faro del modo "painted". El fondo IA ya no lo lleva: aquí se dibuja con el
 * mismo lenguaje (tinta, torre blanca), destella y su haz gira (`LighthouseBeam`).
 *
 * Es además el botón del easter egg "Alerta del faro": mientras dura, la
 * linterna late en rojo en vez de destellar en grupos de dos.
 */

/* -------------------------------- Faro -------------------------------- */

function towerShape(bottomW: number, topW: number, h: number) {
  const s = new THREE.Shape();
  s.moveTo(-bottomW / 2, 0);
  s.lineTo(bottomW / 2, 0);
  s.lineTo(topW / 2, h);
  s.lineTo(-topW / 2, h);
  s.closePath();
  return s;
}

/** Faro de Cíes (Monteagudo): torre blanca y linterna que destella en grupos de 2. */
export function PaintedLighthouse({ alert }: { alert?: RefObject<GullAlert> }) {
  const lampRef = useRef<THREE.MeshBasicMaterial>(null);

  const geo = useMemo(() => ({
    ink: new THREE.ShapeGeometry(towerShape(1.5, 1.0, 2.9)),
    tower: new THREE.ShapeGeometry(towerShape(1.2, 0.76, 2.75)),
    shade: new THREE.ShapeGeometry((() => {
      const s = new THREE.Shape();
      s.moveTo(0.1, 0); s.lineTo(0.6, 0); s.lineTo(0.38, 2.75); s.lineTo(0.06, 2.75); s.closePath();
      return s;
    })()),
  }), []);
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const lamp = lampRef.current;
    if (!lamp) return;
    if (alert?.current.active) {
      // Alerta: deja de destellar en grupos y late en rojo, deprisa.
      const pulse = 0.5 + 0.5 * Math.sin(t * 14);
      lamp.color.setRGB(0.55 + 0.45 * pulse, 0.1 * pulse, 0.05 * pulse);
      return;
    }
    const phase = t % 8;
    const flash = phase < 0.35 || (phase > 0.9 && phase < 1.25) ? 1 : 0.2;
    lamp.color.setScalar(0.75 + 0.25 * flash);
  });

  const flat = { toneMapped: false, fog: false } as const;

  return (
    <group position={LIGHTHOUSE}>
      <mesh geometry={geo.ink} position={[0, -0.08, 0]}>
        <meshBasicMaterial color="#1a1410" {...flat} />
      </mesh>
      <mesh geometry={geo.tower} position={[0, 0, 0.05]}>
        <meshBasicMaterial color="#f3ede0" {...flat} />
      </mesh>
      <mesh geometry={geo.shade} position={[0, 0, 0.08]}>
        <meshBasicMaterial color="#c9b9b4" {...flat} />
      </mesh>
      {/* Galería */}
      <mesh position={[0, 2.8, 0.1]}>
        <planeGeometry args={[1.25, 0.16]} />
        <meshBasicMaterial color="#1a1410" {...flat} />
      </mesh>
      {/* Linterna */}
      <mesh position={[0, 3.12, 0.1]}>
        <planeGeometry args={[0.66, 0.5]} />
        <meshBasicMaterial color="#1a1410" {...flat} />
      </mesh>
      <mesh position={[0, 3.12, 0.12]}>
        <planeGeometry args={[0.5, 0.36]} />
        <meshBasicMaterial ref={lampRef} color="#fff1a8" {...flat} />
      </mesh>
      {/* Cúpula */}
      <mesh position={[0, 3.37, 0.1]}>
        <circleGeometry args={[0.36, 16, 0, Math.PI]} />
        <meshBasicMaterial color="#1a1410" {...flat} />
      </mesh>
      <group position={[0, 3.12, 0.15]}>
        <LighthouseBeam alert={alert} />
      </group>
    </group>
  );
}
