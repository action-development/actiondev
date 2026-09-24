"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { DOOR, HALL } from "./arcade-config";
import type { ArcadePalette } from "./arcade-mode";
import { getGlassTexture, getSignTexture } from "./arcade-textures";
import {
  POSTERS,
  getMuralTexture,
  getPlasterTexture,
  getPosterAtlas,
  getSignHaloTexture,
  getSpeakerTexture,
  getWainscotTexture,
  getWashTexture,
  posterUv,
} from "./hall-textures";

interface ArcadeWallsProps {
  palette: ArcadePalette;
}

const LENGTH = HALL.entranceZ - HALL.endZ;
const MID_Z = (HALL.entranceZ + HALL.endZ) / 2;
const W = HALL.halfWidth;

/** Alturas de la pared, de abajo arriba. */
const WALL = {
  skirting: 0.12,
  wainscot: 1.1,
  /** Riel de bombillas: justo por encima de las marquesinas (2,03 m). */
  bulbs: 2.22,
  /** Pósters y neones. */
  art: 2.92,
  /** Moldura de luz, bajo el techo. */
  cove: 3.52,
} as const;

/** Separación entre bombillas del riel y cadencia de la persecución. */
const BULB_STEP = 0.18;
const CHASE_S = 0.11;

/** Cada cuánto hay algo colgado en la pared, y qué: póster, póster, neón… */
const ART_STEP = 2.9;
const ART_FROM = HALL.entranceZ - 2.4;

const SIGNS = [
  { text: "HIGH SCORE", color: "#4fe3ff" },
  { text: "GAME ON", color: "#ff4fd8" },
  { text: "PRESS START", color: "#ffb347" },
  { text: "1UP", color: "#c8ff00" },
  { text: "LEVEL UP", color: "#4fe3ff" },
  { text: "CONTINUE?", color: "#ff4fd8" },
] as const;
const SIGN_HEIGHT = 0.22;
const SIGN_ASPECT = 1024 / 160;

const POSTER = { w: 0.62, h: 0.87, frame: 0.035 } as const;
/** Fondo de la caja de luz de los pósters. */
const LIGHTBOX_DEPTH = 0.07;

/** Rotación Y de un plano para que mire al pasillo desde la pared `s`. */
const facing = (s: number) => -s * (Math.PI / 2);

interface ArtSlot {
  side: -1 | 1;
  z: number;
  kind: "poster" | "sign";
  /** Índice dentro de POSTERS o SIGNS. */
  index: number;
}

function buildArt(): ArtSlot[] {
  const out: ArtSlot[] = [];
  let poster = 0;
  let sign = 0;
  let k = 0;
  for (let z = ART_FROM; z > HALL.endZ + 2; z -= ART_STEP) {
    for (const side of [-1, 1] as const) {
      // Los dos lados desfasados: enfrentados quedarían en espejo y se nota.
      const isSign = (k + (side === 1 ? 1 : 0)) % 3 === 1;
      if (isSign) out.push({ side, z, kind: "sign", index: sign++ % SIGNS.length });
      else out.push({ side, z, kind: "poster", index: poster++ % POSTERS.length });
    }
    k++;
  }
  return out;
}

/**
 * Las paredes de la sala: de abajo arriba, rodapié, friso de paneles con su
 * moldura, yeso pintado con un mural de luz negra, el riel de bombillas que
 * persiguen por encima de las máquinas, pósters enmarcados y letreros de neón,
 * y arriba del todo una moldura de luz que baña la pared hacia abajo.
 *
 * Las máquinas tapan casi todo lo que queda por debajo de 2 m, así que el
 * detalle se concentra ARRIBA, que es lo que se ve a lo largo del pasillo.
 */
