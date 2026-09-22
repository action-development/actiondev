"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { PLAZA_DECOR_PALETTE, buildDecor } from "./plaza-config";
import { PLAZA_PALETTES, type PlazaMode } from "./plaza-mode";
import { getGlowTexture, getLightPoolTexture } from "./plaza-textures";

/**
 * Mobiliario de la plaza: farolas, bancos, papeleras, setos y arbolado.
 *
 * Todo geometría primitiva — cero assets remotos, misma regla dura que el
 * resto de `plaza/`. Layout fijo y determinista (`buildDecor`): en anillos
 * regulares y mirando al centro, no esparcido como los muñecos.
 *
 * TODO EL MOBILIARIO SE FUSIONA EN UNA GEOMETRÍA POR MATERIAL, ya colocado en
 * coordenadas de mundo (`buildFurniture`). Montado pieza a pieza eran ~145
 * draw calls (una farola sola son cinco) sobre los ~280 que ya cuestan los
 * muñecos; fusionado son doce. Se puede porque el mobiliario es ESTÁTICO: no
 * se anima, no se selecciona y no cambia en toda la vida de la página. Si
 * algún día una pieza tiene que moverse, sale de aquí y se monta suelta.
 *
 * Lo único que queda suelto son los halos de las farolas, que son sprites
 * (billboard) y no se pueden fusionar.
 *
 * Sin interactividad: no lleva handlers de puntero, así que el "suelo
 * invisible" de `PlazaWorld` (cierra la ficha al hacer click fuera de un
 * muñeco) sigue recibiendo el evento por detrás sin `stopPropagation`.
 */

/** Altura del farol (centro del vidrio). ~4 m a escala de la plaza: el muñeco
 * mide 1 unidad ≈ 1,6 m. */
const LAMP_LIGHT_Y = 2.52;
/** Radio del charco de luz que la farola proyecta en el suelo. */
const LIGHT_POOL_RADIUS = 3.3;

/**
 * Alturas de las capas que se pintan sobre el suelo. Todas transparentes y sin
 * escribir en el z-buffer, así que el orden lo fija `renderOrder`, no la Y: la
 * separación es solo para que el depth test no las descarte contra el suelo.
 * Ver `PlazaRoom` para el pavimento (-2) y la retícula guía (-1).
 */
const LAYER_Y = { pool: 0.006, shadow: 0.012 } as const;
const LAYER_ORDER = { pool: 1, shadow: 2 } as const;

/** Une varias geometrías ya colocadas en el espacio local de la pieza y libera
 * las originales: a partir de aquí solo vive la fusionada. */
function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  // Todas SIN índice antes de fusionar: `mergeGeometries` se niega a mezclar
  // indexadas con no indexadas, y las primitivas de three no se ponen de
  // acuerdo (esfera, toro y cono vienen indexados; el icosaedro, no). Convertir
  // sale más caro en vértices que en dolores de cabeza, y esto es geometría
  // estática que se construye una sola vez.
  const flat = parts.map((p) => (p.index ? p.toNonIndexed() : p));
  const merged = mergeGeometries(flat, false);
  flat.forEach((p, i) => {
    if (p !== parts[i]) p.dispose();
  });
  parts.forEach((p) => p.dispose());
  // `mergeGeometries` devuelve null si los atributos no casan; ya normalizados,
  // todas comparten el mismo set (position/normal/uv).
  return merged ?? new THREE.BufferGeometry();
}

/** Caja colocada: azúcar para no repetir `translate` en cada pieza. */
function box(
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  tiltX = 0,
): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  if (tiltX) g.rotateX(tiltX);
  g.translate(x, y, z);
  return g;
}

/**
 * Farola: basa escalonada, fuste con anillos y farol de cuatro caras con
 * capucha y remate. Toda la herrería en una geometría; el vidrio va aparte
 * (`buildLampGlassGeometry`) porque es lo único que emite.
 *
 * Un tubo recto con un cono encima se leía como palo de escoba con sombrero.
 * Lo que convierte un poste en mobiliario urbano son los quiebros: basa ancha,
 * fuste con entasis (más grueso abajo), anillos que marcan el arranque y el
 * remate, y un cuerpo de farol con proporción de caja, no de bombilla.
 */
function buildLampGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const stack = (rTop: number, rBottom: number, h: number, y: number, seg = 14) => {
    const g = new THREE.CylinderGeometry(rTop, rBottom, h, seg);
    g.translate(0, y + h / 2, 0);
    parts.push(g);
  };

  // Basa escalonada.
  stack(0.155, 0.2, 0.09, 0);
  stack(0.115, 0.155, 0.13, 0.09);
  // Fuste con entasis + anillo de arranque y de remate.
  stack(0.052, 0.082, 2.0, 0.22);
  stack(0.088, 0.088, 0.05, 0.4);
  stack(0.085, 0.085, 0.045, 2.14);
  // Cuello de transición al farol.
  stack(0.115, 0.07, 0.1, 2.185);

  // Farol: prisma de cuatro caras (marco inferior, marco superior, capucha).
  stack(0.19, 0.21, 0.045, 2.285, 4);
  stack(0.215, 0.185, 0.04, 2.74, 4);
  const hood = new THREE.CylinderGeometry(0.02, 0.235, 0.26, 4);
  hood.translate(0, 2.91, 0);
  parts.push(hood);
  const finial = new THREE.SphereGeometry(0.05, 10, 8);
  finial.translate(0, 3.07, 0);
  parts.push(finial);
  // Los cuatro montantes del farol, en las esquinas del prisma.
  for (const i of [0, 1, 2, 3]) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const post = new THREE.BoxGeometry(0.028, 0.42, 0.028);
    post.translate(Math.cos(a) * 0.145, 2.52, Math.sin(a) * 0.145);
    parts.push(post);
  }

  const merged = merge(parts);
  // El prisma nace con una arista de frente; girado 45° presenta una CARA al
  // frente, que es como se ve un farol de plaza desde la calle.
  merged.rotateY(Math.PI / 4);
  return merged;
}

/** Vidrio del farol: el prisma interior, lo único que emite luz. */
function buildLampGlassGeometry(): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(0.155, 0.185, 0.43, 4);
  g.translate(0, LAMP_LIGHT_Y, 0);
  g.rotateY(Math.PI / 4);
  return g;
}

/** Medidas del banco. Mira a +Z: el respaldo queda en -Z y `buildDecor` lo
 * gira para que dé la espalda al perímetro. */
const BENCH = {
  halfWidth: 0.62,
  seatY: 0.4,
  /** Listones del asiento: z del centro de cada uno. */
  seatSlats: [-0.19, -0.06, 0.07, 0.2],
  backTilt: -0.17,
  /** Listones del respaldo: [y, z]. */
  backSlats: [
    [0.56, -0.27],
    [0.68, -0.29],
    [0.79, -0.31],
  ],
  armY: 0.63,
} as const;

/** Banco: listones de asiento y respaldo (madera). */
function buildBenchWoodGeometry(): THREE.BufferGeometry {
  const w = BENCH.halfWidth * 2 - 0.16;
  const slats: THREE.BufferGeometry[] = [];
  for (const z of BENCH.seatSlats) slats.push(box(w, 0.05, 0.1, 0, BENCH.seatY, z));
  for (const [y, z] of BENCH.backSlats) slats.push(box(w, 0.095, 0.045, 0, y, z, BENCH.backTilt));
  return merge(slats);
}

/**
 * Banco: los dos costados de hierro fundido, con travesaño, brazo y pie.
 *
 * El costado es lo que da carácter a un banco de plaza: pata delantera corta,
 * trasera larga que sube a sostener el respaldo, y un brazo que las une por
 * arriba. Sin el brazo, los listones flotaban sobre dos palos.
 */
function buildBenchMetalGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (const x of [-BENCH.halfWidth, BENCH.halfWidth]) {
    // Pie, pata delantera y pata trasera (esta sigue la inclinación del
    // respaldo y llega hasta el listón más alto).
    parts.push(box(0.1, 0.05, 0.62, x, 0.025, -0.04));
    parts.push(box(0.055, 0.4, 0.06, x, 0.2, 0.2));
    parts.push(box(0.055, 0.84, 0.065, x, 0.42, -0.27, BENCH.backTilt));
    // Brazo + montante que lo sostiene por delante.
    parts.push(box(0.07, 0.055, 0.56, x, BENCH.armY, -0.02));
    parts.push(box(0.055, 0.24, 0.06, x, 0.51, 0.22));
    // Remate delantero del brazo, redondeado.
    const knob = new THREE.SphereGeometry(0.045, 12, 10);
    knob.scale(0.8, 1, 1.2);
    knob.translate(x, BENCH.armY + 0.01, 0.26);
    parts.push(knob);
  }
  return merge(parts);
}

/**
 * Papelera: cesto de listones verticales con aro de boca y pie. Los listones
 * son lo que la separa de un cubo: dejan ver el hueco y le dan escala.
 */
function buildBinGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const ring = (r: number, h: number, y: number) => {
    const g = new THREE.CylinderGeometry(r, r, h, 16, 1, true);
    g.translate(0, y, 0);
    parts.push(g);
  };
  // Aro de boca y aro de base (abiertos: se ve el interior del cesto).
  ring(0.2, 0.05, 0.6);
  ring(0.17, 0.04, 0.17);
  // Fondo del cesto.
  const bottom = new THREE.CylinderGeometry(0.17, 0.17, 0.03, 16);
  bottom.translate(0, 0.19, 0);
  parts.push(bottom);
  // Listones verticales, ligeramente cónicos como el cesto.
  const SLATS = 12;
  for (let i = 0; i < SLATS; i++) {
    const a = (i / SLATS) * Math.PI * 2;
    const slat = new THREE.BoxGeometry(0.035, 0.44, 0.03);
    slat.translate(0, 0.39, 0);
    slat.rotateX(0);
    slat.translate(Math.cos(a) * 0.185, 0, Math.sin(a) * 0.185);
    parts.push(slat);
  }
  // Pie.
  const foot = new THREE.CylinderGeometry(0.07, 0.11, 0.17, 12);
  foot.translate(0, 0.085, 0);
  parts.push(foot);
  return merge(parts);
}

/** Jardinera de piedra: base, cuerpo y moldura de remate. Los tres escalones
 * son lo que la distingue de una caja gris. */
function buildPlanterGeometry(): THREE.BufferGeometry {
  return merge([
    box(0.98, 0.07, 0.66, 0, 0.035, 0),
    box(0.9, 0.26, 0.58, 0, 0.2, 0),
    box(1.02, 0.09, 0.7, 0, 0.375, 0),
  ]);
}

/**
 * Masa vegetal: varios volúmenes FACETADOS (icosaedros de 1 subdivisión) de
 * distinto tamaño, los de abajo en el verde oscuro y los de arriba en el
 * claro.
 *
 * Una sola esfera suave achatada se leía como un cojín. El follaje necesita
 * silueta irregular y planos que corten la luz: con `flatShading` sobre pocos
 * triángulos, cada cara coge una intensidad distinta y la masa se lee como
 * hojas sin una sola textura.
 */
const HEDGE_BLOBS: ReadonlyArray<{
  r: number;
  pos: [number, number, number];
  scale: [number, number, number];
  dark: boolean;
}> = [
  { r: 0.3, pos: [0, 0.6, 0], scale: [1.45, 0.92, 1.05], dark: false },
  { r: 0.21, pos: [-0.31, 0.53, 0.04], scale: [1, 0.95, 1], dark: true },
  { r: 0.22, pos: [0.3, 0.55, -0.05], scale: [1, 0.9, 1], dark: true },
  { r: 0.17, pos: [0.08, 0.79, 0.02], scale: [1, 0.85, 1], dark: false },
  { r: 0.14, pos: [-0.14, 0.75, -0.08], scale: [1, 0.9, 1], dark: true },
];

function buildHedgeGeometry(dark: boolean): THREE.BufferGeometry {
  const parts = HEDGE_BLOBS.filter((b) => b.dark === dark).map((b) => {
    const g = new THREE.IcosahedronGeometry(b.r, 1);
    g.scale(...b.scale);
    g.translate(...b.pos);
    return g;
  });
  return merge(parts);
}

/** Copa del arbolado: mismos volúmenes facetados que el seto, a otra escala y
 * repartidos en altura. */
const TREE_BLOBS: ReadonlyArray<{
  r: number;
  pos: [number, number, number];
  scale: [number, number, number];
  dark: boolean;
}> = [
  { r: 1.05, pos: [0, 3.15, 0], scale: [1.15, 0.92, 1.15], dark: false },
  { r: 0.78, pos: [-0.72, 2.72, 0.3], scale: [1, 0.95, 1], dark: true },
  { r: 0.72, pos: [0.76, 2.6, -0.26], scale: [1, 0.95, 1], dark: true },
  { r: 0.62, pos: [0.18, 3.95, 0.16], scale: [1, 0.88, 1], dark: false },
  { r: 0.55, pos: [-0.3, 2.35, -0.5], scale: [1, 0.9, 1], dark: true },
];

/** Tronco: cónico, con un ensanche de arranque para que no parezca un tubo
 * clavado, y dos ramas cortas donde arranca la copa. */
function buildTrunkGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const flare = new THREE.CylinderGeometry(0.19, 0.34, 0.3, 10);
  flare.translate(0, 0.15, 0);
  parts.push(flare);
  const trunk = new THREE.CylinderGeometry(0.135, 0.2, 2.5, 10);
  trunk.translate(0, 1.5, 0);
  parts.push(trunk);
  for (const [a, tilt] of [
    [0.4, 0.75],
    [3.6, -0.6],
  ] as const) {
    const branch = new THREE.CylinderGeometry(0.06, 0.1, 1.05, 8);
    branch.rotateZ(tilt);
    branch.translate(Math.cos(a) * 0.3, 2.62, Math.sin(a) * 0.3);
    parts.push(branch);
  }
  return merge(parts);
}

function buildTreeCrownGeometry(dark: boolean): THREE.BufferGeometry {
  const parts = TREE_BLOBS.filter((b) => b.dark === dark).map((b) => {
    const g = new THREE.IcosahedronGeometry(b.r, 1);
    g.scale(...b.scale);
    g.translate(...b.pos);
    return g;
  });
  return merge(parts);
}

/** Superficies sombreadas del mobiliario: una geometría fusionada por cada
 * una, y un material por cada una. */
type SurfaceKey =
  | "metal"
  | "bulb"
  | "wood"
  | "stone"
  | "leaf"
  | "leafDark"
  | "bark"
  | "palm"
  | "crown"
  | "crownDark"
  | "water"
  | "waterJet";

/** Discos planos sobre el suelo (charco de luz, alcorque, sombra). Van
 * aparte porque cada uno lleva su `renderOrder`. */
type DiscKey = "pool" | "soil" | "shadow";

type DecorGeometries = Record<SurfaceKey | DiscKey, THREE.BufferGeometry>;

/** Radios (x, z) de la sombra de contacto de cada pieza, y desplazamiento en
 * z cuando la silueta no está centrada sobre su origen (el banco vuelca hacia
 * el respaldo). */
const CONTACT: Record<string, { rx: number; rz: number; z?: number }> = {
  lamp: { rx: 0.34, rz: 0.34 },
  bench: { rx: 0.78, rz: 0.33, z: -0.02 },
  bin: { rx: 0.3, rz: 0.3 },
  hedge: { rx: 0.62, rz: 0.37 },
  tree: { rx: 0.95, rz: 0.71 },
  palm: { rx: 0.7, rz: 0.52 },
};

/** Matriz de un disco tumbado (radios `rx`/`rz`) dentro del espacio de una
 * pieza: `base · T(0,y,z) · Rx(-90°) · S(rx, rz, 1)`. El orden importa — la
 * escala se aplica en el plano del círculo, antes de tumbarlo. */
function discMatrix(base: THREE.Matrix4, y: number, rx: number, rz: number, z = 0): THREE.Matrix4 {
  const local = new THREE.Matrix4().compose(
    new THREE.Vector3(0, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)),
    new THREE.Vector3(rx, rz, 1),
  );
  return new THREE.Matrix4().multiplyMatrices(base, local);
}

/**
 * Construye el mobiliario completo: cada pieza del layout se clona, se lleva a
 * su sitio en el mundo y se acumula en el saco de su material; al final, un
 * `merge` por saco.
 */
