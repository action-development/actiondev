"use client";

import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import { ScrollInvalidator, onCanvasCreated } from "@/lib/r3f-utils";
import { getToonGradient, OUTLINE, OUTLINE_THIN } from "@/components/canvas/port/toon";
import { createContainerMaterials, loadLabelFont } from "@/components/canvas/port/container-textures";
import { stepSway, type SwayState } from "@/components/canvas/port/crane-logic";

/**
 * HangingCargo — el contenedor TRABAJO que el visitante cargó en la home,
 * colgado del spreader de la grúa, recorriendo `/projects` mientras se hace
 * scroll. Sustituye al cubo wireframe: mismo contrato de posición
 * (`scrollRef.progress` → guiñada lenta, `yOffset` → descenso vertical) pero con
 * el lenguaje del hero: texturas de contenedor pintadas, toon + contorno de
 * tinta, rótulo pintado sobre la chapa (el mismo de la home), cables y péndulo (`stepSway`, el mismo muelle amortiguado del juego).
 *
 * Cámara en z=14 / fov 40 → media altura de pantalla ≈ 5 unidades: `Projects`
 * calibra el descenso con ese número (`VIEWPORT_HALF`). No cambiar la cámara
 * sin recalibrarlo.
 *
 * `frameloop="demand"`: solo pinta con scroll y mientras el péndulo se
 * asienta. 0 assets de red salvo el logo del testero (local, compartido con
 * el hero, fuera de cualquier Suspense).
 */

interface PathDef {
  x: { amp: number; cycles: number; offset?: number };
  y: { amp: number; cycles: number; offset?: number };
  z: { amp: number; cycles: number; offset?: number };
}

export interface CargoScrollState {
  progress: number;
  /** Desplazamiento vertical aditivo (unidades). Negativo = más abajo. */
  yOffset?: number;
}

const INK = "#1a1410";
const STEEL = "#7f8a34";
const CABLE = "#2c2a24";

/** 40 pies, como el contenedor TRABAJO del muelle. */
const HALF_W = 2.0;
const HALF_H = 0.75;
const HALF_D = 0.75;
const SCALE = 0.55;
/** Punto del que cuelga todo (fuera de pantalla): el péndulo gira alrededor de él. */
const PIVOT_Y = 14;
/** Ganancia velocidad → fuerza del péndulo. El scroll hace de "carro". */
const SWAY_GAIN = 9;
/** Guiñada lenta para que se lean los nervios y las puertas. */
const YAW_CYCLES = 0.5;
const YAW_AMP = 0.42;

