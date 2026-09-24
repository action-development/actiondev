"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { FACADE, PORTAL, SLAT } from "../street-config";
import { boxBetween, merge } from "../street-geometry";
import { getSlatTexture } from "../street-textures";

/** Un tramo de revestimiento: dónde va y hacia dónde corren los listones. */
type Run =
  /** Pared mirando a +z, listones verticales. `z` = cara vista. */
  | { kind: "front"; x0: number; x1: number; y0: number; y1: number; z: number }
  /** Pared mirando a +x (lateral del soportal), listones verticales. */
  | { kind: "side"; z0: number; z1: number; y0: number; y1: number; x: number }
  /** Techo mirando abajo, listones hacia el fondo (a lo largo de z). */
  | { kind: "soffit"; x0: number; x1: number; z0: number; z1: number; y: number };

/**
 * Tramos de madera del portal, como en la foto: la banda sobre la calle, el
 * techo del soportal, su lateral izquierdo y la pared del fondo alrededor del
 * ascensor y de las puertas de vidrio.
 */
function buildRuns(): Run[] {
  const back = PORTAL.backZ;
  const glass = PORTAL.glass;
  return [
    { kind: "front", x0: FACADE.left, x1: FACADE.right, y0: FACADE.canopyY, y1: FACADE.bandTop, z: FACADE.bandFront },
    { kind: "soffit", x0: PORTAL.x0, x1: PORTAL.x1, z0: back, z1: FACADE.bandFront, y: FACADE.canopyY },
    { kind: "side", z0: back, z1: 0, y0: 0, y1: FACADE.canopyY, x: PORTAL.x0 },
    { kind: "front", x0: PORTAL.x0, x1: PORTAL.pillars[0][0], y0: 0, y1: FACADE.canopyY, z: back + SLAT.depth },
    { kind: "front", x0: PORTAL.pillars[1][1], x1: glass.x0, y0: 0, y1: FACADE.canopyY, z: back + SLAT.depth },
    { kind: "front", x0: glass.x0, x1: glass.x1, y0: glass.h, y1: FACADE.canopyY, z: back + SLAT.depth },
    { kind: "front", x0: glass.x1, x1: PORTAL.x1, y0: 0, y1: FACADE.canopyY, z: back + SLAT.depth },
  ];
}

/** PRNG determinista (mismo tono para cada listón en cada visita). */
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
 * Revestimiento de listones de madera tropical: CADA listón es una caja, todos
 * en un único `InstancedMesh` (~700 instancias, una llamada de dibujo).
 *
 * Antes era un plano con los listones pintados, y es lo que hacía que la
 * fachada se viera de cartón: sin relieve, la luz rasante del sol no tenía
 * canto que iluminar ni junta que sombrear. Ahora cada listón proyecta sombra
 * sobre el rastrel oscuro de detrás y la banda cambia con el paralaje.
 *
 * El tono de cada listón lo da `instanceColor` (la madera natural nunca sale
 * de un solo color); la veta, una textura compartida estirada a lo largo.
 */
export function WoodCladding() {
  const slatTex = useMemo(() => getSlatTexture(), []);
  const ref = useRef<THREE.InstancedMesh>(null);

  const { slats, backing } = useMemo(() => {
    const out: { pos: THREE.Vector3; scale: THREE.Vector3 }[] = [];
    const backParts: THREE.BufferGeometry[] = [];
    const half = SLAT.pitch / 2;
    for (const run of buildRuns()) {
      if (run.kind === "front") {
        const h = run.y1 - run.y0;
        for (let x = run.x0 + half; x < run.x1; x += SLAT.pitch) {
          out.push({
            pos: new THREE.Vector3(x, run.y0 + h / 2, run.z - SLAT.depth / 2),
            scale: new THREE.Vector3(SLAT.width, h, SLAT.depth),
          });
        }
        // La banda es maciza hasta el muro (se le ve la panza desde la acera);
        // en la pared del fondo basta un tablero.
        const thick = run.y0 === FACADE.canopyY ? run.z - SLAT.depth + 0.1 : 0.03;
        backParts.push(boxBetween(run.x0, run.x1, run.y0, run.y1, run.z - SLAT.depth - thick, run.z - SLAT.depth));
      } else if (run.kind === "side") {
        const h = run.y1 - run.y0;
        for (let z = run.z0 + half; z < run.z1; z += SLAT.pitch) {
          out.push({
            pos: new THREE.Vector3(run.x + SLAT.depth / 2, run.y0 + h / 2, z),
            scale: new THREE.Vector3(SLAT.depth, h, SLAT.width),
          });
        }
        backParts.push(boxBetween(run.x - 0.03, run.x, run.y0, run.y1, run.z0, run.z1));
      } else {
        const len = run.z1 - run.z0;
        for (let x = run.x0 + half; x < run.x1; x += SLAT.pitch) {
          out.push({
            pos: new THREE.Vector3(x, run.y - SLAT.depth / 2, run.z0 + len / 2),
            scale: new THREE.Vector3(SLAT.width, SLAT.depth, len),
          });
        }
        backParts.push(boxBetween(run.x0, run.x1, run.y, run.y + 0.03, run.z0, run.z1));
      }
    }
    // Remate de la banda: vierteaguas de aluminio arriba y canto inferior.
    backParts.push(boxBetween(FACADE.left, FACADE.right, FACADE.bandTop - 0.02, FACADE.bandTop + 0.03, -0.1, FACADE.bandFront + 0.03));
    return { slats: out, backing: merge(backParts) };
  }, []);

  const slatGeo = useMemo(() => {
    // Caja unidad con la veta a lo largo de la dimensión LARGA de cada cara:
    // en las verticales es y; en el techo, z. Se consigue girando las UV de
    // las caras ±y (las únicas que en el techo quedan a la vista).
    const g = new THREE.BoxGeometry(1, 1, 1);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 8; i < 16; i++) uv.setXY(i, uv.getY(i), uv.getX(i));
    return g;
  }, []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    const rand = rng(3);
    slats.forEach((s, i) => {
      m.compose(s.pos, q, s.scale);
      mesh.setMatrixAt(i, m);
      // Tono por listón: más claro/oscuro y algo más rojo o más miel.
      const t = 0.72 + rand() * 0.36;
      const warm = rand() * 0.08;
      c.setRGB(t * (1 + warm), t, t * (1 - warm));
      mesh.setColorAt(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [slats]);

  useEffect(
    () => () => {
      slatGeo.dispose();
      backing.dispose();
    },
    [slatGeo, backing]
  );

  return (
    <group>
      <instancedMesh ref={ref} args={[slatGeo, undefined, slats.length]} castShadow receiveShadow>
        <meshStandardMaterial map={slatTex} roughness={0.62} />
      </instancedMesh>
      {/* Rastrel y fondo: casi negro, es lo que asoma entre listón y listón. */}
      <mesh geometry={backing} receiveShadow>
        <meshStandardMaterial color="#24140c" roughness={0.9} />
      </mesh>
    </group>
  );
}