function buildFurniture(): { geometries: DecorGeometries; halos: THREE.Vector3[] } {
  const piece = {
    lamp: buildLampGeometry(),
    lampGlass: buildLampGlassGeometry(),
    benchWood: buildBenchWoodGeometry(),
    benchMetal: buildBenchMetalGeometry(),
    bin: buildBinGeometry(),
    planter: buildPlanterGeometry(),
    hedge: buildHedgeGeometry(false),
    hedgeDark: buildHedgeGeometry(true),
    trunk: buildTrunkGeometry(),
    palmTrunk: buildPalmTrunkGeometry(),
    palmFronds: buildPalmFrondsGeometry(),
    crown: buildTreeCrownGeometry(false),
    crownDark: buildTreeCrownGeometry(true),
    disc: new THREE.CircleGeometry(1, 48),
  };

  const buckets = new Map<SurfaceKey | DiscKey, THREE.BufferGeometry[]>();
  const put = (key: SurfaceKey | DiscKey, geometry: THREE.BufferGeometry, matrix: THREE.Matrix4) => {
    const copy = geometry.clone().applyMatrix4(matrix);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(copy);
    else buckets.set(key, [copy]);
  };

  const halos: THREE.Vector3[] = [];

  for (const spec of buildDecor()) {
    const base = new THREE.Matrix4().compose(
      new THREE.Vector3(spec.pos[0], 0, spec.pos[1]),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, spec.rotation, 0)),
      new THREE.Vector3(spec.scale, spec.scale, spec.scale),
    );

    switch (spec.kind) {
      case "lamp":
        put("metal", piece.lamp, base);
        put("bulb", piece.lampGlass, base);
        // Charco de luz: lo que de verdad ancla la farola al suelo. Sin él, el
        // halo flota y el poste parece pegado sobre el fondo.
        put("pool", piece.disc, discMatrix(base, LAYER_Y.pool, LIGHT_POOL_RADIUS, LIGHT_POOL_RADIUS));
        halos.push(new THREE.Vector3(spec.pos[0], LAMP_LIGHT_Y * spec.scale, spec.pos[1]));
        break;
      case "bench":
        put("wood", piece.benchWood, base);
        put("metal", piece.benchMetal, base);
        break;
      case "bin":
        put("metal", piece.bin, base);
        break;
      case "hedge":
        put("stone", piece.planter, base);
        put("leafDark", piece.hedgeDark, base);
        put("leaf", piece.hedge, base);
        break;
      case "palm":
        put("soil", piece.disc, discMatrix(base, LAYER_Y.pool, 0.95, 0.95));
        put("palm", piece.palmTrunk, base);
        put("crown", piece.palmFronds, base);
        break;
      case "tree":
        // Alcorque: fuera del pavimento el suelo es casi negro y la sombra de
        // contacto no se ve, así que el árbol flotaba. Esta mancha de tierra
        // le da asiento.
        put("soil", piece.disc, discMatrix(base, LAYER_Y.pool, 1.15, 1.15));
        put("bark", piece.trunk, base);
        put("crownDark", piece.crownDark, base);
        put("crown", piece.crown, base);
        break;
    }

    const contact = CONTACT[spec.kind];
    put("shadow", piece.disc, discMatrix(base, LAYER_Y.shadow, contact.rx, contact.rz, contact.z ?? 0));
  }

  // Parterres: trazado continuo en coordenadas de mundo, no una pieza
  // repetida — entra directo en el saco del seto claro.
  const parterre = buildParterreGeometry();
  put("leaf", parterre, new THREE.Matrix4());
  parterre.dispose();

  // Fuente: pieza única en el centro, también en coordenadas de mundo.
  const identity = new THREE.Matrix4();
  const fountainStone = buildFountainStoneGeometry();
  put("stone", fountainStone, identity);
  fountainStone.dispose();
  const fountainWater = buildFountainWaterGeometry();
  put("water", fountainWater, identity);
  fountainWater.dispose();
  const fountainJets = buildFountainJetGeometry();
  put("waterJet", fountainJets, identity);
  fountainJets.dispose();

  Object.values(piece).forEach((g) => g.dispose());

  const geometries = {} as DecorGeometries;
  for (const [key, parts] of buckets) geometries[key] = merge(parts);
  return { geometries, halos };
}

/**
 * Palmera canaria: estípite curvado por segmentos y corona de frondas.
 *
 * Es LA silueta de Castrelos (y de medio Vigo), así que merece la pena hacerla
 * bien: el tronco no es un cilindro recto sino una pila de anillos que se
 * estrechan y se van desplazando, con lo que la palmera se inclina un poco
 * como las de verdad; y la corona tiene frondas a dos alturas, las de abajo
 * casi horizontales y las de arriba levantadas.
 */
const PALM = {
  segments: 8,
  segmentHeight: 0.44,
  /** Radio del estípite abajo y arriba. */
  radiusBottom: 0.3,
  radiusTop: 0.19,
  /** Cuánto se va de la vertical en total. */
  lean: 0.55,
  fronds: 11,
  frondLength: 2.05,
} as const;

/** Altura a la que arranca la corona. */
const PALM_CROWN_Y = PALM.segments * PALM.segmentHeight;

function buildPalmTrunkGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < PALM.segments; i++) {
    const t = i / (PALM.segments - 1);
    const r = THREE.MathUtils.lerp(PALM.radiusBottom, PALM.radiusTop, t);
    // Anillos ligeramente más anchos que el tramo: es lo que da el aspecto de
    // cicatrices de hoja del estípite sin necesidad de textura.
    const ring = new THREE.CylinderGeometry(r, r * 1.14, PALM.segmentHeight * 0.96, 10);
    ring.translate(Math.sin(t * Math.PI * 0.5) * PALM.lean, (i + 0.5) * PALM.segmentHeight, 0);
    parts.push(ring);
  }
  // Cogollo del que salen las frondas.
  const crown = new THREE.SphereGeometry(0.26, 12, 10);
  crown.scale(1, 0.8, 1);
  crown.translate(PALM.lean, PALM_CROWN_Y + 0.05, 0);
  parts.push(crown);
  return merge(parts);
}

function buildPalmFrondsGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < PALM.fronds; i++) {
    const a = (i / PALM.fronds) * Math.PI * 2;
    // Alterna frondas levantadas y caídas: una corona toda al mismo ángulo se
    // lee como un parasol.
    const droop = i % 2 === 0 ? 1.15 : 0.72;
    const length = PALM.frondLength * (i % 2 === 0 ? 1 : 0.86);
    const frond = new THREE.ConeGeometry(0.19, length, 4);
    // El cono nace apuntando a +Y; se tumba hacia +X y se aplana para que sea
    // una hoja, no un pincho.
    frond.scale(1, 1, 0.26);
    frond.translate(0, length / 2, 0);
    frond.rotateZ(-droop);
    frond.rotateY(a);
    frond.translate(PALM.lean, PALM_CROWN_Y + 0.12, 0);
    parts.push(frond);
  }
  return merge(parts);
}

/**
 * Parterres del jardín francés: arcos de seto bajo recortado sobre el césped,
 * en dos anillos trabados.
 *
 * En Castrelos el dibujo del jardín lo llevan los setos de boj recortados, no
 * los arbustos sueltos. Se generan en coordenadas de MUNDO (no son una pieza
 * repetida con rotación, sino un trazado continuo), así que van aparte del
 * layout de `buildDecor`.
 */
const PARTERRE_RINGS = [
  { radius: 10.5, arcs: 6, sweep: 0.62, phase: 0 },
  { radius: 12.1, arcs: 6, sweep: 0.5, phase: Math.PI / 6 },
] as const;
/** Sección del seto: grosor y cuánto se achata (un seto recortado es más
 * ancho que alto, nunca un tubo). */
const PARTERRE_TUBE = 0.3;
const PARTERRE_SQUASH = 0.62;

function buildParterreGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (const ring of PARTERRE_RINGS) {
    for (let i = 0; i < ring.arcs; i++) {
      const start = ring.phase + (i / ring.arcs) * Math.PI * 2;
      const arc = new THREE.TorusGeometry(
        ring.radius,
        PARTERRE_TUBE,
        6,
        28,
        ((Math.PI * 2) / ring.arcs) * ring.sweep,
      );
      arc.rotateZ(start);
      arc.rotateX(-Math.PI / 2);
      arc.scale(1, PARTERRE_SQUASH, 1);
      arc.translate(0, PARTERRE_TUBE * PARTERRE_SQUASH * 0.85, 0);
      parts.push(arc);
    }
  }
  return merge(parts);
}

/**
 * Fuente central: pilón, pedestal, taza y surtidor.
 *
 * Va en el medallón del pavimento (`PAVING_RINGS[0]`, radio 1.25), que es
 * justo donde la cámara mira en reposo: sin ella, el centro de la plaza era el
 * único sitio vacío de toda la escena. Los muñecos tienen prohibido pasear por
 * encima — ver `FOUNTAIN_KEEP_OUT` en `plaza-config.ts`.
 *
 * Pieza única y centrada, así que se genera directamente en coordenadas de
 * mundo, igual que los parterres.
 */
const FOUNTAIN = {
  /** Radio exterior del pilón. Cabe dentro del medallón. */
  basin: 1.22,
  basinHeight: 0.34,
  /** Altura de la lámina de agua del pilón. */
  waterY: 0.26,
  /** Altura de la taza alta. */
  bowlY: 0.92,
} as const;

function buildFountainStoneGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const ring = (rTop: number, rBottom: number, h: number, y: number, seg = 32) => {
    const g = new THREE.CylinderGeometry(rTop, rBottom, h, seg);
    g.translate(0, y + h / 2, 0);
    parts.push(g);
  };
  // Murete del pilón: anillo abierto (cilindro sin tapas) + coronación, para
  // que se vea el agua dentro y no un tambor macizo.
  const wall = new THREE.CylinderGeometry(FOUNTAIN.basin, FOUNTAIN.basin, FOUNTAIN.basinHeight, 40, 1, true);
  wall.translate(0, FOUNTAIN.basinHeight / 2, 0);
  parts.push(wall);
  const coping = new THREE.TorusGeometry(FOUNTAIN.basin, 0.075, 8, 40);
  coping.rotateX(-Math.PI / 2);
  coping.scale(1, 0.7, 1);
  coping.translate(0, FOUNTAIN.basinHeight, 0);
  parts.push(coping);
  // Fondo del pilón, justo bajo la lámina de agua.
  ring(FOUNTAIN.basin, FOUNTAIN.basin, 0.05, 0.02);
  // Pedestal escalonado y taza alta.
  ring(0.2, 0.3, 0.42, FOUNTAIN.basinHeight * 0.6, 16);
  ring(0.13, 0.2, 0.2, 0.62, 16);
  const bowl = new THREE.CylinderGeometry(0.46, 0.2, 0.16, 24);
  bowl.translate(0, FOUNTAIN.bowlY, 0);
  parts.push(bowl);
  const lip = new THREE.TorusGeometry(0.46, 0.04, 6, 28);
  lip.rotateX(-Math.PI / 2);
  lip.translate(0, FOUNTAIN.bowlY + 0.08, 0);
  parts.push(lip);
  // Remate del surtidor.
  const nozzle = new THREE.CylinderGeometry(0.05, 0.08, 0.18, 12);
  nozzle.translate(0, FOUNTAIN.bowlY + 0.17, 0);
  parts.push(nozzle);
  return merge(parts);
}

function buildFountainWaterGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  // Lámina del pilón y de la taza.
  const pool = new THREE.CircleGeometry(FOUNTAIN.basin - 0.06, 40);
  pool.rotateX(-Math.PI / 2);
  pool.translate(0, FOUNTAIN.waterY, 0);
  parts.push(pool);
  const bowlWater = new THREE.CircleGeometry(0.42, 24);
  bowlWater.rotateX(-Math.PI / 2);
  bowlWater.translate(0, FOUNTAIN.bowlY + 0.09, 0);
  parts.push(bowlWater);
  return merge(parts);
}

/**
 * Agua en movimiento: surtidor central y cortina que cae del borde de la taza.
 *
 * La cortina es un cilindro ABIERTO (sin tapas) muy translúcido, no cuatro
 * chorros sueltos: probado con chorros, una fuente de taza parecía sostenida
 * por cuatro barras de metacrilato. El agua que rebosa una taza cae en velo,
 * y un velo es exactamente un cilindro sin tapas.
 */
function buildFountainJetGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const jet = new THREE.CylinderGeometry(0.022, 0.05, 0.78, 8);
  jet.translate(0, FOUNTAIN.bowlY + 0.55, 0);
  parts.push(jet);
  const fallHeight = FOUNTAIN.bowlY - FOUNTAIN.waterY - 0.02;
  const veil = new THREE.CylinderGeometry(0.455, 0.42, fallHeight, 28, 1, true);
  veil.translate(0, FOUNTAIN.waterY + fallHeight / 2, 0);
  parts.push(veil);
  return merge(parts);
}

/** Geometrías fusionadas + materiales del mobiliario: uno solo para toda la
 * plaza, construido una vez. */
