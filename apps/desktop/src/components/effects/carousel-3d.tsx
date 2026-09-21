"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { ScrollInvalidator, onCanvasCreated } from "@/lib/r3f-utils";
import * as THREE from "three";
import type { Project } from "@/data/projects";

/**
 * Frame-rate independent exponential lerp.
 * `rate` units are 1/seconds. Returns the alpha you'd multiply (target - current) by.
 * Equivalence with fixed factor: factor@60fps `f` ↔ rate ≈ `-60 * ln(1 - f)`.
 */
function expLerp(rate: number, dt: number): number {
  return 1 - Math.exp(-rate * dt);
}

/** Rate constants — chosen so that at 60fps they reproduce the original feel. */
const IMG_FADE_RATE = 6.32;       // ↔ 0.1/frame@60fps
const HOVER_IN_RATE = 7.67;       // ↔ 0.12/frame@60fps
const HOVER_OUT_RATE = 41.59;     // ↔ 0.5/frame@60fps

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

// Viñeta de cómic: margen de papel alrededor de la imagen, marco de tinta y
// sombra dura desplazada (misma gramática que las chapas del HUD del header).
const CARD_PAD = 14;
const IMG_W = CARD_W - CARD_PAD * 2;
const IMG_H = CARD_H - CARD_PAD * 2;
const FRAME = 10;
const SHADOW_OFFSET = 16;
const INK = "#1a1410";
const PAPER = "#f1ead6";
const TAG = "#c8ff00";

/** Familia real de Poppins que inyecta next/font (nombre hasheado) — leída de la variable CSS. */
function displayFontFamily(): string {
	const v = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();
	return v ? `${v}, system-ui, sans-serif` : "system-ui, sans-serif";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}

const HARD_CULL_DEG = 170;
const FADE_START_DEG = 90;

const SETTLE_FRAMES = 20;

// ─── Pre-render text overlay to CanvasTexture (replaces troika Text) ─────

