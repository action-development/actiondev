import * as THREE from "three";
import type { DecorSpec } from "../plaza-config";
import { keyLightDirection } from "../lighting-rig";
import { PLAZA_PALETTES } from "../plaza-mode";
import { getLightPoolTexture } from "../plaza-textures";
import {
  LAYER_ORDER,
  LAYER_Y,
  discMatrix,
  discPiece,
  putContact,
  type ContactSpec,
  type DecorCtx,
  type PlaceCtx,
  type PutFn,
  type SurfaceDef,
} from "./decor-kit";
import { getCanopyShadowTexture } from "./vegetation-shadow";
import { buildPalm } from "./vegetation-palm";
import { buildParterres } from "./vegetation-parterre";
import { VEGETATION_PALETTES } from "./vegetation-palette";
import { buildPlanterHedge, buildTree } from "./vegetation-tree";
import { createWind } from "./vegetation-wind";

/**
 * Vegetación de la plaza: setos en jardinera, arbolado, palmeras y los
 * parterres del jardín francés. Este archivo solo COLOCA y declara materiales;
 * la forma de cada planta vive en `vegetation-tree|palm|parterre.ts`.
 *
 * Sacos que posee (todos con prefijo `veg` para no chocar con el `wood` del
 * banco ni con otros módulos):
 * - `vegFoliage`  copas, frondas, setos, boj y flores: UN material con color por
 *   vértice y viento (era leaf/leafDark/crown/crownDark: cuatro draw calls y
 *   cuatro pases de sombra).
 * - `vegWood`     troncos y estípites (era bark/palm).
 * - `vegShadow`   sombras falsas de lo que cae fuera del frustum del sol.
 * - `soil`        alcorque.
 *
 * Todo con `flatShading: false` y color por vértice: el albedo se hornea en la
 * geometría, no en el material, así que la paleta cambia por modo sin
 * materiales extra.
 */

/** Sombra de contacto de las piezas de este módulo. */
const CONTACT: Record<"hedge" | "tree" | "palm", ContactSpec> = {
  hedge: { rx: 0.62, rz: 0.37 },
  tree: { rx: 0.95, rz: 0.71 },
  palm: { rx: 0.7, rz: 0.52 },
};

/** Radio de las copas para su sombra falsa y su altura media sobre el suelo
 * (en unidades locales; luego manda la escala de la pieza). */
const FAKE_SHADOW = {
  tree: { radius: 1.45, height: 2.5 },
  palm: { radius: 1.35, height: 3.6 },
} as const;

/**
 * Sombra falsa: elipse tumbada, desplazada en sentido contrario al sol y
 * alargada en esa dirección. El sol real solo proyecta dentro de su frustum
 * (`SUN.extent`), y el arbolado (r 16,8) y las palmeras (r 14,6) quedan fuera:
 * sin esto flotan sin sombra sobre la pradera.
 */
function putFakeShadow(put: PutFn, ctx: PlaceCtx, kind: "tree" | "palm"): void {
  // De noche la luna no proyecta (`castShadow: false`): solo cuentan los discos
  // de contacto. Y la dirección sale del rig de luz, no de una copia.
  if (!PLAZA_PALETTES[ctx.mode].light.key.castShadow) return;
  const { x: sx, y: sy, z: sz } = keyLightDirection(ctx.mode);
  const scale = new THREE.Vector3();
  const centre = new THREE.Vector3();
  ctx.base.decompose(centre, new THREE.Quaternion(), scale);
  const spec = FAKE_SHADOW[kind];
  const height = spec.height * scale.y;
  const ground = new THREE.Vector3(-sx / sy, 0, -sz / sy);
  const reach = ground.length();
  const dir = ground.clone().normalize();
  const radius = spec.radius * scale.x;
  // Un sol a 46° alarga la silueta 1/sin(elev) = √(1+cot²) sobre el suelo.
  const along = radius * Math.sqrt(1 + reach * reach);
  const across = radius * 0.92;
  const matrix = new THREE.Matrix4().compose(
    new THREE.Vector3(centre.x + ground.x * height, LAYER_Y.shadow + 0.002, centre.z + ground.z * height),
    // Tumbada (Rx −90°) y girada en Y hacia la dirección de la sombra.
    new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(0, Math.atan2(dir.x, dir.z), 0))
      .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))),
    new THREE.Vector3(across, along, 1),
  );
  put("vegShadow", discPiece(ctx), matrix);
}

