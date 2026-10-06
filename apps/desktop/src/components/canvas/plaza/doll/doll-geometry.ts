import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { DOLL, seededRandom, type DollSpec, type HairStyle } from "../plaza-config";
import { registerPlazaDisposer } from "../plaza-textures";
import type { DollOutfit } from "./doll-outfit";
import { clamp, smoothstep, wrapAngle } from "./doll-math";

/**
 * Modelado procedural del muñeco.
 *
 * Cada pieza RÍGIDA (cabeza, torso, brazo, antebrazo, pierna, zapato) es UNA
 * geometría fusionada con `color` por vértice y un atributo `aRough` (rugosidad
 * por vértice): así tela, piel, suela y pelo comparten UN material y un draw
 * call por pieza, y el color y el brillo de cada parte viajan en la geometría.
 *
 * El tono también lleva oclusión ambiente PINTADA en los vértices (raíces del
 * pelo, bajos de la camiseta, arranque de las piernas): barata y es lo que da
 * "volumen" a un diorama mate sin postprocesado.
 *
 * Las geometrías se cachean por vestuario (colores incluidos) y se liberan
 * todas juntas con `disposePlazaTextures` (vía `registerPlazaDisposer`).
 */

type V3 = [number, number, number];

/** Medidas de la articulación del muñeco (unidades locales, antes de `spec.scale`). */
export const DOLL_RIG = {
  /** Cintura: pivote del tronco (inclinación y contragiro de hombros). */
  waistY: 0.3,
  /** Altura de la cadera sobre el suelo y separación de las piernas. */
  hipY: 0.17,
  hipX: 0.11,
  /** Hombro. */
  shoulderX: 0.235,
  shoulderY: 0.58,
  /** Longitud del brazo hasta el codo y del antebrazo hasta la muñeca. */
  upperArm: 0.105,
  foreArm: 0.095,
  /** Tobillo: cuánto cuelga el pie de la cadera. */
  ankle: 0.1,
  /** Largo efectivo de la pierna (cadera → suelo), para el ciclo de paso. */
  legLength: 0.17,
} as const;

// ---------------------------------------------------------------------------
// Utilidades de construcción
// ---------------------------------------------------------------------------

const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

function xf(pos: V3 = [0, 0, 0], scale: V3 = [1, 1, 1], rot: V3 = [0, 0, 0]): THREE.Matrix4 {
  _e.set(rot[0], rot[1], rot[2]);
  _q.setFromEuler(_e);
  return new THREE.Matrix4().compose(_p.set(...pos), _q, _s.set(...scale));
}

type ColorFn = (x: number, y: number, z: number, out: THREE.Color) => void;
type Paint = THREE.Color | ColorFn | "keep";

const _tmp = new THREE.Color();

/**
 * Prepara una primitiva para fusionar: sin UV, sin índice, con `color` y
 * `aRough`. `matrix` la coloca en el espacio de la pieza ANTES de pintar, de
 * modo que `paint` ve coordenadas de pieza (útil para el degradado de AO).
 */
function piece(geo: THREE.BufferGeometry, paint: Paint, rough: number, matrix?: THREE.Matrix4, skin = false): THREE.BufferGeometry {
  if (matrix) geo.applyMatrix4(matrix);
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (g !== geo) geo.dispose();
  g.deleteAttribute("uv");
  const pos = g.attributes.position;
  if (paint !== "keep") {
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      if (paint instanceof THREE.Color) _tmp.copy(paint);
      else paint(pos.getX(i), pos.getY(i), pos.getZ(i), _tmp);
      col[i * 3] = _tmp.r;
      col[i * 3 + 1] = _tmp.g;
      col[i * 3 + 2] = _tmp.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  }
  g.setAttribute("aRough", new THREE.BufferAttribute(new Float32Array(pos.count).fill(rough), 1));
  // 1 = piel: el material de cuerpo le aplica el sombreado de piel de la cara
  // (wrap + tinte cálido + rim) y a la tela no.
  g.setAttribute("aSkin", new THREE.BufferAttribute(new Float32Array(pos.count).fill(skin ? 1 : 0), 1));
  return g;
}

