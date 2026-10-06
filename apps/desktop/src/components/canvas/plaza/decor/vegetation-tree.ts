import * as THREE from "three";
import { seededRandom } from "../plaza-config";
import { merge } from "./decor-kit";
import { VEGETATION_PALETTES, type VegetationPalette } from "./vegetation-palette";
import type { PlazaMode } from "../plaza-mode";
import { applyShade, fixWinding, hex, smooth, softNoise, tube } from "./vegetation-kit";

/**
 * Árbol de copa por lóbulos y seto de jardinera.
 *
 * Referencia: `arbolado.webp`, copas de masas blandas tipo arcilla. Un
 * icosaedro de 80 triángulos con `flatShading` daba "diamante"; aquí cada copa
 * es la unión de 7-8 elipsoides lisos cuyas NORMALES apuntan hacia el centro de
 * la copa (en parte) y no hacia el de su lóbulo: la luz sombrea la copa como
 * UNA masa y los lóbulos solo asoman en la silueta.
 */

interface Lobe {
  c: THREE.Vector3;
  r: THREE.Vector3;
  detail: number;
  /** Variación de valor de este lóbulo: cada masa de la copa pintada tiene su
   * tono. */
  tone: number;
}

interface TreeType {
  /** Estiramiento horizontal / vertical de la copa. */
  h: number;
  v: number;
  /** Lóbulos del anillo medio. */
  ring: number;
  /** Altura a la que arranca la copa (ahí acaba el tronco "visible"). */
  bottom: number;
  radius: number;
}

/** Redondo, ovalado y extendido: tres siluetas, para que el arbolado no sean
 * once clones con giro distinto. */
const TREE_TYPES: ReadonlyArray<TreeType> = [
  { h: 1, v: 1, ring: 4, bottom: 1.2, radius: 1.5 },
  { h: 0.82, v: 1.38, ring: 5, bottom: 1.25, radius: 1.38 },
  { h: 1.32, v: 0.84, ring: 5, bottom: 1.15, radius: 1.45 },
];

function makeLobes(type: TreeType, rnd: () => number, hs: number, vs: number): Lobe[] {
  const { h, v, radius: R } = type;
  const H = h * hs * R;
  const V = v * vs * R;
  const cy = type.bottom * vs + 0.77 * V;
  const lobes: Lobe[] = [];
  const add = (x: number, y: number, z: number, rx: number, ry: number, rz: number, detail: number) =>
    lobes.push({
      c: new THREE.Vector3(x, cy + y, z),
      r: new THREE.Vector3(rx, ry, rz),
      detail,
      tone: 1 + (rnd() - 0.5) * 0.08,
    });
  add(0, 0, 0, 0.82 * H, 0.74 * V, 0.82 * H, 5);
  add((rnd() - 0.5) * 0.25 * H, 0.52 * V, (rnd() - 0.5) * 0.25 * H, 0.5 * H, 0.46 * V, 0.5 * H, 4);
  const phase = rnd() * Math.PI * 2;
  for (let i = 0; i < type.ring; i++) {
    const a = phase + ((i + (rnd() - 0.5) * 0.3) / type.ring) * Math.PI * 2;
    const d = (0.62 + (rnd() - 0.5) * 0.12) * H;
    const s = 0.5 + (rnd() - 0.5) * 0.14;
    add(Math.cos(a) * d, (-0.06 + (rnd() - 0.5) * 0.22) * V, Math.sin(a) * d, s * H, (s - 0.04) * V, s * H, 5);
  }
  const la = rnd() * Math.PI * 2;
  add(Math.cos(la) * 0.3 * H, -0.38 * V, Math.sin(la) * 0.3 * H, 0.44 * H, 0.4 * V, 0.44 * H, 4);
  return lobes;
}

const ellipsoidQ = (p: THREE.Vector3, l: Lobe): number =>
  Math.hypot((p.x - l.c.x) / l.r.x, (p.y - l.c.y) / l.r.y, (p.z - l.c.z) / l.r.z);

/** Esferas unidad (no indexadas) por nivel de detalle: se reutilizan. */
const unitSpheres = new Map<number, Float32Array>();
function unitSphere(detail: number): Float32Array {
  let data = unitSpheres.get(detail);
  if (!data) {
    const g = new THREE.IcosahedronGeometry(1, detail);
    data = new Float32Array(g.getAttribute("position").array);
    g.dispose();
    unitSpheres.set(detail, data);
  }
  return data;
}

/**
 * Copa: unión de lóbulos con las normales mezcladas hacia la masa.
 *
 * - Triángulos cuyo centroide queda DENTRO de otro lóbulo (q < 0,82) se tiran:
 *   son interior invisible. El margen deja una franja de solape para que no
 *   queden grietas en la costura.
 * - Borde ondulado ±5 % con ruido continuo en coordenadas de mundo (dos lóbulos
 *   desplazan igual el mismo punto).
 * - Color: gradiente vertical (base oscura, punta clara) + oclusión horneada
 *   en las vaguadas entre lóbulos y en lo que mira abajo.
 */
