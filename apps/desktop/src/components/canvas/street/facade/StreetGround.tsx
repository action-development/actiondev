"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { BOLLARDS, PLANTERS, SIDEWALK, WHITE_WALL } from "../street-config";
import { boxBetween, braidedTrunk, leafBall, merge, planarUV } from "../street-geometry";
import {
  ASHLAR_TILE,
  BRICK_TILE,
  COBBLE_TILE,
  getAshlarTexture,
  getBrickTexture,
  getCobbleTexture,
} from "../street-textures";

/** Bordillo de la acera: donde empieza la calzada. */
const CURB_Z = 7.4;

/**
 * La acera y lo que hay en ella (menos la cabina y el buzón, que son canales):
 * - adoquín de granito, con una franja de losa lisa al pie del zócalo;
 * - bordillo y calzada al fondo del plano (asoman en pantallas altas);
 * - macetones de fibrocemento con ficus de tronco trenzado y copa abollada;
 * - bolardos de fundición con remate y anillo;
 * - murete de ladrillo con albardilla de la rampa del garaje, a la derecha.
 */
export function StreetGround() {
  const tex = useMemo(
    () => ({
      cobble: getCobbleTexture(),
      stone: getAshlarTexture(true),
      brick: getBrickTexture(),
    }),
    []
  );

  const geo = useMemo(() => {
    const w = SIDEWALK.halfWidth;

    const sidewalk = planarUV(
      merge([new THREE.PlaneGeometry(2 * w, CURB_Z).rotateX(-Math.PI / 2).translate(0, 0, CURB_Z / 2)]),
      COBBLE_TILE
    );
    // Losa lisa al pie del zócalo y bordillo: piedra, UV en metros.
    const slabs = planarUV(
      merge([
        boxBetween(WHITE_WALL.x0, WHITE_WALL.x1, 0, 0.012, WHITE_WALL.plinthDepth, WHITE_WALL.plinthDepth + 0.45),
        boxBetween(-w, w, -0.14, 0.02, CURB_Z, CURB_Z + 0.25),
      ]),
      ASHLAR_TILE
    );
    // Larga de sobra: en móvil la cámara retrocede hasta ~30 m y mira abajo.
    const roadLen = 60;
    const road = new THREE.PlaneGeometry(2 * w, roadLen).rotateX(-Math.PI / 2).translate(0, -0.14, CURB_Z + 0.25 + roadLen / 2);

    // Macetones: cuerpo, borde y tierra; ficus trenzado con copa de tres bolas.
    const planters: THREE.BufferGeometry[] = [];
    const soil: THREE.BufferGeometry[] = [];
    const trunks: THREE.BufferGeometry[] = [];
    const crowns: THREE.BufferGeometry[] = [];
    PLANTERS.forEach(([x, z], i) => {
      planters.push(boxBetween(x - 0.3, x + 0.3, 0, 0.56, z - 0.3, z + 0.3));
      planters.push(boxBetween(x - 0.33, x + 0.33, 0.56, 0.62, z - 0.33, z + 0.33));
      soil.push(boxBetween(x - 0.27, x + 0.27, 0.56, 0.6, z - 0.27, z + 0.27));
      trunks.push(...braidedTrunk(1.0, 0.05, 2.2).map((g) => g.translate(x, 0.6, z)));
      const top = 0.6 + 1.0;
      crowns.push(
        leafBall(0.36, 20 + i, 0.9).translate(x, top + 0.22, z),
        leafBall(0.28, 30 + i, 0.9).translate(x + 0.26, top + 0.05, z + 0.08),
        leafBall(0.27, 40 + i, 0.9).translate(x - 0.24, top + 0.08, z - 0.05)
      );
    });

    // Bolardos: fuste, anillo y remate achaflanado.
    const bollards: THREE.BufferGeometry[] = [];
    for (const [x, z] of BOLLARDS) {
      bollards.push(
        new THREE.CylinderGeometry(0.09, 0.1, 0.78, 16).translate(x, 0.39, z),
        new THREE.CylinderGeometry(0.105, 0.105, 0.05, 16).translate(x, 0.62, z),
        new THREE.CylinderGeometry(0.05, 0.09, 0.08, 16).translate(x, 0.82, z),
        new THREE.CylinderGeometry(0.12, 0.12, 0.02, 16).translate(x, 0.01, z)
      );
    }

    const brick = planarUV(merge([boxBetween(9.7, 16, 0, 0.34, 0.05, 0.4)]), BRICK_TILE);
    const brickCap = planarUV(merge([boxBetween(9.66, 16, 0.34, 0.4, 0.02, 0.44)]), ASHLAR_TILE);

    return {
      sidewalk,
      slabs,
      road,
      planters: merge(planters),
      soil: merge(soil),
      trunks: merge(trunks),
      crowns: merge(crowns),
      bollards: merge(bollards),
      brick,
      brickCap,
    };
  }, []);

  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  return (
    <group>
      <mesh geometry={geo.sidewalk} receiveShadow>
        <meshStandardMaterial map={tex.cobble} roughness={0.92} />
      </mesh>
      <mesh geometry={geo.slabs} receiveShadow>
        <meshStandardMaterial map={tex.stone} color="#bdb6aa" roughness={0.8} />
      </mesh>
      <mesh geometry={geo.road} receiveShadow>
        <meshStandardMaterial color="#2c2d2f" roughness={0.95} />
      </mesh>

      <mesh geometry={geo.planters} castShadow receiveShadow>
        <meshStandardMaterial color="#6c7075" roughness={0.7} />
      </mesh>
      <mesh geometry={geo.soil}>
        <meshStandardMaterial color="#2b231c" roughness={1} />
      </mesh>
      <mesh geometry={geo.trunks} castShadow>
        <meshStandardMaterial color="#9a8566" roughness={0.85} />
      </mesh>
      <mesh geometry={geo.crowns} castShadow receiveShadow>
        <meshStandardMaterial color="#4b7a35" roughness={0.85} />
      </mesh>

      <mesh geometry={geo.bollards} castShadow>
        <meshStandardMaterial color="#5e3a24" roughness={0.42} metalness={0.55} />
      </mesh>
      <mesh geometry={geo.brick} castShadow receiveShadow>
        <meshStandardMaterial map={tex.brick} roughness={0.9} />
      </mesh>
      <mesh geometry={geo.brickCap} castShadow receiveShadow>
        <meshStandardMaterial map={tex.stone} roughness={0.8} />
      </mesh>
    </group>
  );
}
