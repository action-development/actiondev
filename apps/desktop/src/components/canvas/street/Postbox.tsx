"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { POSTBOX } from "./street-config";
import { boxBetween, merge, roundedBox } from "./street-geometry";
import { getCollectionPlateTexture, getPostboxPlateTexture } from "./street-textures";

interface PostboxProps {
  /** Se incrementa en cada uso: dispara la carta que entra por la boca. */
  activation: number;
  plateLabel: string;
  /** Título de la placa de horarios de recogida. */
  collectionTitle: string;
}

/** La carta se acerca, empuja la trampilla y entra. */
const LETTER = { seconds: 1.25 } as const;

/**
 * Buzón de pie, a nivel de producto:
 * - cuerpo de chapa lacada en amarillo con barniz (`clearcoat`), cantos
 *   redondeados, techo en bóveda con moldura y dos nervios de refuerzo;
 * - boca con marco cromado y TRAMPILLA articulada, que se abre hacia dentro
 *   cuando entra la carta;
 * - puerta de recogida con su junta, cerradura, placa «CARTAS» en relieve y
 *   placa de horarios;
 * - pie de fundición con brida y cuatro pernos.
 * Sin logotipo: la placa dice lo que es, no de quién.
 *
 * Es el canal email: usarlo echa una carta mientras se abre el cliente de
 * correo.
 */
