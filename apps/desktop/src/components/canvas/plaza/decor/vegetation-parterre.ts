import * as THREE from "three";
import { seededRandom } from "../plaza-config";
import { merge } from "./decor-kit";
import { VEGETATION_PALETTES, type VegetationPalette } from "./vegetation-palette";
import type { PlazaMode } from "../plaza-mode";
import { applyShade, fixWinding, hex, smooth } from "./vegetation-kit";

/**
 * Parterres del jardín francés: ocho compartimentos cerrados (rectángulos
 * polares) entre dos radios, con seto recortado en los cuatro lados, relleno de
 * grava o de flor, y boj topiario en las esquinas.
 *
 * Antes eran arcos sueltos de `TorusGeometry` de seis segmentos aplastados
 * (bordillo verde hexagonal, extremos abiertos): no se leía ningún dibujo. Aquí
 * el seto es el barrido de un perfil de trapecio con chaflán, con caras PLANAS
 * (lo recortado con tijera no es redondo) y tapas en los extremos.
 */

const BEDS = 8;
/** Mitad del ángulo que ocupa cada compartimento (el resto es camino). */
const BED_HALF = (Math.PI / BEDS) * 0.68;
const R_INNER = 10.4;
const R_OUTER = 11.9;
/** Perfil del seto (u = lateral, y = altura): trapecio con chaflán de 3 cm. */
const PROFILE: ReadonlyArray<readonly [number, number]> = [
  [-0.17, 0],
  [-0.15, 0.285],
  [-0.12, 0.32],
  [0.12, 0.32],
  [0.15, 0.285],
  [0.17, 0],
];
const HEDGE_HALF = 0.17;
const HEDGE_TOP = 0.32;

/** Color del seto en un punto: oscuro al pie, claro arriba, caras altas al sol. */
function hedgeColor(pal: VegetationPalette, y: number, ny: number, out: THREE.Color, tone: number): void {
  out.copy(hex(pal.hedgeLow)).lerp(hex(pal.hedgeHigh), smooth(y, 0.02, HEDGE_TOP));
  out.multiplyScalar(tone * THREE.MathUtils.lerp(0.88, 1.06, THREE.MathUtils.clamp(ny, 0, 1)));
}

/**
 * Barrido del perfil a lo largo de `path` (puntos del eje, y = 0). Cada cara del
 * perfil lleva su propia normal (plana en el perfil, rotada con el trazado), y
 * `cap` cierra los extremos con la sección entera.
 */
function sweepHedge(path: THREE.Vector3[], pal: VegetationPalette, tone: number, capStart: boolean, capEnd: boolean): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const c = new THREE.Color();
  const up = new THREE.Vector3(0, 1, 0);
  const tangents = path.map((p, i) => {
    const a = path[Math.max(0, i - 1)];
    const b = path[Math.min(path.length - 1, i + 1)];
    return new THREE.Vector3().subVectors(b, a).setY(0).normalize();
  });
  const sides = tangents.map((t) => new THREE.Vector3(-t.z, 0, t.x));

  const push = (p: THREE.Vector3, n: THREE.Vector3, y: number) => {
    positions.push(p.x, p.y, p.z);
    normals.push(n.x, n.y, n.z);
    hedgeColor(pal, y, n.y, c, tone);
    colors.push(c.r, c.g, c.b);
  };
  const at = (i: number, k: number) =>
    new THREE.Vector3().copy(path[i]).addScaledVector(sides[i], PROFILE[k][0]).addScaledVector(up, PROFILE[k][1]);
  const faceNormal = (i: number, k: number) => {
    const [u0, y0] = PROFILE[k];
    const [u1, y1] = PROFILE[k + 1];
    const nu = -(y1 - y0);
    const ny = u1 - u0;
    const len = Math.hypot(nu, ny) || 1;
    return new THREE.Vector3().copy(sides[i]).multiplyScalar(nu / len).addScaledVector(up, ny / len);
  };

  for (let i = 0; i < path.length - 1; i++) {
    for (let k = 0; k < PROFILE.length - 1; k++) {
      const a = at(i, k);
      const b = at(i, k + 1);
      const c2 = at(i + 1, k);
      const d = at(i + 1, k + 1);
      const n0 = faceNormal(i, k);
      const n1 = faceNormal(i + 1, k);
      push(a, n0, PROFILE[k][1]);
      push(b, n0, PROFILE[k + 1][1]);
      push(c2, n1, PROFILE[k][1]);
      push(b, n0, PROFILE[k + 1][1]);
      push(d, n1, PROFILE[k + 1][1]);
      push(c2, n1, PROFILE[k][1]);
    }
  }
  // Tapas: abanico desde el centro de la sección.
  const cap = (i: number, dir: THREE.Vector3) => {
    const centre = new THREE.Vector3().copy(path[i]).addScaledVector(up, HEDGE_TOP / 2);
    for (let k = 0; k < PROFILE.length - 1; k++) {
      push(centre, dir, HEDGE_TOP / 2);
      push(at(i, k), dir, PROFILE[k][1]);
      push(at(i, k + 1), dir, PROFILE[k + 1][1]);
    }
  };
  if (capStart) cap(0, tangents[0].clone().negate());
  if (capEnd) cap(path.length - 1, tangents[path.length - 1].clone());

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setAttribute("aSway", new THREE.Float32BufferAttribute(new Float32Array(positions.length / 3), 1));
  g.setAttribute("aPhase", new THREE.Float32BufferAttribute(new Float32Array(positions.length / 3), 1));
  return fixWinding(g);
}

