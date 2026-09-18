"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import { OUTLINE, OUTLINE_THIN } from "./toon";
import { HOLD_FLOOR_Y, HOLD_MAX_X, HOLD_MIN_X, WATER_Y } from "./crane-logic";
import {
  BOW_X,
  CUT_Y,
  HALF_BEAM,
  HATCH_INNER,
  STERN_X,
  buildDeckSurface,
  buildHullSurface,
  buildRail,
  buildSheerStrake,
  deckYAt,
  farTopAt,
  halfBeamAt,
  type Surface,
} from "./ship-hull";
import { advanceLights, createLights } from "./ship-lights";

/**
 * Portacontenedores con acabado "painted": mismo lenguaje que la grúa dibujada
 * (volumen horneado en canvas, contorno de tinta, `MeshBasicMaterial` sin
 * sombreado) para que se lea como parte de la ilustración del fondo.
 *
 * El casco NO es una caja: sale de barrer una cuaderna a lo largo de la eslora
 * (`ship-hull.ts`), con manga que se cierra en la proa, pantoque redondeado,
 * astilla en el costado y arrufo en la cubierta. Va delante del barco pintado
 * y lo tapa.
 *
 * Colores muestreados del propio fondo (`port-atardecer-v2.webp`).
 */

const INK = "#1a1410";
const NAVY = { base: "#232d55", light: "#41538a", shade: "#161d3a" };
const RED = { base: "#6b2531", light: "#8c3442", shade: "#40141c" };
const HOUSE = { base: "#d0c4ca", light: "#f0e8e6", shade: "#9a8d96" };
const DECK = { base: "#6e6560", light: "#8d837c", shade: "#4a443f" };
const COAMING = { base: "#8b8183", light: "#a9a0a1", shade: "#5d5556" };
const HOLD_DARK = "#1b2240";

/** Caja del forro en unidades de mundo: las UV del casco van en x,y de mundo. */
const HULL_BOX = { minX: 4.6, minY: -10, w: 17.6, h: 6.5 };
/** Caja de la cubierta: sus UV van en x,z de mundo. */
const DECK_BOX = { minX: 4.6, minZ: -2.6, w: 17.6, d: 5.2 };

type Ramp = typeof NAVY;

