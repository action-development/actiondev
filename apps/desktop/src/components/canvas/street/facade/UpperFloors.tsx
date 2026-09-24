"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { BUILDING_TOP, FACADE, UPPER } from "../street-config";
import type { StreetMode, StreetPalette } from "../street-mode";
import { boxBetween, merge, planarUV } from "../street-geometry";
import {
  ASHLAR_TILE,
  getAshlarTexture,
  getBlindTexture,
  getGlassTexture,
  getLitWindowTexture,
} from "../street-textures";

/** Alto de una lama de persiana en la textura (m): fija su repetición. */
const BLIND_TILE = 0.4;
/** Grueso visto de la carpintería. */
const FRAME = { bar: 0.06, depth: 0.07 } as const;

/** PRNG determinista: mismas persianas y mismas luces en cada visita. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Plantas de oficinas sobre el portal.
 *
 * Antes eran un plano con rectángulos oscuros pintados. Ahora el muro está
 * hecho de sus piezas —antepecho, machones entre huecos, dintel— y los huecos
 * son HUECOS: la cara lateral de cada machón es la jamba, con la sombra del
 * sol dentro. Dentro de cada hueco, carpintería de aluminio con parteluz,
 * vidrio que refleja cielo y calle, y una persiana a media altura distinta en
 * cada ventana (la fachada de oficinas española de toda la vida). Alféizar de
 * piedra y una línea de cornisa en cada forjado; coronación arriba.
 *
 * Todo fusionado por material: son 48 ventanas y salen seis llamadas de dibujo.
 */
