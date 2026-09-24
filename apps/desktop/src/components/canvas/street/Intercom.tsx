"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { INTERCOM } from "./street-config";
import { atlasPlane, boxBetween, merge, roundedBox } from "./street-geometry";
import {
  INTERCOM_ACTION_ROW,
  INTERCOM_ROWS,
  getBrushedSteelTexture,
  getNameCardsTexture,
} from "./street-textures";

interface IntercomProps {
  active: boolean;
  /** Se incrementa en cada uso: el pulsador de Action se hunde y parpadea. */
  activation: number;
  lightsOn: boolean;
}

/** Llamada: el pulsador se hunde y el aro parpadea. */
const RING = { seconds: 1.5, blinks: 4, press: 0.006 } as const;
/** Filas de nombres: primera fila, paso y columnas de tarjeta y pulsador. */
const ROWS = { top: 1.715, pitch: 0.07, cardX: -0.05, cardW: 0.29, cardH: 0.046, buttonX: 0.165 } as const;
/** Canto frontal de la placa (sobre el muro del soportal). */
const FACE_Z = 0.045;

/**
 * Placa de portero automático con videocámara, a nivel de producto:
 * - marco de aluminio anodizado y frontal de acero cepillado, con cuatro
 *   tornillos de seguridad y visera antilluvia;
 * - módulo de cámara: cristal negro, lente con aro cromado y LED infrarrojos;
 * - siete filas de tarjeta tras visor (retroiluminadas de noche) con su
 *   pulsador cromado; la de Action, en lima y con aro de luz;
 * - rejilla de altavoz perforada y LED de estado.
 *
 * Es el canal "llámame tú": pulsar el de Action lo hunde, hace parpadear su
 * aro y abre el campo del teléfono en el HUD.
 */
