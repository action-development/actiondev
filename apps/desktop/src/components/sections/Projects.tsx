"use client";

import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import dynamic from "next/dynamic";
import { type RefObject, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CardBackgroundPreview } from "@/components/effects/card-background-preview";
import { AccentWord } from "@/components/ui/AccentWord";
import { featuredProjects as projects } from "@/data/projects";
import { PORT_CONTAINERS } from "@/data/port-containers";
import { useLocale, useT } from "@/lib/i18n";
import hud from "./projects-hud.module.css";

/** Color del contenedor TRABAJO del muelle: la carga que trajo al visitante hasta aquí. */
const CARGO_COLOR = PORT_CONTAINERS.find((c) => c.labelKey === "work")?.color ?? "#c8ff00";

// Recorrido del contenedor colgado: sin órbita. Se queda en el eje central
// (x = z = 0) y solo baja en vertical con el scroll del carrusel (`yOffset`).
const DECORATION_PATH = {
	x: { amp: 0, cycles: 0 },
	y: { amp: 0, cycles: 0 },
	z: { amp: 0, cycles: 0 },
} as const;

// Camera at z=14, fov=40 → half-screen height ≈ tan(20°) * 14 ≈ 5.1 Three.js units.
const VIEWPORT_HALF = 5;
// Caída total (unidades) desde el centro hasta quedar fuera por abajo: media pantalla + el contenedor.
const CARGO_DROP = VIEWPORT_HALF + 1;
// Fracción del scroll del carrusel a partir de la cual se funde (ya casi fuera por abajo,
// solo quedan los cables): hasta entonces es visible y baja al ritmo del scroll.
const CARGO_FADE_START = 0.9;
// Fracción inicial del scroll del carrusel en la que el contenedor aparece fundiendo (0 → 1).
const CARGO_FADE_IN = 0.04;
// Opacidad con la que la card asoma por abajo, antes de que el sticky se fije arriba. Crece
// hasta 1 a lo largo de esa subida: la tarjeta "llega" con el scroll en vez de estar ya puesta.
const ENTRY_OPACITY_FROM = 0.6;

function CarouselLoading() {
	const t = useT();
	return (
		<div className="absolute inset-0 flex items-center justify-center">
			<span className={hud.plate} role="status">
				<span aria-hidden className={`${hud.led} ${hud.ledBlink}`} />
				{t.projects.loading}
			</span>
		</div>
	);
}

const Carousel3D = dynamic(
	() => import("@/components/effects/carousel-3d").then((m) => m.Carousel3D),
	{ ssr: false, loading: () => <CarouselLoading /> }
);

const HangingCargoCanvas = dynamic(
	() => import("@/components/canvas/HangingCargo").then((m) => m.HangingCargoCanvas),
	{ ssr: false }
);

// --- Constants ──────────────────────────────────────────────────────────────

const NUM = projects.length;
const ANGLE_STEP = 75;
const TOTAL_ROTATION = (NUM - 1) * ANGLE_STEP;
const Y_STEP = 280;
const TOTAL_Y = (NUM - 1) * Y_STEP;

// --- Sub-components ─────────────────────────────────────────────────────────

/** Placa de contenedor con el nombre del proyecto a la vista, flanqueada por flechas de tinta. */
function ProjectIndicator({ nameRef }: { nameRef: RefObject<HTMLSpanElement | null> }) {
	return (
		<div className="absolute bottom-8 right-8 z-20 hidden items-center gap-3 md:flex">
			<span aria-hidden className={hud.arrow}>&lt;&lt;</span>
			<span ref={nameRef} className={`${hud.tag} min-w-[160px]`} style={{ ["--crate" as string]: CARGO_COLOR } as React.CSSProperties} />
			<span aria-hidden className={hud.arrow}>&gt;&gt;</span>
		</div>
	);
}

// --- Projects ────────────────────────────────────────────────────────────────

