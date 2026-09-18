"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { RigidBody, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import type { PortPalette } from "./time-of-day";
import { QUAY_TOP_Y } from "./crane-logic";
import { getToonGradient, OUTLINE, OUTLINE_THIN } from "./toon";
import { scratchRapierVec } from "../_pools";
import { PaintedCraneStructure, PaintedSpreader, PaintedTrolley, PAINTED_CABLE_COLOR, type CraneLayout } from "./PaintedCranePieces";

/**
 * Grúa pórtico STS pintada en lima de marca — la protagonista del hero.
 *
 * Solo es VISUAL + el cuerpo cinemático del spreader. Toda la lógica (dónde
 * está el carro, a qué altura va el spreader, qué lleva enganchado) vive en el
 * `useFrame` de GameWorld y llega aquí por `update()`, una vez por frame. Así
 * hay un único bucle de juego y ningún estado duplicado entre componentes.
 *
 * Las patas están en z = -2 (detrás del plano de juego): los contenedores pasan
 * por delante sin chocar y la grúa se lee de perfil, como se ve desde la ría.
 */

export const BOOM_Y = 4.6;
export const TROLLEY_MIN_X = -17;
export const TROLLEY_MAX_X = 16;
/** Y del centro del spreader cuando está recogido arriba. */
export const HOOK_TOP_Y = 2.3;
/** Carro aparcado sobre el agua al arrancar: lejos de donde caen los contenedores. */
export const CRANE_START_X = 8;
export const SPREADER_HALF_W = 1.7;
export const SPREADER_HALF_H = 0.2;

// Patas a la izquierda del encuadre: una pata en el centro partía la escena en dos.
const LEG_XS = [-19, -10.5];
const LEG_Z = -2;
const BOOM_LEFT = -21;
const BOOM_RIGHT = 18.5;
const APEX: [number, number] = [-14.75, 8.6];
const TROLLEY_Y = BOOM_Y - 0.65;
const BEACONS = [-12, -4, 4, 12, 18];
const PAINTED_LAYOUT: CraneLayout = {
  legXs: LEG_XS, legZ: LEG_Z, boomY: BOOM_Y, boomLeft: BOOM_LEFT, boomRight: BOOM_RIGHT,
  apex: APEX, quayTopY: QUAY_TOP_Y, beacons: BEACONS,
};

const LIME = "#c8ff00";

interface CraneProps {
  palette: PortPalette;
  /** Pórtico, pluma y balizas procedurales (false = versión con acabado pintado). */
  showStatic?: boolean;
  /** Carro, cables y spreader. */
  showMoving?: boolean;
}

export interface CraneHandle {
  /** Coloca carro, cables y spreader. `hookY` = centro del spreader (mundo). */
  update(trolleyX: number, hookX: number, hookY: number): void;
}

/** Barra entre dos puntos del plano XY (para tirantes y cables). */
function placeBar(mesh: THREE.Object3D, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  mesh.position.x = (x1 + x2) / 2;
  mesh.position.y = (y1 + y2) / 2;
  mesh.scale.y = Math.sqrt(dx * dx + dy * dy);
  mesh.rotation.z = -Math.atan2(dx, dy);
}

function StaticBar({ from, to, z, thickness, color }: {
  from: [number, number]; to: [number, number]; z: number; thickness: number; color: string;
}) {
  return (
    <mesh
      ref={(m) => { if (m) placeBar(m, from[0], from[1], to[0], to[1]); }}
      position-z={z}
      castShadow
    >
      <boxGeometry args={[thickness, 1, thickness]} />
      <meshToonMaterial color={LIME} gradientMap={getToonGradient()} />
      <Outlines thickness={OUTLINE_THIN} color={color} />
    </mesh>
  );
}

