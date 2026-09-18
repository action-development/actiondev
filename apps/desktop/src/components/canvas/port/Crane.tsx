"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { RigidBody, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import type { PortPalette } from "./time-of-day";
import { QUAY_TOP_Y } from "./crane-logic";
import { getToonGradient, OUTLINE, OUTLINE_THIN } from "./toon";
import { scratchRapierVec } from "../_pools";
import {
  PaintedCraneStructure, PaintedSpreader, PaintedTrolley, PAINTED_CABLE_COLOR,
  GANTRY_WHEEL_R, TROLLEY_WHEEL_R, type CraneLayout,
} from "./PaintedCranePieces";

/**
 * Grúa pórtico STS pintada en lima de marca — la protagonista del hero.
 *
 * Solo es VISUAL + el cuerpo cinemático del spreader. Toda la lógica (dónde
 * está el carro, a qué altura va el spreader, qué lleva enganchado) vive en el
 * `useFrame` de GameWorld y llega aquí por `update()`, una vez por frame. Así
 * hay un único bucle de juego y ningún estado duplicado entre componentes.
 *
 * Las patas están en z = -2 respecto al carro (detrás de su fila): los
 * contenedores pasan por delante sin chocar y la grúa se lee de perfil, como se
 * ve desde la ría.
 *
 * PROFUNDIDAD: la grúa ENTERA viaja en z de una fila del muelle a otra
 * (`quay-rows.ts`). Eso lo hace el grupo raíz, que se recoloca en `update()`
 * con la `gantryZ` que manda GameWorld. Todo lo de dentro (pluma, patas, carro,
 * cables) está en coordenadas LOCALES y viaja gratis con él; la única pieza que
 * hay que mover a mano es el spreader, porque es un RigidBody y Rapier lo
 * coloca en MUNDO, no heredando la transformación del padre.
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
export const LEG_Z = -2;
const BOOM_LEFT = -21;
const BOOM_RIGHT = 18.5;
const APEX: [number, number] = [-14.75, 8.6];
const BEACONS = [-12, -4, 4, 12, 18];

/* --- Geometría de la pluma y del tren carro/cabina/cables/spreader ---
 *
 * De perfil, una STS real: el carro va ENCIMA del ala superior de la pluma
 * (`BOOM_TOP_Y`), la cabina cuelga por debajo colgada de dos brazos y los 4
 * cables bajan por fuera de la cabina hasta el headblock del spreader.
 */
