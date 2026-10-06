import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { PLAZA_PALETTES, type PlazaMode } from "../plaza-mode";
import { getGlowTexture } from "../plaza-textures";

/**
 * Utilidades y contratos COMPARTIDOS del mobiliario de la plaza.
 *
 * Reparto de la carpeta `decor/` (un dueño por archivo):
 * - `furniture.ts`   farolas, bancos, papeleras, jardineras.
 * - `vegetation.ts`  árboles, palmeras, setos, parterres.
 * - `PlazaFountain`  la fuente (componente propio, no se fusiona).
 * - `decor-build.ts` recorre `buildDecor()`, llama a los placers y fusiona.
 * - `../PlazaDecor.tsx` monta la tabla de superficies.
 *
 * Añadir o quitar un SACO (geometría fusionada + su material) solo toca el
 * módulo dueño: su placer hace `put("saco", …)` y su factoría de superficies
 * declara el material y las banderas de render de ese mismo saco.
 */

/**
 * Alturas de las capas que se pintan sobre el suelo. Todas transparentes y sin
 * escribir en el z-buffer, así que el orden lo fija `renderOrder`, no la Y: la
 * separación es solo para que el depth test no las descarte contra el suelo.
 * Ver `PlazaRoom` para el pavimento (-2) y la retícula guía (-1).
 */
export const LAYER_Y = { pool: 0.006, shadow: 0.012 } as const;
export const LAYER_ORDER = { pool: 1, shadow: 2 } as const;

/** Contexto de las FACTORÍAS de superficies: lo que decide cómo se ve un saco. */
export interface DecorCtx {
  mode: PlazaMode;
  /** Movimiento reducido o `?quieto`: nada de lo que viva en `decor/` debe
   * animarse (hoy no anima nada; es el gancho para el viento y el agua). */
  frozen: boolean;
}

/** Contexto de los PLACERS: lo anterior más lo que hace falta para colocar una
 * pieza en el mundo. */
export interface PlaceCtx extends DecorCtx {
  /** Matriz de mundo de la pieza (posición · giro Y · escala uniforme). */
  base: THREE.Matrix4;
  /** Geometría de una pieza reutilizable, construida UNA vez por pasada y
   * liberada al acabar. `key` con prefijo del módulo (`"furniture:lamp"`). */
  piece: (key: string, make: () => THREE.BufferGeometry) => THREE.BufferGeometry;
  /** Registra un punto del mundo para superficies de sprites (halos). */
  anchor: (name: string, position: THREE.Vector3) => void;
}

/** Clona `geometry`, la lleva a su sitio con `matrix` y la acumula en el saco
 * `sack`. Los sacos nacen al primer `put`. */
export type PutFn = (sack: string, geometry: THREE.BufferGeometry, matrix: THREE.Matrix4) => void;

/**
 * Una superficie dibujable: el saco (o los anclajes) que pinta, su material y
 * sus banderas de render. La tabla de `PlazaDecor` es la concatenación de las
 * listas que devuelve cada módulo.
 */
export type SurfaceDef =
  | {
      kind: "mesh";
      /** Nombre del saco fusionado que pinta. */
      sack: string;
      material: THREE.Material;
      castShadow?: boolean;
      receiveShadow?: boolean;
      renderOrder?: number;
      /** Material de profundidad del shadow map, para lo que se anima en el
       * vertex shader (viento): su sombra tiene que seguirlo. */
      customDepthMaterial?: THREE.Material;
      /** false = el saco se construye pero no se monta (p. ej. el charco de
       * luz con las farolas apagadas). Por defecto true. */
      enabled?: boolean;
    }
  | {
      kind: "sprites";
      /** Nombre de la lista de anclajes (`ctx.anchor`) donde se pinta un sprite. */
      anchor: string;
      material: THREE.SpriteMaterial;
      scale: [number, number, number];
      enabled?: boolean;
    };

/** Valor con el que se rellena un atributo ausente (por defecto 0). */
const FILL_VALUE: Record<string, number> = { color: 1 };

