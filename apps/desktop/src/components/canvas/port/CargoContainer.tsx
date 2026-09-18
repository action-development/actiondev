"use client";

import { useEffect, useMemo, useRef } from "react";
import { RigidBody, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import { Outlines } from "@react-three/drei";
import type { PortPalette } from "./time-of-day";
import { getToonGradient, OUTLINE } from "./toon";
import { createContainerMaterials } from "./container-textures";

/**
 * Contenedor marítimo navegable — sustituye a los antiguos cubos de cristal.
 *
 * Aspecto de contenedor pintado (nervios entintados, óxido, puertas): ver
 * `container-textures.ts`. Texturas de canvas 2D por contenedor, 0 bytes de red.
 *
 * Física bloqueada a SU FILA: traslación en z y rotación en x/y desactivadas.
 * Solo puede volcar sobre su eje z, que es lo que se ve.
 *
 * EL BLOQUEO DE Z SE QUEDA COMO ESTÁ aunque ahora la grúa viaje en profundidad,
 * y no hay que soltarlo ni volverlo a poner al enganchar. Comprobado contra
 * Rapier 0.19 (los detalles, en `canvas/SCENE.md`):
 *
 * - Un cuerpo `kinematicPosition` IGNORA el bloqueo: mientras cuelga del
 *   spreader, `setNextKinematicTranslation` lo lleva a la z que haga falta.
 * - `setTranslation` también lo ignora → el respawn a `spawnZ` funciona.
 * - En dinámico el bloqueo sí manda: contactos e impulsos en z no lo mueven,
 *   así que al soltarlo se queda CLAVADO en la fila donde cayó y jamás se
 *   cuela de una fila a otra.
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
  /** Se mantiene por firma: el skin es de canvas y no depende de la hora. */
  palette: PortPalette;
  onRegister: (id: string, rb: RapierRigidBody | null) => void;
}

export function CargoContainer({ data, label, position, onRegister }: CargoContainerProps) {
  const rbRef = useRef<RapierRigidBody>(null);
  const gradient = getToonGradient();
  const w = data.halfW * 2;

  // El rótulo va HORNEADO en la textura del costado +z (ver
  // `container-textures.ts`), no en un `<Text>` encima: cambia con el idioma,
  // así que entra en las dependencias y las texturas se recrean al traducir.
  const skin = useMemo(
    () => createContainerMaterials(data.id, data.color, w, gradient, label),
    [data.id, data.color, w, gradient, label],
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
    </RigidBody>
  );
}
