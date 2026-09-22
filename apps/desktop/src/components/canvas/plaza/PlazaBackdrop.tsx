"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { PLAZA_FRONT_ANGLE } from "./plaza-config";
import { PLAZA_PALETTES, type PlazaMode } from "./plaza-mode";

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
 * NO cuelga del `<Suspense>` de la escena: la textura se carga aparte y el
 * plano aparece cuando está lista. Un asset dentro del Suspense retrasaría el
 * final de la pantalla de carga, que es justo el error que dejó clavado el
 * loader del hero (ver "Errores prohibidos" en CLAUDE.md).
 */

/** Ruta de la fachada del Pazo por modo. */
const BACKDROP_SRC: Record<PlazaMode, string> = {
  dia: "/plaza/pazo-dia.webp",
  noche: "/plaza/pazo-noche.webp",
};

/** Franja de arbolado que cierra el horizonte. Una sola imagen para los dos
 * modos: de noche se tiñe (`backdropTint`), porque una masa de árboles a
 * contraluz es la misma silueta más apagada — al contrario que el Pazo, que
 * de noche enciende las ventanas y necesita imagen propia. */
const TREELINE_SRC = "/plaza/arbolado.webp";

/**
 * Cilindro de arbolado: radio, altura y cuántas veces se repite la franja
 * alrededor.
 *
 * Va POR FUERA del arbolado 3D (16.8) y por dentro de la niebla, que es lo que
 * lo funde con el cielo. La textura se repite en modo ESPEJO: cada copia entra
 * invertida, así que los bordes siempre casan y no hay costura visible por
 * ningún lado, que es justo lo que hacía inviable un telón plano con la cámara
 * en movimiento.
 *
 * Cuántas veces se repite NO se fija a mano: se calcula con el aspecto de la
 * imagen para que cada copia salga con sus proporciones (`treelineRepeat`).
 * Con un número puesto a ojo, los árboles salían al doble de ancho que de
 * alto y la franja se leía como una mancha verde, no como arbolado.
 */
const TREELINE = { radius: 49, height: 5.3 } as const;

/** Altura del edificio en unidades de mundo. El muñeco mide 1 ≈ 1,6 m, así
 * que 7 son unos 11 m: dos plantas más la torre. */
const BACKDROP_HEIGHT = 7;

/** Distancia al centro de la plaza. Por detrás del arbolado (16.8) y dentro
 * de la niebla, que es lo que lo asienta en el fondo en vez de dejarlo como
 * una pegatina. */
const BACKDROP_RADIUS = 27;

/** Carga una textura fuera del `<Suspense>`: devuelve `null` hasta que está. */
function useBackdropTexture(src: string, configure?: (tex: THREE.Texture) => void): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    new THREE.TextureLoader().load(src, (loaded) => {
      if (cancelled) {
        loaded.dispose();
        return;
      }
      loaded.colorSpace = THREE.SRGBColorSpace;
      configure?.(loaded);
      setTexture(loaded);
    });
    return () => {
      cancelled = true;
    };
    // `configure` se define en el módulo, no cambia entre renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
function treelineRepeat(texture: THREE.Texture): number {
  const image = texture.image as { width: number; height: number } | undefined;
  const aspect = image ? image.width / image.height : 3;
  const copyWidth = TREELINE.height * aspect;
  const perimeter = 2 * Math.PI * TREELINE.radius;
  return Math.max(2, Math.round(perimeter / copyWidth / 2) * 2);
}

function configureTreeline(tex: THREE.Texture) {
  tex.wrapS = THREE.MirroredRepeatWrapping;
  tex.repeat.set(treelineRepeat(tex), 1);
}

