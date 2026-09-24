import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { CABINET, PROFILE, PROFILE_ORDER, segmentFrame, type MachineSpec, type ProfilePoint } from "./arcade-config";
import { PANEL_CONTROLS } from "./arcade-textures";

/**
 * Geometría del mueble de recreativa, pieza a pieza.
 *
 * Todo sale del perfil lateral (`PROFILE` en `arcade-config`): el cuerpo y los
 * laterales son ese perfil extruido, el perfil de goma recorre su borde, y lo
 * que va montado en el frontal (bisel, panel de mandos, rejilla, marquesina) se
 * coloca sobre el tramo que le toca con `segmentFrame`. Cada pieza lleva su
 * matriz en el local de la máquina (frente = +Z) y `ArcadeMachines` la repite
 * en las 32 máquinas con una `InstancedMesh`: una llamada de dibujo por pieza.
 */

export type PartMaterial =
  | "body"
  | "panel"
  | "molding"
  | "decal"
  | "metal"
  | "black"
  | "chrome"
  | "cap"
  | "lamp"
  | "start"
  | "bezel"
  | "panelArt"
  | "grille"
  | "trim";

export interface Part {
  geometry: THREE.BufferGeometry;
  material: PartMaterial;
  /** Transformación de la pieza en el local de la máquina (frente = +Z). */
  local: THREE.Matrix4;
  /** Color por instancia (categoría de la máquina, botones…). */
  color?: (m: MachineSpec) => string;
}

const IDENTITY = new THREE.Matrix4();
const INNER = CABINET.innerWidth;
/** Laterales: tablero de 14 mm con bisel de 4 mm → 22 mm de canto. */
const PANEL_CORE = 0.014;
const PANEL_BEVEL = 0.004;
const PANEL_X = INNER / 2 + PANEL_CORE / 2 + PANEL_BEVEL;
const PANEL_OUTER = PANEL_X + PANEL_CORE / 2 + PANEL_BEVEL;

/** Traslación + giro en X, compuestos. */
function tr(x: number, y: number, z: number, rotX = 0): THREE.Matrix4 {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rotX, 0, 0)),
    new THREE.Vector3(1, 1, 1),
  );
}

/**
 * Marco de un tramo del perfil: origen en su centro (separado `offset` sobre
 * la normal), +Y a lo largo del tramo, +Z hacia fuera. `inner` coloca algo
 * dentro de ese marco.
 */
function onSegment(from: ProfilePoint, to: ProfilePoint, offset: number, inner: THREE.Matrix4 = IDENTITY) {
  const f = segmentFrame(from, to, offset);
  return new THREE.Matrix4().multiplyMatrices(tr(0, f.y, f.z, f.angle), inner);
}

function profileShape(): THREE.Shape {
  const shape = new THREE.Shape();
  PROFILE_ORDER.forEach((p, i) => {
    const [z, y] = PROFILE[p];
    if (i === 0) shape.moveTo(z, y);
    else shape.lineTo(z, y);
  });
  shape.closePath();
  return shape;
}

/**
 * El perfil extruido a lo ancho, centrado en X. La forma se dibuja en el plano
 * XY (x = z del mueble) y se extruye en +Z; al girarla -90° en Y, la x de la
 * forma pasa a ser la z del mueble y la extrusión queda a lo ancho.
 */
function extrudeProfile(depth: number, bevel = 0): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(profileShape(), {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
    curveSegments: 1,
  });
  g.translate(0, 0, -depth / 2);
  g.rotateY(-Math.PI / 2);
  return g;
}

/**
 * Perfil de goma ("T-molding"): una tira que recorre TODO el borde del lateral,
 * del color vivo de la máquina. Una caja por tramo, alargada un poco para que
 * las esquinas no dejen huecos.
 */