function buildCrown(lobes: Lobe[], crownCenter: THREE.Vector3, rnd: () => number, p: VegetationPalette, tint: number): THREE.BufferGeometry {
  const noiseSeed = rnd() * 100;
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const l of lobes) {
    yMin = Math.min(yMin, l.c.y - l.r.y);
    yMax = Math.max(yMax, l.c.y + l.r.y);
  }
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const sways: number[] = [];
  const low = hex(p.crownLow);
  const high = hex(p.crownHigh[tint % p.crownHigh.length]);
  const warm = hex(p.crownWarm);
  const treeTone = 1 + (rnd() - 0.5) * 0.12;

  const centroid = new THREE.Vector3();
  const v = new THREE.Vector3();
  const tri: THREE.Vector3[] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const nLobe = new THREE.Vector3();
  const nMass = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  const col = new THREE.Color();

  lobes.forEach((lobe, li) => {
    const sphere = unitSphere(lobe.detail);
    for (let t = 0; t < sphere.length; t += 9) {
      centroid.set(0, 0, 0);
      for (let k = 0; k < 3; k++) {
        tri[k].set(sphere[t + k * 3], sphere[t + k * 3 + 1], sphere[t + k * 3 + 2]);
        centroid.add(v.copy(tri[k]).multiply(lobe.r).add(lobe.c));
      }
      centroid.multiplyScalar(1 / 3);
      if (lobes.some((o, oi) => oi !== li && ellipsoidQ(centroid, o) < 0.82)) continue;

      for (let k = 0; k < 3; k++) {
        const u = tri[k];
        const base = v.copy(u).multiply(lobe.r).add(lobe.c);
        const wob = 1 + 0.05 * softNoise(base.x, base.y, base.z, noiseSeed);
        const pos = v.copy(u).multiplyScalar(wob).multiply(lobe.r).add(lobe.c).clone();
        // Normal: mitad lóbulo, mitad masa (0,6). Es lo que hace que la copa
        // sombree como una nube y no como siete pelotas pegadas.
        nLobe.copy(pos).sub(lobe.c).normalize();
        nMass.copy(pos).sub(crownCenter).normalize();
        nrm.copy(nLobe).lerp(nMass, 0.6).normalize();

        // Oclusión de vaguada: cerca de otro lóbulo (pero fuera) se oscurece.
        let ao = 1;
        for (let oi = 0; oi < lobes.length; oi++) {
          if (oi === li) continue;
          const q = ellipsoidQ(pos, lobes[oi]);
          ao *= 1 - 0.2 * (1 - smooth(q, 1.0, 1.32));
        }
        const under = THREE.MathUtils.lerp(0.8, 1, THREE.MathUtils.clamp(nrm.y * 0.5 + 0.5, 0, 1));
        const ht = smooth((pos.y - yMin) / (yMax - yMin), 0.05, 0.95);
        col.copy(low).lerp(high, ht);
        // Brillo cálido solo donde mira al cielo.
        col.lerp(warm, 0.22 * Math.pow(Math.max(nrm.y, 0), 2.2) * ht);
        col.multiplyScalar(ao * under * lobe.tone * treeTone);

        positions.push(pos.x, pos.y, pos.z);
        normals.push(nrm.x, nrm.y, nrm.z);
        colors.push(col.r, col.g, col.b);
        // Viento: nada en la base de la copa (pegada al tronco), todo arriba.
        sways.push(smooth((pos.y - yMin) / (yMax - yMin), 0.1, 1));
      }
    }
  });

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setAttribute("aSway", new THREE.Float32BufferAttribute(sways, 1));
  g.setAttribute("aPhase", new THREE.Float32BufferAttribute(new Float32Array(positions.length / 3).fill(rnd() * 6.28), 1));
  return fixWinding(g);
}

/**
 * Tronco curvo con ensanche de raíz y dos o tres ramas hacia los lóbulos bajos
 * (se ve la horquilla bajo la copa). Color: corteza con vetas, más oscura hacia
 * la copa, que le echa su sombra.
 */
