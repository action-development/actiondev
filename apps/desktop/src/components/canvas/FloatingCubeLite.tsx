"use client";

import { useRef, useEffect, useMemo, type MutableRefObject, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ScrollInvalidator, onCanvasCreated } from "@/lib/r3f-utils";

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

const SIZE = 1.5;
const ROT_SPEED = { x: 0.25, y: 0.35, z: 0.12 };

interface PathDef {
	x: { amp: number; cycles: number; offset?: number };
	y: { amp: number; cycles: number; offset?: number };
	z: { amp: number; cycles: number; offset?: number };
}

interface CubeScrollState {
	progress: number;
	/** Additive Y offset in Three.js units. Negative = lower on screen. */
	yOffset?: number;
}

function Cube({ scrollRef, color, path }: { scrollRef: MutableRefObject<CubeScrollState>; color: string; path: PathDef }) {
	const groupRef = useRef<THREE.Group>(null);

	const geo = useMemo(() => new THREE.BoxGeometry(SIZE, SIZE, SIZE), []);
	const edgesGeo = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);

	const mat = useMemo(
		() =>
			new THREE.MeshBasicMaterial({
				color,
				transparent: true,
				opacity: 0.04,
				toneMapped: false,
				side: THREE.FrontSide,
				depthWrite: false,
			}),
		[color]
	);

	const wireMat = useMemo(
		() =>
			new THREE.LineBasicMaterial({
				color,
				transparent: true,
				opacity: 0.65,
				toneMapped: false,
			}),
		[color]
	);

	useEffect(() => {
		return () => {
			mat.dispose();
			wireMat.dispose();
			geo.dispose();
			edgesGeo.dispose();
		};
	}, [mat, wireMat, geo, edgesGeo]);

	useFrame((state) => {
		const group = groupRef.current;
		if (!group) return;

		const t = state.clock.elapsedTime;
		const p = scrollRef.current.progress;
		const tau = Math.PI * 2;

		group.position.x = Math.sin(p * tau * path.x.cycles) * path.x.amp + (path.x.offset ?? 0);
		group.position.y = Math.sin(p * tau * path.y.cycles) * path.y.amp + (path.y.offset ?? 0) + (scrollRef.current.yOffset ?? 0);
		group.position.z = Math.sin(p * tau * path.z.cycles) * path.z.amp + (path.z.offset ?? 0);

		group.rotation.x = t * ROT_SPEED.x;
		group.rotation.y = t * ROT_SPEED.y;
		group.rotation.z = t * ROT_SPEED.z;
	});

	return (
		<group ref={groupRef}>
			<mesh geometry={geo} material={mat} />
			<lineSegments geometry={edgesGeo} material={wireMat} />
		</group>
	);
}

interface FloatingCubeLiteProps {
	scrollRef: MutableRefObject<CubeScrollState>;
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
				// R3F forces pointer-events:auto on the canvas, defeating the wrapper's
				// pointer-events-none — this decorative cube must never eat clicks (e.g. footer).
				style={{ width: "100%", height: "100%", background: "transparent", pointerEvents: "none" }}
				onCreated={onCanvasCreated}
			>
				<ScrollInvalidator />
				<Suspense fallback={null}>
					{path && <Cube scrollRef={scrollRef} color={color} path={path} />}
				</Suspense>
			</Canvas>
		</div>
	);
}