/**
 * Une varias geometrías ya colocadas y libera las originales: a partir de aquí
 * solo vive la fusionada.
 *
 * - Todas SIN índice antes de fusionar: `mergeGeometries` se niega a mezclar
 *   indexadas con no indexadas, y las primitivas de three no se ponen de
 *   acuerdo (esfera, toro y cono vienen indexados; el icosaedro, no). Convertir
 *   sale más caro en vértices que en dolores de cabeza, y esto es geometría
 *   estática que se construye una sola vez.
 * - Si a una pieza le falta un atributo que otras del mismo saco sí traen
 *   (`color`, `uv`, `normal`, o uno propio), se rellena antes de fusionar
 *   (`color` = blanco, el resto = 0): `mergeGeometries` devuelve null si los
 *   sets no casan, y antes el saco entero desaparecía EN SILENCIO.
 * - Si aun así falla, `console.error` con el nombre del saco.
 */
export function merge(parts: THREE.BufferGeometry[], name = "sin-nombre"): THREE.BufferGeometry {
  const flat = parts.map((p) => (p.index ? p.toNonIndexed() : p));

  // Unión de atributos (con su itemSize) de todas las piezas.
  const wanted = new Map<string, number>();
  for (const g of flat) {
    for (const [attr, a] of Object.entries(g.attributes)) {
      if (!wanted.has(attr)) wanted.set(attr, a.itemSize);
    }
  }
  for (const g of flat) {
    const count = g.getAttribute("position")?.count ?? 0;
    for (const [attr, itemSize] of wanted) {
      if (g.getAttribute(attr)) continue;
      const data = new Float32Array(count * itemSize).fill(FILL_VALUE[attr] ?? 0);
      g.setAttribute(attr, new THREE.BufferAttribute(data, itemSize));
    }
  }

  const merged = flat.length > 0 ? mergeGeometries(flat, false) : null;
  flat.forEach((p, i) => {
    if (p !== parts[i]) p.dispose();
  });
  parts.forEach((p) => p.dispose());
  if (!merged && parts.length > 0) {
    console.error(`[PlazaDecor] mergeGeometries falló en el saco "${name}": atributos incompatibles entre piezas.`);
  }
  return merged ?? new THREE.BufferGeometry();
}

/** Caja colocada: azúcar para no repetir `translate` en cada pieza. */
export function box(
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

/** Matriz de un disco tumbado (radios `rx`/`rz`) dentro del espacio de una
 * pieza: `base · T(0,y,z) · Rx(-90°) · S(rx, rz, 1)`. El orden importa — la
 * escala se aplica en el plano del círculo, antes de tumbarlo. */
export function discMatrix(base: THREE.Matrix4, y: number, rx: number, rz: number, z = 0): THREE.Matrix4 {
  const local = new THREE.Matrix4().compose(
    new THREE.Vector3(0, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)),
    new THREE.Vector3(rx, rz, 1),
  );
  return new THREE.Matrix4().multiplyMatrices(base, local);
}

/** Disco unidad que comparten charco, alcorque y sombra de contacto. */
export function discPiece(ctx: PlaceCtx): THREE.BufferGeometry {
  return ctx.piece("kit:disc", () => new THREE.CircleGeometry(1, 48));
}

/** Radios (x, z) de la sombra de contacto de una pieza, y desplazamiento en z
 * cuando la silueta no está centrada sobre su origen (el banco vuelca hacia el
 * respaldo). Cada módulo declara los de SUS tipos. */
export interface ContactSpec {
  rx: number;
  rz: number;
  z?: number;
}

/** Sombra de contacto bajo una pieza (saco `shadow`). */
export function putContact(put: PutFn, ctx: PlaceCtx, contact: ContactSpec): void {
  put("shadow", discPiece(ctx), discMatrix(ctx.base, LAYER_Y.shadow, contact.rx, contact.rz, contact.z ?? 0));
}

/** Superficie de la sombra de contacto: el mismo recurso que usan los muñecos,
 * sin sombras reales. Ancla la pieza al suelo. Dueño del saco `shadow`, que
 * alimentan los placers de todos los módulos vía `putContact`. */
export function contactSurfaces({ mode }: DecorCtx): SurfaceDef[] {
  return [
    {
      kind: "mesh",
      sack: "shadow",
      renderOrder: LAYER_ORDER.shadow,
      material: new THREE.MeshBasicMaterial({
        map: getGlowTexture(),
        color: "#000000",
        transparent: true,
        opacity: PLAZA_PALETTES[mode].shadowOpacity,
        depthWrite: false,
      }),
    },
  ];
}
