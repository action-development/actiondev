"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import {
  CAMERA,
  FOCUS,
  HOTSPOTS,
  cameraDistance,
  focusScreenY,
  isStill,
  targetDrop,
  type HotspotId,
} from "./street-config";
import type { StreetMode, StreetPalette } from "./street-mode";
import { StreetFacade } from "./StreetFacade";
import { Hotspot } from "./Hotspot";
import { PhoneBooth } from "./PhoneBooth";
import { Postbox } from "./Postbox";
import { Intercom } from "./Intercom";

/** Rótulos de los objetos, ya traducidos: la escena no sabe de i18n. */
export interface StreetLabels {
  whatsapp: { tag: string; action: string };
  email: { tag: string; action: string };
  callback: { tag: string; action: string };
  /** Caja de luz de la cabina y pantalla del teléfono (dos líneas). */
  booth: string;
  lcd: [string, string];
  /** Placa del buzón y título de su placa de horarios. */
  postbox: string;
  collection: string;
}

export interface StreetWorldProps {
  mode: StreetMode;
  palette: StreetPalette;
  labels: StreetLabels;
  /** Objeto resaltado: apuntado en la escena o su canal apuntado en el HUD.
   * Lo compone la página, que es quien sabe de los dos lados. */
  highlight: HotspotId | null;
  /** Contador de usos por objeto: cada cambio dispara su animación. */
  activations: Record<HotspotId, number>;
  onHoverChange: (id: HotspotId | null) => void;
  onActivate: (id: HotspotId) => void;
  onReady?: () => void;
}

/** Suavizado exponencial independiente del framerate (mismo que la plaza). */
function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/** Encuadre de la sombra del sol: el portal y la acera, nada más. */
const SHADOW_BOX = { half: 13, near: 1, far: 50, mapSize: 2048 } as const;

/**
 * Mundo de /contact: la calle, la luz y la cámara.
 *
 * La cámara no anda. Está en la acera de enfrente con un paralaje suave de
 * ratón (lo justo para que el soportal se lea hundido) y al llegar se acerca
 * desde un poco más lejos. Con pantallas estrechas retrocede lo necesario
 * para que la cabina y el buzón sigan en plano (`cameraDistance`).
 *
 * Al apuntar un objeto (en la calle o su canal en el HUD) la cámara se acerca
 * y lo encuadra de frente (`FOCUS`), por encima del HUD (`focusScreenY`); al
 * soltarlo vuelve a la acera. Posición y punto de mira se suavizan hacia su
 * destino, así que pasar de un objeto a otro es un solo movimiento continuo.
 */
