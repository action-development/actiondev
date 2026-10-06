import * as THREE from "three";
import { FOUNTAIN_SEG } from "./fountain-config";

/**
 * Torno propio para la fuente.
 *
 * `THREE.LatheGeometry` no vale aquí por tres motivos:
 * 1. Calcula las normales ANTES de que se deforme el perfil, y los gallones
 *    del borde (`r·(1 + 0.035·cos 12θ)`) se verían planos.
 * 2. Duplica la costura en φ = 0 con normales distintas: una línea visible.
 * 3. Suaviza todo el perfil: una moldura sin aristas vivas parece de plástico.
 *
 * Aquí el perfil se parte en TRAMOS en cada punto marcado `h` (arista viva).
 * Cada tramo es una malla de (seg+1) × n vértices con las normales sacadas de
 * diferencias finitas sobre la malla ya deformada (periódicas en φ, a un lado
 * en los extremos del tramo): suaves dentro del tramo, vivas entre tramos.
 */

export interface ProfilePoint {
  r: number;
  y: number;
  /** Arista viva: el tramo se corta aquí. */
  h?: boolean;
}

export interface LatheOptions {
  seg?: number;
  /** Multiplicador del radio según (r, y, φ). φ medido desde +Z hacia +X. */
  disp?: (r: number, y: number, phi: number) => number;
  /** Color por vértice (AO, mojado...). */
  shade?: (pos: THREE.Vector3, normal: THREE.Vector3) => [number, number, number];
  /** Añade `uv` (u = vuelta, v = a lo largo del perfil) y `aKind` constante. */
  uv?: boolean;
  kind?: number;
}

const p = (r: number, y: number, h = false): ProfilePoint => ({ r, y, h });
export { p as pt };

/** Puntos de un cuarto de elipse (o arco) de centro (cx, cy) y semiejes a, b. */
export function arcPoints(
  cx: number,
  cy: number,
  a: number,
  b: number,
  from: number,
  to: number,
  n: number,
): ProfilePoint[] {
  const out: ProfilePoint[] = [];
  for (let i = 0; i <= n; i++) {
    const t = from + ((to - from) * i) / n;
    out.push({ r: cx + a * Math.cos(t), y: cy + b * Math.sin(t) });
  }
  return out;
}

/** Quita puntos consecutivos repetidos conservando la marca `h`. */
function dedupe(points: ProfilePoint[]): ProfilePoint[] {
  const out: ProfilePoint[] = [];
  for (const q of points) {
    const last = out[out.length - 1];
    if (last && Math.hypot(last.r - q.r, last.y - q.y) < 1e-6) {
      if (q.h) last.h = true;
      continue;
    }
    out.push({ ...q });
  }
  return out;
}

/** Parte el perfil en tramos continuos (los puntos `h` pertenecen a los dos). */
function splitRuns(points: ProfilePoint[]): ProfilePoint[][] {
  const runs: ProfilePoint[][] = [];
  let cur: ProfilePoint[] = [];
  points.forEach((q, i) => {
    cur.push(q);
    if (q.h && i > 0 && i < points.length - 1) {
      runs.push(cur);
      cur = [q];
    }
  });
  if (cur.length > 1) runs.push(cur);
  return runs.filter((r) => r.length > 1);
}

function latheRun(run: ProfilePoint[], opts: LatheOptions): THREE.BufferGeometry {
  const seg = opts.seg ?? FOUNTAIN_SEG;
  const cols = seg + 1;
  const n = run.length;
  const count = cols * n;
  const pos = new Float32Array(count * 3);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < cols; i++) {
      const phi = ((i % seg) / seg) * Math.PI * 2;
      const r = run[j].r * (opts.disp ? opts.disp(run[j].r, run[j].y, phi) : 1);
      const k = (j * cols + i) * 3;
      pos[k] = r * Math.sin(phi);
      pos[k + 1] = run[j].y;
      pos[k + 2] = r * Math.cos(phi);
    }
  }

  const at = (i: number, j: number, out: THREE.Vector3) => {
    const k = (j * cols + (((i % seg) + seg) % seg)) * 3;
    return out.set(pos[k], pos[k + 1], pos[k + 2]);
  };
  const normals = new Float32Array(count * 3);
  const colors = opts.shade ? new Float32Array(count * 3) : null;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const dPhi = new THREE.Vector3();
  const dS = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  const here = new THREE.Vector3();
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < cols; i++) {
      dPhi.copy(at(i + 1, j, a)).sub(at(i - 1, j, b));
      dS.copy(at(i, Math.min(j + 1, n - 1), a)).sub(at(i, Math.max(j - 1, 0), b));
      nrm.crossVectors(dPhi, dS);
      if (nrm.lengthSq() < 1e-12) {
        // Polo (r = 0): la normal sale del perfil 2D, (dy, -dr).
        const j0 = Math.max(j - 1, 0);
        const j1 = Math.min(j + 1, n - 1);
        const dr = run[j1].r - run[j0].r;
        const dy = run[j1].y - run[j0].y;
        const l = Math.hypot(dr, dy) || 1;
        const phi = ((i % seg) / seg) * Math.PI * 2;
        const nr = dy / l;
        nrm.set(nr * Math.sin(phi), -dr / l, nr * Math.cos(phi));
      }
      nrm.normalize();
      const k = (j * cols + i) * 3;
      normals[k] = nrm.x;
      normals[k + 1] = nrm.y;
      normals[k + 2] = nrm.z;
      if (colors) {
        const c = opts.shade!(at(i, j, here), nrm);
        colors[k] = c[0];
        colors[k + 1] = c[1];
        colors[k + 2] = c[2];
      }
    }
  }

  const index: number[] = [];
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < seg; i++) {
      const p00 = j * cols + i;
      const p10 = p00 + 1;
      const p01 = p00 + cols;
      const p11 = p01 + 1;
      index.push(p00, p10, p11, p00, p11, p01);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  if (colors) g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  if (opts.uv) {
    const uv = new Float32Array(count * 2);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < cols; i++) {
        uv[(j * cols + i) * 2] = i / seg;
        uv[(j * cols + i) * 2 + 1] = n > 1 ? j / (n - 1) : 0;
      }
    }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    g.setAttribute("aKind", new THREE.BufferAttribute(new Float32Array(count).fill(opts.kind ?? 0), 1));
  }
  g.setIndex(index);
  return g;
}

/** Revoluciona un perfil entero → un tramo por arista viva. */
export function latheProfile(profile: ProfilePoint[], opts: LatheOptions = {}): THREE.BufferGeometry[] {
  return splitRuns(dedupe(profile)).map((run) => latheRun(run, opts));
}
