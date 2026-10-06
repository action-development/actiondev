import * as THREE from "three";

/**
 * Herramientas de la vegetación: ruido, tubos con pintura por vértice y
 * ayudas de winding. Sin lógica de plantas aquí.
 *
 * Todo lo que sale de este módulo lleva los MISMOS atributos —`position`,
 * `normal`, `color` (lineal) y `aSway`/`aPhase` (viento)—: los sacos de
 * vegetación se funden en una sola geometría y `merge` solo rellena con ceros
 * lo que falta, que en un `color` sería negro.
 */

/** Función de pintura: color lineal del vértice (se escribe en `out`) y
 * cuánto se mueve con el viento (0 = clavado al suelo, 1 = punta de copa). */
export type ShadeFn = (p: THREE.Vector3, n: THREE.Vector3, out: THREE.Color) => number;

/** Ruido suave determinista en [-1, 1]: suma de senos con fases cruzadas. Sin
 * tablas ni dependencias; basta para ondular una copa un ±5 %. */
export function softNoise(x: number, y: number, z: number, seed: number): number {
  const a = Math.sin(x * 1.7 + seed) * Math.sin(y * 2.1 + seed * 1.3);
  const b = Math.sin(z * 1.9 - seed * 0.7 + x * 0.8) * Math.sin(y * 1.3 + z * 0.6 + seed * 2.1);
  const c = Math.sin((x + y + z) * 3.1 + seed * 0.4) * 0.5;
  return (a + b + c) / 2.5;
}

export const smooth = (x: number, a: number, b: number): number => THREE.MathUtils.smoothstep(x, a, b);

/** Color lineal desde hex. `THREE.Color` ya convierte sRGB → lineal. */
export const hex = (value: string): THREE.Color => new THREE.Color(value);

/**
 * Escribe `color`, `aSway` y `aPhase` según `shade` y quita el `uv`, que la
 * vegetación no usa (el color va por vértice).
 */
export function applyShade(g: THREE.BufferGeometry, shade: ShadeFn, phase: number): THREE.BufferGeometry {
  const pos = g.getAttribute("position");
  const nor = g.getAttribute("normal");
  const count = pos.count;
  const colors = new Float32Array(count * 3);
  const sway = new Float32Array(count);
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    p.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nor, i);
    sway[i] = shade(p, n, c);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.setAttribute("aSway", new THREE.BufferAttribute(sway, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(new Float32Array(count).fill(phase), 1));
  g.deleteAttribute("uv");
  return g;
}

/**
 * Pone cada triángulo en el sentido que casa con las normales del vértice.
 * Así las geometrías que escriben su normal a mano no dependen de acertar el
 * orden de los índices (la causa clásica de caras que "desaparecen").
 * Devuelve una geometría NO indexada.
 */
export function fixWinding(source: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = source.index ? source.toNonIndexed() : source;
  if (g !== source) source.dispose();
  const pos = g.getAttribute("position");
  const nor = g.getAttribute("normal");
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const face = new THREE.Vector3();
  const avg = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  for (let t = 0; t < pos.count; t += 3) {
    a.fromBufferAttribute(pos, t);
    b.fromBufferAttribute(pos, t + 1);
    c.fromBufferAttribute(pos, t + 2);
    face.subVectors(b, a).cross(tmp.subVectors(c, a));
    avg.set(0, 0, 0);
    for (let k = 0; k < 3; k++) avg.add(tmp.fromBufferAttribute(nor, t + k));
    if (face.dot(avg) >= 0) continue;
    for (const attr of Object.values(g.attributes)) {
      const arr = attr.array as Float32Array;
      const s = attr.itemSize;
      for (let k = 0; k < s; k++) {
        const i1 = (t + 1) * s + k;
        const i2 = (t + 2) * s + k;
        const swap = arr[i1];
        arr[i1] = arr[i2];
        arr[i2] = swap;
      }
    }
  }
  return g;
}

export interface TubeStyle {
  segs: number;
  radial: number;
  /** Radio en `t` (0 → 1 a lo largo de la curva) y ángulo `a` alrededor. */
  radius: (t: number, a: number) => number;
  /** Pintura por vértice; recibe `t`, el ángulo y la posición de mundo local. */
  paint: (t: number, a: number, p: THREE.Vector3, out: THREE.Color) => number;
}

/**
 * Tubo de radio variable sobre una curva. Sin tapas: los extremos de tronco y
 * rama quedan enterrados en el suelo o dentro de la copa.
 */
export function tube(curve: THREE.Curve<THREE.Vector3>, style: TubeStyle, phase: number): THREE.BufferGeometry {
  const { segs, radial } = style;
  const frames = curve.computeFrenetFrames(segs, false);
  const positions: number[] = [];
  const normals: number[] = [];
  const ts: number[] = [];
  const angles: number[] = [];
  const index: number[] = [];
  const point = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    curve.getPointAt(t, point);
    const nrm = frames.normals[i];
    const bin = frames.binormals[i];
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const dx = nrm.x * Math.cos(a) + bin.x * Math.sin(a);
      const dy = nrm.y * Math.cos(a) + bin.y * Math.sin(a);
      const dz = nrm.z * Math.cos(a) + bin.z * Math.sin(a);
      const r = style.radius(t, a);
      positions.push(point.x + dx * r, point.y + dy * r, point.z + dz * r);
      normals.push(dx, dy, dz);
      ts.push(t);
      angles.push(a);
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j;
      const b = i * radial + ((j + 1) % radial);
      const c = (i + 1) * radial + j;
      const d = (i + 1) * radial + ((j + 1) % radial);
      index.push(a, b, c, b, d, c);
    }
  }
  const count = ts.length;
  const colors = new Float32Array(count * 3);
  const sway = new Float32Array(count);
  const c = new THREE.Color();
  const p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    p.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    sway[i] = style.paint(ts[i], angles[i], p, c);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.setAttribute("aSway", new THREE.BufferAttribute(sway, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(new Float32Array(count).fill(phase), 1));
  g.setIndex(index);
  // Winding al final: `fixWinding` intercambia TODOS los atributos, color
  // incluido, y devuelve no indexada.
  return fixWinding(g);
}
