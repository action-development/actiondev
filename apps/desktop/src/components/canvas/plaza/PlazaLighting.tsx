"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PLAZA_PALETTES, type PlazaMode } from "./plaza-mode";
import { plazaHorizon } from "./plaza-textures";
import {
  SUN,
  buildEnvironment,
  keyLightDirection,
  lampLightPositions,
  lightDirection,
  sunShadowFrustum,
} from "./lighting-rig";

/** Reexportado: `PlazaRoom` dimensiona con él la capa que recibe la sombra. */
export { SUN };

/** Distancia a la que se planta el contraluz (sin sombra: solo da dirección). */
const RIM_DISTANCE = 20;

/**
 * Iluminación global de la plaza: niebla, IBL, hemisférica, sol/luna (con su
 * sombra de día), contraluz y la luz de las farolas de noche. Los valores
 * los pone el modo (`plaza-mode.ts`, campo `light`); la geometría del rig
 * (direcciones, frustum de sombra, farolas, cúpula del IBL) vive en
 * `lighting-rig.ts`.
 *
 * Se monta como hijo DIRECTO de la escena (desde `PlazaWorld`), y aun así la
 * niebla y el entorno se asignan a mano sobre `scene`: antes colgaba de un
 * `<group>` de `PlazaRoom`, y `<fog attach="fog">` acababa en `group.fog`, que
 * three no lee — la plaza no ha tenido niebla nunca hasta ahora. Asignado
 * sobre la escena no depende de dónde se monte.
 */
export function PlazaLighting({ mode }: { mode: PlazaMode }) {
  const { scene, gl } = useThree();
  const palette = PLAZA_PALETTES[mode];
  const rig = palette.light;

  // ---- Niebla ----
  useLayoutEffect(() => {
    const fog = new THREE.Fog(plazaHorizon(mode), palette.fog.near, palette.fog.far);
    scene.fog = fog;
    return () => {
      if (scene.fog === fog) scene.fog = null;
    };
  }, [scene, mode, palette.fog.near, palette.fog.far]);

  // ---- IBL procedural ----
  useLayoutEffect(() => {
    const target = buildEnvironment(gl, mode);
    scene.environment = target.texture;
    scene.environmentIntensity = rig.env.intensity;
    return () => {
      if (scene.environment === target.texture) scene.environment = null;
      target.dispose();
    };
  }, [gl, scene, mode, rig.env.intensity]);

  // ---- Sol / luna ----
  const keyPosition = useMemo(
    () => keyLightDirection(mode).multiplyScalar(SUN.distance).toArray() as [number, number, number],
    [mode],
  );
  const rimPosition = useMemo(
    () =>
      lightDirection(rig.rim.azimuth, rig.rim.elevation)
        .multiplyScalar(RIM_DISTANCE)
        .toArray() as [number, number, number],
    [rig.rim.azimuth, rig.rim.elevation],
  );
  const frustum = useMemo(() => sunShadowFrustum(rig.key.elevation), [rig.key.elevation]);

  /**
   * La cámara de sombra hay que recalcularla A MANO.
   *
   * R3F escribe `shadow-camera-left` y compañía como propiedades sueltas, pero
   * una ortográfica no se entera de que han cambiado hasta que alguien llama a
   * `updateProjectionMatrix()`. Sin esto la luz se queda con el frustum por
   * defecto (±5, con el sol a 60 del centro) y en pantalla NO se ve ni una
   * sombra: es el síntoma exacto de haber configurado el sol y no ver nada.
   */
  const keyRef = useRef<THREE.DirectionalLight>(null);
  useLayoutEffect(() => {
    keyRef.current?.shadow.camera.updateProjectionMatrix();
  }, [frustum, keyPosition]);

  // ---- Farolas ----
  const lamps = useMemo(() => (rig.lamps ? lampLightPositions() : []), [rig.lamps]);

  return (
    <>
      <hemisphereLight args={[rig.hemi.sky, rig.hemi.ground, rig.hemi.intensity]} />
      <directionalLight
        ref={keyRef}
        color={rig.key.color}
        position={keyPosition}
        intensity={rig.key.intensity}
        castShadow={rig.key.castShadow}
        shadow-mapSize={[SUN.map, SUN.map]}
        shadow-camera-left={frustum.left}
        shadow-camera-right={frustum.right}
        shadow-camera-top={frustum.top}
        shadow-camera-bottom={frustum.bottom}
        shadow-camera-near={frustum.near}
        shadow-camera-far={frustum.far}
        // `normalBias` en vez de subir `bias` a lo bruto: el acné de sombra de
        // esta escena sale en superficies curvas (cabezas, copas, pilón), y
        // desplazar por la normal lo quita sin despegar la sombra del pie.
        shadow-bias={SUN.bias}
        shadow-normalBias={SUN.normalBias}
        // 1: la sombra entre piezas a plena fuerza. La del SUELO la gradúa
        // la opacidad de su `ShadowMaterial` (`sunShadow.ground`), que ya
        // multiplica por esta intensidad — con las dos por debajo de 1 la
        // sombra del suelo se atenuaba dos veces.
        shadow-intensity={1}
        // Ensancha el muestreo PCF: el borde de la sombra de un banco pasa de
        // escalón de píxel a filo blando, que es lo que pide una escena mate.
        shadow-radius={SUN.blur}
      />
      {/* Contraluz: sin sombra (no cuesta pase), solo recorta la silueta. */}
      <directionalLight color={rig.rim.color} position={rimPosition} intensity={rig.rim.intensity} />
      {/*
        Farolas: luz REAL, sin sombra, acotada en `distance` y con caída física
        (decay 2). El halo y el charco del suelo siguen siendo aditivos — el
        pavimento es MeshBasic y no recibe luz —, pero muñecos, bancos, setos y
        fuente sí se tiñen de cálido al acercarse a una farola.
      */}
      {rig.lamps &&
        lamps.map((p, i) => (
          <pointLight
            key={i}
            position={p}
            color={rig.lamps!.color}
            intensity={rig.lamps!.intensity}
            distance={rig.lamps!.distance}
            decay={2}
          />
        ))}
    </>
  );
}
