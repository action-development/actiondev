"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { FLOOR_RADIUS, PLAZA_FOG } from "./plaza-config";
import { getSkyTexture, getFloorTexture, PLAZA_HORIZON } from "./plaza-textures";

/**
 * Radio de la esfera de cielo. Muy por encima de `FLOOR_RADIUS` para que el
 * disco del suelo quede siempre dentro, y por debajo del `far` de la cámara
 * (1000). El degradado va por ángulo de elevación, así que el radio no cambia
 * el aspecto: la cámara está casi en el centro de la esfera.
 */
const SKY_RADIUS = 200;

export function PlazaRoom() {
  const skyTexture = useMemo(() => getSkyTexture(), []);
  const floorTexture = useMemo(() => getFloorTexture(), []);

  // Las texturas son singletons de módulo (compartidas entre montajes de la
  // plaza) — el dispose real vive en `disposePlazaTextures()`, no aquí. Solo
  // limpiamos lo que es propio de esta instancia: geometrías de las mallas.
  const skyGeometry = useMemo(() => new THREE.SphereGeometry(SKY_RADIUS, 48, 64), []);
  const floorGeometry = useMemo(() => new THREE.CircleGeometry(FLOOR_RADIUS, 96), []);

  useEffect(() => {
    return () => {
      skyGeometry.dispose();
      floorGeometry.dispose();
    };
  }, [skyGeometry, floorGeometry]);

  return (
    <group>
      {/* Sin paredes: el fog lleva el suelo al color del horizonte, que es
          también la base del degradado del cielo — no hay costura. */}
      <fog attach="fog" args={[PLAZA_HORIZON, PLAZA_FOG.near, PLAZA_FOG.far]} />

      {/* Cyclorama: esfera invertida vista desde dentro. `toneMapped={false}`
          y `fog={false}` para que el degradado pastel llegue tal cual a
          pantalla — ver justificación completa en plaza-textures.ts. */}
      <mesh geometry={skyGeometry} renderOrder={-2}>
        <meshBasicMaterial
          map={skyTexture}
          side={THREE.BackSide}
          toneMapped={false}
          fog={false}
          depthWrite={false}
        />
      </mesh>

      {/*
        Suelo sin iluminación (MeshBasicMaterial + toneMapped={false}): el
        color de la textura llega al píxel tal cual, y fondo y suelo coinciden
        con `--background` en el horizonte. Con un material iluminado el tono
        pasaría por luz × ACES y no casaría con el fondo del resto de la web.
        Lo único que modela el suelo son las sombras blob de los muñecos.

        Sobre MeshReflectorMaterial (drei): es local, pero repinta la escena
        entera otra vez por frame para el reflejo. Descartado por coste con N
        muñecos + Outlines en GPU integrada.
      */}
      <mesh geometry={floorGeometry} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial map={floorTexture} toneMapped={false} />
      </mesh>

      {/*
        Luz de "vitrina" para MeshStandardMaterial (roughness ~0.6) bajo ACES.
        En three ≥0.155 la difusa es albedo/π × irradiancia, y ACES multiplica
        por 1/0.6 antes de la curva: con irradiancia frontal ≈ 3.4 un blanco
        #EDEDED acaba en ~#F0 sin quemar y la piel mantiene su tono.
        - Hemisphere: base alta y casi sin direccionalidad; el "suelo" es el
          rebote del suelo blanco (ligeramente cálido) para que las zonas bajas
          no se ensucien de azul.
        - Key: desde arriba-delante (lado de la cámara) para sombreado suave.
        - Rim/fill trasero flojo para separar la silueta del fondo blanco.
      */}
      <hemisphereLight args={["#F4F9FF", "#FFF8EE", 2.2]} />
      <directionalLight position={[3, 8, 7]} intensity={1.5} />
      <directionalLight position={[-5, 5, -6]} intensity={0.5} />
    </group>
  );
}
