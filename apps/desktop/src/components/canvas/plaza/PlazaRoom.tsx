"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FLOOR_RADIUS, PLAZA_PALETTE } from "./plaza-config";
import { PLAZA_PALETTES, type PlazaMode } from "./plaza-mode";
import {
  getSkyTexture,
  getGrassTexture,
  getCloudTexture,
  CLOUD_SIZE,
  GRASS_TILE_WORLD,
} from "./plaza-textures";
import { GROUND_PALETTES } from "./ground-palette";
import { createPavingMaterial, PAVING_RADIUS } from "./ground-paving";
import { buildCurbContactGeometry, buildCurbGeometry } from "./ground-curb";
import { createGrassMaterial } from "./ground-grass";
import { PlazaDecor } from "./PlazaDecor";
import { SUN } from "./PlazaLighting";
import { PlazaBackdrop } from "./PlazaBackdrop";

/**
 * Radio de la esfera de cielo. Muy por encima de `FLOOR_RADIUS` para que el
 * suelo quede siempre dentro, y por debajo del `far` de la cámara
 * (1000). El degradado va por ángulo de elevación, así que el radio no cambia
 * el aspecto: la cámara está casi en el centro de la esfera.
 */
const SKY_RADIUS = 200;

/**
 * Anillos concéntricos del suelo, en unidades de mundo.
 *
 * El fondo es plano y la cámara va casi a ras: sin nada dibujado en el suelo,
 * mover un muñeco "hacia delante" y "hacia el fondo" se ven casi igual en
 * pantalla. Estos anillos dan la escala del suelo y se comprimen con la
 * perspectiva, así que la profundidad se lee de un vistazo. Se apagan solos
 * con la niebla, sin necesidad de un degradado en la textura.
 *
 * Solo FUERA de la plaza: dentro, esa referencia la da ya el despiece radial
 * del pavimento (`ground-paving.ts`), mucho mejor, y los anillos lima encima
 * de las losas se leían como aros de neón compitiendo con todo.
 *
 * Además solo se ven MIENTRAS SE ARRASTRA un muñeco (prop `holding`): son una
 * ayuda de profundidad para el gesto, no decorado. Aparecen y se van con un
 * fundido para que no den un parpadeo al agarrar y soltar.
 */
const GRID_RINGS = [13, 16, 20] as const;
/** Grosor de cada anillo (radio ±). Fino: es una referencia, no una decoración. */
const RING_HALF_WIDTH = 0.014;

/**
 * Césped: corona entre el bordillo del pavimento y el arbolado.
 *
 * En Castrelos el granito nunca llega al borde — entre el paseo y los árboles
 * siempre hay pradera. Sin ella, la plaza acababa en un corte seco contra el
 * suelo vacío, que es lo que la hacía parecer una maqueta flotando.
 *
 * Llega hasta el borde del suelo (`FLOOR_RADIUS`) a propósito: su borde tiene
 * que caer MUY pasado `fog.far`, donde ya es 100 % color de horizonte. Con un
 * radio más corto se veía la raya del césped acabándose en mitad del campo, y
 * con el borde a medio fundir se le notaban hasta los polígonos del anillo.
 */
const GRASS = { inner: 8.55, outer: FLOOR_RADIUS } as const;

/** Altura de los ojos de la cámara (`plaza-camera.ts`). La franja de nubes se
 * mide desde ahí: con la cámara a ras del parque el cielo visible es una cuña
 * baja, y cada grado cuenta. */
const EYE_Y = 4.15;

/**
 * Franja de nubes: cilindro de cielo, por dentro de la esfera del cyclorama.
 *
 * Mismo recurso que la franja de arbolado (`PlazaBackdrop`) y por el mismo
 * motivo: envuelta en un cilindro, cada píxel de la textura cae donde se ve.
 * Arranca en el horizonte (0°, a la altura de los ojos) y cubre
 * `CLOUD_SIZE.height / (CLOUD_SIZE.width / 360)` = 22,5°, que es todo el cielo
 * que enseña el encuadre. Las nubes (bancos achatados) y las estrellas viven
 * en los primeros 1,5-9° y 3-22° respectivamente; ver `getCloudTexture`.
 */
const CLOUDS = {
  radius: 160,
  bottom: EYE_Y,
  top: EYE_Y + 160 * Math.tan(((CLOUD_SIZE.height / (CLOUD_SIZE.width / 360)) * Math.PI) / 180),
} as const;
/** Vueltas por segundo de la franja. Un cielo quieto delata la maqueta tanto
 * como un parque sin sombras; a esta velocidad una nube tarda ~9 min en
 * cruzar el encuadre, que es lo que tarda una nube de verdad. */
const CLOUD_DRIFT = 0.0018;

/** Sube la anisotropía de una textura al máximo de la GPU antes de su primera
 * subida (o la re-sube si ya estaba). La fijada a mano (8/16/4) dejaba
 * calidad sobre la mesa en GPUs de escritorio y pedía de más en móviles. */
function useMaxAnisotropy(texture: THREE.Texture) {
  const max = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  if (texture.anisotropy !== max) {
    texture.anisotropy = max;
    texture.needsUpdate = true;
  }
}