function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const out = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  if (!out) throw new Error("doll-geometry: mergeGeometries devolvió null (atributos distintos)");
  out.computeBoundingSphere();
  out.computeBoundingBox();
  return out;
}

/** Normales suaves SIN costura: `computeVertexNormals` por separado deja una
 * arista dura donde la geometría duplica vértices (polos y costura de una
 * esfera), así que se promedian los vértices que coinciden en posición. */
function weldNormals(geo: THREE.BufferGeometry): void {
  geo.computeVertexNormals();
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const acc = new Map<string, [number, number, number]>();
  const key = (i: number) => `${Math.round(pos.getX(i) * 2e4)},${Math.round(pos.getY(i) * 2e4)},${Math.round(pos.getZ(i) * 2e4)}`;
  for (let i = 0; i < pos.count; i++) {
    const k = key(i);
    const a = acc.get(k) ?? [0, 0, 0];
    a[0] += nor.getX(i);
    a[1] += nor.getY(i);
    a[2] += nor.getZ(i);
    acc.set(k, a);
  }
  for (let i = 0; i < pos.count; i++) {
    const a = acc.get(key(i))!;
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    nor.setXYZ(i, a[0] / l, a[1] / l, a[2] / l);
  }
}

function ellipsoid(r: V3, pos: V3, paint: Paint, rough: number, rot: V3 = [0, 0, 0], seg = 14, skin = false): THREE.BufferGeometry {
  return piece(new THREE.SphereGeometry(1, seg, Math.max(8, Math.round(seg * 0.7))), paint, rough, xf(pos, r, rot), skin);
}

function cylinder(rTop: number, rBot: number, h: number, pos: V3, paint: Paint, rough: number, radial = 16, skin = false): THREE.BufferGeometry {
  return piece(new THREE.CylinderGeometry(rTop, rBot, h, radial, 2), paint, rough, xf(pos), skin);
}

function torus(R: number, r: number, pos: V3, paint: Paint, rough: number, rot: V3 = [Math.PI / 2, 0, 0], scale: V3 = [1, 1, 1]): THREE.BufferGeometry {
  return piece(new THREE.TorusGeometry(R, r, 6, 24), paint, rough, xf(pos, scale, rot));
}

function shade(c: THREE.Color, f: number): THREE.Color {
  return c.clone().multiplyScalar(f);
}

// ---------------------------------------------------------------------------
// Cabeza
// ---------------------------------------------------------------------------

const HR = DOLL.head.radius;
const [HSX, HSY, HSZ] = DOLL.head.scale;

/**
 * Punto de la superficie de la cabeza para una dirección unitaria desde su
 * centro. La esfera achatada de antes se modela: mejillas llenas, mandíbula
 * más estrecha, nuca que abulta. Es MUY suave a la altura de los ojos (dy ≈
 * 0.17) y la boca (dy ≈ -0.29): la cara se pinta en las UV de la esfera, y si
 * esa zona se moviera, los rasgos aparecerían corridos.
 *
 * La usan la cabeza y el pelo, así el casco de pelo siempre sigue la cabeza.
 */
export function headPoint(dx: number, dy: number, dz: number, out: THREE.Vector3): THREE.Vector3 {
  const cheek = smoothstep(-0.25, -0.5, dy) * (1 - smoothstep(-0.62, -0.95, dy));
  const jaw = smoothstep(-0.5, -1, dy);
  const nape = smoothstep(0, -0.8, dz) * smoothstep(0.95, 0.25, Math.abs(dy));
  const x = dx * HR * HSX * (1 + 0.06 * cheek - 0.1 * jaw);
  const y = dy * HR * HSY;
  const z = dz * HR * HSZ * (1 + 0.012 * cheek * Math.max(dz, 0) - 0.06 * jaw + 0.045 * nape);
  return out.set(x, y, z);
}

