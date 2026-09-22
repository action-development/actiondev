"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FLOOR_RADIUS, PLAZA_PALETTE } from "./plaza-config";
import { PLAZA_PALETTES, type PlazaMode } from "./plaza-mode";
import {
  getSkyTexture,
  getFloorTexture,
  getPavingTexture,
  getGrassTexture,
  getCloudTexture,
  GRASS_TILE_WORLD,
  PAVING_WORLD_RADIUS,
  plazaHorizon,
} from "./plaza-textures";
import { PlazaDecor } from "./PlazaDecor";
import { PlazaBackdrop } from "./PlazaBackdrop";

/**
 * Radio de la esfera de cielo. Muy por encima de `FLOOR_RADIUS` para que el
 * disco del suelo quede siempre dentro, y por debajo del `far` de la cámara
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
 * del pavimento (`getPavingTexture`), mucho mejor, y los anillos lima encima
 * de las losas se leían como aros de neón compitiendo con todo.
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

/**
 * Sombra proyectada del sol.
 *
 * La direccional de la paleta va a ~12 del centro: sirve para iluminar (la
 * intensidad de una direccional no depende de la distancia) pero NO para
 * proyectar, porque la cámara de sombra mira desde la propia luz y todo lo que
 * quede detrás —el arbolado 3D está a 16.8— cae fuera del frustum y no
 * proyecta nada. Así que para la sombra se recoloca el sol a `SUN_DISTANCE` en
 * la MISMA dirección: se ve igual, y ahora la ortográfica cubre el parque
 * entero.
 *
 * `extent` es la mitad del lado de esa ortográfica y `map` el lado del mapa:
 * juntos deciden cuántos téxeles toca cada metro (a 14 y 1024 salen ~2,7 cm) y,
 * sobre todo, cuánto cuesta. El mapa es el segundo pase completo de la escena
 * en cada frame, así que no es un parámetro de calidad: es la mitad del
 * presupuesto. A 2048 y 19 la plaza bajaba a la mitad de fps y el borde extra
 * no se veía — el desenfoque de `shadow-radius` se lo come igualmente.
 *
 * A 14 quedan fuera las copas del arbolado 3D (r = 16.8). No se pierde nada
 * visible: su sombra caía en la pradera lejana, ya medio comida por la niebla.
 */
const SUN = { distance: 60, extent: 14, map: 1024 } as const;

/** Misma dirección que la luz de la paleta, pero a `SUN.distance` del centro. */
function sunPosition([x, y, z]: readonly [number, number, number]): [number, number, number] {
  const len = Math.hypot(x, y, z) || 1;
  const k = SUN.distance / len;
  return [x * k, y * k, z * k];
}

/**
 * Franja de nubes: cilindro de cielo, por dentro de la esfera del cyclorama.
 *
 * Mismo recurso que la franja de arbolado (`PlazaBackdrop`) y por el mismo
 * motivo: envuelta en un cilindro, cada píxel de la textura cae donde se ve.
 * Arranca por encima de las copas del arbolado (que rematan a ~1,6° sobre el
 * horizonte) para que quede aire entre los árboles y la primera nube, y llega
 * a ~31°, bastante más de lo que abarca el encuadre.
 */
const CLOUDS = { radius: 160, bottom: 10, top: 96, repeat: 2 } as const;
/** Vueltas por segundo de la franja. Un cielo quieto delata la maqueta tanto
 * como un parque sin sombras; a esta velocidad una nube tarda ~9 min en
 * cruzar el encuadre, que es lo que tarda una nube de verdad. */
const CLOUD_DRIFT = 0.0018;

function CloudBand({ mode, still }: { mode: PlazaMode; still: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => {
    const tex = getCloudTexture(mode);
    tex.repeat.set(CLOUDS.repeat, 1);
    return tex;
  }, [mode]);

  const geometry = useMemo(
    () =>
      new THREE.CylinderGeometry(
        CLOUDS.radius,
        CLOUDS.radius,
        CLOUDS.top - CLOUDS.bottom,
        64,
        1,
        true,
      ),
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
          z-buffer. Es cielo, no geometría del parque. */}
      <meshBasicMaterial
        map={texture}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        fog={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function FloorGrid({ opacity }: { opacity: number }) {
  const geometries = useMemo(
    () => GRID_RINGS.map((r) => new THREE.RingGeometry(r - RING_HALF_WIDTH, r + RING_HALF_WIDTH, 128)),
    [],
  );
  // Un único material para todos los anillos.
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: PLAZA_PALETTE.guide,
        transparent: true,
        opacity,
        depthWrite: false,
        toneMapped: false,
      }),
    [opacity],
  );

  useEffect(() => {
    return () => {
      geometries.forEach((g) => g.dispose());
      material.dispose();
    };
  }, [geometries, material]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
      {geometries.map((geometry, i) => (
        <mesh key={i} geometry={geometry} material={material} renderOrder={-1} />
      ))}
    </group>
  );
}