export function ArcadeWalls({ palette }: ArcadeWallsProps) {
  const art = useMemo(() => buildArt(), []);

  const plaster = useMemo(() => {
    const t = getPlasterTexture().clone();
    t.repeat.set(LENGTH / 2, HALL.height / 2);
    t.needsUpdate = true;
    return t;
  }, []);
  const wainscot = useMemo(() => {
    const t = getWainscotTexture().clone();
    t.repeat.set(LENGTH / 0.6, 1);
    t.needsUpdate = true;
    return t;
  }, []);
  const mural = useMemo(() => {
    const t = getMuralTexture().clone();
    t.repeat.set(LENGTH / 4, 1);
    t.needsUpdate = true;
    return t;
  }, []);
  useEffect(
    () => () => {
      plaster.dispose();
      wainscot.dispose();
      mural.dispose();
    },
    [plaster, wainscot, mural],
  );

  const neon = palette.neon.on ? palette.neon.color : "#5a5a60";

  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          {/* Yeso */}
          <mesh position={[s * W, HALL.height / 2, MID_Z]} rotation-y={facing(s)}>
            <planeGeometry args={[LENGTH, HALL.height]} />
            <meshStandardMaterial map={plaster} color={palette.wall} roughness={0.95} />
          </mesh>
          {/* Friso de paneles, moldura y rodapié */}
          <mesh position={[s * (W - 0.012), WALL.wainscot / 2, MID_Z]} rotation-y={facing(s)}>
            <planeGeometry args={[LENGTH, WALL.wainscot]} />
            <meshStandardMaterial map={wainscot} color={palette.wainscot} roughness={0.55} />
          </mesh>
          <mesh position={[s * (W - 0.025), WALL.wainscot + 0.02, MID_Z]}>
            <boxGeometry args={[0.05, 0.045, LENGTH]} />
            <meshStandardMaterial color={palette.steel} roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh position={[s * (W - 0.015), WALL.skirting / 2, MID_Z]}>
            <boxGeometry args={[0.03, WALL.skirting, LENGTH]} />
            <meshStandardMaterial color="#0c0c0f" roughness={0.5} />
          </mesh>

          {/* Mural de luz negra */}
          <mesh position={[s * (W - 0.004), 2.9, MID_Z]} rotation-y={facing(s)}>
            <planeGeometry args={[LENGTH, 1.2]} />
            <meshBasicMaterial
              map={mural}
              transparent
              opacity={palette.mural}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* Riel de las bombillas */}
          <mesh position={[s * (W - 0.035), WALL.bulbs, MID_Z]}>
            <boxGeometry args={[0.07, 0.09, LENGTH]} />
            <meshStandardMaterial color="#111116" roughness={0.4} metalness={0.3} />
          </mesh>

          {/* Moldura de luz y su bañado sobre la pared */}
          <mesh position={[s * (W - 0.06), WALL.cove, MID_Z]}>
            <boxGeometry args={[0.03, 0.03, LENGTH]} />
            <meshBasicMaterial color={neon} toneMapped={false} />
          </mesh>
          <mesh position={[s * (W - 0.006), WALL.cove - 0.5, MID_Z]} rotation-y={facing(s)}>
            <planeGeometry args={[LENGTH, 1]} />
            <meshBasicMaterial
              map={getWashTexture()}
              color={palette.neon.color}
              transparent
              opacity={palette.neon.on ? palette.cove : palette.cove * 0.4}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      <ChaseBulbs palette={palette} />
      <Posters slots={art.filter((a) => a.kind === "poster")} lit={palette.signsOn} />
      {art
        .filter((a) => a.kind === "sign")
        .map((a) => (
          <NeonSign key={`${a.side}:${a.z}`} slot={a} on={palette.signsOn} />
        ))}
      <Speakers />
      <EndWalls palette={palette} />
    </group>
  );
}

/**
 * Bombillas del riel, en persecución: una de cada tres encendida y el patrón
 * corriendo hacia la puerta, como el marco de luces de una sala recreativa.
 * Una sola `InstancedMesh` para las dos paredes; la animación solo reescribe
 * los colores, y solo cuando toca paso (no a cada frame).
 */
