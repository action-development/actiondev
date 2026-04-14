"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Project } from "@/data/projects";

// ─── Constants ─────────────────────────────────────────────────────────────

const ANGLE_STEP = 75;
const RADIUS = 450;
const Y_STEP = 280;
const CARD_W = 440;
const CARD_H = 220;
const CAM_Z = 1100;

const FACING_THRESHOLD = Math.acos(RADIUS / CAM_Z) * (180 / Math.PI);
const HYSTERESIS = 8;
const REVEAL_THRESHOLD = FACING_THRESHOLD - HYSTERESIS;
const HIDE_THRESHOLD = FACING_THRESHOLD + HYSTERESIS;

const CARD_PAD = 8;
const IMG_W = CARD_W - CARD_PAD * 2;
const IMG_H = CARD_H - CARD_PAD * 2;

const HARD_CULL_DEG = 170;
const FADE_START_DEG = 90;

const SETTLE_FRAMES = 20;

// ─── Shared geometries ────────────────────────────────────────────────────

const sharedPlaneGeo = new THREE.PlaneGeometry(CARD_W, CARD_H);
const sharedImgGeo = new THREE.PlaneGeometry(IMG_W, IMG_H);
const sharedEdgesGeo = new THREE.EdgesGeometry(sharedPlaneGeo);

const sharedHitAreaMat = new THREE.MeshBasicMaterial({
	transparent: true,
	opacity: 0,
	side: THREE.FrontSide,
});

// ─── Pre-render text overlay to CanvasTexture (replaces troika Text) ─────

