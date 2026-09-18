"use client";

import { useEffect, useMemo, useRef } from "react";
import { RigidBody, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import { Outlines, Text } from "@react-three/drei";
import type { PortPalette } from "./time-of-day";
import { getToonGradient, OUTLINE } from "./toon";
import { createContainerMaterials } from "./container-textures";

/**
 * Contenedor marítimo navegable — sustituye a los antiguos cubos de cristal.
 *
 * Aspecto de contenedor pintado (nervios entintados, óxido, puertas): ver
 * `container-textures.ts`. Texturas de canvas 2D por contenedor, 0 bytes de red.
 *
 * Física bloqueada al plano de juego: traslación en z y rotación en x/y
 * desactivadas. Solo puede volcar sobre su eje z, que es lo que se ve.
 */

export interface ContainerData {
  id: string;
  /** Clave de `t.nav` para la etiqueta traducida (secciones del sitio). */
  labelKey?: "work" | "reviews" | "contact";
  /** Etiqueta literal, para lo que NO se traduce: marcas de cliente. */
  label?: string;
  href: string;
  color: string;
  /** Semiancho en x — 40 pies ≈ 2.0, 20 pies ≈ 1.3. */
  halfW: number;
}

export const CONTAINER_HALF_H = 0.75;
const HALF_D = 0.75;

interface CargoContainerProps {
  data: ContainerData;
  label: string;
  position: [number, number, number];
  palette: PortPalette;
  onRegister: (id: string, rb: RapierRigidBody | null) => void;
}

export function CargoContainer({ data, label, position, palette, onRegister }: CargoContainerProps) {
  const rbRef = useRef<RapierRigidBody>(null);
  const gradient = getToonGradient();
  const w = data.halfW * 2;
  // Ancho por carácter ≈ 0.86·fontSize con este letterSpacing; se reduce para
  // que etiquetas largas ("CONTACTO") quepan en un contenedor de 20 pies.
  const fontSize = Math.min(0.38, (w - 0.8) / (label.length * 0.86));

  const skin = useMemo(
    () => createContainerMaterials(data.id, data.color, w, gradient),
    [data.id, data.color, w, gradient],
  );
  useEffect(() => () => skin.dispose(), [skin]);

  useEffect(() => {
    onRegister(data.id, rbRef.current);
    return () => onRegister(data.id, null);
  }, [data.id, onRegister]);

  return (
    <RigidBody
      ref={rbRef}
      position={position}
      colliders={false}
      mass={1}
      friction={0.8}
      restitution={0.08}
      linearDamping={0.15}
      angularDamping={1.2}
      enabledTranslations={[true, true, false]}
      enabledRotations={[false, false, true]}
      name={`container-${data.id}`}
      userData={{ container: data }}
      ccd
    >
      <CuboidCollider args={[data.halfW, CONTAINER_HALF_H, HALF_D]} />

      <mesh castShadow receiveShadow material={skin.materials}>
        <boxGeometry args={[w, CONTAINER_HALF_H * 2, HALF_D * 2]} />
        <Outlines thickness={OUTLINE} color="#1a1410" />
      </mesh>

      {/* Placa con la etiqueta — chapa oscura atornillada, legible sobre cualquier color */}
      <mesh position={[0, 0, HALF_D + 0.01]}>
        <planeGeometry args={[Math.min(w - 0.4, label.length * fontSize * 0.86 + 0.5), 0.62]} />
        <meshBasicMaterial color={palette.outline} toneMapped={false} />
      </mesh>
      <Text
        font="/fonts/Poppins-Bold-subset.ttf"
        position={[0, -0.01, HALF_D + 0.03]}
        fontSize={fontSize}
        letterSpacing={0.12}
        color={data.color}
        anchorX="center"
        anchorY="middle"
        maxWidth={w - 0.6}
      >
        {label.toUpperCase()}
      </Text>
    </RigidBody>
  );
}