function ChaseBulbs({ palette }: { palette: ArcadePalette }) {
  const bulbs = useRef<THREE.InstancedMesh>(null);
  const sockets = useRef<THREE.InstancedMesh>(null);
  const perSide = Math.floor(LENGTH / BULB_STEP);
  const count = perSide * 2;
  const geo = useMemo(
    () => ({
      bulb: new THREE.SphereGeometry(0.02, 10, 8),
      // Portalámparas: casquillo que sale del riel hacia el pasillo.
      socket: new THREE.CylinderGeometry(0.013, 0.015, 0.03, 10).rotateZ(Math.PI / 2),
    }),
    [],
  );
  const mat = useMemo(
    () => ({
      bulb: new THREE.MeshBasicMaterial({ toneMapped: false }),
      socket: new THREE.MeshStandardMaterial({ color: "#b8a36a", roughness: 0.3, metalness: 0.8 }),
    }),
    [],
  );
  useEffect(
    () => () => {
      for (const g of Object.values(geo)) g.dispose();
      for (const m of Object.values(mat)) m.dispose();
    },
    [geo, mat],
  );

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const s = i < perSide ? -1 : 1;
      const z = HALL.entranceZ - 0.1 - (i % perSide) * BULB_STEP;
      bulbs.current?.setMatrixAt(i, m.makeTranslation(s * (W - 0.1), WALL.bulbs, z));
      sockets.current?.setMatrixAt(i, m.makeTranslation(s * (W - 0.075), WALL.bulbs, z));
    }
    for (const r of [bulbs, sockets]) {
      if (!r.current) continue;
      r.current.instanceMatrix.needsUpdate = true;
      r.current.computeBoundingSphere();
    }
  }, [count, perSide]);

  const on = useMemo(() => new THREE.Color(palette.bulbs.on), [palette.bulbs.on]);
  const off = useMemo(() => new THREE.Color(palette.bulbs.off), [palette.bulbs.off]);
  const step = useRef(-1);
  const still = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useFrame(({ clock }) => {
    const b = bulbs.current;
    if (!b) return;
    const next = still.current ? 0 : Math.floor(clock.elapsedTime / CHASE_S);
    if (next === step.current && b.instanceColor) return;
    step.current = next;
    for (let i = 0; i < count; i++) {
      const lit = ((i % perSide) + next) % 3 === 0;
      b.setColorAt(i, lit ? on : off);
    }
    if (b.instanceColor) b.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={sockets} args={[geo.socket, mat.socket, count]} />
      <instancedMesh ref={bulbs} args={[geo.bulb, mat.bulb, count]} />
    </group>
  );
}

/**
 * Pósters en CAJA DE LUZ, como en los cines y las salas recreativas: marco de
 * aluminio de 7 cm de fondo, lámina retroiluminada (`emissive`, más de noche) y
 * cristal delante con su reflejo. Todas las láminas son UNA malla fusionada
 * sobre el atlas, los cristales otra, y los marcos una `InstancedMesh`.
 */
function Posters({ slots, lit }: { slots: ArtSlot[]; lit: boolean }) {
  const sheet = useMemo(() => {
    const planes = slots.map((a) => {
      const g = new THREE.PlaneGeometry(POSTER.w, POSTER.h);
      const [u0, v0, u1, v1] = posterUv(a.index);
      const uv = g.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) === 0 ? u0 : u1, uv.getY(i) === 0 ? v0 : v1);
      g.rotateY(facing(a.side));
      g.translate(a.side * (W - LIGHTBOX_DEPTH - 0.002), WALL.art, a.z);
      return g;
    });
    const merged = mergeGeometries(planes);
    for (const p of planes) p.dispose();
    return merged;
  }, [slots]);
  // Cristales: los mismos planos, un pelo por delante y con UV completas (el
  // reflejo es el mismo en todos).
  const glass = useMemo(() => {
    const planes = slots.map((a) => {
      const g = new THREE.PlaneGeometry(POSTER.w + 0.03, POSTER.h + 0.03);
      g.rotateY(facing(a.side));
      g.translate(a.side * (W - LIGHTBOX_DEPTH - 0.006), WALL.art, a.z);
      return g;
    });
    const merged = mergeGeometries(planes);
    for (const p of planes) p.dispose();
    return merged;
  }, [slots]);
  const glassMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: getGlassTexture(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );
  const atlas = getPosterAtlas();
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: atlas,
        emissiveMap: atlas,
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: lit ? 0.62 : 0.28,
        roughness: 0.65,
      }),
    [atlas, lit],
  );
  const frameGeometry = useMemo(
    () => new THREE.BoxGeometry(LIGHTBOX_DEPTH, POSTER.h + POSTER.frame * 2, POSTER.w + POSTER.frame * 2),
    [],
  );
  useEffect(
    () => () => {
      sheet.dispose();
      glass.dispose();
      material.dispose();
      glassMaterial.dispose();
      frameGeometry.dispose();
    },
    [sheet, glass, material, glassMaterial, frameGeometry],
  );

  const frames = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = frames.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    slots.forEach((a, i) => {
      m.makeTranslation(a.side * (W - LIGHTBOX_DEPTH / 2), WALL.art, a.z);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [slots]);

  return (
    <group>
      <mesh geometry={sheet} material={material} />
      <mesh geometry={glass} material={glassMaterial} renderOrder={1} />
      {/* Perfil de aluminio anodizado en negro, como el de las cajas de luz */}
      <instancedMesh ref={frames} args={[frameGeometry, undefined, slots.length]}>
        <meshStandardMaterial color="#1b1c21" roughness={0.28} metalness={0.75} />
      </instancedMesh>
    </group>
  );
}

