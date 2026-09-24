import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/**
 * Geometrías de la calle: trenzas, copas, UV planares en metros y fusión.
 */

/**
 * Tronco trenzado de los ficus: tres hebras en hélice alrededor del eje, cada
 * una desfasada un tercio de vuelta. Es lo que los delata como los de la foto
 * y no como un árbol genérico.
 */
export function braidedTrunk(height: number, radius: number, turns: number): THREE.BufferGeometry[] {
  const strands: THREE.BufferGeometry[] = [];
  for (let s = 0; s < 3; s++) {
    const phase = (s / 3) * Math.PI * 2;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const a = phase + t * turns * Math.PI * 2;
      // La trenza se cierra arriba: las hebras se juntan bajo la copa.
      const r = radius * (1 - t * 0.55);
      points.push(new THREE.Vector3(Math.cos(a) * r, t * height, Math.sin(a) * r));
    }
    strands.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.022, 5, false));
  }
  return strands;
}

/**
 * Copa de hoja recortada: esfera con la superficie abollada por ruido, con
 * normales suaves. Un icosaedro facetado se leía como un caramelo de plástico;
 * así se lee como un seto podado en bola, que es lo que hay en la foto.
 * Devuelve geometría NO indexada, lista para fusionar.
 */
export function leafBall(radius: number, seed: number, squash = 1): THREE.BufferGeometry {
  // Sin UV ni normales antes de soldar: con ellas, los vértices de la costura
  // del mapeado no se unen y la copa sale con una raya de sombreado. Las copas
  // solo se fusionan con otras copas, así que la falta de UV no molesta.
  const ico = new THREE.IcosahedronGeometry(radius, 4);
  ico.deleteAttribute("uv");
  ico.deleteAttribute("normal");
  const base = mergeVertices(ico);
  ico.dispose();
  const pos = base.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    // Tres octavas de senos cruzados: barato, determinista y sin costuras.
    const bump =
      0.09 * Math.sin(n.x * 7 + seed) * Math.sin(n.y * 6 - seed * 0.7) +
      0.05 * Math.sin(n.z * 13 + seed * 1.3) * Math.cos(n.x * 11) +
      0.03 * Math.sin((n.x + n.y + n.z) * 23 + seed);
    v.copy(n).multiplyScalar(radius * (1 + bump));
    v.y *= squash;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  base.computeVertexNormals();
  const flat = base.toNonIndexed();
  base.dispose();
  return flat;
}

/**
 * UV planares en coordenadas de MUNDO, cara a cara según su normal: las que
 * miran a ±z toman (x, y), las que miran a ±x toman (z, y) y las de arriba y
 * abajo (x, z). Se aplica a piezas ya colocadas (y fusionadas): así la junta
 * de la sillería sigue de un machón al siguiente y dobla hacia dentro de la
 * jamba, en vez de empezar de cero en cada caja.
 */
export function planarUV(geo: THREE.BufferGeometry, tile: number): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (!g.attributes.normal) g.computeVertexNormals();
  const pos = g.attributes.position as THREE.BufferAttribute;
  const nor = g.attributes.normal as THREE.BufferAttribute;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    const az = Math.abs(nor.getZ(i));
    let u: number;
    let v: number;
    if (az >= ax && az >= ay) {
      u = pos.getX(i);
      v = pos.getY(i);
    } else if (ax >= ay) {
      u = pos.getZ(i);
      v = pos.getY(i);
    } else {
      u = pos.getX(i);
      v = pos.getZ(i);
    }
    uv[i * 2] = u / tile;
    uv[i * 2 + 1] = v / tile;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  if (g !== geo) geo.dispose();
  return g;
}

/**
 * Fusiona piezas (normalizadas a no indexadas: `mergeGeometries` no mezcla
 * indexadas con no indexadas, ver PlazaDecor) y libera las sueltas.
 */
export function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const flat = parts.map((p) => (p.index ? p.toNonIndexed() : p));
  const merged = mergeGeometries(flat, false) ?? new THREE.BufferGeometry();
  for (const p of parts) p.dispose();
  for (const p of flat) p.dispose();
  return merged;
}

/** Caja colocada por sus límites (más legible que tamaño + centro). */
export function boxBetween(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number
): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return g;
}

/**
 * Caja de cantos redondeados colocada por su centro. Es lo que separa un
 * objeto de producto de un bloque de juguete: ningún objeto fabricado tiene
 * aristas vivas, y el brillo del entorno solo se ve en un canto curvo.
 */
export function roundedBox(
  w: number,
  h: number,
  d: number,
  r: number,
  at: [number, number, number] = [0, 0, 0]
): THREE.BufferGeometry {
  const radius = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
  return new RoundedBoxGeometry(w, h, d, 3, radius).translate(...at);
}

/** Plano `w × h` que muestra solo el recorte [u0, u1] × [v0, v1] de un atlas. */
export function atlasPlane(w: number, h: number, u0: number, v0: number, u1: number, v1: number): THREE.PlaneGeometry {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  }
  return g;
}
