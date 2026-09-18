"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Outlines } from "@react-three/drei";
import { OUTLINE_THIN } from "./toon";
import { beaconLevel, patternAt } from "./beacon-patterns";

/**
 * Carro y spreader para el modo "painted": mismo lenguaje que la grúa dibujada
 * (acero verde oliva, remaches, luz de contraluz ya pintada en la textura y
 * contorno de tinta). Material básico, sin sombreado ni sombras: el volumen
 * va horneado en el canvas, como en el fondo.
 */

const INK = "#1a1410";
const STEEL = { base: "#7f8a34", light: "#9ba64a", shade: "#4d5621" };
const DARK_STEEL = { base: "#3b3a34", light: "#5a584e", shade: "#24231f" };

type Steel = typeof STEEL;

function steelPanel(w: number, h: number, c: Steel, rivets: boolean) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;

  ctx.fillStyle = c.base;
  ctx.fillRect(0, 0, w, h);
  // Luz de contraluz arriba, sombra propia abajo (el sol del fondo está detrás-arriba)
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, c.light);
  g.addColorStop(0.28, c.base);
  g.addColorStop(0.72, c.base);
  g.addColorStop(1, c.shade);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Juntas de chapa
  ctx.strokeStyle = "rgba(26,20,16,0.55)";
  ctx.lineWidth = 2;
  for (let x = w / 3; x < w - 1; x += w / 3) {
    ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x, h - 6); ctx.stroke();
  }

  if (rivets) {
    for (const y of [11, h - 11]) {
      for (let x = 12; x < w - 6; x += 16) {
        ctx.fillStyle = INK;
        ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c.light;
        ctx.beginPath(); ctx.arc(x - 0.8, y - 0.8, 1, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, w, h);

  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function windowTexture() {
  const cv = document.createElement("canvas");
  cv.width = 128;
  cv.height = 64;
  const ctx = cv.getContext("2d")!;
  // Reflejo del atardecer en el cristal
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, "#6b4a86");
  g.addColorStop(0.55, "#e0786a");
  g.addColorStop(1, "#f5b25c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 64);
  ctx.fillStyle = "rgba(255,240,220,0.45)";
  ctx.beginPath();
  ctx.moveTo(20, 0); ctx.lineTo(44, 0); ctx.lineTo(18, 64); ctx.lineTo(-6, 64);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, 128, 64);
  ctx.beginPath(); ctx.moveTo(64, 0); ctx.lineTo(64, 64); ctx.stroke();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Cara de la rueda del carro: llanta, radios rebajados, buje y tornillos.
 * Son 11 px en pantalla, pero son los que hacen que la grúa no parezca de
 * juguete.
 */
function wheelTexture() {
  const S = 128;
  const R = S / 2;
  const cv = document.createElement("canvas");
  cv.width = S;
  cv.height = S;
  const ctx = cv.getContext("2d")!;

  const g = ctx.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, "#5a584e");
  g.addColorStop(0.45, "#3b3a34");
  g.addColorStop(1, "#22211d");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(R, R, R - 3, 0, Math.PI * 2);
  ctx.fill();

  // Llanta: aro exterior separado del disco por una garganta de tinta
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(R, R, R - 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(R, R, R - 15, 0, Math.PI * 2);
  ctx.stroke();

  // Aligeramientos entre radios
  ctx.fillStyle = "rgba(26,20,16,0.55)";
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(R + Math.cos(a) * 33, R + Math.sin(a) * 33, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Buje y tornillos
  ctx.fillStyle = "#6f6c60";
  ctx.beginPath();
  ctx.arc(R, R, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(R + Math.cos(a) * 10, R + Math.sin(a) * 10, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function usePaintedSkins() {
  const skins = useMemo(() => {
    const make = (map: THREE.Texture) => new THREE.MeshBasicMaterial({ map, toneMapped: false });
    const maps = [
      steelPanel(256, 80, STEEL, true),
      steelPanel(128, 112, STEEL, true),
      steelPanel(256, 40, DARK_STEEL, true),
      windowTexture(),
      wheelTexture(),
    ];
    const wheelSide = new THREE.MeshBasicMaterial({ color: "#2b2a25", toneMapped: false });
    const wheelFace = make(maps[4]);
    return {
      frame: make(maps[0]),
      cabin: make(maps[1]),
      spreader: make(maps[2]),
      glass: make(maps[3]),
      ink: new THREE.MeshBasicMaterial({ color: INK }),
      lock: new THREE.MeshBasicMaterial({ color: "#c9b43a", toneMapped: false }),
      // Orden de materiales de CylinderGeometry: costado, tapa, fondo.
      wheel: [wheelSide, wheelFace, wheelFace] as THREE.Material[],
      wheelSide,
      wheelFace,
      maps,
    };
  }, []);

  useEffect(() => () => {
    skins.maps.forEach((m) => m.dispose());
    [skins.frame, skins.cabin, skins.spreader, skins.glass, skins.ink, skins.lock, skins.wheelSide, skins.wheelFace].forEach((m) =>
      m.dispose(),
    );
  }, [skins]);

  return skins;
}

const WHEEL_R = 0.19;
/** Las ruedas van a los dos lados del carril: el de cámara y el de detrás. */
const RAIL_ZS = [0.62, -0.42];

/**
 * Carretón del carro: balancín, dos cajas de grasa y dos ruedas con pestaña
 * (un aro un poco mayor que la llanta, que es lo que las mantiene en el
 * carril). Nada de un cilindro pelado.
 */
function Bogie({ x, y, skins }: { x: number; y: number; skins: ReturnType<typeof usePaintedSkins> }) {
  return (
    <group position={[x, y, 0]}>
      {RAIL_ZS.map((z) => (
        <group key={z} position={[0, 0, z]}>
          {/* Balancín que reparte la carga entre las dos ruedas */}
          <mesh position={[0, 0.2, 0]} material={skins.spreader}>
            <boxGeometry args={[0.72, 0.16, 0.14]} />
            <Outlines thickness={OUTLINE_THIN} color={INK} />
          </mesh>
          {[-0.24, 0.24].map((dx) => (
            <group key={dx} position={[dx, 0, 0]}>
              {/* Caja de grasa */}
              <mesh position={[0, 0.12, 0]} material={skins.ink}>
                <boxGeometry args={[0.16, 0.18, 0.17]} />
              </mesh>
              {/* Pestaña + llanta */}
              <mesh rotation={[Math.PI / 2, 0, 0]} material={skins.wheelSide}>
                <cylinderGeometry args={[WHEEL_R + 0.05, WHEEL_R + 0.05, 0.05, 16]} />
              </mesh>
              <mesh position={[0, 0, 0.055]} rotation={[Math.PI / 2, 0, 0]} material={skins.wheel}>
                <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.1, 16]} />
                <Outlines thickness={OUTLINE_THIN} color={INK} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Perfil de la cabina del gruista: caja arriba y cristalera en chaflán hacia el spreader, abajo. */
const CABIN_W = 1.9;
const CABIN_H = 0.85;
const CABIN_D = 1.2;
/** Vértices del chaflán acristalado: la cara que mira a la ría (+x), por donde el gruista ve la carga. */
const CHAMFER_TOP: [number, number] = [CABIN_W / 2, -0.02];
const CHAMFER_BOTTOM: [number, number] = [CABIN_W / 2 - 0.62, -CABIN_H / 2];

/**
 * Cabina del gruista, la forma real de una STS: cuelga del carro por dos
 * brazos, techo con visera y barandilla, cuerpo de chapa y, en la cara que mira
 * al spreader, la cristalera inclinada por la que el operador mira hacia abajo.
 */
function Cabin({ x, y, skins }: { x: number; y: number; skins: ReturnType<typeof usePaintedSkins> }) {
  const body = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-CABIN_W / 2, CABIN_H / 2);
    shape.lineTo(CHAMFER_TOP[0], CHAMFER_TOP[1]);
    shape.lineTo(CHAMFER_BOTTOM[0], CHAMFER_BOTTOM[1]);
    shape.lineTo(-CABIN_W / 2, -CABIN_H / 2);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: CABIN_D, bevelEnabled: false });
    g.translate(0, 0, -CABIN_D / 2);
    return g;
  }, []);
  useEffect(() => () => body.dispose(), [body]);

  const bodyMat = useMemo(() => new THREE.MeshBasicMaterial({ color: STEEL.base, toneMapped: false }), []);
  useEffect(() => () => bodyMat.dispose(), [bodyMat]);

  const dx = CHAMFER_BOTTOM[0] - CHAMFER_TOP[0];
  const dy = CHAMFER_BOTTOM[1] - CHAMFER_TOP[1];
  const chamferLen = Math.hypot(dx, dy);
  const chamferAngle = Math.atan2(dy, dx);
  const chamferMid: [number, number] = [(CHAMFER_TOP[0] + CHAMFER_BOTTOM[0]) / 2, (CHAMFER_TOP[1] + CHAMFER_BOTTOM[1]) / 2];

  return (
    <group position={[x, y, 0.2]}>
      {/* Brazos que la cuelgan del bastidor del carro */}
      {[-0.7, 0.7].map((bx) => (
        <mesh key={bx} position={[bx, CABIN_H / 2 + 0.12, 0]} material={skins.ink}>
          <boxGeometry args={[0.1, 0.24, 0.1]} />
        </mesh>
      ))}

      {/* Cuerpo con chaflán */}
      <mesh geometry={body} material={bodyMat}>
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>

      {/* Ventanal frontal (cara de cámara) */}
      <mesh position={[0.05, 0.1, CABIN_D / 2 + 0.01]} material={skins.glass}>
        <planeGeometry args={[CABIN_W - 0.35, 0.44]} />
      </mesh>
      {/* Cristalera inclinada hacia el spreader */}
      <group position={[chamferMid[0], chamferMid[1], 0]} rotation={[0, 0, chamferAngle]}>
        <mesh position={[0, -0.012, 0]} rotation={[Math.PI / 2, 0, 0]} material={skins.glass}>
          <planeGeometry args={[chamferLen - 0.05, CABIN_D - 0.14]} />
        </mesh>
      </group>
      {/* Ventana de suelo: el gruista ve la carga entre los pies */}
      <mesh position={[0.3, -CABIN_H / 2 - 0.006, 0]} rotation={[Math.PI / 2, 0, 0]} material={skins.ink}>
        <planeGeometry args={[0.7, CABIN_D - 0.3]} />
      </mesh>

      {/* Techo con visera, equipo de clima y barandilla */}
      <mesh position={[0, CABIN_H / 2 + 0.03, 0]} material={skins.spreader}>
        <boxGeometry args={[CABIN_W + 0.16, 0.06, CABIN_D + 0.16]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>
      <mesh position={[-0.5, CABIN_H / 2 + 0.15, -0.2]} material={skins.spreader}>
        <boxGeometry args={[0.4, 0.18, 0.4]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>
      <mesh position={[0, CABIN_H / 2 + 0.24, CABIN_D / 2 + 0.06]} material={skins.ink}>
        <boxGeometry args={[CABIN_W + 0.16, 0.035, 0.035]} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * (CABIN_W / 2 + 0.06), CABIN_H / 2 + 0.15, CABIN_D / 2 + 0.06]} material={skins.ink}>
          <boxGeometry args={[0.035, 0.22, 0.035]} />
        </mesh>
      ))}

      {/* Foco bajo la cabina apuntando a la carga */}
      <mesh position={[-0.55, -CABIN_H / 2 - 0.08, CABIN_D / 2 - 0.2]} material={skins.ink}>
        <boxGeometry args={[0.16, 0.12, 0.16]} />
      </mesh>
    </group>
  );
}

/** Carro sobre la pluma + cabina del gruista colgada debajo. Coordenadas locales al grupo del carro. */
export function PaintedTrolley({ trolleyY }: { trolleyY: number }) {
  const s = usePaintedSkins();

  return (
    <group>
      {/* Bastidor del carro, abrazando la pluma */}
      <mesh position={[0, trolleyY, -0.2]} material={s.frame}>
        <boxGeometry args={[2.4, 0.62, 1.6]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>
      {/* Carretones sobre el carril de la pluma: dos ruedas por bogie */}
      {[-0.85, 0.85].map((x) => (
        <Bogie key={x} x={x} y={trolleyY + 0.36} skins={s} />
      ))}
      {/* Bloque de poleas de donde salen los cables */}
      <mesh position={[0, trolleyY - 0.42, 0]} material={s.spreader}>
        <boxGeometry args={[1.3, 0.24, 0.7]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>

      <Cabin x={0.1} y={trolleyY - 1.0} skins={s} />
    </group>
  );
}

/** Cuerpo visual del spreader (dentro del RigidBody cinemático). */
export function PaintedSpreader({ halfW, halfH }: { halfW: number; halfH: number }) {
  const s = usePaintedSkins();

  return (
    <group>
      <mesh material={s.spreader}>
        <boxGeometry args={[halfW * 2, halfH * 2, 1.5]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>
      {/* Viga central oliva, como las piezas de la grúa */}
      <mesh position={[0, halfH + 0.12, 0]} material={s.frame}>
        <boxGeometry args={[halfW * 1.1, 0.24, 0.6]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>
      {[-1, 1].map((x) => (
        <mesh key={x} position={[x * (halfW - 0.2), -halfH - 0.08, 0.5]} material={s.lock}>
          <boxGeometry args={[0.25, 0.16, 0.25]} />
        </mesh>
      ))}
    </group>
  );
}


/* ------------------------------------------------------------------ */
/* Estructura de la grúa (pórtico, pluma, A-frame) con acabado pintado */
/* ------------------------------------------------------------------ */

/**
 * Perfil de viga remachada. `vertical` dibuja el patrón girado para miembros
 * que corren en y (patas); la textura se repite a lo largo del miembro, así
 * que los remaches no se estiran.
 */
function girderTexture(vertical: boolean) {
  const L = 256;
  const T = 64;
  const cv = document.createElement("canvas");
  cv.width = vertical ? T : L;
  cv.height = vertical ? L : T;
  const ctx = cv.getContext("2d")!;
  if (vertical) {
    ctx.translate(T, 0);
    ctx.rotate(Math.PI / 2);
  }

  const g = ctx.createLinearGradient(0, 0, 0, T);
  g.addColorStop(0, STEEL.light);
  g.addColorStop(0.3, STEEL.base);
  g.addColorStop(0.75, STEEL.base);
  g.addColorStop(1, STEEL.shade);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, L, T);

  // Alas superior e inferior de la viga
  ctx.fillStyle = STEEL.shade;
  ctx.fillRect(0, T - 12, L, 12);
  ctx.fillStyle = STEEL.light;
  ctx.fillRect(0, 0, L, 6);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 7); ctx.lineTo(L, 7);
  ctx.moveTo(0, T - 12); ctx.lineTo(L, T - 12);
  ctx.stroke();

  // Cartelas de unión y remaches
  ctx.strokeStyle = "rgba(26,20,16,0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(L / 2, 8); ctx.lineTo(L / 2, T - 12); ctx.stroke();
  for (const y of [15, T - 19]) {
    for (let x = 8; x < L; x += 14) {
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = STEEL.light;
      ctx.beginPath(); ctx.arc(x - 0.7, y - 0.7, 0.9, 0, Math.PI * 2); ctx.fill();
    }
  }
  for (const x of [L / 2 - 8, L / 2 + 8]) {
    for (let y = 22; y < T - 22; y += 8) {
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

export interface CraneLayout {
  legXs: number[];
  legZ: number;
  boomY: number;
  boomLeft: number;
  boomRight: number;
  apex: [number, number];
  quayTopY: number;
  beacons: number[];
}

type Resources = { textures: THREE.Texture[]; materials: THREE.Material[] };

/** Material de viga con la textura repetida según largo/canto del miembro. */
function girder(res: Resources, base: THREE.Texture, length: number, depth: number, vertical: boolean) {
  const t = base.clone();
  const reps = Math.max(1, length / (depth * 4));
  if (vertical) t.repeat.set(1, reps);
  else t.repeat.set(reps, 1);
  t.needsUpdate = true;
  const m = new THREE.MeshBasicMaterial({ map: t, toneMapped: false });
  res.textures.push(t);
  res.materials.push(m);
  return m;
}

function Bar({ from, to, z, thickness, material }: {
  from: [number, number]; to: [number, number]; z: number; thickness: number; material: THREE.Material;
}) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  return (
    <mesh
      position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, z]}
      rotation={[0, 0, -Math.atan2(dx, dy)]}
      material={material}
    >
      <boxGeometry args={[thickness, len, thickness]} />
      <Outlines thickness={OUTLINE_THIN} color={INK} />
    </mesh>
  );
}

export function PaintedCraneStructure({ layout }: { layout: CraneLayout }) {
  const { legXs, legZ, boomY, boomLeft, boomRight, apex, quayTopY, beacons } = layout;
  const boomLen = boomRight - boomLeft;
  const legH = boomY - quayTopY;
  const beamW = legXs[1] - legXs[0];

  // `layout` es una constante de módulo: los materiales se crean una vez.
  const mats = useMemo(() => {
    const armLen = (x: number) => Math.hypot(layout.apex[0] - x, layout.apex[1] - layout.boomY);
    const legH = layout.boomY - layout.quayTopY;
    const beamW = layout.legXs[1] - layout.legXs[0];
    const boomLen = layout.boomRight - layout.boomLeft;
    const res: Resources = { textures: [], materials: [] };
    const h = girderTexture(false);
    const v = girderTexture(true);
    res.textures.push(h, v);
    const house = steelPanel(256, 112, { base: "#b9b2a0", light: "#d8d1bd", shade: "#817a69" }, true);
    const bogie = steelPanel(128, 40, DARK_STEEL, true);
    res.textures.push(house, bogie);
    const basic = (map: THREE.Texture) => {
      const m = new THREE.MeshBasicMaterial({ map, toneMapped: false });
      res.materials.push(m);
      return m;
    };
    const flat = (color: string) => {
      const m = new THREE.MeshBasicMaterial({ color, toneMapped: false });
      res.materials.push(m);
      return m;
    };
    return {
      res,
      leg: girder(res, v, legH, 0.8, true),
      beam: girder(res, h, beamW, 0.55, false),
      boom: girder(res, h, boomLen, 0.75, false),
      armL: girder(res, v, armLen(layout.legXs[0]), 0.34, true),
      armR: girder(res, v, armLen(layout.legXs[1]), 0.34, true),
      stay: flat(STEEL.shade),
      head: girder(res, h, 1.6, 0.6, false),
      house: basic(house),
      bogie: basic(bogie),
      lampRing: flat(INK),
    };
  }, [layout]);

  useEffect(() => () => {
    mats.res.textures.forEach((t) => t.dispose());
    mats.res.materials.forEach((m) => m.dispose());
  }, [mats]);

  return (
    <group>
      {legXs.map((x) => (
        <group key={x}>
          <mesh position={[x, (quayTopY + boomY) / 2, legZ]} material={mats.leg}>
            <boxGeometry args={[0.8, legH, 0.8]} />
            <Outlines thickness={OUTLINE_THIN} color={INK} />
          </mesh>
          {/* Cabezal que une la pata con la pluma */}
          <mesh position={[x, boomY, (legZ - 0.6) / 2]} material={mats.head}>
            <boxGeometry args={[0.9, 0.9, Math.abs(legZ) + 0.6]} />
            <Outlines thickness={OUTLINE_THIN} color={INK} />
          </mesh>
          <mesh position={[x, quayTopY + 0.3, legZ]} material={mats.bogie}>
            <boxGeometry args={[2.2, 0.6, 1]} />
            <Outlines thickness={OUTLINE_THIN} color={INK} />
          </mesh>
        </group>
      ))}

      <mesh position={[(legXs[0] + legXs[1]) / 2, 0.8, legZ]} material={mats.beam}>
        <boxGeometry args={[beamW, 0.55, 0.55]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>

      {/* Pluma */}
      <mesh position={[(boomLeft + boomRight) / 2, boomY, -0.6]} material={mats.boom}>
        <boxGeometry args={[boomLen, 0.75, 1]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>

      {/* A-frame y tirantes */}
      <Bar from={[legXs[0], boomY]} to={apex} z={-0.6} thickness={0.34} material={mats.armL} />
      <Bar from={[legXs[1], boomY]} to={apex} z={-0.6} thickness={0.34} material={mats.armR} />
      <Bar from={apex} to={[boomRight - 0.5, boomY + 0.3]} z={-0.6} thickness={0.12} material={mats.stay} />
      <Bar from={apex} to={[boomLeft + 0.5, boomY + 0.3]} z={-0.6} thickness={0.12} material={mats.stay} />
      <mesh position={[apex[0], apex[1], -0.6]} material={mats.head}>
        <boxGeometry args={[0.8, 0.6, 0.6]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>

      {/* Sala de máquinas */}
      <mesh position={[boomLeft + 2.2, boomY + 1.2, -0.6]} material={mats.house}>
        <boxGeometry args={[3.4, 1.5, 1.8]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>

      <Beacons xs={beacons} y={boomY - 0.5} ring={mats.lampRing} />
    </group>
  );
}

// Apagada = bombilla verde oscura, encendida = verde claro. Sin halo: cambio sutil.
const LAMP_OFF = new THREE.Color("#4d6a2a");
const LAMP_ON = new THREE.Color("#b6f06a");

/** Balizas con secuencias (una a una, juntas, alternas…) — ver `beacon-patterns.ts`. Solo cambia la bombilla, sin halo. */
function Beacons({ xs, y, ring }: { xs: number[]; y: number; ring: THREE.Material }) {
  const bulbs = useMemo(
    () => xs.map(() => new THREE.MeshBasicMaterial({ color: LAMP_OFF.clone(), toneMapped: false })),
    [xs],
  );
  useEffect(() => () => bulbs.forEach((m) => m.dispose()), [bulbs]);

  const last = useRef(-1);
  useFrame((state) => {
    const { pattern, local } = patternAt(state.clock.elapsedTime);
    // Los patrones van a saltos de ~0.1 s: no hace falta recalcular a 60 Hz.
    const tick = Math.floor(state.clock.elapsedTime * 30);
    if (tick === last.current) return;
    last.current = tick;
    for (let i = 0; i < xs.length; i++) {
      const k = beaconLevel(pattern, local, i, xs.length);
      bulbs[i].color.copy(LAMP_OFF).lerp(LAMP_ON, k);
    }
  });

  return (
    <>
      {xs.map((x, i) => (
        <group key={x} position={[x, y, 0]}>
          <mesh material={ring}>
            <sphereGeometry args={[0.2, 12, 8]} />
          </mesh>
          <mesh position={[0, -0.02, 0.1]} material={bulbs[i]}>
            <sphereGeometry args={[0.15, 12, 8]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

export const PAINTED_CABLE_COLOR = INK;
