"use client";

import { useRef, type MutableRefObject, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Environment } from "@react-three/drei";
import * as THREE from "three";

/**
 * FloatingCube — Scroll-driven glass cube that roams the background.
 *
 * Color and path are configurable per page so each cube feels unique.
 * Position follows a Lissajous path parameterised by scroll progress (0→1).
 * Rotation is time-based so the cube always feels alive.
 */

const SIZE = 2.0;
const ROT_SPEED = { x: 0.25, y: 0.35, z: 0.12 };

export interface CubePath {
	x: { amp: number; cycles: number; offset?: number };
	y: { amp: number; cycles: number; offset?: number };
	z: { amp: number; cycles: number; offset?: number };
}

/** Pre-defined paths per page — each traces a distinct orbit */
export const CUBE_PATHS = {
	projects: {
		x: { amp: 6, cycles: 1.3 },
		y: { amp: 3.5, cycles: 2.1 },
		z: { amp: 5, cycles: 0.7 },
	},
	reviews: {
		x: { amp: 6, cycles: 1.8 },
		y: { amp: 4, cycles: 2.5 },
		z: { amp: 5, cycles: 1.1, offset: -3 },
	},
	contact: {
		x: { amp: 0, cycles: 0, offset: 4.2 },
		y: { amp: 0, cycles: 0, offset: 3.2 },
		z: { amp: 0, cycles: 0 },
	},
} as const;

interface CubeProps {
	scrollRef: MutableRefObject<{ progress: number }>;
	color: string;
	path: CubePath;
}

function Cube({ scrollRef, color, path }: CubeProps) {
	const groupRef = useRef<THREE.Group>(null);
	const glowRef = useRef<THREE.PointLight>(null);

	useFrame((state) => {
		const group = groupRef.current;
		if (!group) return;

		const t = state.clock.elapsedTime;
		const p = scrollRef.current.progress;

		const tau = Math.PI * 2;
		group.position.x = Math.sin(p * tau * path.x.cycles) * path.x.amp + (path.x.offset ?? 0);
		group.position.y = Math.sin(p * tau * path.y.cycles) * path.y.amp + (path.y.offset ?? 0);
		group.position.z = Math.sin(p * tau * path.z.cycles) * path.z.amp + (path.z.offset ?? 0);

		group.rotation.x = t * ROT_SPEED.x;
		group.rotation.y = t * ROT_SPEED.y;
		group.rotation.z = t * ROT_SPEED.z;

		if (glowRef.current) {
			glowRef.current.intensity = 4 + 2 * Math.sin(t * 1.2);
		}
	});

	return (
		<group ref={groupRef}>
			<mesh castShadow>
				<RoundedBox args={[SIZE, SIZE, SIZE]} radius={SIZE * 0.13} smoothness={4}>
					<meshPhysicalMaterial
						color={color}
						transmission={0.92}
						thickness={SIZE}
						roughness={0.05}
						ior={1.5}
						envMapIntensity={2.5}
						clearcoat={1}
						clearcoatRoughness={0.02}
						iridescence={0.3}
						iridescenceIOR={1.3}
						iridescenceThicknessRange={[100, 400]}
						metalness={0}
						emissive={color}
						emissiveIntensity={0.12}
						transparent
						opacity={1}
						toneMapped={false}
						side={THREE.FrontSide}
					/>
				</RoundedBox>
			</mesh>

			<mesh>
				<RoundedBox args={[SIZE + 0.02, SIZE + 0.02, SIZE + 0.02]} radius={SIZE * 0.13} smoothness={4}>
					<meshBasicMaterial
						color={color}
						wireframe
						transparent
						opacity={0.12}
						toneMapped={false}
					/>
				</RoundedBox>
			</mesh>

			<pointLight
				ref={glowRef}
				color={color}
				intensity={4}
				distance={6}
				decay={2}
			/>
		</group>
	);
}

interface FloatingCubeCanvasProps {
	scrollRef: MutableRefObject<{ progress: number }>;
	color?: string;
	path?: CubePath;
	/** Use "absolute" when inside a transformed ancestor (e.g. Lenis SmoothScroll) to avoid fixed positioning bugs */
	position?: "fixed" | "absolute";
}

export function FloatingCubeCanvas({
	scrollRef,
	color = "#ffdd00",
	path = CUBE_PATHS.projects,
	position = "fixed",
}: FloatingCubeCanvasProps) {
	return (
		<div
			className="pointer-events-none inset-0 z-[1]"
			style={{ position }}
		>
			<Canvas
				camera={{ position: [0, 0, 14], fov: 40 }}
				gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
				dpr={[1, 1.5]}
				style={{ width: "100%", height: "100%", background: "transparent" }}
			>
				<ambientLight intensity={0.15} />
				<directionalLight position={[5, 8, 6]} intensity={0.6} />
				<Environment preset="night" />
				<Suspense fallback={null}>
					<Cube scrollRef={scrollRef} color={color} path={path} />
				</Suspense>
			</Canvas>
		</div>
	);
}