function Cargo({
  scrollRef,
  color,
  label,
  path,
}: {
  scrollRef: MutableRefObject<CargoScrollState>;
  color: string;
  label: string;
  path: PathDef;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const pivotRef = useRef<THREE.Group>(null);
  const { invalidate } = useThree();

  const gradient = getToonGradient();
  const skin = useMemo(() => createContainerMaterials("projects-cargo", color, HALF_W * 2, gradient, label), [color, gradient, label]);
  useEffect(() => () => skin.dispose(), [skin]);
  // El costado se repinta cuando llega la fuente; en `frameloop="demand"` hay que pedir el frame.
  useEffect(() => {
    let alive = true;
    loadLabelFont().then(() => alive && setTimeout(invalidate, 50));
    return () => { alive = false; };
  }, [invalidate, skin]);

  const steelMat = useMemo(() => new THREE.MeshToonMaterial({ color: STEEL, gradientMap: gradient }), [gradient]);
  const cableMat = useMemo(() => new THREE.MeshBasicMaterial({ color: CABLE, toneMapped: false }), []);
  const plateMat = useMemo(() => new THREE.MeshBasicMaterial({ color: INK, toneMapped: false }), []);
  useEffect(
    () => () => {
      steelMat.dispose();
      cableMat.dispose();
      plateMat.dispose();
    },
    [steelMat, cableMat, plateMat],
  );

  const sway = useRef<SwayState>({ offset: 0, velocity: 0 });
  const lastX = useRef<number | null>(null);

  useFrame((_, delta) => {
    const root = rootRef.current;
    const pivot = pivotRef.current;
    if (!root || !pivot) return;

    const dt = Math.min(delta, 1 / 30);
    const p = scrollRef.current.progress;
    const tau = Math.PI * 2;

    const x = Math.sin(p * tau * path.x.cycles) * path.x.amp + (path.x.offset ?? 0);
    const y = Math.sin(p * tau * path.y.cycles) * path.y.amp + (path.y.offset ?? 0) + (scrollRef.current.yOffset ?? 0);
    const z = Math.sin(p * tau * path.z.cycles) * path.z.amp + (path.z.offset ?? 0);
    root.position.set(x, y, z);

    // El desplazamiento lateral del "carro" excita el péndulo, como en el hero.
    const vx = lastX.current === null ? 0 : (x - lastX.current) / dt;
    lastX.current = x;
    stepSway(sway.current, vx * SWAY_GAIN, dt);

    pivot.rotation.z = -sway.current.offset / PIVOT_Y;
    pivot.rotation.y = Math.sin(p * tau * YAW_CYCLES) * YAW_AMP;

    if (Math.abs(sway.current.velocity) > 0.002 || Math.abs(sway.current.offset) > 0.002) invalidate();
  });

  const w = HALF_W * 2;
  const cableLen = PIVOT_Y + 6;

  return (
    <group ref={rootRef} scale={SCALE}>
      {/* El pivote está arriba, fuera de pantalla; el contenido cuelga PIVOT_Y por debajo. */}
      <group position={[0, PIVOT_Y, 0]}>
        <group ref={pivotRef}>
          <group position={[0, -PIVOT_Y, 0]}>
            {/* Cables: dos, desde el spreader hasta más allá del borde superior */}
            {[-1, 1].map((sx) => (
              <mesh key={sx} position={[sx * HALF_W * 0.55, HALF_H + 0.45 + cableLen / 2, 0]} material={cableMat}>
                <boxGeometry args={[0.06, cableLen, 0.06]} />
              </mesh>
            ))}

            {/* Spreader: viga oliva con cerrojos, como el de la grúa */}
            <mesh position={[0, HALF_H + 0.3, 0]} material={steelMat}>
              <boxGeometry args={[w + 0.3, 0.36, HALF_D * 2 + 0.2]} />
              <Outlines thickness={OUTLINE_THIN} color={INK} />
            </mesh>
            {[-1, 1].map((sx) => (
              <mesh key={sx} position={[sx * (HALF_W - 0.2), HALF_H + 0.08, HALF_D + 0.05]} material={plateMat}>
                <boxGeometry args={[0.24, 0.16, 0.2]} />
              </mesh>
            ))}

            {/* Contenedor */}
            <mesh material={skin.materials}>
              <boxGeometry args={[w, HALF_H * 2, HALF_D * 2]} />
              <Outlines thickness={OUTLINE} color={INK} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

interface HangingCargoProps {
  scrollRef: MutableRefObject<CargoScrollState>;
  color: string;
  label: string;
  path: PathDef;
}

export function HangingCargoCanvas({ scrollRef, color, label, path }: HangingCargoProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 14], fov: 40 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        frameloop="demand"
        flat
        dpr={[1, 1.5]}
        // R3F fuerza pointer-events:auto en el canvas: este decorado nunca debe comerse clicks.
        style={{ width: "100%", height: "100%", background: "transparent", pointerEvents: "none" }}
        onCreated={onCanvasCreated}
      >
        <hemisphereLight args={["#cfe7ff", "#5a6f8a", 1.1]} />
        <directionalLight position={[4, 8, 6]} intensity={2.2} color="#ffffff" />
        <ScrollInvalidator />
        <Suspense fallback={null}>
          <Cargo scrollRef={scrollRef} color={color} label={label} path={path} />
        </Suspense>
      </Canvas>
    </div>
  );
}