function buildTrunk(type: TreeType, lobes: Lobe[], rnd: () => number, p: VegetationPalette, vs: number): THREE.BufferGeometry {
  const bark = hex(p.bark);
  const dark = hex(p.barkDark);
  const lean = (rnd() - 0.5) * 0.4;
  const leanDir = rnd() * Math.PI * 2;
  const top = type.bottom * vs + 0.55;
  const end = new THREE.Vector3(Math.cos(leanDir) * lean, top, Math.sin(leanDir) * lean);
  const ctrl = new THREE.Vector3(-Math.cos(leanDir) * 0.08, top * 0.5, -Math.sin(leanDir) * 0.08);
  const trunkCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, -0.1, 0), ctrl, end);
  const veinSeed = rnd() * 50;
  const shadeFrom = type.bottom * vs - 0.5;

  const paint = (y: number, a: number, out: THREE.Color): number => {
    const vein = 0.9 + 0.1 * Math.sin(a * 6 + softNoise(a, y, 0, veinSeed) * 3);
    out.copy(bark).multiplyScalar(vein);
    // La copa le echa su sombra al tronco: oscurece de la base de la copa
    // hacia arriba. Y la base se ensucia con la tierra.
    out.lerp(dark, 0.62 * smooth(y, shadeFrom, shadeFrom + 0.9));
    out.multiplyScalar(THREE.MathUtils.lerp(0.78, 1, smooth(y, 0, 0.25)));
    return 0;
  };

  const parts: THREE.BufferGeometry[] = [
    tube(
      trunkCurve,
      {
        segs: 12,
        radial: 10,
        radius: (t) => THREE.MathUtils.lerp(0.185, 0.115, t) + 0.14 * Math.exp(-t * 9),
        paint: (t, a, pos, out) => paint(pos.y, a, out),
      },
      0,
    ),
  ];

  // Ramas: del 70 % del tronco a los lóbulos más bajos, que las tapan en parte.
  const fork = trunkCurve.getPointAt(0.72);
  const lowest = [...lobes].sort((a, b) => a.c.y - b.c.y).slice(1, 3 + (rnd() > 0.5 ? 1 : 0));
  for (const l of lowest) {
    const target = new THREE.Vector3(l.c.x * 0.8, l.c.y - l.r.y * 0.15, l.c.z * 0.8);
    const mid = fork.clone().lerp(target, 0.5).add(new THREE.Vector3(0, 0.12, 0));
    parts.push(
      tube(
        new THREE.QuadraticBezierCurve3(fork.clone(), mid, target),
        {
          segs: 6,
          radial: 7,
          radius: (t) => THREE.MathUtils.lerp(0.085, 0.04, t),
          paint: (t, a, pos, out) => paint(pos.y, a, out),
        },
        0,
      ),
    );
  }
  return merge(parts, "treeWood");
}

export interface TreeParts {
  foliage: THREE.BufferGeometry;
  wood: THREE.BufferGeometry;
}

/** Árbol completo (copa + tronco) en el espacio local de la pieza. `seed` fija
 * el tipo, la escala horizontal/vertical (±8 %) y los tonos. */
export function buildTree(seed: string, mode: PlazaMode): TreeParts {
  const rnd = seededRandom(`veg:tree:${seed}`);
  const p = VEGETATION_PALETTES[mode];
  const type = TREE_TYPES[Math.floor(rnd() * TREE_TYPES.length)];
  const hs = 0.92 + rnd() * 0.16;
  const vs = 0.92 + rnd() * 0.16;
  const lobes = makeLobes(type, rnd, hs, vs);
  const crownCenter = lobes[0].c.clone();
  const foliage = buildCrown(lobes, crownCenter, rnd, p, Math.floor(rnd() * 3));
  const wood = buildTrunk(type, lobes, rnd, p, vs);
  return { foliage, wood };
}

/**
 * Seto de jardinera: caja recortada con bisel, a juego con los parterres (un
 * jardín francés poda sus setos, no los deja crecer en brócoli). Sube sobre la
 * jardinera de piedra (borde a y = 0,42).
 */
export function buildPlanterHedge(seed: string, mode: PlazaMode): THREE.BufferGeometry {
  const rnd = seededRandom(`veg:hedge:${seed}`);
  const p = VEGETATION_PALETTES[mode];
  const w = 0.84;
  const h = 0.5;
  const d = 0.52;
  const r = 0.075;
  const seg = 6;
  const box = new THREE.BoxGeometry(w, h, d, seg, seg, seg);
  const pos = box.getAttribute("position");
  const nor = box.getAttribute("normal");
  const inner = new THREE.Vector3(w / 2 - r, h / 2 - r, d / 2 - r);
  const q = new THREE.Vector3();
  const dir = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    q.fromBufferAttribute(pos, i);
    const clamped = new THREE.Vector3(
      THREE.MathUtils.clamp(q.x, -inner.x, inner.x),
      THREE.MathUtils.clamp(q.y, -inner.y, inner.y),
      THREE.MathUtils.clamp(q.z, -inner.z, inner.z),
    );
    dir.subVectors(q, clamped);
    if (dir.lengthSq() > 1e-9) {
      dir.normalize();
      q.copy(clamped).addScaledVector(dir, r);
      nor.setXYZ(i, dir.x, dir.y, dir.z);
    }
    pos.setXYZ(i, q.x, q.y + 0.4 + h / 2, q.z);
  }
  const low = hex(p.hedgeLow);
  const high = hex(p.hedgeHigh);
  const tone = 1 + (rnd() - 0.5) * 0.1;
  return applyShade(
    box,
    (pt, n, out) => {
      const t = smooth(pt.y, 0.4, 0.4 + h);
      out.copy(low).lerp(high, t);
      // Caras superiores al sol, flancos y arranque en sombra.
      out.multiplyScalar(tone * THREE.MathUtils.lerp(0.9, 1.08, THREE.MathUtils.clamp(n.y, 0, 1)));
      return 0;
    },
    0,
  );
}
