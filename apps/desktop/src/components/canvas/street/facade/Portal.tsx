"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { FACADE, PORTAL } from "../street-config";
import type { StreetPalette } from "../street-mode";
import { boxBetween, merge, planarUV } from "../street-geometry";
import {
  ASHLAR_TILE,
  POLISH_TILE,
  getAshlarTexture,
  getBrushedSteelTexture,
  getLobbyTexture,
  getPolishTexture,
} from "../street-textures";

/** Perfilería de las puertas de vidrio. */
const PROFILE = { bar: 0.07, depth: 0.09 } as const;

/**
 * El fondo del soportal: lo que se ve bajo el techo de madera.
 * - Pilastras de sillería caliza con su zócalo, y dintel de piedra sobre el
 *   ascensor, como en la foto.
 * - Ascensor: cerco y hojas de acero cepillado, con la junta y la botonera.
 * - Puertas de vidrio: perfilería de aluminio de verdad (cerco, dos hojas con
 *   su bastidor, tiradores de barra), vidrio que refleja el entorno y, detrás,
 *   el vestíbulo iluminado. Felpudo delante.
 * - Suelo de granito pulido (brilla con el entorno) y peldaño con su canto.
 * - Focos empotrados con aro; de noche, su haz.
 */
export function Portal({ palette }: { palette: StreetPalette }) {
  const tex = useMemo(
    () => ({
      stone: getAshlarTexture(true),
      steel: getBrushedSteelTexture(),
      polish: getPolishTexture(),
      lobby: getLobbyTexture(),
    }),
    []
  );

  const geo = useMemo(() => {
    const back = PORTAL.backZ;
    const { lobby, glass, step } = PORTAL;

    // Piedra: pilastras con zócalo, dintel del ascensor y peldaño.
    const stone: THREE.BufferGeometry[] = [];
    for (const [x0, x1] of PORTAL.pillars) {
      stone.push(boxBetween(x0, x1, 0.12, FACADE.canopyY, back, back + 0.3));
      stone.push(boxBetween(x0 - 0.02, x1 + 0.02, 0, 0.12, back, back + 0.33));
    }
    stone.push(boxBetween(lobby.x0, lobby.x1, lobby.h + 0.08, FACADE.canopyY, back, back + 0.12));
    stone.push(boxBetween(step.x0, step.x1, 0, step.h, back, back + step.depth + 0.3));

    // Acero: cerco del ascensor, botonera.
    const steel: THREE.BufferGeometry[] = [
      boxBetween(lobby.x0, lobby.x0 + 0.06, 0, lobby.h + 0.08, back, back + 0.07),
      boxBetween(lobby.x1 - 0.06, lobby.x1, 0, lobby.h + 0.08, back, back + 0.07),
      boxBetween(lobby.x0, lobby.x1, lobby.h, lobby.h + 0.08, back, back + 0.07),
      boxBetween(lobby.x1 + 0.12, lobby.x1 + 0.2, 1.05, 1.3, back + 0.3, back + 0.32),
    ];
    const doors = new THREE.PlaneGeometry(lobby.x1 - lobby.x0 - 0.12, lobby.h).translate(
      (lobby.x0 + lobby.x1) / 2,
      lobby.h / 2,
      back + 0.02
    );
    const dark: THREE.BufferGeometry[] = [
      boxBetween((lobby.x0 + lobby.x1) / 2 - 0.006, (lobby.x0 + lobby.x1) / 2 + 0.006, 0, lobby.h, back, back + 0.025),
      // Túnel entre la pared y el vestíbulo: tapa los cantos del hueco.
      new THREE.PlaneGeometry(0.5, glass.h).rotateY(Math.PI / 2).translate(glass.x0, glass.h / 2, back - 0.25),
      new THREE.PlaneGeometry(0.5, glass.h).rotateY(-Math.PI / 2).translate(glass.x1, glass.h / 2, back - 0.25),
      new THREE.PlaneGeometry(glass.x1 - glass.x0, 0.5).rotateX(Math.PI / 2).translate((glass.x0 + glass.x1) / 2, glass.h, back - 0.25),
    ];

    // Aluminio: cerco, dos hojas con bastidor y tiradores.
    const alu: THREE.BufferGeometry[] = [];
    const b = PROFILE.bar;
    const z0 = back - 0.02;
    const z1 = z0 + PROFILE.depth;
    const mid = (glass.x0 + glass.x1) / 2;
    alu.push(
      boxBetween(glass.x0, glass.x1, glass.h - b, glass.h, z0, z1),
      boxBetween(glass.x0, glass.x0 + b, 0, glass.h, z0, z1),
      boxBetween(glass.x1 - b, glass.x1, 0, glass.h, z0, z1)
    );
    // Montante fijo sobre las hojas.
    const leafTop = glass.h - 0.5;
    alu.push(boxBetween(glass.x0, glass.x1, leafTop - b, leafTop, z0, z1));
    for (const [lx0, lx1] of [
      [glass.x0 + b, mid - 0.005],
      [mid + 0.005, glass.x1 - b],
    ]) {
      alu.push(
        boxBetween(lx0, lx0 + b, 0, leafTop - b, z0 + 0.01, z1 - 0.01),
        boxBetween(lx1 - b, lx1, 0, leafTop - b, z0 + 0.01, z1 - 0.01),
        boxBetween(lx0, lx1, 0, 0.14, z0 + 0.01, z1 - 0.01)
      );
    }
    // Tiradores de barra, uno por hoja, junto al encuentro.
    for (const x of [mid - 0.16, mid + 0.16]) {
      alu.push(new THREE.CylinderGeometry(0.016, 0.016, 1.1, 10).translate(x, 1.05, z1 + 0.06));
      alu.push(boxBetween(x - 0.012, x + 0.012, 0.6, 0.64, z1, z1 + 0.06));
      alu.push(boxBetween(x - 0.012, x + 0.012, 1.46, 1.5, z1, z1 + 0.06));
    }

    const panes = merge([
      new THREE.PlaneGeometry(glass.x1 - glass.x0 - 2 * b, leafTop - b).translate(mid, (leafTop - b) / 2, z0 + PROFILE.depth / 2),
      new THREE.PlaneGeometry(glass.x1 - glass.x0 - 2 * b, glass.h - leafTop - b).translate(mid, (leafTop + glass.h - b) / 2, z0 + PROFILE.depth / 2),
    ]);

    // Suelo pulido del soportal y felpudo.
    const floor = planarUV(
      merge([new THREE.PlaneGeometry(PORTAL.x1 - PORTAL.x0, -back).rotateX(-Math.PI / 2).translate((PORTAL.x0 + PORTAL.x1) / 2, 0.004, back / 2)]),
      POLISH_TILE
    );
    const mat = boxBetween(mid - 0.75, mid + 0.75, 0.004, 0.02, back + 0.15, back + 0.95);

    // Focos: aro de aluminio + disco; el haz es un cono aditivo, no una luz.
    const rings = merge(
      PORTAL.downlights.map(([x, z]) =>
        new THREE.TorusGeometry(0.11, 0.018, 6, 20).rotateX(Math.PI / 2).translate(x, FACADE.canopyY - 0.04, z)
      )
    );
    const discs = merge(
      PORTAL.downlights.map(([x, z]) => new THREE.CircleGeometry(0.1, 20).rotateX(Math.PI / 2).translate(x, FACADE.canopyY - 0.045, z))
    );
    const beams = merge(
      PORTAL.downlights.map(([x, z]) => new THREE.ConeGeometry(0.85, FACADE.canopyY, 24, 1, true).translate(x, FACADE.canopyY / 2, z))
    );

    return {
      stone: planarUV(merge(stone), ASHLAR_TILE),
      steel: merge(steel),
      doors,
      dark: merge(dark),
      alu: merge(alu),
      panes,
      lobby: new THREE.PlaneGeometry(glass.x1 - glass.x0, glass.h).translate(mid, glass.h / 2, back - 0.5),
      floor,
      mat,
      rings,
      discs,
      beams,
    };
  }, []);

  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  const lobbyTone = useMemo(() => new THREE.Color().setScalar(palette.lobbyGlow), [palette.lobbyGlow]);

  return (
    <group>
      <mesh geometry={geo.stone} castShadow receiveShadow>
        <meshStandardMaterial map={tex.stone} roughness={0.8} />
      </mesh>
      <mesh geometry={geo.steel} castShadow>
        <meshStandardMaterial map={tex.steel} roughness={0.32} metalness={0.9} />
      </mesh>
      <mesh geometry={geo.doors}>
        <meshStandardMaterial map={tex.steel} roughness={0.28} metalness={0.92} />
      </mesh>
      <mesh geometry={geo.dark}>
        <meshStandardMaterial color="#17181a" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* El vestíbulo brilla por sí mismo: no depende de la luz de la calle. */}
      <mesh geometry={geo.lobby}>
        <meshBasicMaterial map={tex.lobby} color={lobbyTone} toneMapped={false} />
      </mesh>
      <mesh geometry={geo.alu} castShadow>
        <meshStandardMaterial color="#c9ccd0" roughness={0.3} metalness={0.85} />
      </mesh>
      <mesh geometry={geo.panes}>
        <meshStandardMaterial
          color="#dbe9ee"
          transparent
          opacity={0.16}
          roughness={0.03}
          metalness={0.9}
          envMapIntensity={1.6}
          depthWrite={false}
        />
      </mesh>

      <mesh geometry={geo.floor} receiveShadow>
        <meshStandardMaterial map={tex.polish} roughness={0.16} metalness={0.12} envMapIntensity={1.2} />
      </mesh>
      <mesh geometry={geo.mat} receiveShadow>
        <meshStandardMaterial color="#2b2825" roughness={1} />
      </mesh>

      <mesh geometry={geo.rings}>
        <meshStandardMaterial color="#d7d9dc" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh geometry={geo.discs}>
        <meshBasicMaterial color={palette.lightsOn ? "#fff4dc" : "#bdb8ae"} toneMapped={!palette.lightsOn} />
      </mesh>
      {palette.lightsOn && (
        <mesh geometry={geo.beams} renderOrder={2}>
          <meshBasicMaterial
            color="#ffd49a"
            transparent
            opacity={0.055}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
