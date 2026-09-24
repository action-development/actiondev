"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

import type { StreetMode, StreetPalette } from "./street-mode";
import { getSkyTexture } from "./street-textures";
import { WoodCladding } from "./facade/WoodCladding";
import { UpperFloors } from "./facade/UpperFloors";
import { WhiteWall } from "./facade/WhiteWall";
import { Portal } from "./facade/Portal";
import { StreetGround } from "./facade/StreetGround";

/** Radio del cielo: por encima de todo, por debajo del `far` de la cámara. */
const SKY_RADIUS = 90;

/**
 * El edificio de C/ Colón 20 y su acera: todo lo que no se toca.
 *
 * Cada parte vive en `facade/` con su propio comentario: madera, pisos, muro
 * del rótulo, soportal y acera. Aquí solo se montan y se pone el cielo, que
 * asoma sobre la coronación en pantallas altas.
 */
export function StreetFacade({ mode, palette }: { mode: StreetMode; palette: StreetPalette }) {
  const sky = useMemo(() => getSkyTexture(palette.sky.top, palette.sky.horizon), [palette.sky]);
  const skyGeo = useMemo(() => new THREE.SphereGeometry(SKY_RADIUS, 24, 16), []);
  useEffect(() => () => skyGeo.dispose(), [skyGeo]);

  return (
    <group>
      <mesh geometry={skyGeo}>
        <meshBasicMaterial map={sky} side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false} />
      </mesh>
      <UpperFloors mode={mode} palette={palette} />
      <WoodCladding />
      <WhiteWall />
      <Portal palette={palette} />
      <StreetGround />
    </group>
  );
}