function moldingGeometry(x: number): THREE.BufferGeometry {
  const boxes: THREE.BufferGeometry[] = [];
  PROFILE_ORDER.forEach((p, i) => {
    const q = PROFILE_ORDER[(i + 1) % PROFILE_ORDER.length];
    const f = segmentFrame(p, q, 0.004);
    // Algo más ancha que el canto del lateral: la goma lo abraza.
    const b = new THREE.BoxGeometry(PANEL_OUTER - INNER / 2 + 0.008, f.length + 0.014, 0.012);
    b.rotateX(f.angle);
    b.translate(0, f.y, f.z);
    boxes.push(b);
  });
  const merged = mergeGeometries(boxes);
  for (const b of boxes) b.dispose();
  merged.translate(x, 0, 0);
  return merged;
}

/**
 * Vinilo lateral: dos franjas en diagonal que suben hacia el frontal, como el
 * arte de los laterales de las máquinas de la época. Puntos `[z, y]`, dentro
 * del perfil. El lado derecho es el izquierdo en espejo (material a dos caras).
 */
const DECAL_BANDS: readonly (readonly [number, number])[][] = [
  [
    [-0.42, 0.3],
    [0.06, 0.98],
    [0.06, 1.16],
    [-0.42, 0.48],
  ],
  [
    [-0.42, 0.14],
    [0.22, 0.86],
    [0.22, 0.93],
    [-0.42, 0.22],
  ],
];

function decalGeometry(side: -1 | 1): THREE.BufferGeometry {
  const shapes = DECAL_BANDS.map((band) => {
    const s = new THREE.Shape();
    band.forEach(([z, y], i) => (i === 0 ? s.moveTo(z, y) : s.lineTo(z, y)));
    s.closePath();
    return s;
  });
  const g = new THREE.ShapeGeometry(shapes);
  g.rotateY(-Math.PI / 2);
  g.translate(-(PANEL_OUTER + 0.0015), 0, 0);
  if (side === 1) g.scale(-1, 1, 1);
  return g;
}

/** Cilindro de pie sobre un tablero: su eje (Y) pasa a ser la normal (+Z). */
function puck(radius: number, height: number, segments = 16): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(radius, radius, height, segments).rotateX(Math.PI / 2);
}

const BUTTON_CAPS = (m: MachineSpec) => [m.sideColor, "#f1ead6", "#e0674f"];

