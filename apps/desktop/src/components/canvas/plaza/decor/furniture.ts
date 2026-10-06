import * as THREE from "three";
import { PLAZA_DECOR_PALETTE, type DecorSpec } from "../plaza-config";
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
import {
  BENCH_HALF_WIDTH,
  LAMP_LIGHT_Y,
  buildBenchMetal,
  buildBenchWood,
  buildBin,
  buildLampCore,
  buildLampGlass,
  buildLampGlassLit,
  buildLampMetal,
  buildPlanter,
} from "./furniture-geometry";
export { LAMP_LIGHT_Y };
import { getGlassSkyTexture, getLampHaloTexture, getWoodTexture } from "./furniture-textures";

/**
 * Mobiliario urbano de la plaza: farolas (herrería, vidrio, núcleo, halo y
 * charco de luz), bancos, papeleras y la jardinera de piedra del seto.
 *
 * Sacos que posee: `metal`, `wood`, `stone`, `bulb`, `bulbCore`, `pool` y los
 * halos (anclaje `halo`). La geometría vive en `furniture-geometry.ts`, las
 * texturas en `furniture-textures.ts` y el filtro de colocación respecto a la
 * cámara en `furniture-layout.ts`. Todo estático y fusionado por saco — ver
 * `decor-build.ts`.
 */

/** Radio del charco de luz que la farola proyecta en el suelo. */
const LIGHT_POOL_RADIUS = 3.3;

/** Sombra de contacto de las piezas de este módulo. El banco lleva una por pie
 * (una elipse única bajo un mueble abierto no era contacto: era una mancha). */
const CONTACT: Record<"lamp" | "bin", ContactSpec> = {
  lamp: { rx: 0.42, rz: 0.42 },
  bin: { rx: 0.3, rz: 0.3 },
};
const BENCH_FOOT: ContactSpec = { rx: 0.1, rz: 0.36, z: -0.03 };

/**
 * Coloca las piezas de mobiliario de `spec` (farola, banco, papelera y la
 * jardinera del seto). Ignora el resto de tipos: el orquestador llama a todos
 * los placers con todas las piezas.
 */
export function placeFurniture(spec: DecorSpec, put: PutFn, ctx: PlaceCtx): void {
  const { base } = ctx;
  switch (spec.kind) {
    case "lamp":
      put("metal", ctx.piece("furniture:lamp", buildLampMetal), base);
      // El vidrio se construye según el modo: encendido lleva degradado de
      // vértice; apagado, la UV del reflejo de cielo.
      if (ctx.mode === "noche") put("bulb", ctx.piece("furniture:lampGlassLit", buildLampGlassLit), base);
      else put("bulb", ctx.piece("furniture:lampGlass", buildLampGlass), base);
      if (PLAZA_PALETTES[ctx.mode].lampsOn) put("bulbCore", ctx.piece("furniture:lampCore", buildLampCore), base);
      // Charco de luz: lo que de verdad ancla la farola al suelo. Sin él, el
      // halo flota y el poste parece pegado sobre el fondo.
      put("pool", discPiece(ctx), discMatrix(base, LAYER_Y.pool, LIGHT_POOL_RADIUS, LIGHT_POOL_RADIUS));
      ctx.anchor("halo", new THREE.Vector3(spec.pos[0], LAMP_LIGHT_Y * spec.scale, spec.pos[1]));
      putContact(put, ctx, CONTACT.lamp);
      break;
    case "bench":
      put("wood", ctx.piece("furniture:benchWood", buildBenchWood), base);
      put("metal", ctx.piece("furniture:benchMetal", buildBenchMetal), base);
      for (const x of [-BENCH_HALF_WIDTH, BENCH_HALF_WIDTH]) {
        const foot = new THREE.Matrix4().multiplyMatrices(base, new THREE.Matrix4().makeTranslation(x, 0, 0));
        put("shadow", discPiece(ctx), discMatrix(foot, LAYER_Y.shadow, BENCH_FOOT.rx, BENCH_FOOT.rz, BENCH_FOOT.z ?? 0));
      }
      break;
    case "bin":
      put("metal", ctx.piece("furniture:bin", buildBin), base);
      putContact(put, ctx, CONTACT.bin);
      break;
    case "hedge":
      // Solo la jardinera de piedra; el seto verde y su sombra de contacto son
      // de `vegetation.ts`.
      put("stone", ctx.piece("furniture:planter", buildPlanter), base);
      break;
  }
}

