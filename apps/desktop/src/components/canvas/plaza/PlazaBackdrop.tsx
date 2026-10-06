"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { PLAZA_FRONT_ANGLE } from "./plaza-config";
import {
  createGradedMaterial,
  getGravelTexture,
  getMistTexture,
  getPazoWindowMask,
  getSoftShadowTexture,
} from "./backdrop-material";
import { BACKDROP_GRADES, type LayerGrade } from "./backdrop-palette";
import { PLAZA_PALETTES, type PlazaMode } from "./plaza-mode";
import { getLightPoolTexture, plazaHorizon } from "./plaza-textures";

/**
 * El Pazo de Castrelos al fondo del parque.
 *
 * ÚNICO asset de imagen de toda la plaza, y la única excepción a la regla de
 * "0 assets" de `/resenas`: una fachada de pazo gallego —sillería, tejado de
 * teja, torre almenada y hiedra— no sale de cuatro primitivas, y sin ella el
 * parque no se reconoce como Castrelos. Se resuelve como en el hero del
 * puerto: imagen LOCAL, servida desde `/public`, nunca de una CDN.
 *
 * Es un telón plano (un plano recortado con `alphaTest`), no un edificio: se
 * ve desde el otro lado de la plaza, detrás del arbolado y medio comido por la
 * niebla, así que no necesita volumen. A cambio hay que aceptar que cuando la
 * órbita pasa justo por su costado se ve de canto — está colocado de espaldas
 * al recorrido más visto y el arbolado tapa el momento.
 *
 * Horizonte con grading propio (ver `backdrop-material.ts` y
 * `backdrop-palette.ts`): todas las capas llevan `fog={false}` y resuelven su
 * perspectiva atmosférica en el shader. El Pazo de NOCHE ya no es otra imagen:
 * es el de día gradado + una máscara procedural de ventanas encendidas
 * (`pazo-noche.webp` ya no se carga).
 *
 * NO cuelga del `<Suspense>` de la escena: la textura se carga aparte y el
 * plano aparece cuando está lista. Un asset dentro del Suspense retrasaría el
 * final de la pantalla de carga, que es justo el error que dejó clavado el
 * loader del hero (ver "Errores prohibidos" en CLAUDE.md).
 */

const PAZO_SRC = "/plaza/pazo-dia.webp";

/** Franja de arbolado que cierra el horizonte, una sola imagen para los dos
 * modos (de noche se gradúa en el shader). Va en DOS filas (`TREELINES`). */
const TREELINE_SRC = "/plaza/arbolado.webp";

/**
 * Filas de arbolado: radio, altura y desfase del periodo.
 *
 * Van POR FUERA del arbolado 3D (16.8). La textura se repite en modo ESPEJO:
 * cada copia entra invertida, así los bordes casan y no hay costura. La
 * segunda fila (r 45) se desplaza MEDIA copia: rompe el periodo de 18° (la
 * misma palmera en el mismo sitio) y, al estar más cerca, da un poco de
 * paralaje con la cámara en vaivén.
 *
 * Cuántas copias caben NO se fija a mano: se calcula con el aspecto de la
 * imagen (`treelineRepeat`), o los árboles salen deformados.
 */
const TREELINES = {
  far: { radius: 49, height: 5.3, shift: 0 },
  near: { radius: 45, height: 4.4, shift: 0.5 },
} as const;
type TreelineLayer = (typeof TREELINES)[keyof typeof TREELINES];

/** Altura del edificio en unidades de mundo. El muñeco mide 1 ≈ 1,6 m, así
 * que 7 son unos 11 m: dos plantas más la torre. */
const BACKDROP_HEIGHT = 7;

/** Distancia al centro de la plaza. Por detrás del arbolado 3D (16.8). */
const BACKDROP_RADIUS = 27;

