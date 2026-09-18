"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WATER_Y } from "./crane-logic";
import { fovForAspect } from "./painted-backdrops";

/**
 * Piezas 3D que solo existen en modo "painted" (fondo pintado detrás del canvas).
 */

/** Ajusta el fov para que el 3D siga casando con la imagen en `object-cover`. */
export function PaintedFraming() {
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    camera.fov = fovForAspect(width / height);
    camera.updateProjectionMatrix();
  }, [camera, width, height]);

  return null;
}

/**
 * Superficie de la ría invisible (solo profundidad): un contenedor que cae al
 * agua se hunde tras el agua dibujada en vez de verse a través de ella.
 */
export function WaterOccluder() {
  return (
    <mesh position={[0, WATER_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
      <planeGeometry args={[80, 30]} />
      <meshBasicMaterial colorWrite={false} />
    </mesh>
  );
}