export const Crane = forwardRef<CraneHandle, CraneProps>(function Crane({ palette, showStatic = true, showMoving = true }, ref) {
  const gradient = getToonGradient();
  const trolleyRef = useRef<THREE.Group>(null);
  const cableRefs = useRef<(THREE.Mesh | null)[]>([]);
  const spreaderRef = useRef<RapierRigidBody>(null);

  useImperativeHandle(ref, () => ({
    update(trolleyX, hookX, hookY) {
      if (trolleyRef.current) trolleyRef.current.position.x = trolleyX;
      const top = hookY + SPREADER_HALF_H;
      const c0 = cableRefs.current[0];
      const c1 = cableRefs.current[1];
      if (c0) placeBar(c0, hookX - 1.1, top, trolleyX - 0.45, TROLLEY_Y - 0.3);
      if (c1) placeBar(c1, hookX + 1.1, top, trolleyX + 0.45, TROLLEY_Y - 0.3);
      const rb = spreaderRef.current;
      if (rb) {
        scratchRapierVec.x = hookX; scratchRapierVec.y = hookY; scratchRapierVec.z = 0;
        rb.setNextKinematicTranslation(scratchRapierVec);
      }
    },
  }), []);

  const o = palette.outline;
  const lampColor = palette.lamps > 0.3 ? LIME : "#5b6340";
  const boomLen = BOOM_RIGHT - BOOM_LEFT;

  return (
    <group>
      {!showStatic && <PaintedCraneStructure layout={PAINTED_LAYOUT} />}
      <group visible={showStatic}>
      {/* --- Pórtico: patas + travesaños hasta la pluma --- */}
      {LEG_XS.map((x) => (
        <group key={x}>
          <mesh position={[x, (QUAY_TOP_Y + BOOM_Y) / 2, LEG_Z]} castShadow>
            <boxGeometry args={[0.7, BOOM_Y - QUAY_TOP_Y, 0.7]} />
            <meshToonMaterial color={LIME} gradientMap={gradient} />
            <Outlines thickness={OUTLINE} color={o} />
          </mesh>
          <mesh position={[x, BOOM_Y, (LEG_Z - 0.6) / 2]}>
            <boxGeometry args={[0.6, 0.6, Math.abs(LEG_Z) + 0.6]} />
            <meshToonMaterial color={LIME} gradientMap={gradient} />
            <Outlines thickness={OUTLINE_THIN} color={o} />
          </mesh>
          {/* Bogie sobre el carril */}
          <mesh position={[x, QUAY_TOP_Y + 0.3, LEG_Z]}>
            <boxGeometry args={[2, 0.6, 0.9]} />
            <meshToonMaterial color="#2b2f3f" gradientMap={gradient} />
            <Outlines thickness={OUTLINE_THIN} color={o} />
          </mesh>
        </group>
      ))}
      {/* Travesaño del pórtico — una riostra en X tapaba los contenedores */}
      <mesh position={[(LEG_XS[0] + LEG_XS[1]) / 2, 0.8, LEG_Z]}>
        <boxGeometry args={[LEG_XS[1] - LEG_XS[0], 0.5, 0.5]} />
        <meshToonMaterial color={LIME} gradientMap={gradient} />
        <Outlines thickness={OUTLINE_THIN} color={o} />
      </mesh>

      {/* --- Pluma --- */}
      <mesh position={[(BOOM_LEFT + BOOM_RIGHT) / 2, BOOM_Y, -0.6]} castShadow>
        <boxGeometry args={[boomLen, 0.6, 1]} />
        <meshToonMaterial color={LIME} gradientMap={gradient} />
        <Outlines thickness={OUTLINE} color={o} />
      </mesh>

      {/* A-frame + tirantes hasta la punta de la pluma */}
      <StaticBar from={[LEG_XS[0], BOOM_Y]} to={APEX} z={-0.6} thickness={0.32} color={o} />
      <StaticBar from={[LEG_XS[1], BOOM_Y]} to={APEX} z={-0.6} thickness={0.32} color={o} />
      <StaticBar from={APEX} to={[BOOM_RIGHT - 0.5, BOOM_Y + 0.3]} z={-0.6} thickness={0.1} color={o} />
      <StaticBar from={APEX} to={[BOOM_LEFT + 0.5, BOOM_Y + 0.3]} z={-0.6} thickness={0.1} color={o} />

      {/* Sala de máquinas en el contrapeso */}
      <mesh position={[BOOM_LEFT + 2.2, BOOM_Y + 1.1, -0.6]} castShadow>
        <boxGeometry args={[3.4, 1.5, 1.8]} />
        <meshToonMaterial color="#f2efe6" gradientMap={gradient} />
        <Outlines thickness={OUTLINE_THIN} color={o} />
      </mesh>

      {/* Balizas bajo la pluma */}
      {BEACONS.map((x) => (
        <mesh key={x} position={[x, BOOM_Y - 0.45, 0]}>
          <sphereGeometry args={[0.16, 8, 8]} />
          <meshBasicMaterial color={lampColor} toneMapped={false} />
        </mesh>
      ))}

      </group>

      {/* --- Carro + cabina del gruista --- */}
      <group ref={trolleyRef} position={[CRANE_START_X, 0, 0]} visible={showMoving}>
        {showStatic ? (
          <>
        <mesh position={[0, TROLLEY_Y, -0.2]}>
          <boxGeometry args={[2, 0.55, 1.5]} />
          <meshToonMaterial color="#f2efe6" gradientMap={gradient} />
          <Outlines thickness={OUTLINE_THIN} color={o} />
        </mesh>
        <mesh position={[1.35, TROLLEY_Y - 0.85, 0.2]}>
          <boxGeometry args={[1.2, 1.05, 1.1]} />
          <meshToonMaterial color="#f2efe6" gradientMap={gradient} />
          <Outlines thickness={OUTLINE_THIN} color={o} />
        </mesh>
        {/* Ventanal: encendido de noche — hay alguien dentro manejando */}
        <mesh position={[1.35, TROLLEY_Y - 0.8, 0.76]}>
          <planeGeometry args={[0.95, 0.5]} />
          <meshBasicMaterial color={palette.lamps > 0.3 ? "#fff3b0" : "#9ec9e8"} toneMapped={false} />
        </mesh>
          </>
        ) : (
          <PaintedTrolley trolleyY={TROLLEY_Y} />
        )}
      </group>

      {/* --- Cables (se recolocan en update) --- */}
      {[0, 1].map((i) => (
        <mesh key={i} visible={showMoving} ref={(m) => { cableRefs.current[i] = m; }}>
          <cylinderGeometry args={[showStatic ? 0.045 : 0.035, showStatic ? 0.045 : 0.035, 1, 6]} />
          <meshBasicMaterial color={showStatic ? o : PAINTED_CABLE_COLOR} />
        </mesh>
      ))}

      {/* --- Spreader: cuerpo cinemático, empuja contenedores si los barre --- */}
      <RigidBody
        ref={spreaderRef}
        type="kinematicPosition"
        colliders={false}
        position={[CRANE_START_X, HOOK_TOP_Y, 0]}
        name="spreader"
      >
        <CuboidCollider args={[SPREADER_HALF_W, SPREADER_HALF_H, 0.7]} />
        <group visible={showMoving}>
        {showStatic ? (
          <>
        <mesh>
          <boxGeometry args={[SPREADER_HALF_W * 2, SPREADER_HALF_H * 2, 1.5]} />
          <meshToonMaterial color="#2b2f3f" gradientMap={gradient} />
          <Outlines thickness={OUTLINE} color={o} />
        </mesh>
        {/* Twistlocks lima en las esquinas */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (SPREADER_HALF_W - 0.2), -SPREADER_HALF_H - 0.08, 0.5]}>
            <boxGeometry args={[0.25, 0.16, 0.25]} />
            <meshBasicMaterial color={LIME} toneMapped={false} />
          </mesh>
        ))}
          </>
        ) : (
          <PaintedSpreader halfW={SPREADER_HALF_W} halfH={SPREADER_HALF_H} />
        )}
        </group>
      </RigidBody>
    </group>
  );
});