function createOverlayTexture(category: string, title: string): THREE.CanvasTexture {
	const dpr = 1;
	const w = IMG_W * dpr;
	const h = IMG_H * dpr;
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d")!;

	ctx.clearRect(0, 0, w, h);

	// Category — small, accent muted
	ctx.font = `${9 * dpr}px system-ui, sans-serif`;
	ctx.fillStyle = "#b06a3a";
	ctx.letterSpacing = `${1.4 * dpr}px`;
	ctx.fillText(category.toUpperCase(), 18 * dpr, h - 32 * dpr);

	// Title — larger, white
	ctx.font = `500 ${18 * dpr}px system-ui, sans-serif`;
	ctx.fillStyle = "#f0f0f0";
	ctx.letterSpacing = "0px";
	ctx.fillText(title, 18 * dpr, h - 10 * dpr);

	const texture = new THREE.CanvasTexture(canvas);
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ScrollState {
	rotation: number;
	y: number;
}

// ─── Single Card ───────────────────────────────────────────────────────────

function Card3D({
	project,
	index,
	scrollRef,
}: {
	project: Project;
	index: number;
	scrollRef: React.RefObject<ScrollState>;
}) {
	const groupRef = useRef<THREE.Group>(null);
	const frontGroupRef = useRef<THREE.Group>(null);
	const imageRef = useRef<THREE.Mesh>(null);
	const overlayRef = useRef<THREE.Mesh>(null);
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const textureRef = useRef<THREE.Texture | null>(null);
	const revealedRef = useRef(false);
	const imgOpacity = useRef(0);
	const hoveredRef = useRef(false);
	const hoverOpacity = useRef(0);

	const imageMat = useMemo(
		() =>
			new THREE.MeshBasicMaterial({
				transparent: true,
				opacity: 0,
				toneMapped: false,
				side: THREE.FrontSide,
			}),
		[]
	);
	const darkMat = useMemo(
		() =>
			new THREE.MeshBasicMaterial({
				color: "#000000",
				transparent: true,
				opacity: 0.15,
				side: THREE.FrontSide,
			}),
		[]
	);
	const cardBaseMat = useMemo(
		() =>
			new THREE.MeshBasicMaterial({
				color: "#0e0e11",
				side: THREE.DoubleSide,
				transparent: true,
				opacity: 1,
			}),
		[]
	);
	const borderMat = useMemo(
		() =>
			new THREE.LineBasicMaterial({
				color: "#ff7a3d",
				transparent: true,
				opacity: 0.07,
			}),
		[]
	);

	// Overlay: pre-rendered text as a single CanvasTexture (no troika)
	const overlayMat = useMemo(() => {
		const tex = createOverlayTexture(project.category, project.title);
		return new THREE.MeshBasicMaterial({
			map: tex,
			transparent: true,
			opacity: 0,
			side: THREE.FrontSide,
			depthWrite: false,
		});
	}, [project.category, project.title]);

	const { invalidate } = useThree();
	const textureLoaded = useRef(false);
	const cancelledRef = useRef(false);

	// Lazy texture loader — called on first reveal, not on mount
	const loadTexture = useCallback(() => {
		if (textureLoaded.current || cancelledRef.current) return;
		textureLoaded.current = true;

		const applyTexture = (t: THREE.Texture) => {
			if (cancelledRef.current) return;
			t.minFilter = THREE.LinearFilter;
			t.magFilter = THREE.LinearFilter;
			t.colorSpace = THREE.SRGBColorSpace;
			textureRef.current = t;
			imageMat.map = t;
			imageMat.needsUpdate = true;
			invalidate();
		};

		if (project.video) {
			const v = document.createElement("video");
			v.src = project.video;
			v.crossOrigin = "anonymous";
			v.loop = true;
			v.muted = true;
			v.playsInline = true;
			v.play().catch(() => {});
			videoRef.current = v;
			applyTexture(new THREE.VideoTexture(v));
		} else if ("createImageBitmap" in window) {
			const bitmapLoader = new THREE.ImageBitmapLoader();
			bitmapLoader.setOptions({ imageOrientation: "flipY" });
			bitmapLoader.load(project.image, (bitmap) => {
				applyTexture(new THREE.CanvasTexture(bitmap));
			});
		} else {
			new THREE.TextureLoader().load(project.image, (t) => applyTexture(t));
		}
	}, [project.video, project.image, imageMat, invalidate]);

	// Cleanup on unmount
	useEffect(() => {
		cancelledRef.current = false;
		return () => {
			cancelledRef.current = true;
			if (textureRef.current) textureRef.current.dispose();
			if (videoRef.current) {
				videoRef.current.pause();
				videoRef.current.removeAttribute("src");
			}
			imageMat.dispose();
			darkMat.dispose();
			cardBaseMat.dispose();
			borderMat.dispose();
			overlayMat.map?.dispose();
			overlayMat.dispose();
		};
	}, [imageMat, darkMat, cardBaseMat, borderMat, overlayMat]);

	useFrame(() => {
		if (!groupRef.current || !scrollRef.current) return;
		const { rotation } = scrollRef.current;
		const cardAngle = index * ANGLE_STEP - rotation;
		const abs = Math.abs(cardAngle);

		if (abs > HARD_CULL_DEG) {
			groupRef.current.visible = false;
			return;
		}

		const fade =
			abs <= FADE_START_DEG
				? 1
				: Math.max(0, 1 - (abs - FADE_START_DEG) / (HARD_CULL_DEG - FADE_START_DEG));
		groupRef.current.visible = fade > 0.01;
		if (fade <= 0.01) return;

		// Lazy load texture on first visibility
		if (!textureLoaded.current) loadTexture();

		cardBaseMat.opacity = fade;
		borderMat.opacity = 0.07 * fade;

		let facing = cardAngle % 360;
		if (facing > 180) facing -= 360;
		if (facing < -180) facing += 360;
		const absFacing = Math.abs(facing);
		const showFront = absFacing < 90;

		if (frontGroupRef.current) frontGroupRef.current.visible = showFront;

		const shouldReveal =
			showFront &&
			(revealedRef.current ? absFacing < HIDE_THRESHOLD : absFacing < REVEAL_THRESHOLD);
		revealedRef.current = shouldReveal;
		const imgTarget = shouldReveal ? 1 : 0;
		imgOpacity.current += (imgTarget - imgOpacity.current) * 0.1;

		imageMat.opacity = imgOpacity.current * fade;
		if (imageRef.current) {
			imageRef.current.visible = imgOpacity.current > 0.01;
		}

		if (Math.abs(imgOpacity.current - imgTarget) > 0.005) {
			invalidate();
		}

		// Hover overlay
		if (imgOpacity.current > 0.5) {
			const hoverTarget = hoveredRef.current ? 1 : 0;
			hoverOpacity.current += (hoverTarget - hoverOpacity.current) * (hoverTarget > 0 ? 0.12 : 0.5);

			overlayMat.opacity = hoverOpacity.current * fade;
			if (overlayRef.current) {
				overlayRef.current.visible = hoverOpacity.current > 0.01;
			}

			darkMat.opacity = (0.15 + hoverOpacity.current * 0.35) * fade;
			darkMat.visible = true;

			if (
				videoRef.current &&
				textureRef.current instanceof THREE.VideoTexture &&
				!videoRef.current.paused
			) {
				textureRef.current.needsUpdate = true;
				invalidate();
			}

			if (Math.abs(hoverOpacity.current - hoverTarget) > 0.005) {
				invalidate();
			}
		} else {
			if (overlayRef.current) overlayRef.current.visible = false;
			darkMat.opacity = 0.15;
			darkMat.visible = false;
			hoverOpacity.current = 0;
		}
	});

	const angleRad = THREE.MathUtils.degToRad(index * ANGLE_STEP);

	return (
		<group
			ref={groupRef}
			position={[Math.sin(angleRad) * RADIUS, -(index * Y_STEP), Math.cos(angleRad) * RADIUS]}
			rotation={[0, angleRad, 0]}
		>
			<mesh geometry={sharedPlaneGeo} material={cardBaseMat} />
			<lineSegments geometry={sharedEdgesGeo} position={[0, 0, 0.5]} material={borderMat} />

			<group ref={frontGroupRef}>
				<mesh ref={imageRef} geometry={sharedImgGeo} position={[0, 0, 1]} material={imageMat} />
				<mesh geometry={sharedImgGeo} position={[0, 0, 2]} material={darkMat} />
				<mesh ref={overlayRef} geometry={sharedImgGeo} position={[0, 0, 3]} material={overlayMat} visible={false} />

				{/* biome-ignore lint/a11y/noStaticElementInteractions: Three.js mesh, not DOM */}
				<mesh
					geometry={sharedImgGeo}
					position={[0, 0, 4]}
					material={sharedHitAreaMat}
					onClick={() => {
						window.location.href = `/projects/${project.slug}`;
					}}
					onPointerEnter={() => {
						hoveredRef.current = true;
						document.body.style.cursor = "pointer";
						invalidate();
						window.dispatchEvent(
							new CustomEvent("card-bg-preview", {
								detail: {
									image: project.image,
									video: project.video,
									videoElement: videoRef.current,
								},
							})
						);
					}}
					onPointerLeave={() => {
						hoveredRef.current = false;
						document.body.style.cursor = "";
						invalidate();
						window.dispatchEvent(new CustomEvent("card-bg-preview", { detail: null }));
					}}
				/>
			</group>
		</group>
	);
}

// ─── Scene ─────────────────────────────────────────────────────────────────

function CarouselScene({
	projects,
	scrollRef,
}: {
	projects: Project[];
	scrollRef: React.RefObject<ScrollState>;
}) {
	const groupRef = useRef<THREE.Group>(null);
	const lastRotation = useRef(0);
	const lastY = useRef(0);
	const settleFrames = useRef(0);
	const { camera, size, gl, invalidate } = useThree();

	useEffect(() => {
		if (camera instanceof THREE.PerspectiveCamera) {
			const fov = 2 * Math.atan(size.height / 2 / CAM_Z) * (180 / Math.PI);
			camera.fov = fov;
			camera.near = 1;
			camera.far = 3000;
			camera.position.set(0, 0, CAM_Z);
			camera.lookAt(0, 0, 0);
			camera.updateProjectionMatrix();
		}

		gl.setClearColor(0x000000, 0);
		gl.setPixelRatio(1);
	}, [camera, size, gl]);

	useFrame(() => {
		if (!groupRef.current || !scrollRef.current) return;
		const { rotation, y } = scrollRef.current;

		if (rotation !== lastRotation.current || y !== lastY.current) {
			lastRotation.current = rotation;
			lastY.current = y;
			groupRef.current.rotation.y = -THREE.MathUtils.degToRad(rotation);
			groupRef.current.position.y = y;
			settleFrames.current = SETTLE_FRAMES;
		}

		if (settleFrames.current > 0) {
			settleFrames.current--;
			invalidate();
		}
	});

	return (
		<group ref={groupRef}>
			{projects.map((project, i) => (
				<Card3D key={project.id} project={project} index={i} scrollRef={scrollRef} />
			))}
		</group>
	);
}

// ─── Scroll bridge — rAF-gated to avoid redundant invalidations ──────────

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

// ─── Export ─────────────────────────────────────────────────────────────────

const POINTER_EVENTS_DEBOUNCE_MS = 150;

export function Carousel3D({
	projects,
	scrollRef,
}: {
	projects: Project[];
	scrollRef: React.RefObject<ScrollState>;
}) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		let timer: ReturnType<typeof setTimeout>;

		const onScroll = () => {
			container.style.pointerEvents = "none";
			clearTimeout(timer);
			timer = setTimeout(() => {
				container.style.pointerEvents = "auto";
			}, POINTER_EVENTS_DEBOUNCE_MS);
		};

		window.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			window.removeEventListener("scroll", onScroll);
			clearTimeout(timer);
		};
	}, []);

	return (
		<div
			ref={containerRef}
			role="region"
			aria-label="3D project carousel — scroll to browse projects"
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				zIndex: 5,
				pointerEvents: "auto",
			}}
		>
			<Canvas
				gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
				frameloop="demand"
				flat
				dpr={1}
				style={{ background: "transparent" }}
				onCreated={({ gl: renderer, scene, camera }) => {
					renderer.setClearColor(0x000000, 0);
					scene.background = null;
					renderer.compile(scene, camera);
				}}
			>
				<ScrollInvalidator />
				<Suspense fallback={null}>
					<CarouselScene projects={projects} scrollRef={scrollRef} />
				</Suspense>
			</Canvas>
		</div>
	);
}