function buildHead(): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 48, 32);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    // En la esfera unidad la posición ES la dirección.
    headPoint(pos.getX(i), pos.getY(i), pos.getZ(i), v);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  weldNormals(g);
  // Piel un punto satinada (la cara es lo que más brilla del muñeco).
  g.setAttribute("aRough", new THREE.BufferAttribute(new Float32Array(pos.count).fill(0.58), 1));
  g.computeBoundingSphere();
  g.computeBoundingBox();
  return g;
}

// ---------------------------------------------------------------------------
// Tubo barrido (mechones, coleta)
// ---------------------------------------------------------------------------

function sweepTube(
  points: THREE.Vector3[],
  radiusAt: (s: number) => number,
  paint: (s: number) => THREE.Color,
  radial = 10,
  steps = 10,
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const frames = curve.computeFrenetFrames(steps, false);
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const centers: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const c = curve.getPointAt(s);
    centers.push(c);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const r = radiusAt(s);
    const color = paint(s);
    for (let k = 0; k < radial; k++) {
      const a = (k / radial) * Math.PI * 2;
      const cs = Math.cos(a) * r;
      const sn = Math.sin(a) * r;
      pos.push(c.x + N.x * cs + B.x * sn, c.y + N.y * cs + B.y * sn, c.z + N.z * cs + B.z * sn);
      col.push(color.r, color.g, color.b);
    }
  }
  for (let i = 0; i < steps; i++) {
    for (let k = 0; k < radial; k++) {
      const a = i * radial + k;
      const b = i * radial + ((k + 1) % radial);
      const c = (i + 1) * radial + k;
      const d = (i + 1) * radial + ((k + 1) % radial);
      idx.push(a, b, c, b, d, c);
    }
  }
  // Tapas: punta y base.
  const addCap = (ring: number, center: THREE.Vector3, tip: boolean) => {
    const ci = pos.length / 3;
    pos.push(center.x, center.y, center.z);
    const color = paint(tip ? 1 : 0);
    col.push(color.r, color.g, color.b);
    for (let k = 0; k < radial; k++) {
      const a = ring * radial + k;
      const b = ring * radial + ((k + 1) % radial);
      if (tip) idx.push(ci, a, b);
      else idx.push(ci, b, a);
    }
  };
  addCap(steps, centers[steps], true);
  addCap(0, centers[0], false);

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  weldNormals(g);
  return g;
}

// ---------------------------------------------------------------------------
// Pelo
// ---------------------------------------------------------------------------

interface HairShape {
  /** Polar (rad desde la coronilla) del borde del pelo al frente, a los lados y detrás. */
  front: number;
  side: number;
  back: number;
  /** Transición frente → lados (rad de azimut): estrecha en el bob (cortinilla). */
  sideFrom: number;
  sideTo: number;
  /** Grosor de la masa de pelo. */
  thick: number;
  /** Amplitud y frecuencia del festoneado del borde (flequillo, puntas). */
  scallop: number;
  scallopK: number;
  /** Cuánto abulta hacia fuera la parte baja (melena). */
  flare: number;
  /** Tupé: volumen extra encima de la frente. */
  quiff: number;
}

const HAIR_SHAPES: Record<Exclude<HairStyle, "bald">, HairShape> = {
  short: { front: 0.98, side: 1.5, back: 1.95, sideFrom: 0.35, sideTo: 1.45, thick: 0.034, scallop: 0.07, scallopK: 7, flare: 0, quiff: 0.03 },
  spiky: { front: 0.95, side: 1.4, back: 1.8, sideFrom: 0.35, sideTo: 1.45, thick: 0.036, scallop: 0.06, scallopK: 9, flare: 0, quiff: 0.012 },
  bun: { front: 0.97, side: 1.45, back: 1.85, sideFrom: 0.35, sideTo: 1.45, thick: 0.036, scallop: 0.05, scallopK: 8, flare: 0, quiff: 0.01 },
  ponytail: { front: 0.97, side: 1.42, back: 1.8, sideFrom: 0.35, sideTo: 1.45, thick: 0.035, scallop: 0.05, scallopK: 8, flare: 0, quiff: 0.012 },
  bob: { front: 1.0, side: 2.2, back: 2.32, sideFrom: 0.7, sideTo: 1.25, thick: 0.05, scallop: 0.045, scallopK: 11, flare: 0.8, quiff: 0.008 },
};

