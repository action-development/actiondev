"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { FLOOR_RADIUS, PLAZA_FOG, PLAZA_PALETTE } from "./plaza-config";
import { getSkyTexture, getFloorTexture, PLAZA_HORIZON } from "./plaza-textures";

/**
 * Radio de la esfera de cielo. Muy por encima de `FLOOR_RADIUS` para que el
 * disco del suelo quede siempre dentro, y por debajo del `far` de la cámara
 * (1000). El degradado va por ángulo de elevación, así que el radio no cambia
 * el aspecto: la cámara está casi en el centro de la esfera.
 */
const SKY_RADIUS = 200;

/**
 * Anillos concéntricos del suelo, en unidades de mundo.
 *
 * El fondo es plano y la cámara va casi a ras: sin nada dibujado en el suelo,
 * mover un muñeco "hacia arriba" (altura) y "hacia el fondo" (profundidad) se
 * ven IGUAL en pantalla. Estos anillos dan la escala del suelo y se comprimen
 * con la perspectiva, así que la profundidad se lee de un vistazo. Se apagan
 * solos con la niebla, sin necesidad de un degradado en la textura.
 */
const GRID_RINGS = [2, 3.4, 5, 7, 9.5, 12.5, 16, 20] as const;
/** Grosor de cada anillo (radio ±). Fino: es una referencia, no una decoración. */
const RING_HALF_WIDTH = 0.014;

function FloorGrid() {
  const geometries = useMemo(
    () => GRID_RINGS.map((r) => new THREE.RingGeometry(r - RING_HALF_WIDTH, r + RING_HALF_WIDTH, 128)),
    [],
  );
  // Un único material para todos los anillos.
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: PLAZA_PALETTE.guide,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geometries.forEach((g) => g.dispose());
      material.dispose();
    };
  }, [geometries, material]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
      {geometries.map((geometry, i) => (
        <mesh key={i} geometry={geometry} material={material} renderOrder={-1} />
      ))}
    </group>
  );
}

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

      <FloorGrid />

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