export function StreetWorld({
  mode,
  palette,
  labels,
  highlight,
  activations,
  onHoverChange,
  onActivate,
  onReady,
}: StreetWorldProps) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const still = useMemo(() => isStill(), []);
  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const introT = useRef(still || reducedMotion ? 1 : 0);
  const pan = useRef({ x: 0, y: 0 });
  const readyFired = useRef(false);
  const sun = useRef<THREE.DirectionalLight>(null);
  // Estado suavizado de la cámara y destinos del frame (sin alocar por frame).
  const camPos = useRef<THREE.Vector3 | null>(null);
  const lookAt = useRef<THREE.Vector3 | null>(null);
  const wantPos = useMemo(() => new THREE.Vector3(), []);
  const wantLook = useMemo(() => new THREE.Vector3(), []);
  const hoveredRef = useRef<HotspotId | null>(null);

  // La cámara de sombra hay que recalcularla A MANO: R3F escribe
  // `shadow-camera-left` y compañía como propiedades sueltas y la
  // ortográfica no se entera (mismo síntoma y arreglo que en la plaza).
  useLayoutEffect(() => {
    const light = sun.current;
    if (!light) return;
    const cam = light.shadow.camera;
    cam.left = -SHADOW_BOX.half;
    cam.right = SHADOW_BOX.half;
    cam.top = SHADOW_BOX.half;
    cam.bottom = -SHADOW_BOX.half;
    cam.near = SHADOW_BOX.near;
    cam.far = SHADOW_BOX.far;
    cam.updateProjectionMatrix();
    light.target.position.set(0, 0, 0);
    light.target.updateMatrixWorld();
  }, []);

  const setHovered = (id: HotspotId | null) => {
    hoveredRef.current = id;
    gl.domElement.style.cursor = id ? "pointer" : "auto";
    onHoverChange(id);
  };
  const handleHover = (id: HotspotId) => setHovered(id);
  // Solo suelta si el que sale es el que está enfocado: al pasar directo de
  // la cabina al portero, la salida retrasada de la cabina no debe borrar al
  // portero recién apuntado.
  const handleLeave = (id: HotspotId) => {
    if (hoveredRef.current === id) setHovered(null);
  };

  useEffect(
    () => () => {
      gl.domElement.style.cursor = "auto";
    },
    [gl]
  );

  // Entorno para los reflejos: `RoomEnvironment` es una sala generada en
  // código y prefiltrada con PMREM — nada que descargar, al contrario que los
  // `preset` de drei (ver "Errores prohibidos" en CLAUDE.md). Sin él, todo lo
  // metálico o pulido se veía de plástico mate.
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  useEffect(() => {
    scene.environmentIntensity = palette.envIntensity;
  }, [scene, palette.envIntensity]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const aspect = size.width / size.height;
    const distance = cameraDistance(aspect);

    if (introT.current < 1) introT.current = Math.min(1, introT.current + dt / CAMERA.introSeconds);
    // Ease-out cúbico: llega rápido y se posa.
    const intro = 1 - Math.pow(1 - introT.current, 3);

    if (!still) {
      pan.current.x = damp(pan.current.x, state.pointer.x * CAMERA.parallax.x, 3, dt);
      pan.current.y = damp(pan.current.y, state.pointer.y * CAMERA.parallax.y, 3, dt);
    }

    // Destino en reposo: la acera de enfrente.
    wantPos.set(pan.current.x, CAMERA.eyeY + pan.current.y, distance + CAMERA.introExtra * (1 - intro));
    wantLook.set(CAMERA.target[0], CAMERA.target[1] - targetDrop(aspect), CAMERA.target[2]);

    // Destino enfocado: delante del objeto, sobre su normal.
    if (highlight) {
      const spot = HOTSPOTS[highlight];
      const f = FOCUS[highlight];
      const k = CAMERA.focusParallax;
      wantPos.set(
        spot.x + Math.sin(spot.rotY) * f.distance + pan.current.x * k,
        f.eye + pan.current.y * k,
        spot.z + Math.cos(spot.rotY) * f.distance
      );
      // Mirar un poco por debajo del objeto lo sube en pantalla, por encima
      // del HUD: a `focusScreenY` en NDC.
      const halfTan = Math.tan(THREE.MathUtils.degToRad(CAMERA.fov / 2));
      wantLook.set(spot.x, f.target - f.distance * halfTan * focusScreenY(aspect), spot.z);
    }

    if (!camPos.current || !lookAt.current) {
      camPos.current = wantPos.clone();
      lookAt.current = wantLook.clone();
    } else {
      const a = 1 - Math.exp(-CAMERA.focusLambda * dt);
      // La entrada manda sola en el primer tramo: si no, el suavizado se
      // comería la mitad del acercamiento inicial.
      const blend = introT.current < 1 && !highlight ? 1 : a;
      camPos.current.lerp(wantPos, blend);
      lookAt.current.lerp(wantLook, blend);
    }
    camera.position.copy(camPos.current);
    camera.lookAt(lookAt.current);

    // La niebla cuenta desde la cámara: con pantallas estrechas la cámara
    // retrocede y, con la niebla fija, la calle entera quedaba dentro de ella.
    if (scene.fog instanceof THREE.Fog) {
      const extra = distance - CAMERA.distance;
      scene.fog.near = palette.fog.near + extra;
      scene.fog.far = palette.fog.far + extra;
    }

    if (!readyFired.current) {
      readyFired.current = true;
      // Tras el primer frame pintado, no en el mount: si no, la persiana se
      // recogería antes de que hubiera nada detrás.
      onReady?.();
    }
  });

  const isActive = (id: HotspotId) => highlight === id;
  const hotspotProps = { still, onHover: handleHover, onLeave: handleLeave, onActivate } as const;

  return (
    <>
      <color attach="background" args={[palette.background]} />
      <fog attach="fog" args={[palette.background, palette.fog.near, palette.fog.far]} />

      <hemisphereLight args={[palette.hemi.sky, palette.hemi.ground, palette.hemi.intensity]} />
      <directionalLight
        ref={sun}
        color={palette.key.color}
        intensity={palette.key.intensity}
        position={palette.key.position}
        castShadow
        shadow-mapSize={[SHADOW_BOX.mapSize, SHADOW_BOX.mapSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={3}
        shadow-intensity={palette.shadow}
      />
      {/* Luz cálida del soportal: la única real bajo el techo de madera. */}
      <pointLight
        color={palette.portalLight.color}
        intensity={palette.portalLight.intensity}
        position={[2.5, 3.1, -0.9]}
        distance={14}
        decay={2}
      />
      {/* Farola de la acera, fuera de plano por la derecha. Solo de noche. */}
      {palette.streetLamp && (
        <spotLight
          color={palette.streetLamp.color}
          intensity={palette.streetLamp.intensity}
          position={[9, 7.5, 8]}
          angle={0.85}
          penumbra={0.9}
          distance={40}
          decay={2}
        />
      )}

      <StreetFacade mode={mode} palette={palette} />

      <Hotspot
        id="whatsapp"
        active={isActive("whatsapp")}
        hitSize={[1.5, 2.8, 1.4]}
        hitCenter={[0, 1.4, 0]}
        label={labels.whatsapp.tag}
        action={labels.whatsapp.action}
        {...hotspotProps}
      >
        <PhoneBooth
          activation={activations.whatsapp}
          lightsOn={palette.lightsOn}
          signLabel={labels.booth}
          lcd={labels.lcd}
        />
      </Hotspot>

      <Hotspot
        id="email"
        active={isActive("email")}
        hitSize={[1.1, 1.9, 1]}
        hitCenter={[0, 0.95, 0]}
        label={labels.email.tag}
        action={labels.email.action}
        {...hotspotProps}
      >
        <Postbox activation={activations.email} plateLabel={labels.postbox} collectionTitle={labels.collection} />
      </Hotspot>

      <Hotspot
        id="callback"
        active={isActive("callback")}
        hitSize={[0.9, 1.3, 0.3]}
        hitCenter={[0, HOTSPOTS.callback.beacon - 0.85, 0.1]}
        label={labels.callback.tag}
        action={labels.callback.action}
        {...hotspotProps}
      >
        <Intercom active={isActive("callback")} activation={activations.callback} lightsOn={palette.lightsOn} />
      </Hotspot>
    </>
  );
}
