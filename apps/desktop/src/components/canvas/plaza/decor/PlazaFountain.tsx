"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PLAZA_PALETTES, type PlazaMode } from "../plaza-mode";
import { keyLightDirection } from "../lighting-rig";
import { buildDecorLayout } from "./furniture-layout";
import { LAMP_LIGHT_Y } from "./furniture";
import { LAYER_ORDER, LAYER_Y } from "./decor-kit";
import { FOUNTAIN_FROZEN_TIME, fountainLook } from "./fountain-config";
import {
  DROP_TOTAL,
  GROUND_RADIUS,
  HALO_COUNT,
  buildDropsGeometry,
  buildFountainFxGeometry,
  createDropsMaterial,
  createFxMaterial,
  createGroundMaterial,
} from "./fountain-fx";
import { buildFountainStone } from "./fountain-stone";
import { buildFountainWaterGeometry, createFountainWaterMaterial } from "./fountain-water";

/**
 * Fuente central: pilón con zócalo, pedestal abalaustrado y dos tazas de
 * jardín francés con gallones; agua opaca con shader; surtidor, láminas que
 * rebosan, gotas y, de noche, luz fría de focos subacuáticos.
 *
 * Va en el medallón del pavimento (`PAVING_RINGS[0]`) y los muñecos tienen
 * prohibido pasear por encima (`FOUNTAIN_KEEP_OUT`, 1.95 = radio 1.30 + 0.65).
 * Pieza única y centrada: se genera en coordenadas de mundo, no se fusiona con
 * el mobiliario porque tiene que poder moverse.
 *
 * 5 draw calls: piedra, agua, chorro + láminas, gotas (instanciadas) y suelo
 * (sombra de contacto + charco de luz). Nada de luces reales ni reflejo real:
 * todo lo que brilla de noche es aditivo.
 *
 * Los módulos que la componen (un archivo cada uno):
 *   fountain-config.ts  medidas y colores · fountain-lathe.ts  torno propio
 *   fountain-stone.ts   piedra            · fountain-water.ts  agua
 *   fountain-fx.ts      chorro, gotas y suelo
 */

interface PlazaFountainProps {
  mode: PlazaMode;
  /** Movimiento reducido o `?quieto`: la fuente se queda en un fotograma fijo
   * y determinista (`uTime` = `FOUNTAIN_FROZEN_TIME`). */
  frozen: boolean;
}

function useFountain(mode: PlazaMode, frozen: boolean) {
  const resources = useMemo(() => {
    const palette = PLAZA_PALETTES[mode];
    const look = fountainLook(mode);
    // Un único reloj compartido por todos los shaders de la fuente.
    const time = { value: frozen ? FOUNTAIN_FROZEN_TIME : 0 };
    const lamps = buildDecorLayout()
      .filter((d) => d.kind === "lamp")
      .map((d) => new THREE.Vector3(d.pos[0], LAMP_LIGHT_Y * d.scale, d.pos[1]));
    // Hacia el sol (de día) o la luna (de noche): dirección del destello.
    const sun = keyLightDirection(mode);

    const drops = buildDropsGeometry();
    drops.instanceCount = DROP_TOTAL + (look.night > 0 ? HALO_COUNT : 0);
    const geometries = {
      stone: buildFountainStone(),
      water: buildFountainWaterGeometry(),
      fx: buildFountainFxGeometry(),
      drops,
    };
    const materials = {
      stone: new THREE.MeshStandardMaterial({
        color: look.stone,
        vertexColors: true,
        roughness: 0.82,
        metalness: 0,
      }),
      water: createFountainWaterMaterial(look, sun, lamps, palette.lampsOn, time),
      fx: createFxMaterial(look, time),
      drops: createDropsMaterial(look, time),
      ground: createGroundMaterial(look, palette.shadowOpacity),
    };
    return { time, geometries, materials };
  }, [mode, frozen]);

  useEffect(() => {
    return () => {
      Object.values(resources.geometries).forEach((g) => g.dispose());
      Object.values(resources.materials).forEach((m) => m.dispose());
    };
  }, [resources]);

  return resources;
}

export function PlazaFountain({ mode, frozen }: PlazaFountainProps) {
  const { time, geometries, materials } = useFountain(mode, frozen);

  useFrame(({ clock }) => {
    if (!frozen) time.value = clock.elapsedTime;
  });

  return (
    <group>
      {/* Suelo: sombra de contacto + charco frío. Misma capa que el resto de
          sombras de contacto del mobiliario. */}
      <mesh rotation-x={-Math.PI / 2} position-y={LAYER_Y.shadow} renderOrder={LAYER_ORDER.shadow} material={materials.ground}>
        <planeGeometry args={[GROUND_RADIUS * 2, GROUND_RADIUS * 2]} />
      </mesh>
      <mesh geometry={geometries.stone} material={materials.stone} castShadow receiveShadow />
      <mesh geometry={geometries.water} material={materials.water} receiveShadow />
      {/* Translúcidos: después de lo opaco y en este orden (láminas, gotas). */}
      <mesh geometry={geometries.fx} material={materials.fx} renderOrder={LAYER_ORDER.shadow + 1} />
      <mesh
        geometry={geometries.drops}
        material={materials.drops}
        renderOrder={LAYER_ORDER.shadow + 2}
        // Las gotas se calculan en el vertex shader: la esfera de culling del
        // quad unidad no dice nada de dónde acaban.
        frustumCulled={false}
      />
    </group>
  );
}
