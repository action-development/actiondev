"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider, type IntersectionEnterPayload, type IntersectionExitPayload } from "@react-three/rapier";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import type { PortPalette } from "./time-of-day";
import { HOLD_FLOOR_Y, HOLD_MAX_X, HOLD_MIN_X, SHIP_DROP_X } from "./crane-logic";
import { getToonGradient, OUTLINE, OUTLINE_THIN } from "./toon";
import { createHoloMaterial, HOLO_COLOR, holoArrowShape } from "./holo-material";
import { CONTAINER_HALF_H } from "./CargoContainer";
import { PaintedShip } from "./PaintedShip";

/**
 * Portacontenedores atracado: la "canasta" del nuevo hero. Un contenedor
 * soltado por la grúa que entra en la bodega dispara la navegación.
 *
 * El casco tiene la regala BAJADA sobre la bodega (y = -6.2) para que el
 * contenedor se vea dentro; si fuese un bloque macizo hasta cubierta, lo
 * tapaba entero la cara frontal del casco.
 */

const HULL_Z = 2.3;
const STERN_X = 5.8;
const BOW_TIP_X = 22;
const LIP_Y = -6.2;
const BRIDGE_X = 18;
/**
 * La marca de carga se centra en la parte VISIBLE de la bodega: a 16:10 el
 * borde derecho del encuadre corta en x ≈ 15, así que el centro real (11.5)
 * dejaba medio marco fuera de pantalla. Es también el punto al que la grúa
 * lleva la carga sola, por eso el valor vive en `crane-logic`.
 */
const MARKER_X = SHIP_DROP_X;
const MARKER_Z = 0.9;
const MARKER_DEPTH = 0.5;

/**
 * Flecha holográfica apuntando a la bodega (punta en y = 0, apunta a -y).
 * Volumen 3D con shader de holograma (líneas de barrido, borde fresnel,
 * parpadeo y doble imagen) en vez de HUD plano: los corchetes de videojuego
 * rompían el estilo pintado, y una flecha opaca no se leía como "señal".
 *
 * El shader vive en `holo-material.ts` desde que la guía del gancho
 * (`HookGuide.tsx`) usa el mismo lenguaje. Los valores por defecto de
 * `createHoloMaterial` SON los de esta flecha: cambiarlos la cambia a ella.
 */

/**
 * Estado del HUECO de descarga (contenedor fantasma en la bodega):
 * - `hidden`: la grúa va de vacío — no hay nada que descargar.
 * - `dim`: lleva carga pero fuera de la fila del barco.
 * - `target`: fila buena, aún no encima de la bodega.
 * - `ready`: encima de la bodega — soltar ahora entra.
 */
export type DropState = "hidden" | "dim" | "target" | "ready";

/**
 * Mando a distancia de la marca de carga. Se usa cuando la grúa se lleva un
 * contenedor a otra FILA: desde ahí no se puede soltar en la bodega, así que la
 * flecha se apaga a medias en vez de seguir invitando. Es un handle imperativo
 * y no un prop para que apagarla NO re-renderice el barco: solo toca uniforms.
 */
export interface ShipHandle {
  /** `true` = flecha atenuada (la carga está fuera de la fila del barco). */
  setDimmed(dimmed: boolean): void;
  /**
   * Hueco fantasma de la bodega. Una llamada por frame desde GameWorld.
   * @param halfW semiancho del contenedor que cuelga (el hueco mide lo mismo).
   * @param landX x donde caería si se suelta ahora (solo cuenta en `ready`).
   */
  setDrop(state: DropState, halfW: number, landX: number): void;
}

/** Opacidad del hueco fantasma por estado. */
const DROP_ALPHA: Record<DropState, number> = { hidden: 0, dim: 0.15, target: 0.45, ready: 1 };
/** Suavizado del hueco (1/s): aparece, se enciende y se desliza sin saltos. */
const DROP_SNAP = 10;

/** Alpha de la flecha: normal y atenuada (la fantasma va siempre más floja). */
const MARKER_ALPHA = 1;
const MARKER_ALPHA_DIM = 0.25;
const GHOST_FACTOR = 0.35;

export interface ShipProps {
  palette: PortPalette;
  onEnterHold: (payload: IntersectionEnterPayload) => void;
  onExitHold: (payload: IntersectionExitPayload) => void;
  /** false = el barco está en el fondo pintado; el casco queda como oclusor invisible. */
  showStatic?: boolean;
  showMarker?: boolean;
}

function hullShape() {
  const s = new THREE.Shape();
  s.moveTo(STERN_X + 0.6, -10);
  s.lineTo(STERN_X, -4.4);
  s.lineTo(HOLD_MIN_X, -4.4);
  s.lineTo(HOLD_MIN_X, LIP_Y);
  s.lineTo(HOLD_MAX_X, LIP_Y);
  s.lineTo(HOLD_MAX_X, -5.9);
  s.lineTo(BOW_TIP_X, -3.9);
  s.lineTo(BOW_TIP_X - 3.5, -10);
  s.closePath();
  return s;
}