function createOverlayTexture(category: string, title: string): THREE.CanvasTexture {
	const dpr = Math.min(window.devicePixelRatio, 2);
	const w = IMG_W * dpr;
	const h = IMG_H * dpr;
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d")!;

	ctx.clearRect(0, 0, w, h);
	const family = displayFontFamily();
	const pad = 12 * dpr;

	// Placa de contenedor con la categoría: lima, borde de tinta, canto duro
	ctx.font = `800 ${7 * dpr}px ${family}`;
	ctx.letterSpacing = `${1 * dpr}px`;
	const cat = category.toUpperCase();
	const tagW = ctx.measureText(cat).width + 13 * dpr;
	const tagH = 16 * dpr;
	const tagY = h - pad - tagH;
	ctx.fillStyle = INK;
	roundRect(ctx, pad, tagY + 2 * dpr, tagW, tagH, 2.5 * dpr);
	ctx.fill();
	ctx.fillStyle = TAG;
	roundRect(ctx, pad, tagY, tagW, tagH, 2.5 * dpr);
	ctx.fill();
	ctx.lineWidth = 1.25 * dpr;
	ctx.strokeStyle = INK;
	ctx.stroke();
	ctx.fillStyle = INK;
	ctx.textBaseline = "middle";
	ctx.fillText(cat, pad + 6.5 * dpr, tagY + tagH / 2 + dpr);

	// Título: rotulado de cómic — relleno papel con contorno de tinta
	ctx.textBaseline = "alphabetic";
	ctx.font = `800 ${13 * dpr}px ${family}`;
	ctx.letterSpacing = `${-0.2 * dpr}px`;
	ctx.lineJoin = "round";
	ctx.lineWidth = 3.5 * dpr;
	ctx.strokeStyle = INK;
	ctx.strokeText(title, pad, tagY - 8 * dpr);
	ctx.fillStyle = PAPER;
	ctx.fillText(title, pad, tagY - 8 * dpr);

	const texture = new THREE.CanvasTexture(canvas);
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	// CanvasTexture default `generateMipmaps=true` would build a mip pyramid that minFilter=Linear
	// never samples — pure VRAM waste (~33% overhead per texture).
	texture.generateMipmaps = false;
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface ScrollState {
	rotation: number;
	y: number;
}

// ─── Single Card ───────────────────────────────────────────────────────────

function Card3D({
	project,
	categoryLabel,
	index,
	scrollRef,
	sharedPlaneGeo,
	sharedImgGeo,
	sharedEdgesGeo,
	sharedFrameGeo,
	sharedHitAreaMat,
}: {
	project: Project;
	categoryLabel: string;
	index: number;
	scrollRef: React.RefObject<ScrollState>;
	sharedPlaneGeo: THREE.PlaneGeometry;
	sharedImgGeo: THREE.PlaneGeometry;
	sharedEdgesGeo: THREE.EdgesGeometry;
	sharedFrameGeo: THREE.PlaneGeometry;
	sharedHitAreaMat: THREE.MeshBasicMaterial;
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
		() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, toneMapped: false, side: THREE.FrontSide }),
		[]
	);
	const darkMat = useMemo(
		() => new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0, side: THREE.FrontSide }),
		[]
	);
	// Papel de la viñeta (DoubleSide: por detrás se ve el dorso del panel).
	const cardBaseMat = useMemo(
		() => new THREE.MeshBasicMaterial({ color: PAPER, side: THREE.DoubleSide, transparent: true, opacity: 1 }),
		[]
	);
	// Canto de tinta sobre el papel.
	const borderMat = useMemo(
		() => new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 1 }),
		[]
	);
	// Marco de tinta detrás del papel + sombra dura desplazada (mismo material).
	const inkMat = useMemo(
		() => new THREE.MeshBasicMaterial({ color: INK, side: THREE.DoubleSide, transparent: true, opacity: 1 }),
		[]
	);
	const overlayMat = useMemo(() => {
		const tex = createOverlayTexture(categoryLabel, project.title);
		return new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, side: THREE.FrontSide, depthWrite: false });
	}, [categoryLabel, project.title]);

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
			// VideoTexture has generateMipmaps=false by default (no-op here, defensive).
			// CanvasTexture (from ImageBitmapLoader) and stock Texture both default to true,
			// generating an unused mip pyramid → VRAM waste with minFilter=Linear.
			t.generateMipmaps = false;
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
			inkMat.dispose();
			overlayMat.map?.dispose();
			overlayMat.dispose();
		};
	}, [imageMat, darkMat, cardBaseMat, borderMat, inkMat, overlayMat]);

	useFrame((_, delta) => {
		if (!groupRef.current || !scrollRef.current) return;
		// Clamp dt — frameloop="demand" can produce huge gaps after idle pauses,
		// which would teleport lerps to target if used raw.
		const dt = Math.min(delta, 1 / 30);
		const { rotation } = scrollRef.current;
		const cardAngle = index * ANGLE_STEP - rotation;
		const abs = Math.abs(cardAngle);

		if (abs > HARD_CULL_DEG) {
			groupRef.current.visible = false;
			// Pause video decode while card is off-screen
			if (videoRef.current && !videoRef.current.paused) videoRef.current.pause();
			return;
		}

		const fade =
			abs <= FADE_START_DEG
				? 1
				: Math.max(0, 1 - (abs - FADE_START_DEG) / (HARD_CULL_DEG - FADE_START_DEG));
		groupRef.current.visible = fade > 0.01;
		if (fade <= 0.01) return;

		// Lazy load texture on first visibility, resume if previously paused
		if (!textureLoaded.current) {
			loadTexture();
		} else if (videoRef.current && videoRef.current.paused) {
			videoRef.current.play().catch(() => {});
		}

		cardBaseMat.opacity = fade;
		borderMat.opacity = fade;
		inkMat.opacity = fade;

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
		imgOpacity.current += (imgTarget - imgOpacity.current) * expLerp(IMG_FADE_RATE, dt);

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
			const hoverRate = hoverTarget > 0 ? HOVER_IN_RATE : HOVER_OUT_RATE;
			hoverOpacity.current += (hoverTarget - hoverOpacity.current) * expLerp(hoverRate, dt);

			overlayMat.opacity = hoverOpacity.current * fade;
			if (overlayRef.current) {
				overlayRef.current.visible = hoverOpacity.current > 0.01;
			}

			darkMat.opacity = hoverOpacity.current * 0.45 * fade;
			darkMat.visible = darkMat.opacity > 0.01;

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
			darkMat.opacity = 0;
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
			{/* Sombra dura desplazada y marco de tinta: la viñeta "pegada" sobre el fondo */}
			<mesh geometry={sharedFrameGeo} position={[SHADOW_OFFSET, -SHADOW_OFFSET, -2]} material={inkMat} />
			<mesh geometry={sharedFrameGeo} position={[0, 0, -1]} material={inkMat} />
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
						// No hay página de detalle: la card abre la web real del cliente en
						// pestaña nueva. Un `url: "#"` es un proyecto sin web pública todavía.
						if (project.url !== "#") window.open(project.url, "_blank", "noopener,noreferrer");
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
	locale,
}: {
	projects: Project[];
	scrollRef: React.RefObject<ScrollState>;
	locale: string;
}) {
	const groupRef = useRef<THREE.Group>(null);
	const lastRotation = useRef(0);
	const lastY = useRef(0);
	const settleFrames = useRef(0);
	const { camera, size, gl, invalidate } = useThree();

	const sharedPlaneGeo = useMemo(() => new THREE.PlaneGeometry(CARD_W, CARD_H), []);
	const sharedImgGeo = useMemo(() => new THREE.PlaneGeometry(IMG_W, IMG_H), []);
	const sharedEdgesGeo = useMemo(() => new THREE.EdgesGeometry(sharedPlaneGeo), [sharedPlaneGeo]);
	const sharedFrameGeo = useMemo(() => new THREE.PlaneGeometry(CARD_W + FRAME * 2, CARD_H + FRAME * 2), []);
	const sharedHitAreaMat = useMemo(
		() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.FrontSide }),
		[]
	);

	useEffect(() => {
		return () => {
			sharedPlaneGeo.dispose();
			sharedImgGeo.dispose();
			sharedEdgesGeo.dispose();
			sharedFrameGeo.dispose();
			sharedHitAreaMat.dispose();
		};
	}, [sharedPlaneGeo, sharedImgGeo, sharedEdgesGeo, sharedFrameGeo, sharedHitAreaMat]);

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
			{projects.map((project, i) => {
				const categoryLabel = locale === "es"
					? (project.categoryEs ?? project.category)
					: project.category;
				return (
					<Card3D
						key={project.id}
						project={project}
						categoryLabel={categoryLabel}
						index={i}
						scrollRef={scrollRef}
						sharedPlaneGeo={sharedPlaneGeo}
						sharedImgGeo={sharedImgGeo}
						sharedEdgesGeo={sharedEdgesGeo}
						sharedFrameGeo={sharedFrameGeo}
						sharedHitAreaMat={sharedHitAreaMat}
					/>
				);
			})}
		</group>
	);
}

// ─── Export ─────────────────────────────────────────────────────────────────

const POINTER_EVENTS_DEBOUNCE_MS = 150;

export function Carousel3D({
	projects,
	scrollRef,
	locale = "en",
}: {
	projects: Project[];
	scrollRef: React.RefObject<ScrollState>;
	locale?: string;
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
				onCreated={onCanvasCreated}
			>
				<ScrollInvalidator />
				<Suspense fallback={null}>
					<CarouselScene projects={projects} scrollRef={scrollRef} locale={locale} />
				</Suspense>
			</Canvas>
		</div>
	);
}