/**
 * Sotobosque: cilindro opaco JUSTO POR DETRÁS de la franja de arbolado.
 *
 * El síntoma eran unas calvas blancas dentadas entre los troncos pintados. No
 * era el borde del mundo: era el propio suelo, que a partir de `fog.far` ya es
 * 100 % color de horizonte, asomando por el hueco que la imagen deja entre las
 * copas y los troncos. Geométricamente no hay forma de cerrarlo —el suelo se
 * vuelve blanco antes de que la masa opaca de las copas llegue a taparlo— así
 * que lo que se tapa es el suelo, no el hueco.
 *
 * Y tapándolo con lo que de verdad hay bajo una masa de árboles: sombra. Por
 * eso va medio metro POR DETRÁS del arbolado (los troncos se siguen viendo
 * recortados contra él, que es lo que da la profundidad) y con la niebla
 * puesta, que es lo que le hace llegar al mismo gris verdoso que el césped de
 * delante.
 */
const UNDERSTORY = { radius: 49.5, bottom: -1.5, top: 1.5 } as const;

function Understory({ color }: { color: string }) {
  const geometry = useMemo(
    () =>
      new THREE.CylinderGeometry(
        UNDERSTORY.radius,
        UNDERSTORY.radius,
        UNDERSTORY.top - UNDERSTORY.bottom,
        96,
        1,
        true,
      ),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} position={[0, (UNDERSTORY.top + UNDERSTORY.bottom) / 2, 0]}>
      {/* Sin sombrear y CON niebla: es fondo, no superficie. Lo que le da el
          tono final es la misma niebla que apaga el césped y el arbolado. */}
      <meshBasicMaterial color={color} side={THREE.BackSide} toneMapped={false} />
    </mesh>
  );
}

function Treeline({ tint }: { tint: string }) {
  const texture = useBackdropTexture(TREELINE_SRC, configureTreeline);
  const geometry = useMemo(
    () => new THREE.CylinderGeometry(TREELINE.radius, TREELINE.radius, TREELINE.height, 96, 1, true),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  if (!texture) return null;

  return (
    <mesh geometry={geometry} position={[0, TREELINE.height / 2 - 0.35, 0]}>
      {/* `BackSide`: se ve desde dentro. `alphaTest` recorta el cielo entre
          las copas sin entrar en la cola de transparentes. */}
      <meshBasicMaterial
        map={texture}
        color={tint}
        side={THREE.BackSide}
        alphaTest={0.5}
        toneMapped={false}
      />
    </mesh>
  );
}

function Pazo({ mode }: { mode: PlazaMode }) {
  const texture = useBackdropTexture(BACKDROP_SRC[mode]);

  const geometry = useMemo(() => {
    if (!texture?.image) return null;
    const { width, height } = texture.image as { width: number; height: number };
    return new THREE.PlaneGeometry(BACKDROP_HEIGHT * (width / height), BACKDROP_HEIGHT);
  }, [texture]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  if (!texture || !geometry) return null;

  const x = Math.cos(PLAZA_FRONT_ANGLE) * BACKDROP_RADIUS;
  const z = Math.sin(PLAZA_FRONT_ANGLE) * BACKDROP_RADIUS;

  return (
    <mesh
      geometry={geometry}
      position={[x, BACKDROP_HEIGHT / 2, z]}
      rotation={[0, Math.atan2(-x, -z), 0]}
    >
      {/*
        Sin sombrear: la imagen ya trae su propia luz pintada (sol de día,
        ventanas encendidas de noche), y pasarla por las luces de la escena
        la ensuciaría. El fog SÍ la afecta — es lo que la mete en el fondo.
        `alphaTest` en vez de `transparent`: el recorte es duro y así no entra
        en la cola de transparentes ni se pelea por el orden con el arbolado.
      */}
      <meshBasicMaterial
        map={texture}
        color={PLAZA_PALETTES[mode].backdropTint}
        alphaTest={0.5}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function PlazaBackdrop({ mode }: { mode: PlazaMode }) {
  return (
    <group>
      <Understory color={PLAZA_PALETTES[mode].understory} />
      <Treeline tint={PLAZA_PALETTES[mode].treelineTint} />
      <Pazo mode={mode} />
    </group>
  );
}