function CloudBand({ mode, still }: { mode: PlazaMode; still: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => getCloudTexture(mode), [mode]);
  useMaxAnisotropy(texture);

  const geometry = useMemo(
    () => new THREE.CylinderGeometry(CLOUDS.radius, CLOUDS.radius, CLOUDS.top - CLOUDS.bottom, 64, 1, true),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    if (!still && ref.current) ref.current.rotation.y += CLOUD_DRIFT * delta;
  });

  return (
    <mesh
      ref={ref}
      geometry={geometry}
      position={[0, (CLOUDS.top + CLOUDS.bottom) / 2, 0]}
      renderOrder={-3}
    >
      {/* Como el cyclorama: sin niebla, sin tone mapping y sin escribir en el
          z-buffer. Es cielo, no geometría del parque. `dithering` rompe las
          bandas del borde blando de las nubes sobre el degradado. */}
      <meshBasicMaterial
        map={texture}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        fog={false}
        toneMapped={false}
        dithering
      />
    </mesh>
  );
}

/** Altura de la retícula guía: por encima del césped (0.004), sin pelearse con
 * él en el z-buffer. */
const GRID_Y = 0.007;

function FloorGrid({ opacity, holding }: { opacity: number; holding: boolean }) {
  const geometries = useMemo(
    () => GRID_RINGS.map((r) => new THREE.RingGeometry(r - RING_HALF_WIDTH, r + RING_HALF_WIDTH, 128)),
    [],
  );
  // Un único material para todos los anillos. Arranca invisible: solo se
  // enciende mientras se arrastra.
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: PLAZA_PALETTE.guide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );
  const groupRef = useRef<THREE.Group>(null);

  // Fundido exponencial hacia el objetivo. El grupo se oculta del todo al
  // acabar para no gastar tres mallas transparentes en cada frame de reposo.
  useFrame((_, delta) => {
    const target = holding ? opacity : 0;
    const k = 1 - Math.exp(-10 * delta);
    material.opacity += (target - material.opacity) * k;
    if (Math.abs(target - material.opacity) < 0.002) material.opacity = target;
    if (groupRef.current) groupRef.current.visible = material.opacity > 0;
  });

  useEffect(() => {
    return () => {
      geometries.forEach((g) => g.dispose());
      material.dispose();
    };
  }, [geometries, material]);

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, GRID_Y, 0]} visible={false}>
      {geometries.map((geometry, i) => (
        <mesh key={i} geometry={geometry} material={material} renderOrder={-1} />
      ))}
    </group>
  );
}

