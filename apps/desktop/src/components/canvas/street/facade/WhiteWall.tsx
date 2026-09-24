"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { FACADE, WHITE_WALL } from "../street-config";
import { boxBetween, leafBall, merge, planarUV } from "../street-geometry";
import {
  ASHLAR_TILE,
  SIGN_ASPECT,
  STUCCO_TILE,
  getAshlarTexture,
  getSignTexture,
  getStuccoTexture,
} from "../street-textures";

/** Barandilla de forja sobre el zócalo: anillos entre dos pletinas. */
const RAIL = { bottom: 0.03, top: 0.3, ring: 0.105, pitch: 0.22, post: 1.76 } as const;
/** Separación de las letras corpóreas respecto al muro. */
const LETTER_STANDOFF = 0.035;

/**
 * El tramo de muro a la izquierda del portal, como en la foto:
 * - enfoscado blanco, con una junta de sombra bajo la banda de madera;
 * - «Colon 20» en letras corpóreas negras SEPARADAS del muro: la sombra
 *   difusa que echan sobre el estuco es lo que las hace leer como objeto y no
 *   como pegatina;
 * - zócalo de sillería caliza con albardilla que vuela;
 * - jardinera corrida encima, con cubresuelos y árboles de bola;
 * - barandilla de forja de anillos, en 3D (la sombra de los anillos cae sobre
 *   la albardilla).
 */
export function WhiteWall() {
  const tex = useMemo(
    () => ({
      stucco: getStuccoTexture(),
      stone: getAshlarTexture(true),
      sign: getSignTexture(false),
      signShadow: getSignTexture(true),
    }),
    []
  );

  const geo = useMemo(() => {
    const { x0, x1, plinthH, plinthDepth, sign, topiary } = WHITE_WALL;
    const coping = { h: 0.08, over: 0.05 };
    const railZ = plinthDepth - 0.05;
    const railY = plinthH + coping.h;

    const stucco = planarUV(
      merge([new THREE.PlaneGeometry(x1 - x0, FACADE.canopyY - plinthH).translate((x0 + x1) / 2, (FACADE.canopyY + plinthH) / 2, 0)]),
      STUCCO_TILE
    );
    const plinth = planarUV(merge([boxBetween(x0, x1, 0, plinthH, 0, plinthDepth)]), ASHLAR_TILE);
    const copingGeo = planarUV(
      merge([boxBetween(x0, x1, plinthH, plinthH + coping.h, -0.02, plinthDepth + coping.over)]),
      ASHLAR_TILE
    );

    // Junta de sombra entre el enfoscado y la madera.
    const reveal = new THREE.PlaneGeometry(x1 - x0, 0.05).translate((x0 + x1) / 2, FACADE.canopyY - 0.025, 0.003);

    // Tierra de la jardinera corrida y cubresuelos (matas bajas).
    const soil = boxBetween(x0, x1, plinthH + coping.h, plinthH + coping.h + 0.02, 0.02, railZ - 0.04);
    const ground: THREE.BufferGeometry[] = [];
    let seed = 1;
    for (let x = x0 + 0.2; x < x1 - 0.1; x += 0.34) {
      ground.push(leafBall(0.2 + (seed % 3) * 0.03, seed, 0.55).translate(x, railY + 0.06, 0.16));
      seed++;
    }

    // Árboles de bola: tronco fino, copa abollada.
    const trunks: THREE.BufferGeometry[] = [];
    const crowns: THREE.BufferGeometry[] = [];
    topiary.forEach((x, i) => {
      trunks.push(new THREE.CylinderGeometry(0.022, 0.032, 0.95, 7).translate(x, railY + 0.47, 0.15));
      crowns.push(leafBall(0.34, 10 + i * 3, 0.95).translate(x, railY + 1.12, 0.15));
    });

    // Barandilla: pletinas, montantes y anillos ovalados.
    const iron: THREE.BufferGeometry[] = [
      boxBetween(x0, x1, railY + RAIL.bottom - 0.012, railY + RAIL.bottom + 0.012, railZ - 0.012, railZ + 0.012),
      boxBetween(x0, x1, railY + RAIL.top, railY + RAIL.top + 0.018, railZ - 0.03, railZ + 0.03),
    ];
    for (let x = x0 + 0.3; x < x1; x += RAIL.post) {
      iron.push(boxBetween(x - 0.015, x + 0.015, railY, railY + RAIL.top, railZ - 0.015, railZ + 0.015));
    }
    const ringH = RAIL.top - RAIL.bottom;
    for (let x = x0 + RAIL.pitch / 2; x < x1; x += RAIL.pitch) {
      const ring = new THREE.TorusGeometry(RAIL.ring, 0.009, 6, 20);
      ring.scale(1, ringH / (RAIL.ring * 2), 1);
      ring.translate(x, railY + RAIL.bottom + ringH / 2, railZ);
      iron.push(ring);
    }

    const signH = sign.w / SIGN_ASPECT;
    return {
      stucco,
      plinth,
      coping: copingGeo,
      reveal,
      soil,
      ground: merge(ground),
      trunks: merge(trunks),
      crowns: merge(crowns),
      iron: merge(iron),
      signShadow: new THREE.PlaneGeometry(sign.w, signH).translate(sign.x + 0.03, sign.y - 0.035, 0.004),
      signSide: new THREE.PlaneGeometry(sign.w, signH).translate(sign.x + 0.006, sign.y - 0.006, LETTER_STANDOFF - 0.012),
      sign: new THREE.PlaneGeometry(sign.w, signH).translate(sign.x, sign.y, LETTER_STANDOFF),
    };
  }, []);

  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  return (
    <group>
      <mesh geometry={geo.stucco} receiveShadow>
        <meshStandardMaterial map={tex.stucco} roughness={0.95} />
      </mesh>
      <mesh geometry={geo.reveal}>
        <meshBasicMaterial color="#1b1916" transparent opacity={0.55} depthWrite={false} />
      </mesh>

      {/* Rótulo corpóreo: sombra en el muro, canto y cara. */}
      <mesh geometry={geo.signShadow}>
        <meshBasicMaterial map={tex.signShadow} transparent depthWrite={false} />
      </mesh>
      <mesh geometry={geo.signSide}>
        <meshStandardMaterial map={tex.sign} color="#4a4a4a" transparent alphaTest={0.5} roughness={0.5} />
      </mesh>
      <mesh geometry={geo.sign}>
        <meshStandardMaterial map={tex.sign} transparent alphaTest={0.5} roughness={0.35} metalness={0.3} />
      </mesh>

      <mesh geometry={geo.plinth} castShadow receiveShadow>
        <meshStandardMaterial map={tex.stone} roughness={0.85} />
      </mesh>
      <mesh geometry={geo.coping} castShadow receiveShadow>
        <meshStandardMaterial map={tex.stone} color="#f6f1e6" roughness={0.75} />
      </mesh>
      <mesh geometry={geo.soil}>
        <meshStandardMaterial color="#2f271f" roughness={1} />
      </mesh>
      <mesh geometry={geo.ground} castShadow receiveShadow>
        <meshStandardMaterial color="#3f6a2e" roughness={0.9} />
      </mesh>
      <mesh geometry={geo.trunks} castShadow>
        <meshStandardMaterial color="#5a4632" roughness={0.9} />
      </mesh>
      <mesh geometry={geo.crowns} castShadow receiveShadow>
        <meshStandardMaterial color="#4f8038" roughness={0.85} />
      </mesh>
      <mesh geometry={geo.iron} castShadow>
        <meshStandardMaterial color="#2c2f33" roughness={0.45} metalness={0.65} />
      </mesh>
    </group>
  );
}