/**
 * Coloca la vegetación de `spec` (seto verde, árbol, palmera). Ignora el resto
 * de tipos: el orquestador llama a todos los placers con todas las piezas. La
 * jardinera de piedra del seto es de `furniture.ts`.
 */
export function placeVegetation(spec: DecorSpec, put: PutFn, ctx: PlaceCtx): void {
  const { base } = ctx;
  switch (spec.kind) {
    case "hedge":
      put("vegFoliage", ctx.piece(`vegetation:hedge:${spec.seed}`, () => buildPlanterHedge(spec.seed, ctx.mode)), base);
      putContact(put, ctx, CONTACT.hedge);
      break;
    case "palm": {
      const palm = buildPalm(spec.seed, ctx.mode);
      put("soil", discPiece(ctx), discMatrix(base, LAYER_Y.pool, 0.95, 0.95));
      put("vegWood", palm.wood, base);
      put("vegFoliage", palm.foliage, base);
      palm.wood.dispose();
      palm.foliage.dispose();
      putContact(put, ctx, CONTACT.palm);
      putFakeShadow(put, ctx, "palm");
      break;
    }
    case "tree": {
      const tree = buildTree(spec.seed, ctx.mode);
      // Alcorque: fuera del pavimento el suelo es casi negro y la sombra de
      // contacto no se ve, así que el árbol flotaba. Esta mancha de tierra
      // le da asiento.
      put("soil", discPiece(ctx), discMatrix(base, LAYER_Y.pool, 1.15, 1.15));
      put("vegWood", tree.wood, base);
      put("vegFoliage", tree.foliage, base);
      tree.wood.dispose();
      tree.foliage.dispose();
      putContact(put, ctx, CONTACT.tree);
      putFakeShadow(put, ctx, "tree");
      break;
    }
  }
}

/** Piezas únicas en coordenadas de MUNDO (no se repiten por `DecorSpec`): se
 * llama una vez, después de recorrer el layout. */
export function placeParterres(put: PutFn, ctx: DecorCtx): void {
  const parterres = buildParterres(ctx.mode);
  put("vegFoliage", parterres, new THREE.Matrix4());
  parterres.dispose();
}

/** Superficies de la vegetación: material y banderas de render de cada saco. */
export function vegetationSurfaces({ mode, frozen }: DecorCtx): SurfaceDef[] {
  const palette = PLAZA_PALETTES[mode];
  const veg = VEGETATION_PALETTES[mode];
  const wind = createWind(frozen);
  const solid = { castShadow: true, receiveShadow: true } as const;
  return [
    {
      kind: "mesh",
      sack: "vegFoliage",
      material: wind.foliage,
      customDepthMaterial: wind.depth,
      ...solid,
    },
    {
      kind: "mesh",
      sack: "vegWood",
      material: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }),
      ...solid,
    },
    // Sombras falsas: mismo recurso que la sombra de contacto, pero con la
    // opacidad de una sombra de sol sobre el césped.
    {
      kind: "mesh",
      sack: "vegShadow",
      renderOrder: LAYER_ORDER.shadow,
      material: new THREE.MeshBasicMaterial({
        map: getCanopyShadowTexture(),
        color: "#000000",
        transparent: true,
        opacity: palette.sunShadow.ground,
        depthWrite: false,
      }),
    },
    // Tierra del alcorque. Capa plana del suelo: truco de pintura, no volumen,
    // así que no entra en el shadow map. Color por modo (antes #2a2620 fijo:
    // de día era una mancha sucia sobre el césped claro).
    {
      kind: "mesh",
      sack: "soil",
      renderOrder: LAYER_ORDER.pool,
      material: new THREE.MeshBasicMaterial({
        map: getLightPoolTexture(),
        color: veg.soil,
        transparent: true,
        opacity: veg.soilOpacity,
        depthWrite: false,
        toneMapped: false,
      }),
    },
  ];
}