export function Intercom({ active, activation, lightsOn }: IntercomProps) {
  const { w, h, y } = INTERCOM;
  const tex = useMemo(() => ({ steel: getBrushedSteelTexture(), cards: getNameCardsTexture() }), []);

  const geo = useMemo(() => {
    const frame = merge([
      roundedBox(w, h, FACE_Z, 0.02, [0, y, FACE_Z / 2]),
      // Visera: vuela sobre la placa para que la lluvia no entre al altavoz.
      roundedBox(w + 0.05, 0.028, 0.1, 0.01, [0, y + h / 2 + 0.012, 0.05]),
    ]);
    const face = roundedBox(w - 0.04, h - 0.04, 0.006, 0.006, [0, y, FACE_Z + 0.002]);

    // Cámara: módulo de cristal negro, lente e infrarrojos.
    const camY = y + h / 2 - 0.09;
    const glass = merge([
      roundedBox(0.19, 0.1, 0.014, 0.012, [0, camY, FACE_Z + 0.009]),
      new THREE.SphereGeometry(0.02, 20, 12).scale(1, 1, 0.55).translate(0, camY, FACE_Z + 0.017),
    ]);
    const chrome: THREE.BufferGeometry[] = [
      new THREE.TorusGeometry(0.025, 0.004, 8, 24).translate(0, camY, FACE_Z + 0.017),
    ];
    const ir: THREE.BufferGeometry[] = [-0.07, -0.05, 0.05, 0.07].map((x) =>
      new THREE.CircleGeometry(0.006, 12).translate(x, camY, FACE_Z + 0.0165)
    );

    // Filas: visor oscuro, tarjeta del atlas y pulsador cromado.
    const visors: THREE.BufferGeometry[] = [];
    const cards: THREE.BufferGeometry[] = [];
    for (let i = 0; i < INTERCOM_ROWS; i++) {
      const ry = ROWS.top - i * ROWS.pitch;
      visors.push(roundedBox(ROWS.cardW + 0.018, ROWS.cardH + 0.016, 0.006, 0.004, [ROWS.cardX, ry, FACE_Z + 0.005]));
      const v1 = 1 - i / INTERCOM_ROWS;
      cards.push(atlasPlane(ROWS.cardW, ROWS.cardH, 0, v1 - 1 / INTERCOM_ROWS, 1, v1).translate(ROWS.cardX, ry, FACE_Z + 0.0085));
      if (i !== INTERCOM_ACTION_ROW) {
        chrome.push(
          new THREE.CylinderGeometry(0.019, 0.02, 0.01, 24).rotateX(Math.PI / 2).translate(ROWS.buttonX, ry, FACE_Z + 0.007)
        );
      }
    }

    // Rejilla del altavoz y tornillos.
    const holes: THREE.BufferGeometry[] = [];
    const grilleY = y - h / 2 + 0.08;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 11; c++) {
        holes.push(new THREE.CircleGeometry(0.0055, 8).translate(-0.12 + c * 0.021 + (r % 2) * 0.0105, grilleY - 0.03 + r * 0.02, FACE_Z + 0.0055));
      }
    }
    for (const [sx, sy] of [
      [-1, 1],
      [1, 1],
      [-1, -1],
      [1, -1],
    ]) {
      chrome.push(
        new THREE.CylinderGeometry(0.009, 0.009, 0.004, 12)
          .rotateX(Math.PI / 2)
          .translate(sx * (w / 2 - 0.035), y + sy * (h / 2 - 0.035), FACE_Z + 0.006)
      );
    }

    return {
      frame,
      face,
      glass,
      chrome: merge(chrome),
      ir: merge(ir),
      visors: merge(visors),
      cards: merge(cards),
      holes: merge([...holes, boxBetween(0.155, 0.175, grilleY - 0.01, grilleY + 0.01, FACE_Z + 0.004, FACE_Z + 0.006)]),
      actionButton: new THREE.CylinderGeometry(0.019, 0.02, 0.012, 24).rotateX(Math.PI / 2),
      actionRing: new THREE.TorusGeometry(0.024, 0.0035, 8, 28),
      led: new THREE.CircleGeometry(0.005, 12).translate(0.165, grilleY + 0.028, FACE_Z + 0.006),
    };
  }, [w, h, y]);

  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  const buttonRef = useRef<THREE.Group>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const ledMat = useRef<THREE.MeshBasicMaterial>(null);
  const startedAt = useRef<number | null>(null);
  const clock = useRef(0);

  useEffect(() => {
    if (activation > 0) startedAt.current = clock.current;
  }, [activation]);

  useFrame((state) => {
    clock.current = state.clock.elapsedTime;
    const button = buttonRef.current;
    const ring = ringMat.current;
    const led = ledMat.current;
    if (!button || !ring || !led) return;
    let lit = active ? 1 : lightsOn ? 0.75 : 0.45;
    let press = 0;
    let calling = false;
    if (startedAt.current !== null) {
      const p = (clock.current - startedAt.current) / RING.seconds;
      if (p >= 1) startedAt.current = null;
      else {
        calling = true;
        press = p < 0.15 ? 1 : 0;
        lit = Math.floor(p * RING.blinks * 2) % 2 === 0 ? 1 : 0.15;
      }
    }
    button.position.z = FACE_Z + 0.008 - press * RING.press;
    ring.opacity = lit;
    led.color.set(calling ? "#3dff6a" : "#1f4a26");
  });

  const actionY = ROWS.top - INTERCOM_ACTION_ROW * ROWS.pitch;

  return (
    <group>
      <mesh geometry={geo.frame} castShadow receiveShadow>
        <meshStandardMaterial color="#5d6369" roughness={0.35} metalness={0.8} />
      </mesh>
      <mesh geometry={geo.face} receiveShadow>
        <meshStandardMaterial map={tex.steel} roughness={0.28} metalness={0.9} />
      </mesh>
      <mesh geometry={geo.glass}>
        <meshStandardMaterial color="#07080a" roughness={0.06} metalness={0.6} envMapIntensity={1.5} />
      </mesh>
      <mesh geometry={geo.ir}>
        <meshBasicMaterial color={lightsOn ? "#5a0d0d" : "#2a0a0a"} />
      </mesh>
      <mesh geometry={geo.chrome} castShadow>
        <meshStandardMaterial color="#eef0f2" roughness={0.1} metalness={1} />
      </mesh>
      <mesh geometry={geo.visors}>
        <meshStandardMaterial color="#1b1d20" roughness={0.4} metalness={0.4} />
      </mesh>
      {/* Tarjetas tras visor: retroiluminadas de noche. */}
      <mesh geometry={geo.cards}>
        <meshStandardMaterial
          map={tex.cards}
          emissive="#ffffff"
          emissiveMap={tex.cards}
          emissiveIntensity={lightsOn ? 0.55 : 0}
          roughness={0.15}
        />
      </mesh>
      <mesh geometry={geo.holes}>
        <meshBasicMaterial color="#0b0c0d" />
      </mesh>
      <mesh geometry={geo.led}>
        <meshBasicMaterial ref={ledMat} color="#1f4a26" toneMapped={false} />
      </mesh>

      {/* Pulsador de Action: se hunde al llamar; su aro lima es la luz. */}
      <group ref={buttonRef} position={[ROWS.buttonX, actionY, FACE_Z + 0.008]}>
        <mesh geometry={geo.actionButton}>
          <meshStandardMaterial color="#eef0f2" roughness={0.1} metalness={1} />
        </mesh>
        <mesh geometry={geo.actionRing} position={[0, 0, -0.002]}>
          <meshBasicMaterial ref={ringMat} color="#c8ff00" transparent toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