function useDecor(mode: PlazaMode) {
  const decor = useMemo(() => {
    const palette = PLAZA_PALETTES[mode];
    const { geometries, halos } = buildFurniture();

    // Mobiliario dieléctrico (`metalness: 0`): sin environment map, subir
    // `metalness` solo apaga el material — ver cabecera de la paleta.
    const surface = (color: string, roughness: number) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
    // Follaje con `flatShading`: cada faceta del icosaedro coge su propia
    // intensidad y la masa se lee como hojas, no como plástico.
    const foliage = (color: string) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0, flatShading: true });

    const materials = {
      metal: surface(PLAZA_DECOR_PALETTE.metal, 0.55),
      stone: surface(palette.stone, 0.8),
      wood: surface(PLAZA_DECOR_PALETTE.wood, 0.75),
      bark: surface(PLAZA_DECOR_PALETTE.bark, 0.95),
      palm: surface(PLAZA_DECOR_PALETTE.palm, 0.9),
      /** Lámina de agua: lisa y algo transparente, para que se adivine el
       * fondo del pilón. */
      water: new THREE.MeshStandardMaterial({
        color: palette.water,
        roughness: 0.12,
        metalness: 0,
        transparent: true,
        opacity: 0.88,
      }),
      /** Chorro: sin sombrear, para que se lea como agua en movimiento y no
       * como una varilla de plástico. */
      waterJet: new THREE.MeshBasicMaterial({
        color: palette.waterJet,
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      }),
      leaf: foliage(palette.leaf),
      leafDark: foliage(palette.leafDark),
      crown: foliage(palette.crown),
      crownDark: foliage(palette.crownDark),
      /** Vidrio del farol. Encendido va sin sombrear, para que se lea como
       * fuente de luz y no como una caja pintada de amarillo; de día es
       * cristal sucio, sombreado como cualquier otra superficie. */
      bulb: palette.lampsOn
        ? new THREE.MeshBasicMaterial({
            color: PLAZA_DECOR_PALETTE.glow,
            toneMapped: false,
            transparent: true,
            opacity: 0.92,
          })
        : new THREE.MeshStandardMaterial({
            color: PLAZA_DECOR_PALETTE.glassOff,
            roughness: 0.25,
            metalness: 0,
            transparent: true,
            opacity: 0.55,
          }),
      /** Halo y charco: aditivos sobre textura radial. Glow barato sin luces
       * reales — seis `pointLight` costarían un recálculo por fragmento en
       * toda la escena a cambio de un degradado que aquí es gratis. */
      halo: new THREE.SpriteMaterial({
        map: getGlowTexture(),
        color: PLAZA_DECOR_PALETTE.glow,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
      pool: new THREE.MeshBasicMaterial({
        map: getLightPoolTexture(),
        color: PLAZA_DECOR_PALETTE.glow,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        fog: false,
      }),
      /** Tierra del alcorque. */
      soil: new THREE.MeshBasicMaterial({
        map: getLightPoolTexture(),
        color: "#2a2620",
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        toneMapped: false,
      }),
      /** Sombra de contacto: el mismo recurso que usan los muñecos, sin
       * sombras reales. Ancla la pieza al suelo. */
      shadow: new THREE.MeshBasicMaterial({
        map: getGlowTexture(),
        color: "#000000",
        transparent: true,
        opacity: palette.shadowOpacity,
        depthWrite: false,
      }),
    };

    return { geometries, halos, materials };
  }, [mode]);

  useEffect(() => {
    return () => {
      Object.values(decor.geometries).forEach((g) => g.dispose());
      Object.values(decor.materials).forEach((m) => m.dispose());
    };
  }, [decor]);

  return decor;
}

export function PlazaDecor({ mode }: { mode: PlazaMode }) {
  const { geometries, halos, materials } = useDecor(mode);
  const lampsOn = PLAZA_PALETTES[mode].lampsOn;

  return (
    <group>
      {/*
        `castShadow` + `receiveShadow` en todo lo que es materia sólida: como
        el mobiliario está FUSIONADO por material, cada bandera cuesta un
        único paso extra por el shadow map, no uno por farola. Se quedan
        fuera a propósito el vidrio del farol (es la fuente de luz), el agua
        y el chorro (translúcidos: proyectarían una silueta opaca) y las
        capas planas del suelo, que son truco de pintura, no volumen.
      */}
      <mesh geometry={geometries.metal} material={materials.metal} castShadow receiveShadow />
      <mesh geometry={geometries.wood} material={materials.wood} castShadow receiveShadow />
      <mesh geometry={geometries.stone} material={materials.stone} castShadow receiveShadow />
      <mesh geometry={geometries.bark} material={materials.bark} castShadow receiveShadow />
      <mesh geometry={geometries.palm} material={materials.palm} castShadow receiveShadow />
      <mesh geometry={geometries.leafDark} material={materials.leafDark} castShadow receiveShadow />
      <mesh geometry={geometries.leaf} material={materials.leaf} castShadow receiveShadow />
      <mesh geometry={geometries.crownDark} material={materials.crownDark} castShadow receiveShadow />
      <mesh geometry={geometries.crown} material={materials.crown} castShadow receiveShadow />
      <mesh geometry={geometries.bulb} material={materials.bulb} />
      <mesh geometry={geometries.water} material={materials.water} receiveShadow />
      <mesh geometry={geometries.waterJet} material={materials.waterJet} />

      <mesh geometry={geometries.soil} material={materials.soil} renderOrder={LAYER_ORDER.pool} />
      <mesh geometry={geometries.shadow} material={materials.shadow} renderOrder={LAYER_ORDER.shadow} />

      {/* Halo y charco de luz solo con las farolas encendidas: de día una
          farola es un poste de hierro, no una fuente de luz. */}
      {lampsOn && (
        <>
          <mesh geometry={geometries.pool} material={materials.pool} renderOrder={LAYER_ORDER.pool} />
          {halos.map((pos, i) => (
            <sprite key={i} material={materials.halo} position={pos} scale={[1.5, 1.5, 1]} />
          ))}
        </>
      )}
    </group>
  );
}