function rivetRow(ctx: CanvasRenderingContext2D, y: number, from: number, to: number, step: number, light: string) {
  for (let x = from; x < to; x += step) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(x, y, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(x - 0.8, y - 0.8, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Forro del costado: obra muerta azul arriba, traca roja de flotación abajo,
 * con la línea de agua justo donde cae `WATER_Y` en el mundo.
 */
function hullTexture() {
  const W = 1280;
  const H = 472;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;

  const row = (y: number) => ((HULL_BOX.minY + HULL_BOX.h - y) / HULL_BOX.h) * H;
  const col = (x: number) => ((x - HULL_BOX.minX) / HULL_BOX.w) * W;
  const bootTop = row(WATER_Y + 0.75);

  // Casi plano a propósito: un degradado de toda la altura aclara la proa (que
  // es la parte más alta del casco) y la desgaja del resto. El volumen lo dan
  // el trancanil, las costuras y la tinta.
  ctx.fillStyle = NAVY.base;
  ctx.fillRect(0, 0, W, bootTop);
  const blue = ctx.createLinearGradient(0, bootTop - 90, 0, bootTop);
  blue.addColorStop(0, "rgba(22,29,58,0)");
  blue.addColorStop(1, NAVY.shade);
  ctx.fillStyle = blue;
  ctx.fillRect(0, bootTop - 90, W, 90);

  const red = ctx.createLinearGradient(0, bootTop, 0, H);
  red.addColorStop(0, RED.light);
  red.addColorStop(0.3, RED.base);
  red.addColorStop(1, RED.shade);
  ctx.fillStyle = red;
  ctx.fillRect(0, bootTop, W, H - bootTop);

  // Costuras verticales entre chapas
  ctx.strokeStyle = "rgba(26,20,16,0.32)";
  ctx.lineWidth = 2;
  for (let x = W / 20; x < W; x += W / 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  // Trancaniles del forro
  ctx.strokeStyle = "rgba(26,20,16,0.5)";
  ctx.lineWidth = 3;
  for (const y of [row(-6.55), row(-7.05)]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, bootTop);
  ctx.lineTo(W, bootTop);
  ctx.stroke();

  rivetRow(ctx, row(-6.72), 10, W, 16, NAVY.light);
  rivetRow(ctx, bootTop + 14, 10, W, 16, RED.light);

  // Calados de proa, como en cualquier barco de verdad
  ctx.fillStyle = "#e8e0d2";
  ctx.font = "bold 15px monospace";
  for (let i = 0; i < 4; i++) {
    ctx.fillText(String(6 - i), col(BOW_X + 1.5), row(-7.35 - i * 0.42));
  }

  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(1 / HULL_BOX.w, 1 / HULL_BOX.h);
  t.offset.set(-HULL_BOX.minX / HULL_BOX.w, -HULL_BOX.minY / HULL_BOX.h);
  t.anisotropy = 8;
  return t;
}

/** Plancha de cubierta: chapas soldadas, no tablones. */
function deckTexture() {
  const W = 1024;
  const H = 320;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, DECK.shade);
  g.addColorStop(0.5, DECK.base);
  g.addColorStop(1, DECK.light);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(26,20,16,0.4)";
  ctx.lineWidth = 2;
  for (let x = 0; x < W; x += W / 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += H / 5) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(1 / DECK_BOX.w, 1 / DECK_BOX.d);
  t.offset.set(-DECK_BOX.minX / DECK_BOX.w, -DECK_BOX.minZ / DECK_BOX.d);
  t.anisotropy = 8;
  return t;
}

/** Frontal del puente: blanco de superestructura con dos corridas de ventanas. */
function houseTexture() {
  const W = 256;
  const H = 416;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, HOUSE.light);
  g.addColorStop(0.35, HOUSE.base);
  g.addColorStop(1, HOUSE.shade);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(26,20,16,0.45)";
  ctx.lineWidth = 3;
  for (const y of [96, 200, 300]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  const glass = ctx.createLinearGradient(0, 40, 0, 84);
  glass.addColorStop(0, "#7fb0c4");
  glass.addColorStop(1, "#4f6b92");
  for (let i = 0; i < 6; i++) {
    const x = 18 + i * 37;
    ctx.fillStyle = glass;
    ctx.fillRect(x, 40, 28, 44);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, 40, 28, 44);
  }

  rivetRow(ctx, 110, 14, W, 20, HOUSE.light);
  rivetRow(ctx, 314, 14, W, 20, HOUSE.light);

  ctx.strokeStyle = INK;
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, W, H);

  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Chapa lisa con degradado: laterales del puente, chimenea, brazolas, molinete. */
function plateTexture(w: number, h: number, c: Ramp, seams: number) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, c.light);
  g.addColorStop(0.3, c.base);
  g.addColorStop(1, c.shade);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(26,20,16,0.4)";
  ctx.lineWidth = 2;
  for (let i = 1; i < seams; i++) {
    const x = (w / seams) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  rivetRow(ctx, 10, 10, w, 16, c.light);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function toGeometry({ positions, uvs, indices }: Surface) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

function useShipParts(lit: boolean) {
  const parts = useMemo(() => {
    const textures: THREE.Texture[] = [];
    const materials: THREE.Material[] = [];
    const geometries: THREE.BufferGeometry[] = [];
    const basic = (map: THREE.Texture, side?: THREE.Side) => {
      textures.push(map);
      const m = new THREE.MeshBasicMaterial({ map, toneMapped: false, side });
      materials.push(m);
      return m;
    };
    const flat = (color: string, side?: THREE.Side) => {
      const m = new THREE.MeshBasicMaterial({ color, toneMapped: false, side });
      materials.push(m);
      return m;
    };
    const geo = (s: Surface) => {
      const g = toGeometry(s);
      geometries.push(g);
      return g;
    };
    return {
      textures,
      materials,
      geometries,
      hullGeo: geo(buildHullSurface()),
      deckGeo: geo(buildDeckSurface()),
      railNearGeo: geo(buildRail(true)),
      strakeNearGeo: geo(buildSheerStrake(true)),
      railFarGeo: geo(buildRail(false)),
      // A dos caras: por la escotilla y por el rebaje se ve el forro por
      // dentro, y con una sola cara esas zonas salen en negro.
      plating: basic(hullTexture(), THREE.DoubleSide),
      // La cubierta y el trancanil se ven por las dos caras según el tramo.
      deck: basic(deckTexture(), THREE.DoubleSide),
      rail: basic(plateTexture(512, 40, COAMING, 16), THREE.DoubleSide),
      house: basic(houseTexture()),
      houseSide: basic(plateTexture(192, 416, HOUSE, 3)),
      funnel: basic(plateTexture(96, 128, NAVY, 2)),
      winch: basic(plateTexture(96, 64, { base: "#5d5a52", light: "#807c71", shade: "#3a3833" }, 3)),
      hold: flat(HOLD_DARK),
      ink: flat(INK),
      accent: flat("#c8ff00"),
      lamp: flat(lit ? "#ffe9a6" : "#8ea3bd"),
    };
  }, [lit]);

  useEffect(
    () => () => {
      parts.textures.forEach((t) => t.dispose());
      parts.materials.forEach((m) => m.dispose());
      parts.geometries.forEach((g) => g.dispose());
    },
    [parts],
  );

  return parts;
}

const BRIDGE_X = 18;
const HOLD_CENTER = (HOLD_MIN_X + HOLD_MAX_X) / 2;
const HOLD_W = HOLD_MAX_X - HOLD_MIN_X;
/** Mamparo interior de la escotilla (banda opuesta). */
const HATCH_Z = -HALF_BEAM * HATCH_INNER;
/**
 * El mamparo interior llega hasta la amurada de la banda opuesta, no solo
 * hasta la cubierta: si se queda corto, por la escotilla se ve el forro del
 * casco POR DENTRO (cara trasera, culled) y aparece una franja negra.
 */
const HOLD_TOP = farTopAt(HOLD_CENTER);

/* ------------------------------------------------------------------ */
/* Ventanas de los camarotes con vida propia (ver `ship-lights.ts`)    */
/* ------------------------------------------------------------------ */

const WIN_W = 0.34;
const WIN_H = 0.42;
const OFF_GLASS = new THREE.Color("#44536f");
const ON_GLASS = new THREE.Color("#f2d18d");
/**
 * Lo que tarda una ventana en llegar a su estado: una lámpara no es un
 * interruptor, pero tampoco puede quedarse mucho a medias — el punto medio
 * entre el azul del cristal y el amarillo es un gris sucio.
 */
const FADE = 9;

interface CabinWindow {
  pos: [number, number, number];
  rot: [number, number, number];
}

/**
 * Dos corridas de camarotes en las dos caras que ve la cámara (-x y +z). El
 * orden importa: las secuencias recorren el array, así que van seguidas como
 * un pasillo.
 */
function cabinWindows(): CabinWindow[] {
  const rows = [0.45, -0.95];
  const list: CabinWindow[] = [];
  for (const y of rows) {
    for (let i = 0; i < 4; i++) {
      list.push({ pos: [-1.62, y, -1.25 + i * 0.82], rot: [0, -Math.PI / 2, 0] });
    }
    for (let i = 0; i < 4; i++) {
      list.push({ pos: [-1.05 + i * 0.7, y, 1.82], rot: [0, 0, 0] });
    }
  }
  return list;
}

function CabinLights({ lit, ink }: { lit: boolean; ink: THREE.Material }) {
  const windows = useMemo(() => cabinWindows(), []);

  const glass = useMemo(
    () =>
      windows.map(
        () => new THREE.MeshBasicMaterial({ color: OFF_GLASS.clone(), toneMapped: false }),
      ),
    [windows],
  );
  useEffect(() => () => glass.forEach((m) => m.dispose()), [glass]);

  const state = useRef(createLights(windows.length));
  // Nivel actual de cada ventana, que persigue al objetivo de la máquina.
  const level = useRef<number[]>(windows.map(() => 0));

  useFrame((frame, delta) => {
    if (!lit) return;
    const s = advanceLights(state.current, frame.clock.elapsedTime);
    const k = Math.min(1, delta * FADE);
    const lv = level.current;
    for (let i = 0; i < glass.length; i++) {
      lv[i] += (s.target[i] - lv[i]) * k;
      glass[i].color.copy(OFF_GLASS).lerp(ON_GLASS, lv[i]);
    }
  });

  return (
    <>
      {windows.map((w, i) => (
        <group key={i} position={w.pos} rotation={w.rot}>
          {/* Marco de tinta, un poco por detrás del cristal */}
          <mesh position={[0, 0, -0.008]} material={ink}>
            <planeGeometry args={[WIN_W + 0.09, WIN_H + 0.09]} />
          </mesh>
          <mesh material={glass[i]}>
            <planeGeometry args={[WIN_W, WIN_H]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/**
 * Castillo de proa: molinete, bolardos, ancla y guía de la cadena.
 *
 * Todo va DIMENSIONADO por la semimanga local: en la entrada de la proa el
 * casco mide décimas de unidad, así que un molinete de tamaño fijo asomaba por
 * fuera del forro y parecía que la proa estaba partida.
 */
function Forecastle({ parts }: { parts: ReturnType<typeof useShipParts> }) {
  // Lo bastante a popa para que haya manga donde apoyar los herrajes, pero por
  // delante de la bodega (`HOLD_MIN_X = 6.8`).
  const x = BOW_X + 1.35;
  const deck = deckYAt(x);
  const b = halfBeamAt(x);
  const anchorX = BOW_X + 1.1;
  return (
    <group>
      {/* Molinete: bastidor con dos campanas para la cadena */}
      <mesh position={[x, deck + 0.18, 0]} material={parts.winch}>
        <boxGeometry args={[0.5, 0.3, b * 1.1]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>
      {[-b * 0.55, b * 0.55].map((z) => (
        <mesh key={z} position={[x, deck + 0.22, z]} rotation={[0, 0, Math.PI / 2]} material={parts.ink}>
          <cylinderGeometry args={[0.14, 0.14, 0.12, 12]} />
        </mesh>
      ))}
      {/* Bolardos de amarre, dentro del trancanil */}
      {[-b * 0.6, b * 0.6].map((z) => (
        <mesh key={z} position={[x + 0.75, deck + 0.17, z]} material={parts.ink}>
          <cylinderGeometry args={[0.08, 0.1, 0.34, 10]} />
        </mesh>
      ))}
      {/* Gatera y ancla, pegadas al costado de la banda que se ve */}
      <mesh
        position={[anchorX, deck - 0.6, halfBeamAt(anchorX) * 1.04]}
        rotation={[Math.PI / 2, 0, 0]}
        material={parts.hold}
      >
        <cylinderGeometry args={[0.09, 0.09, 0.08, 12]} />
      </mesh>
      <mesh position={[anchorX + 0.2, deck - 0.95, halfBeamAt(anchorX + 0.2) * 1.05]} material={parts.hold}>
        <boxGeometry args={[0.32, 0.38, 0.07]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>
    </group>
  );
}

export function PaintedShip({ lit }: { lit: boolean }) {
  const parts = useShipParts(lit);

  return (
    <group>
      {/* Forro del casco */}
      <mesh geometry={parts.hullGeo} material={parts.plating}>
        <Outlines thickness={OUTLINE} color={INK} />
      </mesh>

      {/* Cubierta y trancanil (dibuja el arrufo y remata la escotilla) */}
      <mesh geometry={parts.deckGeo} material={parts.deck} />
      <mesh geometry={parts.railNearGeo} material={parts.rail}>
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>
      {/* Cinta vertical del trancanil: es la que se VE a esta cámara. */}
      <mesh geometry={parts.strakeNearGeo} material={parts.rail}>
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>
      <mesh geometry={parts.railFarGeo} material={parts.rail} />

      {/* Bodega: suelo y mamparos. El de la banda opuesta llega a la cubierta
          para que dentro se vea acero y no la ría del fondo. */}
      <mesh position={[HOLD_CENTER, HOLD_FLOOR_Y - 0.1, HATCH_Z / 2]} material={parts.hold}>
        <boxGeometry args={[HOLD_W, 0.2, Math.abs(HATCH_Z) * 2]} />
      </mesh>
      <mesh position={[HOLD_CENTER, (HOLD_TOP + HOLD_FLOOR_Y) / 2, HATCH_Z]} material={parts.hold}>
        {/* Ancho de sobra: tiene que tapar también las rampas del rebaje. */}
        <boxGeometry args={[HOLD_W + 2, HOLD_TOP - HOLD_FLOOR_Y, 0.2]} />
      </mesh>
      {/* Mamparos de los extremos de la bodega. El ancho sale de la manga LOCAL:
          con la manga máxima, el de proa asomaba por fuera del forro y se veía
          como una caja negra flotando al costado. */}
      {[HOLD_MIN_X, HOLD_MAX_X].map((x) => (
        <mesh key={x} position={[x, (HOLD_TOP + HOLD_FLOOR_Y) / 2, 0]} material={parts.hold}>
          <boxGeometry args={[0.2, HOLD_TOP - HOLD_FLOOR_Y, halfBeamAt(x) * 1.9]} />
        </mesh>
      ))}

      {/* Ventiladores de cubierta entre la escotilla y el puente */}
      {[16.9, 16.9].map((x, i) => (
        <mesh key={i} position={[x, deckYAt(x) + 0.3, i === 0 ? -1.1 : 0.9]} material={parts.winch}>
          <cylinderGeometry args={[0.18, 0.22, 0.6, 10]} />
          <Outlines thickness={OUTLINE_THIN} color={INK} />
        </mesh>
      ))}

      <Forecastle parts={parts} />

      {/* Superestructura */}
      <group position={[BRIDGE_X, -3.7, 0]}>
        {/* Caras de BoxGeometry: +x, -x, +y, -y, +z, -z. La cámara ve -x y +z. */}
        <mesh material={[parts.houseSide, parts.house, parts.houseSide, parts.houseSide, parts.house, parts.houseSide]}>
          <boxGeometry args={[3.2, 5.2, 3.6]} />
          <Outlines thickness={OUTLINE_THIN} color={INK} />
        </mesh>

        <mesh position={[0, 2.05, 0]} material={parts.deck}>
          <boxGeometry args={[4.2, 0.16, 4.4]} />
          <Outlines thickness={OUTLINE_THIN} color={INK} />
        </mesh>
        <CabinLights lit={lit} ink={parts.ink} />

        {[-2.0, -1.0, 0, 1.0, 2.0].map((x) => (
          <mesh key={x} position={[x, 2.42, 2.18]} material={parts.ink}>
            <boxGeometry args={[0.06, 0.56, 0.06]} />
          </mesh>
        ))}
        {[2.42, 2.66].map((y) => (
          <mesh key={y} position={[0, y, 2.18]} material={parts.ink}>
            <boxGeometry args={[4.2, 0.06, 0.06]} />
          </mesh>
        ))}

        {/* Chimenea con la banda de marca */}
        <mesh position={[0.4, 3.4, -0.6]} material={parts.funnel}>
          <boxGeometry args={[1.1, 1.6, 1.1]} />
          <Outlines thickness={OUTLINE_THIN} color={INK} />
        </mesh>
        <mesh position={[0.4, 3.5, -0.03]} material={parts.accent}>
          <planeGeometry args={[1.1, 0.35]} />
        </mesh>

        {/* Palo de antenas con su cruceta */}
        <mesh position={[-0.9, 4.3, -0.2]} material={parts.ink}>
          <boxGeometry args={[0.09, 3.2, 0.09]} />
        </mesh>
        <mesh position={[-0.9, 5.2, -0.2]} material={parts.ink}>
          <boxGeometry args={[1.5, 0.08, 0.08]} />
        </mesh>
        <mesh position={[-0.9, 4.55, -0.2]} material={parts.ink}>
          <boxGeometry args={[1, 0.07, 0.07]} />
        </mesh>
        <mesh position={[-0.9, 5.95, -0.2]} material={parts.lamp}>
          <sphereGeometry args={[0.13, 10, 8]} />
        </mesh>
      </group>
    </group>
  );
}

export { STERN_X as SHIP_STERN_X };