const polar = (r: number, a: number): THREE.Vector3 => new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);

function arcPath(r: number, a0: number, a1: number): THREE.Vector3[] {
  const n = Math.max(6, Math.ceil(((a1 - a0) * r) / 0.28));
  return Array.from({ length: n + 1 }, (_, i) => polar(r, a0 + ((a1 - a0) * i) / n));
}

/** Relleno plano de un sector polar, en una malla de celdas para poder pintar
 * motas de grava / tierra por vértice. */
function fillSector(a0: number, a1: number, r0: number, r1: number, y: number, rnd: () => number, base: THREE.Color, dark: THREE.Color): THREE.BufferGeometry {
  const nA = 14;
  const nR = 4;
  const positions: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= nR; i++) {
    for (let j = 0; j <= nA; j++) {
      const p = polar(r0 + ((r1 - r0) * i) / nR, a0 + ((a1 - a0) * j) / nA);
      positions.push(p.x, y, p.z);
    }
  }
  for (let i = 0; i < nR; i++) {
    for (let j = 0; j < nA; j++) {
      const a = i * (nA + 1) + j;
      index.push(a, a + 1, a + nA + 1, a + 1, a + nA + 2, a + nA + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(new Float32Array(positions.length).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setIndex(index);
  const seed = rnd() * 40;
  return applyShade(
    fixWinding(g),
    (p, _n, out) => {
      const m = 0.5 + 0.5 * Math.sin(p.x * 7.3 + seed) * Math.sin(p.z * 6.1 - seed);
      out.copy(base).lerp(dark, 0.55 * m);
      return 0;
    },
    0,
  );
}

/** Bola de boj: esfera lisa con degradado y sombra propia en la parte baja. */
function boxwoodBall(centre: THREE.Vector3, radius: number, pal: VegetationPalette): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(radius, 3);
  const n = g.getAttribute("position").clone();
  g.translate(centre.x, centre.y, centre.z);
  const normal = g.getAttribute("normal");
  for (let i = 0; i < n.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(n, i).normalize();
    normal.setXYZ(i, v.x, v.y, v.z);
  }
  const low = hex(pal.hedgeLow);
  const high = hex(pal.boxwood);
  return applyShade(
    g,
    (p, nn, out) => {
      out.copy(low).lerp(high, smooth((p.y - centre.y) / radius, -0.8, 0.9));
      out.multiplyScalar(THREE.MathUtils.lerp(0.9, 1.1, THREE.MathUtils.clamp(nn.y, 0, 1)));
      return 0;
    },
    0,
  );
}

/** Cono de boj en esquina exterior. */
function boxwoodCone(centre: THREE.Vector3, radius: number, height: number, pal: VegetationPalette): THREE.BufferGeometry {
  const g = new THREE.ConeGeometry(radius, height, 16, 3, false);
  g.translate(centre.x, centre.y + height / 2, centre.z);
  const low = hex(pal.hedgeLow);
  const high = hex(pal.boxwood);
  return applyShade(
    g,
    (p, n, out) => {
      out.copy(low).lerp(high, smooth(p.y - centre.y, 0, height));
      out.multiplyScalar(THREE.MathUtils.lerp(0.9, 1.08, THREE.MathUtils.clamp(n.y + 0.4, 0, 1)));
      return 0;
    },
    0,
  );
}

/** Flores de un lecho: icosaedros diminutos en rejilla con respiro. */
function flowers(a0: number, a1: number, rnd: () => number, pal: VegetationPalette): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const colors = pal.flowers.map(hex);
  const rIn = R_INNER + HEDGE_HALF + 0.14;
  const rOut = R_OUTER - HEDGE_HALF - 0.14;
  const rows = 5;
  for (let i = 0; i < rows; i++) {
    const r = rIn + ((rOut - rIn) * (i + 0.5)) / rows;
    const cols = Math.floor(((a1 - a0) * r) / 0.17);
    for (let j = 0; j < cols; j++) {
      const a = a0 + ((a1 - a0) * (j + 0.5 + (rnd() - 0.5) * 0.5)) / cols;
      const p = polar(r + (rnd() - 0.5) * 0.08, a);
      const g = new THREE.IcosahedronGeometry(0.03 + rnd() * 0.015, 0);
      g.translate(p.x, 0.075 + rnd() * 0.025, p.z);
      // Flat shading de origen: los icosaedros de detalle 0 ya traen normales
      // por cara al ser no indexados.
      const col = colors[(i + Math.floor(j / 2)) % colors.length];
      out.push(applyShade(g, (_p, n, o) => (o.copy(col).multiplyScalar(0.85 + 0.2 * Math.max(n.y, 0)), 0), 0));
    }
  }
  return out;
}

/** Piezas del jardín francés, en coordenadas de MUNDO, para el saco de follaje. */
export function buildParterres(mode: PlazaMode): THREE.BufferGeometry {
  const pal = VEGETATION_PALETTES[mode];
  const rnd = seededRandom("veg:parterres");
  const parts: THREE.BufferGeometry[] = [];
  const gravel = hex(pal.gravel);
  const gravelDark = hex(pal.gravelDark);
  const soil = hex(pal.bedSoil);
  const soilDark = soil.clone().multiplyScalar(0.72);

  for (let b = 0; b < BEDS; b++) {
    const centre = ((b + 0.5) / BEDS) * Math.PI * 2;
    const a0 = centre - BED_HALF;
    const a1 = centre + BED_HALF;
    const tone = 1 + (rnd() - 0.5) * 0.08;
    // Lados largos (arcos): se prolongan medio grosor para que el mitrado
    // exterior de la esquina quede limpio.
    const extIn = HEDGE_HALF / R_INNER;
    const extOut = HEDGE_HALF / R_OUTER;
    parts.push(sweepHedge(arcPath(R_INNER, a0 - extIn, a1 + extIn), pal, tone, true, true));
    parts.push(sweepHedge(arcPath(R_OUTER, a0 - extOut, a1 + extOut), pal, tone, true, true));
    // Lados cortos (radiales): del eje de un arco al del otro; sus extremos
    // quedan enterrados en los arcos.
    for (const a of [a0, a1]) {
      parts.push(sweepHedge([polar(R_INNER, a), polar((R_INNER + R_OUTER) / 2, a), polar(R_OUTER, a)], pal, tone, false, false));
    }

    const isFlower = b % 2 === 1;
    const rIn = R_INNER + HEDGE_HALF - 0.01;
    const rOut = R_OUTER - HEDGE_HALF + 0.01;
    const aIn = a0 + HEDGE_HALF / R_INNER - 0.005;
    const aOut = a1 - HEDGE_HALF / R_INNER + 0.005;
    parts.push(
      isFlower
        ? fillSector(aIn, aOut, rIn, rOut, 0.045, rnd, soil, soilDark)
        : fillSector(aIn, aOut, rIn, rOut, 0.045, rnd, gravel, gravelDark),
    );
    if (isFlower) parts.push(...flowers(aIn, aOut, rnd, pal));
    else parts.push(boxwoodBall(new THREE.Vector3(Math.cos(centre) * (R_INNER + R_OUTER) * 0.5, 0.2, Math.sin(centre) * (R_INNER + R_OUTER) * 0.5), 0.2, pal));

    // Esquinas: bolas en el lado interior, conos en el exterior, sobre el seto.
    for (const a of [a0, a1]) {
      parts.push(boxwoodBall(polar(R_INNER, a).setY(HEDGE_TOP + 0.1), 0.17, pal));
      parts.push(boxwoodCone(polar(R_OUTER, a).setY(HEDGE_TOP - 0.02), 0.15, 0.62, pal));
    }
  }
  return merge(parts, "parterres");
}