export function UpperFloors({ mode, palette }: { mode: StreetMode; palette: StreetPalette }) {
  const tex = useMemo(
    () => ({
      stone: getAshlarTexture(false),
      blind: getBlindTexture(),
      glass: getGlassTexture(mode),
      lit: getLitWindowTexture(),
    }),
    [mode]
  );

  const geo = useMemo(() => {
    const { floors, floorH, pitch, bays, window: win, depth, front, crown } = UPPER;
    const back = front - depth;
    const left = FACADE.left;
    const right = FACADE.right;
    const rand = rng(57);

    const wall: THREE.BufferGeometry[] = [];
    const trim: THREE.BufferGeometry[] = [];
    const frames: THREE.BufferGeometry[] = [];
    const glassDark: THREE.BufferGeometry[] = [];
    const glassLit: THREE.BufferGeometry[] = [];
    const blinds: THREE.BufferGeometry[] = [];

    const centers = Array.from({ length: bays }, (_, i) => (i - (bays - 1) / 2) * pitch);

    for (let f = 0; f < floors; f++) {
      const yb = FACADE.bandTop + f * floorH;
      const ys = yb + win.sill;
      const yt = ys + win.h;

      // Antepecho y dintel: bandas de lado a lado.
      wall.push(boxBetween(left, right, yb, ys, back, front));
      wall.push(boxBetween(left, right, yt, yb + floorH, back, front));
      // Machones entre huecos (y los dos de los extremos).
      let x = left;
      for (const cx of centers) {
        wall.push(boxBetween(x, cx - win.w / 2, ys, yt, back, front));
        x = cx + win.w / 2;
      }
      wall.push(boxBetween(x, right, ys, yt, back, front));

      // Línea de cornisa en el forjado (la primera la tapa la banda de madera).
      if (f > 0) trim.push(boxBetween(left, right, yb - 0.07, yb + 0.07, back, front + 0.06));

      for (const cx of centers) {
        const x0 = cx - win.w / 2;
        const x1 = cx + win.w / 2;
        // Alféizar: vuela sobre el muro y sobresale por los lados.
        trim.push(boxBetween(x0 - 0.06, x1 + 0.06, ys - 0.06, ys, back, front + 0.07));

        // Carpintería: cerco, parteluz y travesaño del fijo inferior.
        const zf0 = back;
        const zf1 = back + FRAME.depth;
        const b = FRAME.bar;
        frames.push(
          boxBetween(x0, x1, ys, ys + b, zf0, zf1),
          boxBetween(x0, x1, yt - b, yt, zf0, zf1),
          boxBetween(x0, x0 + b, ys, yt, zf0, zf1),
          boxBetween(x1 - b, x1, ys, yt, zf0, zf1),
          boxBetween(cx - b / 2, cx + b / 2, ys, yt, zf0, zf1),
          boxBetween(x0, x1, ys + 0.42, ys + 0.42 + b * 0.8, zf0, zf1)
        );

        // Vidrio: encendido de noche en una parte de las ventanas.
        const glass = new THREE.PlaneGeometry(win.w - b, win.h - b).translate(cx, (ys + yt) / 2, back + 0.02);
        (rand() < palette.windowsLit ? glassLit : glassDark).push(glass);

        // Persiana enrollable: baja desde el dintel hasta una altura propia.
        const drop = rand() < 0.2 ? 0 : 0.12 + rand() * 0.7;
        if (drop > 0) {
          const h = win.h * drop;
          const blind = new THREE.PlaneGeometry(win.w - 2 * b, h).translate(cx, yt - b - h / 2, back + FRAME.depth + 0.004);
          const uv = blind.attributes.uv as THREE.BufferAttribute;
          for (let i = 0; i < uv.count; i++) uv.setY(i, (uv.getY(i) * h) / BLIND_TILE);
          blinds.push(blind);
          // Cajón de la persiana: bajo el dintel, dentro del hueco.
          frames.push(boxBetween(x0 + b, x1 - b, yt - b - 0.02, yt - b, back, back + FRAME.depth + 0.02));
        }
      }
    }

    // Coronación: cornisa volada y peto encima.
    trim.push(boxBetween(left, right, BUILDING_TOP, BUILDING_TOP + crown.h * 0.45, back, front + crown.projection));
    trim.push(boxBetween(left, right, BUILDING_TOP + crown.h * 0.45, BUILDING_TOP + crown.h, back, front + crown.projection * 0.6));
    wall.push(boxBetween(left, right, BUILDING_TOP + crown.h, BUILDING_TOP + crown.h + 0.9, back, front));

    return {
      wall: planarUV(merge(wall), ASHLAR_TILE),
      trim: planarUV(merge(trim), ASHLAR_TILE),
      frames: merge(frames),
      glassDark: merge(glassDark),
      glassLit: glassLit.length ? merge(glassLit) : null,
      blinds: blinds.length ? merge(blinds) : null,
    };
  }, [palette.windowsLit]);

  useEffect(
    () => () => {
      for (const g of Object.values(geo)) g?.dispose();
    },
    [geo]
  );

  return (
    <group>
      <mesh geometry={geo.wall} castShadow receiveShadow>
        <meshStandardMaterial map={tex.stone} roughness={0.88} />
      </mesh>
      {/* Cornisas y alféizares: la misma piedra, un punto más clara. */}
      <mesh geometry={geo.trim} castShadow receiveShadow>
        <meshStandardMaterial map={tex.stone} color="#f4f1ea" roughness={0.8} />
      </mesh>
      <mesh geometry={geo.frames} castShadow>
        <meshStandardMaterial color="#3d3b38" roughness={0.38} metalness={0.7} />
      </mesh>
      <mesh geometry={geo.glassDark}>
        <meshStandardMaterial map={tex.glass} roughness={0.06} metalness={0.55} envMapIntensity={1.4} />
      </mesh>
      {geo.glassLit && (
        <mesh geometry={geo.glassLit}>
          <meshBasicMaterial map={tex.lit} toneMapped={false} color="#d9c2a0" />
        </mesh>
      )}
      {geo.blinds && (
        <mesh geometry={geo.blinds} receiveShadow>
          <meshStandardMaterial map={tex.blind} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