export function PlazaRoom({
  mode,
  still = false,
  holding = false,
}: {
  mode: PlazaMode;
  still?: boolean;
  /** Hay un muñeco agarrado: enciende la retícula guía del suelo. */
  holding?: boolean;
}) {
  const palette = PLAZA_PALETTES[mode];
  const ground = GROUND_PALETTES[mode];

  const skyTexture = useMemo(() => getSkyTexture(mode), [mode]);

  // Las texturas son singletons de módulo (compartidas entre montajes de la
  // plaza) — el dispose real vive en `disposePlazaTextures()`, no aquí. Solo
  // limpiamos lo que es propio de esta instancia: geometrías y materiales.
  const skyGeometry = useMemo(() => new THREE.SphereGeometry(SKY_RADIUS, 48, 64), []);
  // El disco del pavimento acaba por debajo del bordillo (que lo tapa), así
  // que no necesita alpha ni fundido: es opaco.
  const pavingGeometry = useMemo(() => new THREE.CircleGeometry(PAVING_RADIUS, 128), []);
  const pavingMaterial = useMemo(() => createPavingMaterial(mode), [mode]);
  const curbGeometry = useMemo(() => buildCurbGeometry(mode), [mode]);
  const curbContactGeometry = useMemo(() => buildCurbContactGeometry(mode), [mode]);
  const grassGeometry = useMemo(
    () => new THREE.RingGeometry(GRASS.inner, GRASS.outer, 256, 1),
    [],
  );
  /**
   * Capa que RECIBE la sombra proyectada.
   *
   * El suelo y el pavimento son `MeshBasicMaterial` a propósito (su color
   * tiene que llegar al píxel sin pasar por la luz, que es lo que hace que
   * casen con el horizonte), y un material sin sombreado no puede recibir
   * sombras. Así que la sombra va en su propia capa: un disco con
   * `ShadowMaterial`, que es transparente salvo donde le cae sombra. Ventaja
   * añadida: UNA sola capa para pavimento y césped, sin el doble oscurecido
   * que saldría si el césped las recibiera además por su cuenta.
   *
   * Color y opacidad son PROPIOS (`ground-palette.ts`): frío de día, casi
   * negro de noche. Con el negro puro de antes, la sombra sobre un granito
   * cálido era un gris sucio. La luz ya no atenúa por segunda vez
   * (`shadow.intensity` = 1), así que la opacidad de aquí es la final.
   */
  const shadowCatcherGeometry = useMemo(() => new THREE.CircleGeometry(SUN.extent, 128), []);
  const shadowCatcherMaterial = useMemo(
    () =>
      new THREE.ShadowMaterial({
        color: ground.shadow.color,
        opacity: ground.shadow.opacity,
        depthWrite: false,
        dithering: true,
      }),
    [ground.shadow.color, ground.shadow.opacity],
  );

  // La teja del césped es un singleton de módulo: el `repeat` se fija aquí
  // porque depende del radio del anillo, no de la textura. Las UV de un
  // `RingGeometry` son planas sobre su caja, así que abarcan 2 × `outer`.
  const grassTexture = useMemo(() => {
    const tex = getGrassTexture(mode);
    const tiles = (GRASS.outer * 2) / GRASS_TILE_WORLD;
    tex.repeat.set(tiles, tiles);
    return tex;
  }, [mode]);
  useMaxAnisotropy(grassTexture);

  const grassMaterial = useMemo(() => createGrassMaterial(mode, grassTexture), [mode, grassTexture]);

  const curbMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, side: THREE.DoubleSide, dithering: true }),
    [],
  );
  const curbContactMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        dithering: true,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      skyGeometry.dispose();
      pavingGeometry.dispose();
      grassGeometry.dispose();
      shadowCatcherGeometry.dispose();
    };
  }, [skyGeometry, pavingGeometry, grassGeometry, shadowCatcherGeometry]);
  useEffect(() => () => curbGeometry.dispose(), [curbGeometry]);
  useEffect(() => () => curbContactGeometry.dispose(), [curbContactGeometry]);
  useEffect(() => () => pavingMaterial.dispose(), [pavingMaterial]);
  useEffect(() => () => grassMaterial.dispose(), [grassMaterial]);
  useEffect(() => () => shadowCatcherMaterial.dispose(), [shadowCatcherMaterial]);
  useEffect(() => () => curbMaterial.dispose(), [curbMaterial]);
  useEffect(() => () => curbContactMaterial.dispose(), [curbContactMaterial]);

  return (
    <group>
      {/* Cyclorama: esfera invertida vista desde dentro. `toneMapped={false}`
          y `fog={false}` para que el degradado llegue tal cual a pantalla —
          ver justificación completa en plaza-textures.ts. `dithering` rompe
          las bandas de los degradados oscuros al cuantizar a 8 bits. */}
      <mesh geometry={skyGeometry} renderOrder={-4}>
        <meshBasicMaterial
          map={skyTexture}
          side={THREE.BackSide}
          toneMapped={false}
          fog={false}
          depthWrite={false}
          dithering
        />
      </mesh>

      {/* Nubes (de día) o estrellas (de noche), por dentro del cyclorama. */}
      <CloudBand mode={mode} still={still} />

      {/*
        Sin disco de suelo base: el pavimento (hasta 8.3), el bordillo (8.2-8.6)
        y el césped (8.55 hasta `FLOOR_RADIUS`) cubren el suelo sin dejar
        hueco, así que el disco que había debajo nunca se veía (se comprobó
        quitándolo). Más allá de `FLOOR_RADIUS` solo hay niebla, que es color
        de horizonte.

        Césped: SÍ iluminado (MeshStandard), al contrario que el pavimento. Es
        superficie cercana con volumen aparente, y con la luz del modo coge el
        mismo tono que la vegetación que hay plantada encima.
      */}
      <mesh
        geometry={grassGeometry}
        material={grassMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.004, 0]}
        receiveShadow={false}
      />

      {/*
        Pavimento: disco opaco con despiece analítico (ver `ground-paving.ts`).
        A 0.002 sobre el origen, por debajo del césped (0.004), que empieza
        fuera de él: no se solapan.
      */}
      <mesh geometry={pavingGeometry} material={pavingMaterial} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} />

      {/* Bordillo 3D: una malla, sombreado por cara en color de vértice. */}
      <mesh geometry={curbGeometry} material={curbMaterial} />
      {/* Oclusión de contacto del bordillo sobre el césped. */}
      <mesh geometry={curbContactGeometry} material={curbContactMaterial} position={[0, 0.0065, 0]} renderOrder={1} />

      {/*
        Sombra proyectada del suelo. Por encima de los discos de contacto
        (`LAYER_Y.shadow` = 0.012 en `decor/decor-kit.ts`) para que se dibuje después:
        las dos son transparentes y sin z-write, así que manda `renderOrder`.
      */}
      <mesh
        geometry={shadowCatcherGeometry}
        material={shadowCatcherMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        renderOrder={3}
        receiveShadow
      />

      <FloorGrid opacity={palette.guideOpacity} holding={holding} />

      {/* Mobiliario y vegetación — ver `PlazaDecor.tsx`. */}
      <PlazaDecor mode={mode} still={still} />

      {/* El Pazo, al fondo del parque — ver `PlazaBackdrop.tsx`. */}
      <PlazaBackdrop mode={mode} />

      {/* Niebla y luces: las monta `PlazaWorld` como hijas DIRECTAS de la
          escena (ver `PlazaLighting.tsx`) — aquí colgaban de un <group> y la
          niebla no se aplicaba. */}
    </group>
  );
}