/** Superficies del mobiliario: material y banderas de render de cada saco. */
export function furnitureSurfaces({ mode }: DecorCtx): SurfaceDef[] {
  const palette = PLAZA_PALETTES[mode];

  // El color de vértice lleva la AO horneada (pie, bajos, interior).
  const metal = new THREE.MeshStandardMaterial({
    color: PLAZA_DECOR_PALETTE.metal,
    // Hay IBL (contrato de luz): el hierro refleja cielo arriba y piedra abajo.
    roughness: 0.5,
    metalness: 0.5,
    vertexColors: true,
  });
  const wood = new THREE.MeshStandardMaterial({
    color: PLAZA_DECOR_PALETTE.wood,
    map: getWoodTexture(),
    roughness: 0.78,
    metalness: 0,
    vertexColors: true,
  });
  const stone = new THREE.MeshStandardMaterial({ color: palette.stone, roughness: 0.82, metalness: 0, vertexColors: true });

  return [
    // `castShadow` + `receiveShadow` en todo lo que es materia sólida: como el
    // mobiliario está FUSIONADO por material, cada bandera cuesta un único paso
    // extra por el shadow map, no uno por farola.
    { kind: "mesh", sack: "metal", material: metal, castShadow: true, receiveShadow: true },
    { kind: "mesh", sack: "wood", material: wood, castShadow: true, receiveShadow: true },
    { kind: "mesh", sack: "stone", material: stone, castShadow: true, receiveShadow: true },
    // Vidrio del farol: fuera del shadow map a propósito (es la fuente de luz).
    // ENCENDIDO: envoltura translúcida con degradado de vértice (más clara al
    // centro) sin tone mapping, y el núcleo opaco en blanco puro aparte. Lo
    // que satura a blanco es el núcleo; el vidrio es el color de la luz.
    // APAGADO (de día): vidrio OPACO oscuro con falso reflejo de cielo — no
    // entra en la ordenación de transparentes y no se ve lechoso.
    {
      kind: "mesh",
      sack: "bulb",
      material: palette.lampsOn
        ? new THREE.MeshBasicMaterial({
            color: PLAZA_DECOR_PALETTE.glow,
            vertexColors: true,
            toneMapped: false,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
          })
        : new THREE.MeshBasicMaterial({ map: getGlassSkyTexture(), color: "#ffffff" }),
      renderOrder: palette.lampsOn ? LAYER_ORDER.shadow + 1 : undefined,
    },
    {
      kind: "mesh",
      sack: "bulbCore",
      enabled: palette.lampsOn,
      material: new THREE.MeshBasicMaterial({ color: "#fffdf0", toneMapped: false }),
    },
    // Charco y halo: aditivos sobre textura radial. Glow barato sin luces
    // reales — seis `pointLight` costarían un recálculo por fragmento en toda
    // la escena. Solo con las farolas encendidas.
    {
      kind: "mesh",
      sack: "pool",
      renderOrder: LAYER_ORDER.pool,
      enabled: palette.lampsOn,
      material: new THREE.MeshBasicMaterial({
        map: getLightPoolTexture(),
        color: PLAZA_DECOR_PALETTE.glow,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        fog: false,
      }),
    },
    {
      kind: "sprites",
      anchor: "halo",
      scale: [3, 3, 1],
      enabled: palette.lampsOn,
      material: new THREE.SpriteMaterial({
        map: getLampHaloTexture(),
        color: PLAZA_DECOR_PALETTE.glow,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    },
  ];
}