export function Postbox({ activation, plateLabel, collectionTitle }: PostboxProps) {
  const { w, d, bodyH, footH } = POSTBOX;
  const tex = useMemo(
    () => ({
      plate: getPostboxPlateTexture(plateLabel),
      hours: getCollectionPlateTexture(collectionTitle),
    }),
    [plateLabel, collectionTitle]
  );

  const y0 = footH;
  const y1 = footH + bodyH;
  const front = d / 2;
  const slotY = y0 + bodyH * 0.8;
  const slotW = w * 0.62;

  const geo = useMemo(() => {
    const paint = merge([
      roundedBox(w, bodyH, d, 0.035, [0, y0 + bodyH / 2, 0]),
      // Bóveda: medio cilindro con tapas, apoyado en el cuerpo.
      new THREE.CylinderGeometry(d / 2, d / 2, w - 0.004, 32, 1, false, 0, Math.PI)
        // El medio cilindro de three es la mitad x ≥ 0 con el eje en y:
        // girándolo 90° en z queda con el eje a lo ancho y la mitad arriba.
        .rotateZ(Math.PI / 2)
        .translate(0, y1, 0),
      // Moldura entre cuerpo y bóveda, y dos nervios.
      roundedBox(w + 0.03, 0.035, d + 0.03, 0.012, [0, y1, 0]),
      roundedBox(w + 0.015, 0.02, d + 0.015, 0.008, [0, y0 + bodyH * 0.35, 0]),
      roundedBox(w + 0.015, 0.02, d + 0.015, 0.008, [0, y0 + 0.03, 0]),
      // Pie: fuste y collarín.
      roundedBox(0.2, footH, 0.2, 0.03, [0, footH / 2, 0]),
      roundedBox(0.26, 0.05, 0.26, 0.015, [0, footH - 0.025, 0]),
      // Visera sobre la boca.
      roundedBox(slotW + 0.08, 0.025, 0.07, 0.01, [0, slotY + 0.055, front + 0.03]),
    ]);

    // Junta de la puerta de recogida (el cuadro rehundido del frente).
    const doorX = w / 2 - 0.06;
    const doorY0 = y0 + 0.06;
    const doorY1 = y0 + bodyH * 0.62;
    const seam = merge([
      boxBetween(-doorX, doorX, doorY0, doorY0 + 0.004, front - 0.001, front + 0.002),
      boxBetween(-doorX, doorX, doorY1 - 0.004, doorY1, front - 0.001, front + 0.002),
      boxBetween(-doorX, -doorX + 0.004, doorY0, doorY1, front - 0.001, front + 0.002),
      boxBetween(doorX - 0.004, doorX, doorY0, doorY1, front - 0.001, front + 0.002),
      // Boca: el hueco oscuro detrás de la trampilla.
      boxBetween(-slotW / 2, slotW / 2, slotY - 0.03, slotY + 0.03, front - 0.05, front + 0.001),
    ]);

    const chrome = merge([
      // Marco de la boca.
      boxBetween(-slotW / 2 - 0.02, slotW / 2 + 0.02, slotY + 0.03, slotY + 0.042, front, front + 0.012),
      boxBetween(-slotW / 2 - 0.02, slotW / 2 + 0.02, slotY - 0.042, slotY - 0.03, front, front + 0.012),
      boxBetween(-slotW / 2 - 0.02, -slotW / 2, slotY - 0.03, slotY + 0.03, front, front + 0.012),
      boxBetween(slotW / 2, slotW / 2 + 0.02, slotY - 0.03, slotY + 0.03, front, front + 0.012),
      // Cerradura.
      new THREE.CylinderGeometry(0.018, 0.018, 0.014, 20).rotateX(Math.PI / 2).translate(doorX - 0.05, doorY0 + 0.07, front + 0.007),
      // Marcos de las placas.
      roundedBox(w * 0.66, w * 0.3, 0.008, 0.004, [0, y0 + bodyH * 0.45, front + 0.004]),
    ]);

    // Brida del pie con cuatro pernos.
    const iron = merge([
      new THREE.CylinderGeometry(0.19, 0.2, 0.035, 32).translate(0, 0.0175, 0),
      ...[0, 1, 2, 3].map((i) => {
        const a = Math.PI / 4 + (i * Math.PI) / 2;
        return new THREE.CylinderGeometry(0.018, 0.018, 0.03, 6).translate(Math.cos(a) * 0.15, 0.045, Math.sin(a) * 0.15);
      }),
    ]);

    return {
      paint,
      seam,
      chrome,
      iron,
      plate: new THREE.PlaneGeometry(w * 0.62, w * 0.26).translate(0, y0 + bodyH * 0.45, front + 0.009),
      hours: new THREE.PlaneGeometry(0.1, 0.125).translate(-doorX + 0.08, y0 + 0.16, front + 0.003),
      // Trampilla: pivota en su canto superior (origen del grupo).
      flap: boxBetween(-slotW / 2, slotW / 2, -0.058, 0, -0.004, 0.004),
      letter: new THREE.PlaneGeometry(0.26, 0.15).rotateX(-Math.PI / 2),
    };
  }, [w, d, bodyH, footH, y0, y1, front, slotY, slotW]);

  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  const flapRef = useRef<THREE.Group>(null);
  const letterRef = useRef<THREE.Mesh>(null);
  const startedAt = useRef<number | null>(null);
  const clock = useRef(0);

  useEffect(() => {
    if (activation > 0) startedAt.current = clock.current;
  }, [activation]);

  useFrame((state) => {
    clock.current = state.clock.elapsedTime;
    const flap = flapRef.current;
    const letter = letterRef.current;
    if (!flap || !letter) return;
    if (startedAt.current === null) {
      letter.visible = false;
      flap.rotation.x = 0;
      return;
    }
    const p = (clock.current - startedAt.current) / LETTER.seconds;
    if (p >= 1) {
      startedAt.current = null;
      return;
    }
    // 0-0.35: se acerca; 0.35-0.8: empuja la trampilla y entra; luego cierra.
    const approach = Math.min(1, p / 0.35);
    const enter = THREE.MathUtils.clamp((p - 0.35) / 0.45, 0, 1);
    const eased = enter * enter * (3 - 2 * enter);
    letter.visible = enter < 1;
    letter.position.set(0, slotY + 0.002, front + 0.4 - approach * 0.33 - eased * 0.28);
    letter.rotation.set(0.3 * (1 - approach), 0, 0);
    const open = p < 0.35 ? 0 : p < 0.8 ? eased : 1 - (p - 0.8) / 0.2;
    flap.rotation.x = -open * 1.2;
  });

  return (
    <group>
      <mesh geometry={geo.paint} castShadow receiveShadow>
        <meshPhysicalMaterial color="#f5c400" roughness={0.38} metalness={0.1} clearcoat={0.7} clearcoatRoughness={0.18} />
      </mesh>
      <mesh geometry={geo.seam}>
        <meshStandardMaterial color="#231d05" roughness={0.8} />
      </mesh>
      <mesh geometry={geo.chrome} castShadow>
        <meshStandardMaterial color="#e7e9eb" roughness={0.12} metalness={1} />
      </mesh>
      <mesh geometry={geo.iron} castShadow receiveShadow>
        <meshStandardMaterial color="#4a4d51" roughness={0.55} metalness={0.7} />
      </mesh>
      <mesh geometry={geo.plate}>
        <meshStandardMaterial map={tex.plate} roughness={0.35} metalness={0.3} />
      </mesh>
      <mesh geometry={geo.hours}>
        <meshStandardMaterial map={tex.hours} roughness={0.5} />
      </mesh>

      <group ref={flapRef} position={[0, slotY + 0.03, front + 0.006]}>
        <mesh geometry={geo.flap} castShadow>
          <meshStandardMaterial color="#d7dadd" roughness={0.2} metalness={0.95} />
        </mesh>
      </group>

      <mesh ref={letterRef} geometry={geo.letter} visible={false} castShadow>
        <meshStandardMaterial color="#fbfaf6" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