export function buildCabinetParts(): Part[] {
  const parts: Part[] = [];
  const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

  // ── Cuerpo y laterales ──
  parts.push({ geometry: extrudeProfile(INNER), material: "body", local: IDENTITY });
  for (const s of [-1, 1] as const) {
    const panel = extrudeProfile(PANEL_CORE, PANEL_BEVEL);
    panel.translate(s * PANEL_X, 0, 0);
    parts.push({ geometry: panel, material: "panel", local: IDENTITY, color: (m) => mutedSide(m.sideColor) });
    parts.push({ geometry: moldingGeometry(s * PANEL_X), material: "molding", local: IDENTITY, color: (m) => m.sideColor });
    parts.push({ geometry: decalGeometry(s), material: "decal", local: IDENTITY, color: (m) => m.sideColor });
  }

  // ── Zócalo y monedero (tramo B→C) ──
  const front = PROFILE.B[0];
  parts.push({ geometry: box(INNER, 0.1, 0.012), material: "black", local: tr(0, 0.05, front + 0.006) });
  parts.push({ geometry: box(0.3, 0.36, 0.014), material: "metal", local: tr(0, 0.5, front + 0.007) });
  for (const x of [-0.07, 0.07]) {
    parts.push({ geometry: box(0.075, 0.11, 0.012), material: "black", local: tr(x, 0.565, front + 0.018) });
    // Inserto iluminado de la ranura, con la ranura en negro encima.
    parts.push({ geometry: box(0.034, 0.05, 0.004), material: "lamp", local: tr(x, 0.58, front + 0.026) });
    parts.push({ geometry: box(0.004, 0.034, 0.003), material: "black", local: tr(x, 0.58, front + 0.029) });
    // Botón de devolución de monedas.
    parts.push({ geometry: box(0.036, 0.022, 0.01), material: "chrome", local: tr(x, 0.51, front + 0.02) });
  }
  parts.push({ geometry: puck(0.013, 0.012), material: "chrome", local: tr(0, 0.38, front + 0.018) });

  // ── Panel de mandos (tramo E→F) ──
  const cp = segmentFrame("E", "F", 0);
  parts.push({
    geometry: new THREE.PlaneGeometry(INNER, cp.length),
    material: "panelArt",
    local: onSegment("E", "F", 0.0015),
    color: (m) => m.sideColor,
  });
  const onPanel = (x: number, y: number, z: number) => onSegment("E", "F", 0, tr(x, y, z));
  const [jx, jy] = PANEL_CONTROLS.joystick;
  parts.push({ geometry: puck(0.042, 0.004, 24), material: "black", local: onPanel(jx, jy, 0.004) });
  parts.push({ geometry: puck(0.0075, 0.075, 10), material: "chrome", local: onPanel(jx, jy, 0.04) });
  parts.push({
    geometry: new THREE.SphereGeometry(0.027, 16, 12),
    material: "cap",
    local: onPanel(jx, jy, 0.082),
    color: () => "#d8432f",
  });
  PANEL_CONTROLS.buttons.forEach(([bx, by], i) => {
    parts.push({ geometry: puck(0.031, 0.008, 20), material: "black", local: onPanel(bx, by, 0.004) });
    parts.push({
      geometry: puck(0.024, 0.016, 20),
      material: "cap",
      local: onPanel(bx, by, 0.012),
      color: (m) => BUTTON_CAPS(m)[i],
    });
  });
  for (const [sx, sy] of PANEL_CONTROLS.starts) {
    parts.push({ geometry: box(0.03, 0.02, 0.01), material: "start", local: onPanel(sx, sy, 0.005) });
  }

  // ── Bisel de la pantalla (tramo G→H) ──
  const screen = segmentFrame("G", "H", 0);
  parts.push({
    geometry: new THREE.PlaneGeometry(INNER, screen.length),
    material: "bezel",
    local: onSegment("G", "H", 0.004),
    color: (m) => m.sideColor,
  });

  // ── Rejilla del altavoz, bajo el voladizo (tramo I→J) ──
  const grille = segmentFrame("I", "J", 0);
  parts.push({
    geometry: new THREE.PlaneGeometry(INNER, grille.length),
    material: "grille",
    local: onSegment("I", "J", 0.002),
  });

  // ── Molduras de aluminio que sujetan el metacrilato de la marquesina ──
  for (const s of [-1, 1]) {
    parts.push({
      geometry: box(INNER, 0.014, 0.02),
      material: "trim",
      local: onSegment("J", "K", 0, tr(0, s * (CABINET.marquee.height / 2 + 0.006), 0.008)),
    });
  }

  return parts;
}

const SIDE_INK = new THREE.Color("#15151a");
/** Color del lateral: el de la categoría llevado casi al negro del mueble. A
 * plena saturación los laterales eran losas de color que se comían el pasillo;
 * el color vivo lo llevan el perfil de goma y el vinilo. */
function mutedSide(color: string): string {
  return `#${new THREE.Color(color).lerp(SIDE_INK, 0.85).getHexString()}`;
}

/**
 * Tubo CRT: plano con abombamiento hacia fuera, más en el centro que en los
 * bordes. Lo comparten la imagen, las líneas de barrido, el viñeteado y el
 * reflejo del cristal, que se apilan desplazados sobre la normal.
 */
export function crtGeometry(): THREE.BufferGeometry {
  const { width, height } = CABINET.screen;
  const g = new THREE.PlaneGeometry(width, height, 16, 12);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / (width / 2);
    const v = pos.getY(i) / (height / 2);
    pos.setZ(i, 0.016 * (1 - u * u * 0.9) * (1 - v * v * 0.9));
  }
  g.computeVertexNormals();
  return g;
}