export function PlazaRoom({ mode, still = false }: { mode: PlazaMode; still?: boolean }) {
  const palette = PLAZA_PALETTES[mode];
  const horizon = plazaHorizon(mode);

  /**
   * La cámara de sombra hay que recalcularla A MANO.
   *
   * R3F escribe `shadow-camera-left` y compañía como propiedades sueltas, pero
   * una ortográfica no se entera de que han cambiado hasta que alguien llama a
   * `updateProjectionMatrix()`. Sin esto la luz se queda con el frustum por
   * defecto (±5, con el sol a 60 del centro) y en pantalla NO se ve ni una
   * sombra: es el síntoma exacto de haber configurado el sol y no ver nada.
   */
  const sunRef = useRef<THREE.DirectionalLight>(null);
  useEffect(() => {
    sunRef.current?.shadow.camera.updateProjectionMatrix();
  }, [mode]);

  const skyTexture = useMemo(() => getSkyTexture(mode), [mode]);
  const floorTexture = useMemo(() => getFloorTexture(mode), [mode]);
  const pavingTexture = useMemo(() => getPavingTexture(mode), [mode]);

  // Las texturas son singletons de módulo (compartidas entre montajes de la
  // plaza) — el dispose real vive en `disposePlazaTextures()`, no aquí. Solo
  // limpiamos lo que es propio de esta instancia: geometrías y materiales.
  const skyGeometry = useMemo(() => new THREE.SphereGeometry(SKY_RADIUS, 48, 64), []);
  const floorGeometry = useMemo(() => new THREE.CircleGeometry(FLOOR_RADIUS, 96), []);
  // El disco del pavimento mide exactamente lo que representa su textura: el
  // despiece es polar, así que la textura y la geometría comparten centro y
  // radio (ver `getPavingTexture`).
  const pavingGeometry = useMemo(() => new THREE.CircleGeometry(PAVING_WORLD_RADIUS, 128), []);
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
   */
  const shadowCatcherGeometry = useMemo(() => new THREE.CircleGeometry(SUN.extent, 128), []);
  const shadowCatcherMaterial = useMemo(
    () => new THREE.ShadowMaterial({ opacity: palette.sunShadow.ground, depthWrite: false }),
    [palette.sunShadow.ground],
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

  const grassMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        // Blanco × mapa: el verde lo pone la teja, que ya lleva el tono del
        // modo. Con `color` además del `map` los dos se multiplicarían y el
        // césped saldría el doble de oscuro.
        color: "#ffffff",
        map: grassTexture,
        roughness: 1,
        metalness: 0,
      }),
    [grassTexture],
  );

  useEffect(() => {
    return () => {
      skyGeometry.dispose();
      floorGeometry.dispose();
      pavingGeometry.dispose();
      grassGeometry.dispose();
      shadowCatcherGeometry.dispose();
    };
  }, [skyGeometry, floorGeometry, pavingGeometry, grassGeometry, shadowCatcherGeometry]);

  useEffect(() => () => grassMaterial.dispose(), [grassMaterial]);
  useEffect(() => () => shadowCatcherMaterial.dispose(), [shadowCatcherMaterial]);

  return (
    <group>
      {/* Sin paredes: el fog lleva el suelo al color del horizonte, que es
          también la base del degradado del cielo — no hay costura. */}
      <fog attach="fog" args={[horizon, palette.fog.near, palette.fog.far]} />

      {/* Cyclorama: esfera invertida vista desde dentro. `toneMapped={false}`
          y `fog={false}` para que el degradado llegue tal cual a pantalla —
          ver justificación completa en plaza-textures.ts. */}
      <mesh geometry={skyGeometry} renderOrder={-4}>
        <meshBasicMaterial
          map={skyTexture}
          side={THREE.BackSide}
          toneMapped={false}
          fog={false}
          depthWrite={false}
        />
      </mesh>

      {/* Nubes (de día) o estrellas (de noche), por dentro del cyclorama. */}
      <CloudBand mode={mode} still={still} />

      {/*
        Suelo sin iluminación (MeshBasicMaterial + toneMapped={false}): el
        color de la textura llega al píxel tal cual, y fondo y suelo coinciden
        en el horizonte. Con un material iluminado el tono pasaría por luz ×
        ACES y no casaría con el cielo.

        Sobre MeshReflectorMaterial (drei): es local, pero repinta la escena
        entera otra vez por frame para el reflejo. Descartado por coste con N
        muñecos.
      */}
      <mesh geometry={floorGeometry} rotation={[-Math.PI / 2, 0, 0]}>
        {/* `polygonOffset` empuja el disco hacia atrás en el z-buffer. Es el
            cinturón además del tirante (`near` alto en `PlazaScene`): el
            césped se le monta encima a 1 mm y a cuarenta unidades de la
            cámara esa distancia es menor que un paso del buffer. */}
        <meshBasicMaterial
          map={floorTexture}
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={2}
          polygonOffsetUnits={4}
        />
      </mesh>

      {/* Césped: SÍ iluminado (MeshStandard), al contrario que el suelo base.
          Es superficie cercana con volumen aparente, y con la luz del modo
          coge el mismo tono que la vegetación que hay plantada encima. */}
      <mesh
        geometry={grassGeometry}
        material={grassMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.004, 0]}
        receiveShadow={false}
      />

      {/*
        Pavimento: capa aparte sobre el suelo base (ver justificación en
        `getPavingTexture`), con el alpha bakeado en la propia textura.
        `depthWrite={false}` para no pelearse en el z-buffer con el suelo, a
        0.002 de distancia.
      */}
      <mesh
        geometry={pavingGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.002, 0]}
        // Antes que la retícula guía (-1): las dos son transparentes y sin
        // z-write, así que el orden de dibujado es lo único que decide quién
        // queda encima. Al revés, el pavimento tapaba las líneas lima.
        renderOrder={-2}
      >
        <meshBasicMaterial map={pavingTexture} transparent depthWrite={false} toneMapped={false} />
      </mesh>

      {/*
        Sombra proyectada del suelo. Por encima de los discos de contacto
        (`LAYER_Y.shadow` = 0.012 en `PlazaDecor`) para que se dibuje después:
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

      <FloorGrid opacity={palette.guideOpacity} />

      {/* Mobiliario y vegetación — ver `PlazaDecor.tsx`. */}
      <PlazaDecor mode={mode} />

      {/* El Pazo, al fondo del parque — ver `PlazaBackdrop.tsx`. */}
      <PlazaBackdrop mode={mode} />

      {/*
        Luz de "vitrina" para los MeshStandardMaterial de la escena bajo ACES.
        En three ≥0.155 la difusa es albedo/π × irradiancia, y ACES multiplica
        por 1/0.6 antes de la curva, así que las intensidades van altas.
        - Hemisphere: base casi sin direccionalidad; el "suelo" es el rebote
          del pavimento, para que las zonas bajas no se ensucien de azul.
        - Key: desde arriba-delante, para sombreado suave.
        - Fill: contraluz flojo que separa la silueta del fondo.
        Los valores los pone el modo (`plaza-mode.ts`): de día manda el sol y
        de noche una hemisférica alta que hace de luz de ciudad.
      */}
      <hemisphereLight args={[palette.hemi.sky, palette.hemi.ground, palette.hemi.intensity]} />
      <directionalLight
        ref={sunRef}
        color={palette.key.color}
        position={sunPosition(palette.key.position)}
        intensity={palette.key.intensity}
        castShadow
        shadow-mapSize={[SUN.map, SUN.map]}
        shadow-camera-left={-SUN.extent}
        shadow-camera-right={SUN.extent}
        shadow-camera-top={SUN.extent}
        shadow-camera-bottom={-SUN.extent}
        shadow-camera-near={SUN.distance - SUN.extent * 1.6}
        shadow-camera-far={SUN.distance + SUN.extent * 1.6}
        // `normalBias` en vez de subir `bias` a lo bruto: el acné de sombra de
        // esta escena sale en superficies curvas (cabezas, copas, pilón), y
        // desplazar por la normal lo quita sin despegar la sombra del pie.
        shadow-bias={-0.0004}
        shadow-normalBias={0.035}
        shadow-intensity={palette.sunShadow.objects}
        // Ensancha el muestreo PCF: el borde de la sombra de un banco pasa de
        // escalón de píxel a filo blando, que es lo que pide una escena mate.
        shadow-radius={1.5}
      />
      <directionalLight color={palette.fill.color} position={[-5, 5, -6]} intensity={palette.fill.intensity} />
    </group>
  );
}