/** Carga una textura fuera del `<Suspense>`: devuelve `null` hasta que está. */
function useBackdropTexture(src: string): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    new THREE.TextureLoader().load(src, (loaded) => {
      if (cancelled) {
        loaded.dispose();
        return;
      }
      loaded.colorSpace = THREE.SRGBColorSpace;
      setTexture(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  return texture;
}

/**
 * Nº de copias de la franja alrededor del cilindro: las que caben con la
 * proporción original de la imagen. Se redondea a PAR para que la última copia
 * cierre contra la primera por el mismo borde (es lo que pide el espejo).
 */
function treelineRepeat(texture: THREE.Texture, layer: TreelineLayer): number {
  const image = texture.image as { width: number; height: number } | undefined;
  const aspect = image ? image.width / image.height : 3;
  const copyWidth = layer.height * aspect;
  const perimeter = 2 * Math.PI * layer.radius;
  return Math.max(2, Math.round(perimeter / copyWidth / 2) * 2);
}

/** Cilindro abierto, visto desde dentro. */
function useCylinder(radius: number, height: number, segments = 96): THREE.CylinderGeometry {
  const geometry = useMemo(
    () => new THREE.CylinderGeometry(radius, radius, height, segments, 1, true),
    [radius, height, segments],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

/**
 * Sotobosque: cilindro opaco JUSTO POR DETRÁS de la franja de arbolado.
 *
 * El síntoma eran unas calvas blancas dentadas entre los troncos pintados: el
 * propio suelo, ya 100 % color de horizonte, asomando por el hueco entre copas
 * y troncos. Geométricamente no se puede cerrar, así que se tapa el SUELO con
 * lo que de verdad hay bajo una masa de árboles: sombra. Va medio metro por
 * detrás (r 49,5) para que los troncos se sigan recortando contra él.
 *
 * Ahora sin niebla de escena: su verde se mezcla a mano con el horizonte
 * (`understoryHaze`) para llegar al mismo tono que el césped lejano.
 */
const UNDERSTORY = { radius: 49.5, bottom: -1.5, top: 1.5 } as const;

function Understory({ mode }: { mode: PlazaMode }) {
  const geometry = useCylinder(UNDERSTORY.radius, UNDERSTORY.top - UNDERSTORY.bottom);
  const color = useMemo(
    () =>
      new THREE.Color(PLAZA_PALETTES[mode].understory).lerp(
        new THREE.Color(plazaHorizon(mode)),
        BACKDROP_GRADES[mode].understoryHaze,
      ),
    [mode],
  );
  return (
    <mesh geometry={geometry} position={[0, (UNDERSTORY.top + UNDERSTORY.bottom) / 2, 0]}>
      <meshBasicMaterial color={color} side={THREE.BackSide} toneMapped={false} fog={false} />
    </mesh>
  );
}

/**
 * Bruma de suelo: cilindro transparente cuya opacidad cae con la altura, del
 * color de horizonte. Tapa las puntas de los troncos y la junta recta entre
 * césped y sotobosque: es el aire que de verdad se acumula a ras de suelo.
 */
function GroundMist({ mode, radius, height, strength }: { mode: PlazaMode; radius: number; height: number; strength: number }) {
  const geometry = useCylinder(radius, height);
  const map = useMemo(() => getMistTexture(), []);
  return (
    <mesh geometry={geometry} position={[0, height / 2, 0]} renderOrder={1}>
      <meshBasicMaterial
        map={map}
        color={plazaHorizon(mode)}
        opacity={strength}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        toneMapped={false}
        fog={false}
      />
    </mesh>
  );
}

function Treeline({ mode, base, layer, grade }: { mode: PlazaMode; base: THREE.Texture; layer: TreelineLayer; grade: LayerGrade }) {
  // Clon por fila: comparte la imagen (y la subida a GPU) pero cada una tiene
  // su propio `repeat` y `offset`. Es lo que permite desfasar la segunda.
  const texture = useMemo(() => {
    const tex = base.clone();
    tex.wrapS = THREE.MirroredRepeatWrapping;
    tex.repeat.set(treelineRepeat(base, layer), 1);
    tex.offset.x = layer.shift;
    tex.needsUpdate = true;
    return tex;
  }, [base, layer]);
  useEffect(() => () => texture.dispose(), [texture]);

  const geometry = useCylinder(layer.radius, layer.height);
  const material = useMemo(
    () => createGradedMaterial({ map: texture, grade, haze: plazaHorizon(mode), side: THREE.BackSide }),
    [texture, grade, mode],
  );
  useEffect(() => () => material.dispose(), [material]);

  return <mesh geometry={geometry} material={material} position={[0, layer.height / 2 - 0.3, 0]} />;
}

/** Setos bajos delante del zócalo: blobs aplastados de un solo InstancedMesh
 * (una llamada de dibujo). Tapan la junta fachada/césped y apoyan el edificio.
 * Coordenadas locales del Pazo: x a lo ancho, z hacia la plaza. El hueco
 * central es la puerta. */
const HEDGE_BLOBS: ReadonlyArray<readonly [number, number, number, number]> = [
  // x, z, escala, y-giro
  [-5.9, 0.85, 0.62, 0.3], [-5.1, 0.95, 0.74, 1.1], [-4.2, 0.85, 0.66, 2.0], [-3.4, 0.95, 0.72, 0.6],
  [-2.6, 0.85, 0.64, 1.7], [-1.9, 0.95, 0.6, 2.6],
  [2.2, 0.95, 0.62, 0.9], [2.9, 0.85, 0.7, 2.2], [3.8, 0.95, 0.66, 0.2], [4.6, 0.85, 0.74, 1.4],
  [5.4, 0.95, 0.66, 2.8], [6.0, 0.85, 0.58, 0.8],
  [-4.6, 1.5, 0.5, 1.9], [3.4, 1.5, 0.5, 0.4],
];

function Hedges({ mode }: { mode: PlazaMode }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 2), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    HEDGE_BLOBS.forEach(([x, z, s, ry], i) => {
      e.set(0, ry, 0);
      q.setFromEuler(e);
      // Largos y bajos: un seto recortado, no una bola.
      sc.set(s * 1.25, s * 0.62, s * 0.8);
      p.set(x, s * 0.5, z);
      m.compose(p, q, sc);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, HEDGE_BLOBS.length]}>
      <meshStandardMaterial color={PLAZA_PALETTES[mode].leafDark} roughness={1} />
    </instancedMesh>
  );
}

/** Explanada de grava + sombra difusa + charco de luz de la puerta: lo que
 * asienta el Pazo en el suelo en vez de dejarlo como una pegatina. */
function Grounding({ mode }: { mode: PlazaMode }) {
  const grade = BACKDROP_GRADES[mode];
  const gravel = useMemo(() => getGravelTexture(), []);
  const shadow = useMemo(() => getSoftShadowTexture(), []);
  const pool = useMemo(() => getLightPoolTexture(), []);
  const flat: [number, number, number] = [-Math.PI / 2, 0, 0];

  return (
    <>
      <mesh rotation={flat} position={[0, 0.012, 2.9]}>
        <planeGeometry args={[17, 6.4]} />
        <meshBasicMaterial
          map={gravel}
          color={grade.gravel}
          transparent
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
          toneMapped={false}
        />
      </mesh>
      {/* Sombra del edificio sobre la explanada: pegada al zócalo. */}
      <mesh rotation={flat} position={[0, 0.02, 0.9]}>
        <planeGeometry args={[14.5, 3.2]} />
        <meshBasicMaterial
          map={shadow}
          color="#000000"
          opacity={mode === "dia" ? 0.4 : 0.55}
          transparent
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-3}
          toneMapped={false}
        />
      </mesh>
      {grade.doorPool > 0 && (
        <mesh rotation={flat} position={[0.2, 0.03, 2.1]}>
          <planeGeometry args={[6, 4.4]} />
          <meshBasicMaterial
            map={pool}
            color="#ffb870"
            opacity={grade.doorPool}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-4}
            toneMapped={false}
          />
        </mesh>
      )}
    </>
  );
}