/**
 * Letrero de neón como se cuelga de verdad: los tubos sobre una placa de
 * metacrilato ahumado, separada de la pared con cuatro separadores cromados, y
 * detrás el HALO del color del tubo bañando el yeso. De día, tubos apagados:
 * el texto se queda en gris y el halo desaparece.
 */
function NeonSign({ slot, on }: { slot: ArtSlot; on: boolean }) {
  const sign = SIGNS[slot.index];
  const texture = getSignTexture(sign.text, sign.color);
  const halo = getSignHaloTexture(sign.text, sign.color);
  const width = SIGN_HEIGHT * SIGN_ASPECT;
  const plate = { w: width * 0.86, h: SIGN_HEIGHT * 1.9 };
  return (
    <group position={[slot.side * (W - 0.05), WALL.art, slot.z]} rotation-y={facing(slot.side)}>
      {on && (
        <mesh position={[0, 0, -0.045]}>
          <planeGeometry args={[width * 1.5, SIGN_HEIGHT * 4]} />
          <meshBasicMaterial
            map={halo}
            transparent
            opacity={0.9}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      )}
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[plate.w, plate.h, 0.006]} />
        <meshStandardMaterial color="#0a0a0d" roughness={0.08} metalness={0.3} transparent opacity={0.82} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sy) => (
          <mesh
            key={`${sx}:${sy}`}
            position={[sx * (plate.w / 2 - 0.03), sy * (plate.h / 2 - 0.03), -0.03]}
            rotation-x={Math.PI / 2}
          >
            <cylinderGeometry args={[0.009, 0.009, 0.04, 10]} />
            <meshStandardMaterial color="#c9ccd4" roughness={0.15} metalness={0.9} />
          </mesh>
        )),
      )}
      <mesh>
        <planeGeometry args={[width, SIGN_HEIGHT]} />
        <meshBasicMaterial
          map={texture}
          color={on ? "#ffffff" : "#6a6a6a"}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Altavoces colgados en lo alto de la pared, inclinados hacia el pasillo. */
function Speakers() {
  const zs = useMemo(() => {
    const out: number[] = [];
    for (let z = HALL.entranceZ - 4; z > HALL.endZ + 3; z -= 7) out.push(z);
    return out;
  }, []);
  return (
    <group>
      {[-1, 1].flatMap((s) =>
        zs.map((z) => (
          <group key={`${s}:${z}`} position={[s * (W - 0.14), 3.32, z + s * 1.4]} rotation={[0, facing(s), 0]}>
            <group rotation-x={-0.35}>
              <mesh>
                <boxGeometry args={[0.24, 0.34, 0.2]} />
                <meshStandardMaterial color="#141418" roughness={0.35} metalness={0.1} />
              </mesh>
              <mesh position={[0, 0, 0.101]}>
                <planeGeometry args={[0.2, 0.3]} />
                <meshStandardMaterial map={getSpeakerTexture()} roughness={0.95} />
              </mesh>
            </group>
            {/* Escuadra a la pared */}
            <mesh position={[0, 0.16, -0.12]}>
              <boxGeometry args={[0.04, 0.03, 0.12]} />
              <meshStandardMaterial color="#2a2a30" metalness={0.5} roughness={0.4} />
            </mesh>
          </group>
        )),
      )}
    </group>
  );
}