/** Canto de la pluma pintada (0.75) y su z/fondo — los usa también el carro. */
const BOOM_HALF_H = 0.375;
export const BOOM_Z = -0.6;
const BOOM_DEPTH = 1;
/** Cara superior de la pluma: es donde se apoya el carro (y se posan las gaviotas). */
export const BOOM_TOP_Y = BOOM_Y + BOOM_HALF_H;
/** Centro de la cabina del gruista (mundo). Su bajo queda 0.38 sobre el headblock recogido. */
const CABIN_Y = 3.62;
/** Alto del headblock del spreader: los cables mueren en su cara de arriba. */
const HEADBLOCK_H = 0.34;
/** Separación en x de cada par de cables: libran el ancho de la cabina (1.85). */
const ROPE_DX = 1.08;
/** 4 cables = 2 parejas, una por cada costado de la cabina y a dos profundidades. */
const ROPE_SX = [-1, -1, 1, 1];
const ROPE_ZS = [0.55, -0.55, 0.55, -0.55];
/** Carro de la versión toon (procedural), que cuelga bajo la pluma. */
const TROLLEY_Y = BOOM_Y - 0.65;
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
  /**
   * Coloca pórtico, carro, cables y spreader. `hookY` = centro del spreader
   * (mundo) y `gantryZ` = profundidad de TODA la grúa (fila del muelle).
   */
  update(trolleyX: number, hookX: number, hookY: number, gantryZ: number): void;
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
  const rootRef = useRef<THREE.Group>(null);
  const trolleyRef = useRef<THREE.Group>(null);
  const cableRefs = useRef<(THREE.Mesh | null)[]>([]);
  const spreaderRef = useRef<RapierRigidBody>(null);
  // Ruedas del pórtico y del carro: grupos planos cuyos hijos se giran uno a uno.
  const gantryWheelsRef = useRef<THREE.Group>(null);
  const trolleyWheelsRef = useRef<THREE.Group>(null);
  // Última posición vista, para sacar el avance de este frame. NaN = primer frame.
  const lastGantryZ = useRef(NaN);
  const lastTrolleyX = useRef(NaN);

  useImperativeHandle(ref, () => ({
    update(trolleyX, hookX, hookY, gantryZ) {
      // Toda la estructura viaja en profundidad de golpe.
      if (rootRef.current) rootRef.current.position.z = gantryZ;
      if (trolleyRef.current) trolleyRef.current.position.x = trolleyX;

      /*
       * Rodadura: el giro sale del AVANCE real (θ += Δs / r), no de un reloj,
       * así la rueda para cuando para la grúa y gira al revés al volver.
       * Los ejes van horneados en la geometría de cada rueda, de modo que aquí
       * solo se toca un ángulo del grupo y no hay Euler cruzados.
       *   - Pórtico: eje X. Con +x a la derecha, subir `rotation.x` lleva el
       *     punto alto de la rueda hacia +z → rueda hacia +z. Signo directo.
       *   - Carro: eje Z. Ahí el punto alto va hacia +x al BAJAR el ángulo.
       */
      const gw = gantryWheelsRef.current;
      if (gw && !Number.isNaN(lastGantryZ.current)) {
        const spin = (gantryZ - lastGantryZ.current) / GANTRY_WHEEL_R;
        if (spin !== 0) for (let i = 0; i < gw.children.length; i++) gw.children[i].rotation.x += spin;
      }
      lastGantryZ.current = gantryZ;

      const tw = trolleyWheelsRef.current;
      if (tw && !Number.isNaN(lastTrolleyX.current)) {
        const spin = (trolleyX - lastTrolleyX.current) / TROLLEY_WHEEL_R;
        if (spin !== 0) for (let i = 0; i < tw.children.length; i++) tw.children[i].rotation.z -= spin;
      }
      lastTrolleyX.current = trolleyX;

      // Los 4 cables mueren en la cara de arriba del headblock y suben rectos
      // al carro. Bucle sin reservas: solo escribe en los meshes ya creados.
      const top = hookY + SPREADER_HALF_H + HEADBLOCK_H;
      for (let i = 0; i < ROPE_SX.length; i++) {
        const c = cableRefs.current[i];
        if (!c) continue;
        const dx = ROPE_SX[i] * ROPE_DX;
        placeBar(c, hookX + dx, top, trolleyX + dx, BOOM_TOP_Y);
      }
      const rb = spreaderRef.current;
      if (rb) {
        // En MUNDO: un RigidBody no hereda la transformación del grupo padre.
        scratchRapierVec.x = hookX; scratchRapierVec.y = hookY; scratchRapierVec.z = gantryZ;
        rb.setNextKinematicTranslation(scratchRapierVec);
      }
    },
  }), []);

  const o = palette.outline;
  const lampColor = palette.lamps > 0.3 ? LIME : "#5b6340";
  const boomLen = BOOM_RIGHT - BOOM_LEFT;

  return (
    <group>
      {/* Todo lo VISUAL viaja en profundidad con este grupo. */}
      <group ref={rootRef}>
      {!showStatic && <PaintedCraneStructure layout={PAINTED_LAYOUT} wheelsRef={gantryWheelsRef} />}
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

      {/* A-frame + tirantes hasta la punta de la pluma. Detrás de la viga
          (z = -1.35), igual que en el modo pintado: por delante estorban a los
          cables y al carro. */}
      <StaticBar from={[LEG_XS[0], BOOM_Y]} to={APEX} z={-1.35} thickness={0.32} color={o} />
      <StaticBar from={[LEG_XS[1], BOOM_Y]} to={APEX} z={-1.35} thickness={0.32} color={o} />
      <StaticBar from={APEX} to={[BOOM_RIGHT - 0.5, BOOM_Y + 0.3]} z={-1.35} thickness={0.1} color={o} />
      <StaticBar from={APEX} to={[BOOM_LEFT + 0.5, BOOM_Y + 0.3]} z={-1.35} thickness={0.1} color={o} />

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
        {/* Cabina centrada bajo el carro: los cables pasan por fuera de ella */}
        <mesh position={[0, TROLLEY_Y - 0.85, 0.2]}>
          <boxGeometry args={[1.2, 1.05, 1.1]} />
          <meshToonMaterial color="#f2efe6" gradientMap={gradient} />
          <Outlines thickness={OUTLINE_THIN} color={o} />
        </mesh>
        {/* Ventanal: encendido de noche — hay alguien dentro manejando */}
        <mesh position={[0, TROLLEY_Y - 0.8, 0.76]}>
          <planeGeometry args={[0.95, 0.5]} />
          <meshBasicMaterial color={palette.lamps > 0.3 ? "#fff3b0" : "#9ec9e8"} toneMapped={false} />
        </mesh>
          </>
        ) : (
          <PaintedTrolley
            boomTopY={BOOM_TOP_Y}
            boomZ={BOOM_Z}
            boomDepth={BOOM_DEPTH}
            cabinY={CABIN_Y}
            wheelsRef={trolleyWheelsRef}
          />
        )}
      </group>

      {/* --- Cables: 2 parejas, a dos z, por fuera de la cabina (se recolocan en update) --- */}
      {ROPE_ZS.map((z, i) => (
        <mesh key={i} position-z={z} visible={showMoving} ref={(m) => { cableRefs.current[i] = m; }}>
          <cylinderGeometry args={[showStatic ? 0.045 : 0.035, showStatic ? 0.045 : 0.035, 1, 6]} />
          <meshBasicMaterial color={showStatic ? o : PAINTED_CABLE_COLOR} />
        </mesh>
      ))}
      </group>

      {/* --- Spreader: cuerpo cinemático, empuja contenedores si los barre ---
          VA FUERA del grupo que viaja en z, aunque visualmente pertenezca a él:
          @react-three/rapier guarda la inversa de la matriz del PADRE una sola
          vez, al crear el cuerpo, y no la recalcula. Dentro del grupo móvil esa
          foto se queda con z = 0 y el spreader saldría pintado a 2 × gantryZ.
          Aquí el padre no se mueve nunca y la posición de mundo que escribe
          `update()` es la que se ve. */}
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
        {/* Headblock: donde aterrizan los 4 cables */}
        <mesh position={[0, SPREADER_HALF_H + HEADBLOCK_H / 2, 0]}>
          <boxGeometry args={[ROPE_DX * 2 + 0.16, HEADBLOCK_H, 1.3]} />
          <meshToonMaterial color="#2b2f3f" gradientMap={gradient} />
          <Outlines thickness={OUTLINE_THIN} color={o} />
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
          <PaintedSpreader halfW={SPREADER_HALF_W} halfH={SPREADER_HALF_H} headblockH={HEADBLOCK_H} ropeDx={ROPE_DX} />
        )}
        </group>
      </RigidBody>
    </group>
  );
});