function Pazo({ mode }: { mode: PlazaMode }) {
  const texture = useBackdropTexture(PAZO_SRC);
  const grade = BACKDROP_GRADES[mode];

  const geometry = useMemo(() => {
    if (!texture?.image) return null;
    const { width, height } = texture.image as { width: number; height: number };
    return new THREE.PlaneGeometry(BACKDROP_HEIGHT * (width / height), BACKDROP_HEIGHT);
  }, [texture]);
  useEffect(() => () => geometry?.dispose(), [geometry]);

  const material = useMemo(() => {
    if (!texture) return null;
    return createGradedMaterial({
      map: texture,
      grade: grade.pazo,
      haze: plazaHorizon(mode),
      side: THREE.DoubleSide,
      baseAO: grade.pazo.baseAO,
      windowMask: grade.pazo.windows > 0 ? getPazoWindowMask() : null,
      windowGain: grade.pazo.windows * 1.15,
    });
  }, [texture, grade, mode]);
  useEffect(() => () => material?.dispose(), [material]);

  if (!geometry || !material) return null;

  const x = Math.cos(PLAZA_FRONT_ANGLE) * BACKDROP_RADIUS;
  const z = Math.sin(PLAZA_FRONT_ANGLE) * BACKDROP_RADIUS;

  return (
    // Grupo local: +z mira a la plaza, +x a lo ancho. Todo lo que apoya el
    // edificio (grava, sombra, setos) cuelga de aquí y gira con él.
    <group position={[x, 0, z]} rotation={[0, Math.atan2(-x, -z), 0]}>
      <mesh geometry={geometry} material={material} position={[0, BACKDROP_HEIGHT / 2, 0]} />
      <Grounding mode={mode} />
      <Hedges mode={mode} />
    </group>
  );
}

export function PlazaBackdrop({ mode }: { mode: PlazaMode }) {
  const treeTexture = useBackdropTexture(TREELINE_SRC);
  const grade = BACKDROP_GRADES[mode];
  return (
    <group>
      <Understory mode={mode} />
      {treeTexture && (
        <>
          <Treeline mode={mode} base={treeTexture} layer={TREELINES.far} grade={grade.treelineFar} />
          <Treeline mode={mode} base={treeTexture} layer={TREELINES.near} grade={grade.treelineNear} />
        </>
      )}
      <GroundMist mode={mode} radius={47.5} height={1.6} strength={grade.groundMist} />
      <GroundMist mode={mode} radius={43.5} height={1.1} strength={grade.groundMist * 0.7} />
      <Pazo mode={mode} />
    </group>
  );
}