/**
 * Pared del fondo (la de la puerta) y la de la entrada: mismo yeso, friso a
 * ambos lados de la puerta y la moldura de luz, para que el pasillo acabe en
 * la misma sala y no contra un telón plano.
 */
function EndWalls({ palette }: { palette: ArcadePalette }) {
  const plaster = useMemo(() => {
    const t = getPlasterTexture().clone();
    t.repeat.set((W * 2) / 2, HALL.height / 2);
    t.needsUpdate = true;
    return t;
  }, []);
  // La pared del fondo es una `ShapeGeometry` con el vano recortado: sus UV
  // son metros, así que la teja de 2 m se repite a 1/2 por unidad.
  const plasterEnd = useMemo(() => {
    const t = getPlasterTexture().clone();
    t.repeat.set(0.5, 0.5);
    t.needsUpdate = true;
    return t;
  }, []);
  const endWall = useMemo(() => {
    const hw = DOOR.width / 2 + DOOR.frame;
    const top = DOOR.height + DOOR.frame;
    // Contorno en U (el vano toca el suelo, así que no puede ser un agujero).
    const shape = new THREE.Shape();
    shape.moveTo(-W, 0);
    shape.lineTo(-hw, 0);
    shape.lineTo(-hw, top);
    shape.lineTo(hw, top);
    shape.lineTo(hw, 0);
    shape.lineTo(W, 0);
    shape.lineTo(W, HALL.height);
    shape.lineTo(-W, HALL.height);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);
  const wainscot = useMemo(() => {
    const t = getWainscotTexture().clone();
    t.repeat.set(1.52 / 0.6, 1);
    t.needsUpdate = true;
    return t;
  }, []);
  useEffect(
    () => () => {
      plaster.dispose();
      plasterEnd.dispose();
      wainscot.dispose();
      endWall.dispose();
    },
    [plaster, plasterEnd, wainscot, endWall],
  );
  const sideWidth = W - DOOR.width / 2 - 0.08;
  const neon = palette.neon.on ? palette.neon.color : "#5a5a60";

  return (
    <group>
      {/* Fondo, con el vano de la puerta recortado */}
      <mesh position={[0, 0, HALL.endZ]} geometry={endWall}>
        <meshStandardMaterial map={plasterEnd} color={palette.wall} roughness={0.95} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (W - sideWidth / 2), 0, HALL.endZ]}>
          <mesh position={[0, WALL.wainscot / 2, 0.012]}>
            <planeGeometry args={[sideWidth, WALL.wainscot]} />
            <meshStandardMaterial map={wainscot} color={palette.wainscot} roughness={0.55} />
          </mesh>
          <mesh position={[0, WALL.wainscot + 0.02, 0.025]}>
            <boxGeometry args={[sideWidth, 0.045, 0.05]} />
            <meshStandardMaterial color={palette.steel} roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh position={[0, WALL.skirting / 2, 0.015]}>
            <boxGeometry args={[sideWidth, WALL.skirting, 0.03]} />
            <meshStandardMaterial color="#0c0c0f" roughness={0.5} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, WALL.cove, HALL.endZ + 0.06]}>
        <boxGeometry args={[W * 2, 0.03, 0.03]} />
        <meshBasicMaterial color={neon} toneMapped={false} />
      </mesh>

      {/* Entrada, a la espalda */}
      <mesh position={[0, HALL.height / 2, HALL.entranceZ]} rotation-y={Math.PI}>
        <planeGeometry args={[W * 2, HALL.height]} />
        <meshStandardMaterial map={plaster} color={palette.wall} roughness={0.95} />
      </mesh>
    </group>
  );
}
