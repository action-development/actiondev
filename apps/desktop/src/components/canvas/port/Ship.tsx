"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider, type IntersectionEnterPayload, type IntersectionExitPayload } from "@react-three/rapier";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import type { PortPalette } from "./time-of-day";
import { HOLD_FLOOR_Y, HOLD_MAX_X, HOLD_MIN_X, SHIP_DROP_X } from "./crane-logic";
import { getToonGradient, OUTLINE, OUTLINE_THIN } from "./toon";
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
 */
const HOLO_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vY;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(cameraPosition - wp.xyz);
    vY = wp.y;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const HOLO_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uAlpha;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vY;
  void main() {
    // Líneas de barrido que suben por la flecha.
    float scan = 0.55 + 0.45 * step(0.5, fract(vY * 5.0 - uTime * 1.6));
    // Borde luminoso tipo fresnel: el interior queda translúcido.
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 1.6);
    // Parpadeo de proyector: leve y con un tartamudeo ocasional.
    float flicker = 0.9 + 0.1 * sin(uTime * 37.0) * sin(uTime * 3.3);
    float a = (0.28 + fresnel * 0.6) * scan * flicker * uAlpha;
    vec3 col = mix(uColor, vec3(1.0), fresnel * 0.5);
    gl_FragColor = vec4(col, a);
  }
`;

function arrowShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(1.35, 1.3);
  s.lineTo(0.55, 1.3);
  s.lineTo(0.55, 2.6);
  s.lineTo(-0.55, 2.6);
  s.lineTo(-0.55, 1.3);
  s.lineTo(-1.35, 1.3);
  s.closePath();
  return s;
}

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

export function Ship({ palette, onEnterHold, onExitHold, showStatic = true, showMarker = true }: ShipProps) {
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
    const g = new THREE.ExtrudeGeometry(arrowShape(), { depth: MARKER_DEPTH, bevelEnabled: false });
    g.translate(0, 0, -MARKER_DEPTH / 2);
    return g;
  }, []);
  const holoMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: HOLO_VERT,
        fragmentShader: HOLO_FRAG,
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color("#c8ff00") }, uAlpha: { value: 1 } },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );
  const ghostMat = useMemo(() => {
    const m = holoMat.clone();
    m.uniforms.uAlpha.value = 0.35;
    return m;
  }, [holoMat]);
  useFrame((state) => {
    const m = markerRef.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
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
}
