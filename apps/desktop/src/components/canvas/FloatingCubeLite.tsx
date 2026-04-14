"use client";

import { useRef, useEffect, type MutableRefObject, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * FloatingCubeLite — Lightweight version for content pages (not home).
 *
 * vs FloatingCube:
 * - MeshStandardMaterial (no transmission = no 2x render pass)
 * - No Environment HDR (saves ~2MB GPU)
 * - Single BoxGeometry + EdgesGeometry (no RoundedBox smoothness=4)
 * - frameloop="demand" (only renders on scroll)
 * - DPR=1, antialias off, flat shading
 * - No pointLight
 */

const SIZE = 2.0;
const ROT_SPEED = { x: 0.25, y: 0.35, z: 0.12 };

export type { CubePath } from "@/components/canvas/FloatingCube";
export { CUBE_PATHS } from "@/components/canvas/FloatingCube";

interface PathDef {
	x: { amp: number; cycles: number; offset?: number };
	y: { amp: number; cycles: number; offset?: number };
	z: { amp: number; cycles: number; offset?: number };
}

const sharedGeo = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
const sharedEdgesGeo = new THREE.EdgesGeometry(sharedGeo);

function Cube({ scrollRef, color, path }: { scrollRef: MutableRefObject<{ progress: number }>; color: string; path: PathDef }) {
	const groupRef = useRef<THREE.Group>(null);

	const mat = useRef(
		new THREE.MeshStandardMaterial({
			color,
			emissive: color,
			emissiveIntensity: 0.15,
			metalness: 0.9,
			roughness: 0.15,
			transparent: true,
			opacity: 0.55,
			toneMapped: false,
			side: THREE.FrontSide,
		})
	);

	const wireMat = useRef(
		new THREE.LineBasicMaterial({
			color,
			transparent: true,
			opacity: 0.15,
		})
	);

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
	});

	return (
		<group ref={groupRef}>
			<mesh geometry={sharedGeo} material={mat.current} />
			<lineSegments geometry={sharedEdgesGeo} material={wireMat.current} />
		</group>
	);
}

function ScrollInvalidator() {
	const { invalidate } = useThree();
	useEffect(() => {
		invalidate();
		let pending = false;
		const handler = () => {
			if (pending) return;
			pending = true;
			requestAnimationFrame(() => {
				invalidate();
				pending = false;
			});
		};
		window.addEventListener("scroll", handler, { passive: true });
		return () => window.removeEventListener("scroll", handler);
	}, [invalidate]);
	return null;
}

interface FloatingCubeLiteProps {
	scrollRef: MutableRefObject<{ progress: number }>;
	color?: string;
	path?: PathDef;
	position?: "fixed" | "absolute";
}

export function FloatingCubeLiteCanvas({
	scrollRef,
	color = "#ffdd00",
	path,
	position = "fixed",
}: FloatingCubeLiteProps) {
	return (
		<div
			className="pointer-events-none inset-0 z-[1]"
			style={{ position }}
			aria-hidden="true"
		>
			<Canvas
				camera={{ position: [0, 0, 14], fov: 40 }}
				gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
				frameloop="demand"
				flat
				dpr={1}
				style={{ width: "100%", height: "100%", background: "transparent" }}
				onCreated={({ gl: renderer, scene, camera }) => {
					renderer.setClearColor(0x000000, 0);
					scene.background = null;
					renderer.compile(scene, camera);
				}}
			>
				<ambientLight intensity={0.3} />
				<directionalLight position={[5, 8, 6]} intensity={0.5} />
				<ScrollInvalidator />
				<Suspense fallback={null}>
					{path && <Cube scrollRef={scrollRef} color={color} path={path} />}
				</Suspense>
			</Canvas>
		</div>
	);
}
