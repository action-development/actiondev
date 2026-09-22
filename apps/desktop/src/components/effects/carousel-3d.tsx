"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/** Familia real de Space Grotesk que inyecta next/font (nombre hasheado) — leída de la variable CSS. */
function displayFontFamily(): string {
	const v = getComputedStyle(document.documentElement).getPropertyValue("--font-space-grotesk").trim();
	return v ? `${v}, system-ui, sans-serif` : "system-ui, sans-serif";
}

/**
 * ¿Está ya cargada la Space Grotesk de next/font?
 *
 * `document.fonts.check()` con la lista entera siempre diría que sí — basta con
 * que exista `system-ui`. Hay que preguntar solo por la PRIMERA familia, que es
 * la real; si aún no está, el rótulo se pintaría con la fuente de sistema y
 * quedaría con otro grosor y otro ancho (ver el repintado en `Card3D`).
 */
function displayFontLoaded(size: number): boolean {
	if (typeof document === "undefined" || !document.fonts) return true;
	const first = getComputedStyle(document.documentElement)
		.getPropertyValue("--font-space-grotesk")
		.split(",")[0]
		.trim();
	if (!first) return true;
	try {
		return document.fonts.check(`700 ${size}px ${first}`);
	} catch {
		return true;
	}
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

// Velo de llegada: la mitad de arriba de la imagen entra un punto más apagada y
// recupera opacidad conforme la card gira hacia el frente con el scroll. Encadena
// las cards —cada una "llega" al girar— sin tocar el pipeline de texturas.
const VEIL_ALPHA = 0.32;          // oscurecido máximo, en el canto alto de la imagen
const VEIL_STOP = 0.5;            // hasta dónde llega el degradado (0.5 = media card)
const VEIL_RANGE_DEG = 55;        // ángulo desde el frente en el que el velo se disuelve

const SETTLE_FRAMES = 20;

// ─── Pre-render text overlay to CanvasTexture (replaces troika Text) ─────

/**
 * Ampliación en pantalla de la card que mira a cámara.
 *
 * El fov se calcula para que en z=0 una unidad de mundo sea un píxel CSS, pero
 * la card frontal está a RADIUS del centro de la rueda, o sea a `CAM_Z - RADIUS`
 * de la cámara: se ve ~1,69× más grande de lo que mide. Es el factor que hay que
 * meter en la textura del rótulo o sale ampliada (= borrosa).
 */
const FRONT_MAG = CAM_Z / (CAM_Z - RADIUS);

/** Tope de densidad del framebuffer y de las texturas de rótulo. */
const MAX_DPR = 2;

// Rótulo de la card, en unidades de mundo (= px CSS del plano de la imagen).
const LABEL_PAD = 12;      // margen desde el canto de la imagen
const TAG_FONT = 7;
const TAG_H = 16;
const TAG_RADIUS = 2.5;
const TAG_PAD_X = 6.5;     // relleno horizontal del texto dentro de la chapa
const TAG_SHADOW = 2;      // desplazamiento de la sombra dura de tinta
const TITLE_FONT = 13;
const TITLE_GAP = 8;       // base del título por encima del canto alto de la chapa
const TITLE_STROKE = 3.5;

interface OverlayLabel {
	texture: THREE.CanvasTexture;
	/** Tamaño del rótulo en unidades de mundo. */
	width: number;
	height: number;
	/** Centro del rótulo relativo al centro del plano de la imagen. */
	x: number;
	y: number;
}

/**
 * Rótulo (título + chapa de categoría) pre-pintado a `CanvasTexture`, sin troika.
 *
 * La textura cubre SOLO el bloque de texto, no el plano entero de la imagen: así
 * cada téxel se gasta en tinta y no en transparencia, y cabe pintarla a
 * `dpr × FRONT_MAG` (1:1 con los píxeles de pantalla de la card frontal) por
 * menos memoria de la que costaba la versión borrosa a plano completo.
 * Todo se dibuja en unidades de mundo y es `ctx.scale` quien aplica la densidad.
 */
function createOverlayTexture(category: string, title: string): OverlayLabel {
	const ss = Math.min(window.devicePixelRatio || 1, MAX_DPR) * FRONT_MAG;
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d")!;
	const family = displayFontFamily();
	const cat = category.toUpperCase();
	const half = TITLE_STROKE / 2;   // el contorno del título sobresale por la izquierda

	// Medir primero: el tamaño del canvas sale del texto, no al revés.
	ctx.font = `700 ${TAG_FONT}px ${family}`;
	ctx.letterSpacing = "1px";
	const tagW = ctx.measureText(cat).width + TAG_PAD_X * 2;

	ctx.font = `700 ${TITLE_FONT}px ${family}`;
	ctx.letterSpacing = "-0.2px";
	const titleM = ctx.measureText(title);

	const baseline = titleM.actualBoundingBoxAscent + half;
	const tagY = baseline + TITLE_GAP;
	const w = Math.max(titleM.width, tagW) + half * 2;
	const h = tagY + TAG_H + TAG_SHADOW;

	canvas.width = Math.ceil(w * ss);
	canvas.height = Math.ceil(h * ss);
	// Cambiar el tamaño resetea el contexto: fuente, espaciado y transform se
	// vuelven a poner después, nunca antes.
	ctx.scale(canvas.width / w, canvas.height / h);

	// Placa de contenedor con la categoría: lima, borde de tinta, canto duro
	ctx.fillStyle = INK;
	roundRect(ctx, half, tagY + TAG_SHADOW, tagW, TAG_H, TAG_RADIUS);
	ctx.fill();
	ctx.fillStyle = TAG;
	roundRect(ctx, half, tagY, tagW, TAG_H, TAG_RADIUS);
	ctx.fill();
	ctx.lineWidth = 1.25;
	ctx.strokeStyle = INK;
	ctx.stroke();
	ctx.font = `700 ${TAG_FONT}px ${family}`;
	ctx.letterSpacing = "1px";
	ctx.fillStyle = INK;
	ctx.textBaseline = "middle";
	ctx.fillText(cat, half + TAG_PAD_X, tagY + TAG_H / 2 + 1);

	// Título: rotulado de cómic — relleno papel con contorno de tinta
	ctx.font = `700 ${TITLE_FONT}px ${family}`;
	ctx.letterSpacing = "-0.2px";
	ctx.textBaseline = "alphabetic";
	ctx.lineJoin = "round";
	ctx.lineWidth = TITLE_STROKE;
	ctx.strokeStyle = INK;
	ctx.strokeText(title, half, baseline);
	ctx.fillStyle = PAPER;
	ctx.fillText(title, half, baseline);

	const texture = new THREE.CanvasTexture(canvas);
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	// CanvasTexture default `generateMipmaps=true` would build a mip pyramid that minFilter=Linear
	// never samples — pure VRAM waste (~33% overhead per texture).
	texture.generateMipmaps = false;
	texture.colorSpace = THREE.SRGBColorSpace;

	return {
		texture,
		width: w,
		height: h,
		// El bloque se ancla a la esquina inferior izquierda de la imagen: el
		// origen del título y el canto izquierdo de la chapa caen a LABEL_PAD, y
		// la sombra de la chapa asoma TAG_SHADOW por debajo de ese margen.
		x: -IMG_W / 2 + (LABEL_PAD - half) + w / 2,
		y: -IMG_H / 2 + (LABEL_PAD - TAG_SHADOW) + h / 2,
	};
}

/**
 * Degradado del velo (negro → transparente) para el canto alto de la imagen.
 *
 * Una sola columna de téxeles: el degradado es vertical y la textura se estira a lo
 * ancho del plano. `flipY` va por defecto en `CanvasTexture`, así que la fila 0 del
 * canvas cae en el borde SUPERIOR de la card (igual que el rótulo, que también se
 * pinta de arriba abajo). El material es quien gradúa el velo con su `opacity`; el
 * canvas solo guarda la FORMA del degradado, así una textura sirve para todas.
 */
function createVeilTexture(): THREE.CanvasTexture {
	const canvas = document.createElement("canvas");
	canvas.width = 4;
	canvas.height = 128;
	const ctx = canvas.getContext("2d")!;
	const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
	grad.addColorStop(0, "rgba(0,0,0,1)");
	grad.addColorStop(VEIL_STOP * 0.5, "rgba(0,0,0,0.42)");
	grad.addColorStop(VEIL_STOP, "rgba(0,0,0,0)");
	grad.addColorStop(1, "rgba(0,0,0,0)");
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const texture = new THREE.CanvasTexture(canvas);
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.generateMipmaps = false;
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface ScrollState {
	rotation: number;
	y: number;
	/** Subida de la sección antes de fijarse el sticky (0 = asomando por abajo, 1 = centrada). */
	entry: number;
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
	sharedLabelGeo,
	sharedHitAreaMat,
	sharedVeilTex,
}: {
	project: Project;
	categoryLabel: string;
	index: number;
	scrollRef: React.RefObject<ScrollState>;
	sharedPlaneGeo: THREE.PlaneGeometry;
	sharedImgGeo: THREE.PlaneGeometry;
	sharedEdgesGeo: THREE.EdgesGeometry;
	sharedFrameGeo: THREE.PlaneGeometry;
	sharedLabelGeo: THREE.PlaneGeometry;
	sharedHitAreaMat: THREE.MeshBasicMaterial;
	sharedVeilTex: THREE.CanvasTexture;
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
	// Velo de llegada: el degradado va en el mapa (compartido) y la fuerza en la opacidad.
	const veilMat = useMemo(
		() =>
			new THREE.MeshBasicMaterial({
				map: sharedVeilTex,
				transparent: true,
				opacity: 0,
				side: THREE.FrontSide,
				depthWrite: false,
			}),
		[sharedVeilTex]
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
	// Si Space Grotesk todavía no está cargada, el rótulo se pintaría con la fuente de
	// sistema y se quedaría así para siempre (la textura se pinta una sola vez).
	// `fontGen` fuerza un repintado cuando `document.fonts` termina.
	const [fontGen, setFontGen] = useState(0);
	useEffect(() => {
		if (displayFontLoaded(TITLE_FONT)) return;
		let alive = true;
		document.fonts.ready.then(() => {
			if (alive) setFontGen((g) => g + 1);
		});
		return () => {
			alive = false;
		};
	}, []);

	const label = useMemo(
		() => createOverlayTexture(categoryLabel, project.title),
		// `fontGen` no se usa dentro: es el disparador del repintado con la fuente ya cargada.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[categoryLabel, project.title, fontGen]
	);
	const overlayMat = useMemo(
		() =>
			new THREE.MeshBasicMaterial({
				map: label.texture,
				transparent: true,
				opacity: 0,
				side: THREE.FrontSide,
				depthWrite: false,
			}),
		[label]
	);

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
			veilMat.dispose();
			cardBaseMat.dispose();
			borderMat.dispose();
			inkMat.dispose();
		};
	}, [imageMat, darkMat, veilMat, cardBaseMat, borderMat, inkMat]);

	// El rótulo se recrea si la fuente llega tarde, así que se tira por separado:
	// meterlo en el cleanup de arriba haría que un repintado disparase también el
	// dispose de la textura de imagen, que sí vive todo el ciclo de la card.
	useEffect(() => {
		invalidate();
		return () => {
			overlayMat.map?.dispose();
			overlayMat.dispose();
		};
	}, [overlayMat, invalidate]);

	useFrame((_, delta) => {
		if (!groupRef.current || !scrollRef.current) return;
		// Clamp dt — frameloop="demand" can produce huge gaps after idle pauses,
		// which would teleport lerps to target if used raw.
		const dt = Math.min(delta, 1 / 30);
		const { rotation, entry } = scrollRef.current;
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

		// Velo de llegada. Función pura del scroll (sin lerp propio): al parar no hace falta
		// pedir más frames, y en e2e una misma posición de scroll da siempre la misma imagen.
		// Va multiplicado por `imgOpacity` para velar la foto y no el papel de la viñeta.
		// El término `entry` es el de la PRIMERA card: ya está de frente a scroll 0, así que
		// el ángulo no la velaría nunca — su llegada es la subida de la sección desde abajo.
		const veil = Math.max(Math.min(1, absFacing / VEIL_RANGE_DEG), 1 - entry);
		veilMat.opacity = veil * VEIL_ALPHA * imgOpacity.current * fade;
		veilMat.visible = veilMat.opacity > 0.004;

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

			{/*
			  Pila frontal: imagen → oscurecido → rótulo → zona de click. Todo es
			  transparente, y three.js ordena los transparentes por la distancia
			  del CENTRO de cada objeto, no por su z local. El rótulo no está
			  centrado en la card (vive en su esquina inferior izquierda), así que
			  con la card girada su centro cae más lejos que el de la imagen y se
			  pintaba DEBAJO de ella. `renderOrder` fija el orden a mano.
			*/}
			<group ref={frontGroupRef}>
				<mesh ref={imageRef} geometry={sharedImgGeo} position={[0, 0, 1]} renderOrder={1} material={imageMat} />
				<mesh geometry={sharedImgGeo} position={[0, 0, 1.5]} renderOrder={2} material={veilMat} visible={false} />
				<mesh geometry={sharedImgGeo} position={[0, 0, 2]} renderOrder={3} material={darkMat} />
				<mesh
					ref={overlayRef}
					geometry={sharedLabelGeo}
					position={[label.x, label.y, 3]}
					scale={[label.width, label.height, 1]}
					renderOrder={4}
					material={overlayMat}
					visible={false}
				/>

				{/* biome-ignore lint/a11y/noStaticElementInteractions: Three.js mesh, not DOM */}
				<mesh
					geometry={sharedImgGeo}
					position={[0, 0, 4]}
					renderOrder={5}
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
	// Plano 1×1: cada rótulo lo escala a su propio bloque de texto.
	const sharedLabelGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
	const sharedHitAreaMat = useMemo(
		() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.FrontSide }),
		[]
	);
	// El degradado del velo es idéntico en todas las cards: una textura para la rueda entera.
	const sharedVeilTex = useMemo(() => createVeilTexture(), []);

	useEffect(() => {
		return () => {
			sharedPlaneGeo.dispose();
			sharedImgGeo.dispose();
			sharedEdgesGeo.dispose();
			sharedFrameGeo.dispose();
			sharedLabelGeo.dispose();
			sharedHitAreaMat.dispose();
			sharedVeilTex.dispose();
		};
	}, [sharedPlaneGeo, sharedImgGeo, sharedEdgesGeo, sharedFrameGeo, sharedLabelGeo, sharedHitAreaMat, sharedVeilTex]);

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
						sharedLabelGeo={sharedLabelGeo}
						sharedHitAreaMat={sharedHitAreaMat}
						sharedVeilTex={sharedVeilTex}
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
				dpr={[1, MAX_DPR]}
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