export const Ship = forwardRef<ShipHandle, ShipProps>(function Ship(
  { palette, onEnterHold, onExitHold, showStatic = true, showMarker = true },
  ref,
) {
  const gradient = getToonGradient();
  const o = palette.outline;

  const hullGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(hullShape(), { depth: HULL_Z * 2, bevelEnabled: false });
    g.translate(0, 0, -HULL_Z);
    return g;
  }, []);

  const holdCenterX = (HOLD_MIN_X + HOLD_MAX_X) / 2;
  const holdHalfW = (HOLD_MAX_X - HOLD_MIN_X) / 2;
  const lit = palette.lamps > 0.3;

  // Marca de "zona de carga": flecha de cómic que bota sobre la bodega. Es la
  // única pista visual de adónde hay que llevar el contenedor.
  const markerRef = useRef<THREE.Group>(null);
  const arrowGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(holoArrowShape(), { depth: MARKER_DEPTH, bevelEnabled: false });
    g.translate(0, 0, -MARKER_DEPTH / 2);
    return g;
  }, []);
  const holoMat = useMemo(() => createHoloMaterial(), []);

  // Hueco fantasma: "tu contenedor va AQUÍ". Caja unitaria escalada al tamaño
  // de la carga + aristas lima nítidas; la caja sola, de frente, apenas se ve.
  const dropRef = useRef<THREE.Group>(null);
  const dropBoxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const dropEdgeGeo = useMemo(() => new THREE.EdgesGeometry(dropBoxGeo), [dropBoxGeo]);
  const dropMat = useMemo(
    () => createHoloMaterial({ alpha: 0, scanAxis: [0, 1, 0], scanScale: 4, scanSpeed: -1.2, base: 0.22, fresnel: 0.5 }),
    [],
  );
  const dropEdgeMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: HOLO_COLOR, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
    [],
  );
  const drop = useRef({ state: "hidden" as DropState, halfW: 1.3, x: MARKER_X, alpha: 0 });
  const ghostMat = useMemo(() => {
    const m = holoMat.clone();
    m.uniforms.uAlpha.value = GHOST_FACTOR;
    return m;
  }, [holoMat]);

  useImperativeHandle(ref, () => ({
    setDimmed(dimmed: boolean) {
      const a = dimmed ? MARKER_ALPHA_DIM : MARKER_ALPHA;
      holoMat.uniforms.uAlpha.value = a;
      ghostMat.uniforms.uAlpha.value = a * GHOST_FACTOR;
    },
    setDrop(state: DropState, halfW: number, landX: number) {
      const d = drop.current;
      d.state = state;
      d.halfW = halfW;
      // Sobre la bodega el hueco sigue al gancho (es donde caerá); fuera de
      // ella se queda en la marca, que es adonde hay que ir.
      d.x = state === "ready" ? Math.min(Math.max(landX, HOLD_MIN_X + halfW), HOLD_MAX_X - halfW) : MARKER_X;
    },
  }), [holoMat, ghostMat]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    const g = dropRef.current;
    if (g) {
      const d = drop.current;
      const a = 1 - Math.exp(-DROP_SNAP * Math.min(delta, 1 / 30));
      const target = DROP_ALPHA[d.state];
      d.alpha += (target - d.alpha) * a;
      g.visible = d.alpha > 0.01;
      if (g.visible) {
        g.position.x += (d.x - g.position.x) * a;
        g.scale.x += (d.halfW * 2 - g.scale.x) * a;
        // "ready" late: el pulso dice "ahora".
        const pulse = d.state === "ready" ? 0.8 + 0.2 * Math.sin(t * 9) : 1;
        dropMat.uniforms.uAlpha.value = d.alpha * pulse;
        dropMat.uniforms.uTime.value = t;
        dropEdgeMat.opacity = Math.min(d.alpha * 1.4, 1) * pulse;
      }
    }

    const m = markerRef.current;
    if (!m) return;
    holoMat.uniforms.uTime.value = t;
    ghostMat.uniforms.uTime.value = t + 0.13;
    // Bote con rebote seco (|sin|): cae, toca y sube — lenguaje de cartoon.
    const bounce = Math.abs(Math.sin(t * 2.2));
    m.position.y = HOLD_FLOOR_Y + 2.4 + bounce * 0.55;
    // Squash & stretch: se estira al subir, se achata al llegar abajo.
    const sy = 0.94 + bounce * 0.12;
    m.scale.set(1.06 - bounce * 0.12, sy, 1);
    m.rotation.y = Math.sin(t * 0.9) * 0.18;
  });

  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        {/* Suelo de bodega */}
        <CuboidCollider args={[holdHalfW + 0.2, 0.25, 2]} position={[holdCenterX, HOLD_FLOOR_Y - 0.25, 0]} friction={0.9} />
        {/* Mamparo de popa */}
        <CuboidCollider args={[0.25, 1.1, 2]} position={[HOLD_MIN_X - 0.25, -5.5, 0]} />
        {/* Puente — tope por proa */}
        <CuboidCollider args={[1.7, 2.6, 2]} position={[BRIDGE_X, -3.7, 0]} />
        {/* Sensor de bodega */}
        <CuboidCollider
          args={[holdHalfW - 0.2, 0.6, 1.5]}
          position={[holdCenterX, HOLD_FLOOR_Y + 0.7, 0]}
          sensor
          onIntersectionEnter={onEnterHold}
          onIntersectionExit={onExitHold}
        />
      </RigidBody>

      {/* Casco azul con franja roja de flotación (el navy oscuro se perdía de noche) */}
      {showStatic ? (
        <mesh geometry={hullGeo} castShadow receiveShadow>
          <meshToonMaterial color="#2f5bd3" gradientMap={gradient} />
          <Outlines thickness={OUTLINE} color={o} />
        </mesh>
      ) : (
        // Nuestro barco en 3D, DELANTE del pintado y tapándolo: misma silueta,
        // así que el encuadre no se mueve y la bodega sigue siendo jugable.
        <PaintedShip lit={lit} />
      )}

      <group visible={showStatic}>
      <mesh position={[13.5, -7.55, HULL_Z + 0.01]}>
        <planeGeometry args={[15.5, 0.7]} />
        <meshBasicMaterial color="#d9432f" toneMapped={false} />
      </mesh>

      {/* Suelo de bodega visible */}
      <mesh position={[holdCenterX, HOLD_FLOOR_Y - 0.05, 0]} receiveShadow>
        <boxGeometry args={[HOLD_MAX_X - HOLD_MIN_X, 0.1, HULL_Z * 2 - 0.2]} />
        <meshToonMaterial color="#2a3a66" gradientMap={gradient} />
      </mesh>
      </group>

      {/* Hueco fantasma de descarga: solo con carga colgando (ver `setDrop`). */}
      {showMarker && (
        <group
          ref={dropRef}
          position={[MARKER_X, HOLD_FLOOR_Y + CONTAINER_HALF_H, 0]}
          scale={[2.6, CONTAINER_HALF_H * 2, 1.5]}
          visible={false}
        >
          <mesh geometry={dropBoxGeo} material={dropMat} />
          <lineSegments geometry={dropEdgeGeo} material={dropEdgeMat} />
        </group>
      )}

      <group ref={markerRef} position={[MARKER_X, HOLD_FLOOR_Y + 2.4, MARKER_Z]} visible={showMarker}>
        {/* Doble imagen desfasada: la "interferencia" del proyector */}
        <mesh geometry={arrowGeo} material={ghostMat} position={[0.12, 0.06, -0.04]} />
        <mesh geometry={arrowGeo} material={holoMat}>
          <Outlines thickness={OUTLINE_THIN} color="#eaffb0" transparent opacity={0.7} />
        </mesh>
      </group>

      <group visible={showStatic}>
      {/* Puente de mando */}
      <group position={[BRIDGE_X, -3.7, 0]}>
        <mesh castShadow>
          <boxGeometry args={[3.2, 5.2, 3.6]} />
          <meshToonMaterial color="#f2efe6" gradientMap={gradient} />
          <Outlines thickness={OUTLINE_THIN} color={o} />
        </mesh>
        <mesh position={[0, 1.6, 1.81]}>
          <planeGeometry args={[2.6, 0.7]} />
          <meshBasicMaterial color={lit ? "#fff3b0" : "#4b6f94"} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.2, 1.81]}>
          <planeGeometry args={[2.6, 0.45]} />
          <meshBasicMaterial color={lit ? "#ffd86b" : "#4b6f94"} toneMapped={false} />
        </mesh>
        {/* Chimenea con la banda de marca */}
        <mesh position={[0.4, 3.4, -0.6]} castShadow>
          <boxGeometry args={[1.1, 1.6, 1.1]} />
          <meshToonMaterial color="#17244a" gradientMap={gradient} />
          <Outlines thickness={OUTLINE_THIN} color={o} />
        </mesh>
        <mesh position={[0.4, 3.5, -0.04]}>
          <planeGeometry args={[1.1, 0.35]} />
          <meshBasicMaterial color="#c8ff00" toneMapped={false} />
        </mesh>
      </group>
      </group>
    </group>
  );
});
