import * as THREE from "three";
import { PLAZA_PALETTES, type PlazaMode } from "./plaza-mode";
import { GROUND_PALETTES } from "./ground-palette";
import { sunDirection3 } from "./ground-paving";

/**
 * Bordillo 3D del pavimento (8,2-8,6) y oclusión de contacto sobre el césped.
 *
 * Antes el bordillo era una banda PINTADA en la textura del pavimento: sin
 * volumen, la plaza se leía como maqueta. Aquí es una pieza real, con chaflán
 * y altura, en UNA sola malla (una llamada de dibujo) y un `MeshBasicMaterial`
 * con el sombreado por cara bakeado en el color de vértice: el suelo no pasa
 * por la luz, pero el bordillo sí recibe el sol "a mano" con la dirección de
 * la paleta, que es lo que le da lectura de volumen.
 *
 * Cada pieza lleva su tono; entre piezas hay una junta oscura, así que el
 * bordillo también se lee despiezado.
 */

export const CURB = { inner: 8.2, outer: 8.6, height: 0.032, below: -0.04, blocks: 64 } as const;

/** Perfil (radio, altura) de dentro a fuera, con chaflán en las dos aristas. */
const CH = 0.028;
const PROFILE: ReadonlyArray<readonly [number, number]> = [
  [CURB.inner, CURB.below],
  [CURB.inner, CURB.height - 0.01],
  [CURB.inner + CH, CURB.height],
  [CURB.outer - CH, CURB.height],
  [CURB.outer, CURB.height - 0.01],
  [CURB.outer, CURB.below],
];

/** Pasos angulares por pieza (para que el círculo no se vea poligonal). */
const STEPS = 2;
/** Mitad de la junta entre piezas, en radianes (~1,7 cm a r = 8,4). */
const GAP = 0.0011;

/** Normal (radio, altura) del tramo `face` del perfil. El perfil va de dentro a
 * fuera por arriba, así que la normal exterior es la perpendicular de la
 * tangente girada 90° en sentido antihorario: inner → -r, top → +y, outer → +r. */
function faceNormal(face: number): [number, number] {
  const [ra, ya] = PROFILE[face];
  const [rb, yb] = PROFILE[face + 1];
  const len = Math.hypot(rb - ra, yb - ya) || 1;
  return [-(yb - ya) / len, (rb - ra) / len];
}

function hexToSrgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** PRNG determinista: el mismo bordillo en cada carga y en cada captura. */
function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function buildCurbGeometry(mode: PlazaMode): THREE.BufferGeometry {
  const palette = PLAZA_PALETTES[mode];
  const ground = GROUND_PALETTES[mode];
  const sun = sunDirection3(mode);
  const base = hexToSrgb(palette.paving).map((c) => Math.min(1, c * ground.curb.top));
  const joint = hexToSrgb(ground.joint);
  const rnd = lcg(11);

  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  /** Brillo de una cara con normal (nr, ny) en el plano (radio, altura), en el
   * ángulo `a`: ambiente + Lambert, normalizado para que la cara superior
   * valga 1 (así casa con el pavimento de al lado). */
  const brightness = (nr: number, ny: number, a: number) => {
    const n = new THREE.Vector3(nr * Math.cos(a), ny, nr * Math.sin(a));
    const amb = ground.curb.ambient;
    const lam = Math.max(0, n.dot(sun)) / Math.max(sun.y, 0.2);
    return Math.min(1.25, amb + (1 - amb) * lam);
  };

  /** Pinta el perfil entero entre dos ángulos con un color por cara. */
  const strip = (a0: number, a1: number, tone: (face: number, a: number) => [number, number, number]) => {
    for (let face = 0; face < PROFILE.length - 1; face++) {
      const [ra, ya] = PROFILE[face];
      const [rb, yb] = PROFILE[face + 1];
      for (let s = 0; s < STEPS; s++) {
        const t0 = a0 + ((a1 - a0) * s) / STEPS;
        const t1 = a0 + ((a1 - a0) * (s + 1)) / STEPS;
        const mid = (t0 + t1) / 2;
        const [cr, cg, cb] = tone(face, mid);
        const v = positions.length / 3;
        for (const [t, r, y] of [
          [t0, ra, ya],
          [t1, ra, ya],
          [t1, rb, yb],
          [t0, rb, yb],
        ] as const) {
          positions.push(Math.cos(t) * r, y, Math.sin(t) * r);
          colors.push(cr, cg, cb);
        }
        // Triángulos con la cara hacia fuera/arriba (el material es de doble
        // cara de todos modos; el orden solo evita sorpresas con culling).
        indices.push(v, v + 2, v + 1, v, v + 3, v + 2);
      }
    }
  };

  const linearRgb = (srgb: number[], k: number): [number, number, number] => [
    toLinear(Math.min(1, srgb[0] * k)),
    toLinear(Math.min(1, srgb[1] * k)),
    toLinear(Math.min(1, srgb[2] * k)),
  ];

  const step = (Math.PI * 2) / CURB.blocks;
  for (let b = 0; b < CURB.blocks; b++) {
    const a0 = b * step;
    const a1 = a0 + step;
    // Variación de cada pieza: luminancia ±6 % y un leve tinte cálido/frío.
    const lum = 1 + (rnd() - 0.5) * 0.12;
    const warm = rnd() - 0.5;
    const tinted = [base[0] * (1 + warm * 0.05), base[1], base[2] * (1 - warm * 0.05)];
    strip(a0 + GAP, a1 - GAP, (face, a) => {
      const [nr, ny] = faceNormal(face);
      return linearRgb(tinted, lum * brightness(nr, ny, a));
    });
    // Junta: todo el perfil en el color de junta (un poco más claro que el
    // surco del pavimento: está más expuesto al sol).
    strip(a1 - GAP, a1 + GAP, () => linearRgb(joint, 1.15));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

/** Radios (y opacidad) de la franja de oclusión de contacto sobre el césped. */
const AO_ROWS: ReadonlyArray<readonly [radius: number, alpha: number]> = [
  [CURB.outer - 0.01, 1],
  [CURB.outer + 0.07, 0.55],
  [CURB.outer + 0.17, 0.2],
  [CURB.outer + 0.3, 0],
];

/**
 * Franja de oclusión bajo el bordillo: el césped se oscurece pegado a la
 * piedra, que es lo que ancla el bordillo al terreno. Alpha en el color de
 * vértice (4 componentes): una malla, sin textura.
 */
export function buildCurbContactGeometry(mode: PlazaMode): THREE.BufferGeometry {
  const { color, alpha } = GROUND_PALETTES[mode].contactAO;
  const [r, g, b] = hexToSrgb(color).map(toLinear);
  const segments = 128;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    for (const [radius, a] of AO_ROWS) {
      positions.push(Math.cos(t) * radius, 0, Math.sin(t) * radius);
      colors.push(r, g, b, a * alpha);
    }
  }
  const row = AO_ROWS.length;
  for (let i = 0; i < segments; i++) {
    for (let k = 0; k < row - 1; k++) {
      const a = i * row + k;
      const c = (i + 1) * row + k;
      indices.push(a, c, a + 1, a + 1, c, c + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 4));
  geometry.setIndex(indices);
  return geometry;
}