export function Projects() {
	const t = useT();
	const { locale } = useLocale();
	const wrapperRef       = useRef<HTMLDivElement>(null);
	const sectionRef       = useRef<HTMLElement>(null);
	const heroRef          = useRef<HTMLDivElement>(null);
	const line1Ref         = useRef<HTMLSpanElement>(null);
	const line2Ref         = useRef<HTMLSpanElement>(null);
	const indicatorRef     = useRef<HTMLSpanElement>(null);
	const carouselWrapRef  = useRef<HTMLDivElement>(null);

	// Single cube state — progress drives the slow yaw, yOffset drives the vertical drop
	const cubeRef        = useRef({ progress: 0, yOffset: 0 });
	const cubeWrapperRef = useRef<HTMLDivElement>(null);

	// Carousel state — `entry` (0 → 1) es la subida de la sección ANTES de fijarse el sticky.
	const scrollRef      = useRef({ rotation: 0, y: 0, entry: 0 });

	const lastIndexRef   = useRef(0);

	// Portal target — only available after mount (client-only)
	const [mounted, setMounted] = useState(false);
	// Portal client-only: no hay forma de saber en SSR que ya hay `document`.
	// eslint-disable-next-line react-hooks/set-state-in-effect
	useEffect(() => setMounted(true), []);

	/**
	 * Gate de montaje del carrusel 3D.
	 *
	 * POR QUÉ: el culling de las cards vive en su `useFrame` y va por ÁNGULO de la
	 * card, no por viewport del DOM. En cuanto el canvas monta y arranca el
	 * frameloop, las 3 cards dentro de HARD_CULL_DEG llaman a `loadTexture()` y se
	 * bajan sus vídeos. Medido con Playwright sin hacer scroll: 4,8 MB de .webm
	 * descargándose mientras el usuario sigue mirando el hero, compitiendo por
	 * ancho de banda con los 2,2 MB de Rapier. Por eso la home "se quedaba pillada".
	 *
	 * El rootMargin da medio viewport de margen: monta antes de que se vea, pero
	 * NO al cargar la página. Ojo al calibrarlo — la sección del carrusel arranca
	 * sobre los 200vh (hero del juego + hero de Projects), así que un rootMargin
	 * del 100% dispara con el scroll a cero y el gate no sirve de nada. Medido.
	 *
	 * Una vez montado no se desmonta: tirar el contexto WebGL y las texturas de
	 * vídeo al hacer scroll atrás costaría más que mantenerlo vivo.
	 */
	const [carouselNear, setCarouselNear] = useState(false);
	useEffect(() => {
		const section = sectionRef.current;
		if (!section) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setCarouselNear(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "50% 0px" }
		);
		observer.observe(section);
		return () => observer.disconnect();
	}, []);

	// --- Hero section ---
	useEffect(() => {
		const hero = heroRef.current;
		if (!hero) return;

		const ctx = gsap.context(() => {
			const words = hero.querySelectorAll("[data-word]");
			gsap.set(words, { opacity: 0, y: 30, rotateX: -30 });

			// Entrada del titular. El contenedor colgado NO se toca aquí: solo se ve durante
			// el carrusel (ver "Sticky section"). Antes lo mostraba este trigger, que al
			// cargar la página ya está pasado y no dispara, y el onUpdate del carrusel lo
			// dejaba a opacity 1 al volver arriba → aparecía sobre el titular.
			ScrollTrigger.create({
				trigger: hero,
				start: "top 60%",
				onEnter: () => {
					gsap.to(words, { opacity: 1, y: 0, rotateX: 0, duration: 0.5, ease: "power3.out", stagger: 0.06, delay: 0.2 });
				},
				onLeaveBack: () => {
					gsap.set(words, { opacity: 0, y: 30, rotateX: -30 });
				},
			});

			// Text exits left/right on scroll
			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: hero,
					start: "top top",
					end: "40% top",
					scrub: 0.3,
				},
			});
			tl.to(line1Ref.current, { xPercent: -45, opacity: 0, ease: "power2.in" }, 0);
			tl.to(line2Ref.current, { xPercent: 45, opacity: 0, ease: "power2.in" }, 0);
		}, hero);

		return () => ctx.revert();
	}, []);

	// --- Sticky section ---
	useEffect(() => {
		const section = sectionRef.current;
		if (!section) return;

		const indicator = indicatorRef.current;

		if (indicator) indicator.textContent = projects[0].title;

		const ctx = gsap.context(() => {
			/**
			 * Entrada de la sección: el tramo que el trigger del carrusel NO cubre.
			 *
			 * Aquel arranca en "top top" y a progress 0 la primera card ya está centrada,
			 * así que mientras la tarjeta sube desde abajo no había nada que animar. Este
			 * va de "asoma por abajo" a "sticky fijado": la card entra más apagada y gana
			 * opacidad con el scroll. `entry` viaja al canvas para que el velo del canto
			 * alto se disuelva con la misma subida (ver `carousel-3d.tsx`).
			 *
			 * `onRefresh` deja el valor correcto al cargar ya dentro o pasada la sección;
			 * `onLeave`/`onLeaveBack` lo fijan fuera de rango, donde `onUpdate` no llega.
			 */
			const applyEntry = (progress: number) => {
				scrollRef.current.entry = progress;
				const wrap = carouselWrapRef.current;
				if (wrap) {
					wrap.style.opacity = String(ENTRY_OPACITY_FROM + (1 - ENTRY_OPACITY_FROM) * progress);
				}
			};

			ScrollTrigger.create({
				trigger: section,
				start: "top bottom",
				end: "top top",
				scrub: true,
				onUpdate: (self) => applyEntry(self.progress),
				onRefresh: (self) => applyEntry(self.progress),
				onLeave: () => applyEntry(1),
				onLeaveBack: () => applyEntry(0),
			});

			ScrollTrigger.create({
				trigger: section,
				start: "top top",
				end: "bottom bottom",
				scrub: 1,
				onUpdate: (self) => {
					const progress = self.progress;
					const rotation = progress * TOTAL_ROTATION;

					scrollRef.current.rotation = rotation;
					scrollRef.current.y        = progress * TOTAL_Y;

					// Straight vertical drop from screen center (yOffset 0) to below the viewport,
					// linear in scroll across the WHOLE carousel (it exits as the section ends). x/z stay at 0, so the pendulum never gets excited.
					cubeRef.current.progress = progress;
					cubeRef.current.yOffset  = -CARGO_DROP * progress;

					// Único dueño de la opacidad del contenedor: funde de entrada en el primer tramo
					// del carrusel (a progress 0 vale 0 → arriba del todo nunca se ve) y de salida
					// en el último, para que los cables no lleguen al índice. Relativo al progreso
					// del carrusel, no a los píxeles de la sección (varían con NUM).
					const cubeWrapper = cubeWrapperRef.current;
					if (cubeWrapper) {
						const fadeIn = Math.min(1, progress / CARGO_FADE_IN);
						const fadeOut = 1 - Math.max(0, (progress - CARGO_FADE_START) / (1 - CARGO_FADE_START));
						cubeWrapper.style.opacity = String(Math.max(0, Math.min(fadeIn, fadeOut)));
					}

					const idx = Math.round(rotation / ANGLE_STEP) % NUM;
					if (idx !== lastIndexRef.current) {
						lastIndexRef.current = idx;
						if (indicator && projects[idx]) indicator.textContent = projects[idx].title;
					}
				},
			});
		});

		return () => ctx.revert();
	}, []);


	// -------------------------------------------------------------------------

	const cubePortal = mounted
		? createPortal(
				<div
					ref={cubeWrapperRef}
					data-testid="hanging-cargo"
					style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", opacity: 0 }}
					aria-hidden="true"
				>
					<HangingCargoCanvas
						scrollRef={cubeRef}
						color={CARGO_COLOR}
						label={t.nav.work}
						path={DECORATION_PATH}
					/>
				</div>,
				document.body
		  )
		: null;

	return (
		<>
			{/* El contenedor colgado se renderiza en document.body — escapa del overflow:hidden de todos los ancestros */}
			{cubePortal}

			<div ref={wrapperRef} className={hud.hud}>
				{/* Hero headline */}
				<div
					ref={heroRef}
					className="relative z-[2] flex h-[80vh] flex-col items-center justify-center gap-8 overflow-hidden pt-[20vh] container-editorial"
					style={{ perspective: "600px" }}
				>
					<h2 className="display-xl max-w-5xl text-center text-foreground">
						<span ref={line1Ref} className="block will-change-transform">
							{t.projects.transform.split(" ").map((word, i) => (
								<span key={i} data-word className="inline-block" style={{ marginRight: "0.25em" }}>
									{word}
								</span>
							))}
						</span>
						<span ref={line2Ref} className="block will-change-transform">
							<span data-word className="inline-block" style={{ marginRight: "0.25em" }}>
								<AccentWord>{t.projects.into}</AccentWord>
							</span>
							{t.projects.accent.split(" ").map((word, i) => (
								<span key={i} data-word className="inline-block" style={{ marginRight: "0.25em" }}>
									{word}
								</span>
							))}
						</span>
					</h2>
				</div>

				<section
					ref={sectionRef}
					aria-label="Featured projects showcase"
					className="relative z-[2]"
					style={{ height: `${200 + NUM * 55}vh` }}
				>
					<div className="sticky top-0 h-screen overflow-hidden">
						<CardBackgroundPreview />

						<div
							ref={carouselWrapRef}
							className="absolute inset-0 z-[5]"
							style={{ opacity: ENTRY_OPACITY_FROM }}
						>
							{carouselNear ? (
								<Carousel3D projects={projects} scrollRef={scrollRef} locale={locale} />
							) : (
								<CarouselLoading />
							)}
						</div>
						<ProjectIndicator nameRef={indicatorRef} />
					</div>
				</section>
			</div>
		</>
	);
}