function dirOf(theta: number, phi: number, out: THREE.Vector3): THREE.Vector3 {
  const s = Math.sin(theta);
  return out.set(s * Math.sin(phi), Math.cos(theta), s * Math.cos(phi));
}

/**
 * Casco de pelo CON GROSOR: la superficie de la cabeza desplazada hacia fuera
 * por la normal, con el grosor muriendo en el borde (así el pelo "nace" de la
 * cabeza en vez de acabar en un canto recto de cartón) y el borde festoneado
 * como mechones. Pintado con vetas por azimut y raíces más oscuras.
 */
function hairShell(shape: HairShape, base: THREE.Color, phase: number): THREE.BufferGeometry {
  const NP = 56;
  const NT = 14;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const d = new THREE.Vector3();
  const p = new THREE.Vector3();

  for (let j = 0; j <= NT; j++) {
    for (let i = 0; i < NP; i++) {
      const phi = (i / NP) * Math.PI * 2;
      const f = Math.abs(wrapAngle(phi));
      const sideT = smoothstep(shape.sideFrom, shape.sideTo, f);
      const backT = smoothstep(1.5, 2.7, f);
      let thetaMax = THREE.MathUtils.lerp(shape.front, shape.side, sideT);
      thetaMax = THREE.MathUtils.lerp(thetaMax, shape.back, backT);
      // Festoneado: puntas que bajan, nunca suben por encima de la línea base.
      thetaMax += shape.scallop * Math.abs(Math.sin(phi * shape.scallopK + phase)) * (1 - backT * 0.6);
      const theta = (j / NT) * thetaMax;
      const edge = thetaMax - theta; // distancia angular al borde
      const taper = Math.sin(clamp(edge / 0.3, 0, 1) * Math.PI * 0.5);

      let t = shape.thick;
      t *= 1 + shape.flare * smoothstep(1.2, 2.0, theta) * sideT;
      // Volumen de la coronilla y tupé sobre la frente.
      t += 0.012 * (1 - smoothstep(0, 0.7, theta));
      t += shape.quiff * Math.exp(-(((theta - 0.72) ** 2) / 0.06 + (wrapAngle(phi) ** 2) / 0.35));
      t = 0.003 + (t - 0.003) * taper;

      dirOf(theta, phi, d);
      headPoint(d.x, d.y, d.z, p);
      p.addScaledVector(d, t);
      pos.push(p.x, p.y, p.z);

      // Vetas finas por azimut, raíz oscura en el borde y brillo en la coronilla.
      const strand = 0.93 + 0.07 * Math.sin(phi * 26 + theta * 2.2 + phase);
      const ao = THREE.MathUtils.lerp(0.78, 1, taper);
      const top = 1 + 0.1 * (1 - smoothstep(0, 1.1, theta));
      const k = strand * ao * top;
      col.push(base.r * k, base.g * k, base.b * k);
    }
  }
  for (let j = 0; j < NT; j++) {
    for (let i = 0; i < NP; i++) {
      const a = j * NP + i;
      const b = j * NP + ((i + 1) % NP);
      const c = (j + 1) * NP + i;
      const e = (j + 1) * NP + ((i + 1) % NP);
      idx.push(a, c, b, b, c, e);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  weldNormals(g);
  // Normales hacia fuera: el casco envuelve el centro de la cabeza.
  const P = g.attributes.position;
  const N = g.attributes.normal;
  let dot = 0;
  for (let i = 0; i < P.count; i++) dot += P.getX(i) * N.getX(i) + P.getY(i) * N.getY(i) + P.getZ(i) * N.getZ(i);
  if (dot < 0) {
    const ia = g.index!.array as Uint16Array | Uint32Array;
    for (let i = 0; i < ia.length; i += 3) {
      const t = ia[i + 1];
      ia[i + 1] = ia[i + 2];
      ia[i + 2] = t;
    }
    weldNormals(g);
  }
  return g;
}

function buildHair(style: HairStyle, hairColor: string, seed: string): THREE.BufferGeometry[] {
  if (style === "bald") return [];
  const rnd = seededRandom(seed);
  const base = new THREE.Color(hairColor);
  const parts: THREE.BufferGeometry[] = [];
  parts.push(piece(hairShell(HAIR_SHAPES[style], base, rnd() * 6.28), "keep", 0.42));

  const d = new THREE.Vector3();
  const p = new THREE.Vector3();
  const tie = shade(base, 0.45);

  if (style === "bun") {
    headPoint(0, 0.93, -0.37, p);
    p.y += 0.055;
    parts.push(ellipsoid([0.115, 0.1, 0.115], [p.x, p.y + 0.04, p.z - 0.02], (x, y, z, o) => o.copy(base).multiplyScalar(0.92 + 0.12 * clamp((y - p.y) * 6, -1, 1)), 0.42, [0, 0, 0], 16));
    parts.push(torus(0.075, 0.016, [p.x, p.y - 0.02, p.z - 0.012], tie, 0.7, [Math.PI / 2.4, 0, 0]));
  } else if (style === "ponytail") {
    headPoint(0, 0.5, -0.86, p);
    const o = p.clone();
    const pts = [
      o.clone().multiplyScalar(0.97),
      o.clone().add(new THREE.Vector3(0, 0.02, -0.07)),
      o.clone().add(new THREE.Vector3(0, -0.07, -0.15)),
      o.clone().add(new THREE.Vector3(0.01, -0.2, -0.17)),
      o.clone().add(new THREE.Vector3(0.0, -0.33, -0.13)),
    ];
    parts.push(
      piece(
        sweepTube(
          pts,
          (s) => 0.07 * (0.55 + 0.45 * Math.sin(Math.min(1, s * 3.2) * 1.2 + 0.3)) * (1 - 0.72 * s ** 1.6) + 0.006,
          (s) => base.clone().multiplyScalar(0.8 + 0.22 * (1 - s)),
          12,
          14,
        ),
        "keep",
        0.42,
      ),
    );
    parts.push(torus(0.062, 0.014, o.clone().add(new THREE.Vector3(0, 0.0, -0.05)).toArray() as V3, tie, 0.7, [Math.PI / 2.2, 0, 0]));
  } else if (style === "spiky") {
    // Mechones orgánicos: base ancha hundida en el casquete, curvados hacia
    // arriba-atrás y con caída en la punta, como un tupé revuelto. Se solapan
    // (más mechones y gruesos) para que lean como pelo y no como conos.
    const n = 11;
    const up = new THREE.Vector3(0, 1, 0);
    for (let k = 0; k < n; k++) {
      const theta = 0.12 + rnd() * 0.85;
      const phi = (k / n) * Math.PI * 2 + rnd() * 0.5;
      dirOf(theta, phi, d);
      headPoint(d.x, d.y, d.z, p);
      const len = 0.12 + rnd() * 0.07;
      const lean = new THREE.Vector3(d.x, 0, d.z).normalize().multiplyScalar(0.55);
      const dir = d.clone().multiplyScalar(0.55).addScaledVector(up, 0.8).add(new THREE.Vector3(0, 0, -0.18 + (rnd() - 0.5) * 0.3)).normalize();
      const start = p.clone().addScaledVector(d, -0.012);
      const mid = start.clone().addScaledVector(dir, len * 0.55);
      // Caída: la punta se curva hacia fuera y baja, más cuanto más lateral.
      const tip = start.clone().addScaledVector(dir, len * 0.95).addScaledVector(lean, len * 0.4).addScaledVector(up, -len * 0.3);
      const r0 = 0.07 + rnd() * 0.02;
      parts.push(
        piece(
          sweepTube(
            [start, mid, tip],
            (s) => r0 * (1 - s ** 1.5) ** 0.8 * (1 - 0.35 * s) + 0.007,
            (s) => base.clone().multiplyScalar(0.8 + 0.24 * s),
            10,
            9,
          ),
          "keep",
          0.42,
        ),
      );
    }
  }
  return parts;
}

// ---------------------------------------------------------------------------
// Accesorios de la cabeza (nariz, orejas)
// ---------------------------------------------------------------------------

function headSkin(skin: THREE.Color): THREE.BufferGeometry[] {
  const nose = ellipsoid([DOLL.nose.radius, DOLL.nose.radius * 0.8, DOLL.nose.radius * 0.85], [0, DOLL.nose.y - DOLL.head.y, DOLL.nose.z], shade(skin, 0.9), 0.62, [0, 0, 0], 16, true);
  const ear = (side: number) =>
    ellipsoid([0.03, 0.062, 0.046], [side * 0.322, -0.012, -0.03], (x, y, z, o) => o.copy(skin).multiplyScalar(0.96 - 0.05 * Math.abs(x - side * 0.322) * 20), 0.62, [0, 0, side * 0.12], 16, true);
  return [nose, ear(-1), ear(1)];
}

// ---------------------------------------------------------------------------
// Torso
// ---------------------------------------------------------------------------

/** Perfil del torso (radio, y) desde el bajo hasta el hombro, y desde la cintura. */
const SHIRT_PROFILE: ReadonlyArray<readonly [number, number]> = [
  [0.0, 0.0],
  [0.17, 0.0],
  [0.181, 0.01],
  [0.186, 0.04],
  [0.19, 0.12],
  [0.199, 0.22],
  [0.202, 0.28],
  [0.192, 0.34],
  [0.16, 0.392],
  [0.108, 0.428],
  [0.075, 0.44],
];
const PANTS_PROFILE: ReadonlyArray<readonly [number, number]> = [
  [0.0, -0.14],
  [0.08, -0.137],
  [0.135, -0.12],
  [0.158, -0.08],
  [0.165, -0.02],
  [0.165, 0.03],
  [0.0, 0.03],
];

function lathe(profile: ReadonlyArray<readonly [number, number]>, samples: number, radial: number): THREE.BufferGeometry {
  const curve = new THREE.SplineCurve(profile.map(([x, y]) => new THREE.Vector2(x, y)));
  const pts = curve.getPoints(samples).map((v) => new THREE.Vector2(Math.max(0, v.x), v.y));
  return new THREE.LatheGeometry(pts, radial);
}

function buildTorso(spec: Pick<DollSpec, "shirt" | "skin">, outfit: DollOutfit): THREE.BufferGeometry {
  const shirt = new THREE.Color(spec.shirt);
  const pants = new THREE.Color(outfit.pants);
  const skin = new THREE.Color(spec.skin);
  const stripe = shirt.clone().lerp(new THREE.Color("#F2EEE6"), 0.78);

  const shirtGeo = piece(lathe(SHIRT_PROFILE, 40, 32), (x, y, z, o) => {
    // AO: bajos y sobaco más oscuros, hombros con un punto de luz.
    const ao = THREE.MathUtils.lerp(0.8, 1, smoothstep(0, 0.1, y)) * (1 + 0.06 * smoothstep(0.3, 0.43, y));
    if (outfit.stripes && Math.floor((y + 0.0001) / 0.046) % 2 === 1) o.copy(stripe);
    else o.copy(shirt);
    o.multiplyScalar(ao);
  }, 0.86);
  const pantsGeo = piece(lathe(PANTS_PROFILE, 10, 32), (x, y, z, o) => {
    o.copy(pants).multiplyScalar(0.78 + 0.22 * smoothstep(-0.14, -0.02, y));
  }, 0.86);
  const neck = cylinder(0.068, 0.078, 0.14, [0, 0.46, 0], shade(skin, 0.94), 0.62, 14, true);
  // Cuello de la camiseta: anillo de tela algo más claro que la prenda.
  const collar = torus(0.1, 0.021, [0, 0.424, 0], shade(shirt, 1.1), 0.9, [Math.PI / 2, 0, 0], [1, 1, 0.8]);
  // Cinturilla: línea oscura donde la camiseta se mete.
  const hem = torus(0.176, 0.01, [0, 0.004, 0], shade(shirt, 0.85), 0.9, [Math.PI / 2, 0, 0]);
  return merge([shirtGeo, pantsGeo, neck, collar, hem]);
}

// ---------------------------------------------------------------------------
// Brazos
// ---------------------------------------------------------------------------

function buildUpperArm(spec: Pick<DollSpec, "shirt" | "skin">, outfit: DollOutfit): THREE.BufferGeometry {
  const shirt = new THREE.Color(spec.shirt);
  const skin = new THREE.Color(spec.skin);
  const U = DOLL_RIG.upperArm;
  const parts: THREE.BufferGeometry[] = [];
  // Hombro: bola de manga que oculta la unión con el torso.
  parts.push(ellipsoid([0.068, 0.066, 0.066], [0, 0, 0], (x, y, z, o) => o.copy(shirt).multiplyScalar(0.94 + 0.08 * clamp(y * 12, -1, 1)), 0.86, [0, 0, 0], 16));
  const sleeve = outfit.shortSleeves ? U * 0.62 : U;
  parts.push(cylinder(0.062, outfit.shortSleeves ? 0.066 : 0.056, sleeve, [0, -sleeve / 2, 0], (x, y, z, o) => o.copy(shirt).multiplyScalar(0.9 + 0.1 * smoothstep(-U, 0, y)), 0.86, 14));
  if (outfit.shortSleeves) {
    parts.push(torus(0.066, 0.011, [0, -sleeve, 0], shade(shirt, 0.84), 0.9));
    parts.push(cylinder(0.052, 0.047, U - sleeve + 0.012, [0, -sleeve - (U - sleeve) / 2 + 0.006, 0], skin, 0.66, 14, true));
  }
  return merge(parts);
}

/** `side`: -1 / +1 = lado del brazo; decide hacia dónde asoma el pulgar. */
function buildForeArm(spec: Pick<DollSpec, "shirt" | "skin">, outfit: DollOutfit, side: -1 | 1): THREE.BufferGeometry {
  const shirt = new THREE.Color(spec.shirt);
  const skin = new THREE.Color(spec.skin);
  const F = DOLL_RIG.foreArm;
  const parts: THREE.BufferGeometry[] = [];
  const sleeveColor = outfit.shortSleeves ? skin : shirt;
  const rough = outfit.shortSleeves ? 0.66 : 0.86;
  // Codo: bola que da continuidad a la articulación al doblar.
  parts.push(ellipsoid([0.052, 0.052, 0.052], [0, 0, 0], sleeveColor, rough, [0, 0, 0], 14));
  parts.push(cylinder(0.054, outfit.shortSleeves ? 0.044 : 0.05, F, [0, -F / 2, 0], sleeveColor, rough, 14, outfit.shortSleeves));
  if (!outfit.shortSleeves) parts.push(torus(0.052, 0.011, [0, -F + 0.004, 0], shade(shirt, 0.84), 0.9));
  // Mano: manopla redondeada con pulgar sugerido, en el sitio natural de una
  // mano colgando (el pulgar hacia delante y hacia dentro).
  const hy = -F - 0.022;
  parts.push(ellipsoid([0.066, 0.078, 0.052], [0, hy, 0], (x, y, z, o) => o.copy(skin).multiplyScalar(0.93 + 0.07 * smoothstep(hy - 0.07, hy + 0.05, y)), 0.66, [0, 0, 0], 16, true));
  parts.push(ellipsoid([0.023, 0.042, 0.025], [-side * 0.046, hy + 0.012, 0.034], shade(skin, 0.97), 0.66, [0.35, 0, side * 0.35], 14, true));
  return merge(parts);
}

// ---------------------------------------------------------------------------
// Piernas y zapatos
// ---------------------------------------------------------------------------

function buildLeg(outfit: DollOutfit): THREE.BufferGeometry {
  const pants = new THREE.Color(outfit.pants);
  const A = DOLL_RIG.ankle;
  return merge([
    ellipsoid([0.074, 0.074, 0.074], [0, 0, 0], shade(pants, 0.82), 0.86, [0, 0, 0], 16),
    cylinder(0.073, 0.066, A, [0, -A / 2, 0], (x, y, z, o) => o.copy(pants).multiplyScalar(0.82 + 0.18 * smoothstep(0, -A * 0.5, y)), 0.86, 14),
    torus(0.068, 0.012, [0, -A + 0.004, 0], shade(pants, 0.8), 0.9),
  ]);
}

/** Origen en el tobillo; el suelo queda a `hipY - ankle` = 0.07 por debajo. */
function buildShoe(outfit: DollOutfit): THREE.BufferGeometry {
  const upper = new THREE.Color(outfit.shoe);
  const sole = new THREE.Color(outfit.sole);
  const g = DOLL_RIG.hipY - DOLL_RIG.ankle; // 0.07 de tobillo a suelo
  return merge([
    // Empeine.
    ellipsoid([0.083, 0.05, 0.12], [0, -g + 0.052, 0.034], (x, y, z, o) => o.copy(upper).multiplyScalar(0.84 + 0.2 * smoothstep(-g, -g + 0.1, y)), 0.5, [0, 0, 0], 16),
    // Suela clara: es lo que lo lee como zapato.
    ellipsoid([0.09, 0.02, 0.13], [0, -g + 0.02, 0.036], sole, 0.7, [0, 0, 0], 16),
    // Puntera.
    ellipsoid([0.066, 0.034, 0.05], [0, -g + 0.036, 0.1], shade(upper, 1.08), 0.5, [0, 0, 0], 14),
  ]);
}

// ---------------------------------------------------------------------------
// Caché
// ---------------------------------------------------------------------------

export interface DollGeos {
  head: THREE.BufferGeometry;
  /** Pelo + nariz + orejas (mismo material que el cuerpo). */
  headgear: THREE.BufferGeometry;
  torso: THREE.BufferGeometry;
  upperArm: THREE.BufferGeometry;
  foreArmL: THREE.BufferGeometry;
  foreArmR: THREE.BufferGeometry;
  leg: THREE.BufferGeometry;
  shoe: THREE.BufferGeometry;
}

const cache = new Map<string, THREE.BufferGeometry>();
let headGeo: THREE.BufferGeometry | null = null;
let registered = false;

function cached(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = cache.get(key);
  if (!g) {
    g = make();
    cache.set(key, g);
  }
  return g;
}

export function getDollGeos(spec: DollSpec, outfit: DollOutfit): DollGeos {
  if (!registered) {
    registered = true;
    registerPlazaDisposer(() => {
      cache.forEach((g) => g.dispose());
      cache.clear();
      headGeo?.dispose();
      headGeo = null;
      registered = false;
    });
  }
  headGeo ??= buildHead();
  const arm = `${spec.shirt}|${spec.skin}|${outfit.shortSleeves ? 1 : 0}`;
  return {
    head: headGeo,
    headgear: cached(`hg|${spec.hair}|${spec.hairColor}|${spec.skin}|${outfit.hairSeed}`, () => {
      const skin = new THREE.Color(spec.skin);
      return merge([...buildHair(spec.hair, spec.hairColor, outfit.hairSeed), ...headSkin(skin)]);
    }),
    torso: cached(`to|${spec.shirt}|${spec.skin}|${outfit.pants}|${outfit.stripes ? 1 : 0}`, () => buildTorso(spec, outfit)),
    upperArm: cached(`ua|${arm}`, () => buildUpperArm(spec, outfit)),
    foreArmL: cached(`fl|${arm}`, () => buildForeArm(spec, outfit, -1)),
    foreArmR: cached(`fr|${arm}`, () => buildForeArm(spec, outfit, 1)),
    leg: cached(`lg|${outfit.pants}`, () => buildLeg(outfit)),
    shoe: cached(`sh|${outfit.shoe}|${outfit.sole}`, () => buildShoe(outfit)),
  };
}
