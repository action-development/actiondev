import * as THREE from "three";
import { buildDecorLayout } from "./furniture-layout";
import { merge, type DecorCtx, type PlaceCtx, type PutFn } from "./decor-kit";
import { placeFurniture } from "./furniture";
import { placeParterres, placeVegetation } from "./vegetation";

/**
 * Construye TODO el mobiliario estático: cada pieza del layout (`buildDecor`)
 * se clona, se lleva a su sitio en el mundo y se acumula en el saco de su
 * material; al final, un `merge` por saco.
 *
 * Este archivo NO conoce los sacos ni los materiales: cada módulo (`furniture`,
 * `vegetation`) hace `put("saco", …)` por su cuenta. Función pura (sin React ni
 * materiales) para poder medirla desde un test.
 */
export function buildDecorSacks(ctx: DecorCtx): {
  sacks: Record<string, THREE.BufferGeometry>;
  anchors: Record<string, THREE.Vector3[]>;
} {
  const buckets = new Map<string, THREE.BufferGeometry[]>();
  const put: PutFn = (sack, geometry, matrix) => {
    const copy = geometry.clone().applyMatrix4(matrix);
    const bucket = buckets.get(sack);
    if (bucket) bucket.push(copy);
    else buckets.set(sack, [copy]);
  };

  const pieces = new Map<string, THREE.BufferGeometry>();
  const piece: PlaceCtx["piece"] = (key, make) => {
    let g = pieces.get(key);
    if (!g) {
      g = make();
      pieces.set(key, g);
    }
    return g;
  };

  const anchors: Record<string, THREE.Vector3[]> = {};
  const anchor: PlaceCtx["anchor"] = (name, position) => {
    (anchors[name] ??= []).push(position);
  };

  for (const spec of buildDecorLayout()) {
    const base = new THREE.Matrix4().compose(
      new THREE.Vector3(spec.pos[0], 0, spec.pos[1]),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, spec.rotation, 0)),
      new THREE.Vector3(spec.scale, spec.scale, spec.scale),
    );
    const placeCtx: PlaceCtx = { ...ctx, base, piece, anchor };
    placeFurniture(spec, put, placeCtx);
    placeVegetation(spec, put, placeCtx);
  }

  // Parterres: trazado continuo en coordenadas de mundo, no una pieza repetida.
  placeParterres(put, ctx);

  pieces.forEach((g) => g.dispose());

  const sacks: Record<string, THREE.BufferGeometry> = {};
  for (const [name, parts] of buckets) sacks[name] = merge(parts, name);
  return { sacks, anchors };
}
