"use client";

import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import dynamic from "next/dynamic";
import { type RefObject, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CardBackgroundPreview } from "@/components/effects/card-background-preview";
import { AccentWord } from "@/components/ui/AccentWord";
import { featuredProjects as projects } from "@/data/projects";
import { useLocale, useT } from "@/lib/i18n";

const DECORATION_PATH = {
	x: { amp: 6, cycles: 1.3 },
	y: { amp: 3.5, cycles: 2.1 },
	z: { amp: 5, cycles: 0.7 },
} as const;

// Camera at z=14, fov=40 → half-screen height ≈ tan(20°) * 14 ≈ 5.1 Three.js units.
const VIEWPORT_HALF = 5;
// DESCENT is how far the cube drops (in units) between the headline and the sticky section.
const DESCENT = 2.5;
// Orbit fraction pre-seeded during the descent → sticky bridge (so orbit starts visibly earlier).
const PRE_ORBIT = 0.06;

function CarouselLoading() {
	const t = useT();
	return (
		<div className="absolute inset-0 flex items-center justify-center">
			<span className="font-mono text-xs text-foreground/20 animate-pulse">{t.projects.loading}</span>
		</div>
	);
}

const Carousel3D = dynamic(
	() => import("@/components/effects/carousel-3d").then((m) => m.Carousel3D),
	{ ssr: false, loading: () => <CarouselLoading /> }
);

const FloatingCubeLiteCanvas = dynamic(
	() => import("@/components/canvas/FloatingCubeLite").then((m) => m.FloatingCubeLiteCanvas),
	{ ssr: false }
);

// --- Constants ──────────────────────────────────────────────────────────────

const NUM = projects.length;
const ANGLE_STEP = 75;
const TOTAL_ROTATION = (NUM - 1) * ANGLE_STEP;
const Y_STEP = 280;
const TOTAL_Y = (NUM - 1) * Y_STEP;

// --- Sub-components ─────────────────────────────────────────────────────────

function CentralColumn({ textRef, label }: { textRef: RefObject<HTMLSpanElement | null>; label: string }) {
	return (
		<div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center overflow-hidden">
			<div className="relative flex h-screen items-start justify-center" style={{ perspective: "800px" }}>
				<span
					ref={textRef}
					className="block font-mono font-bold leading-[0.75] tracking-[-0.05em] text-foreground/[0.12] will-change-transform"
					style={{
						writingMode: "vertical-rl",
						textOrientation: "mixed",
						fontSize: "clamp(18rem, 40vh, 45rem)",
						transform: "rotateY(-12deg) rotateX(3deg) translateY(10%)",
						transformStyle: "preserve-3d",
					}}
				>
					{label}
				</span>
			</div>
		</div>
	);
}

function ProjectIndicator({ nameRef }: { nameRef: RefObject<HTMLSpanElement | null> }) {
	return (
		<div className="absolute bottom-8 right-8 z-20 hidden items-center gap-4 md:flex">
			<span className="font-mono text-xs text-foreground/30">&lt;&lt;</span>
			<span ref={nameRef} className="min-w-[140px] text-center font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/50" />
			<span className="font-mono text-xs text-foreground/30">&gt;&gt;</span>
		</div>
	);
}

function ProgressBar({ barRef, labelRef }: { barRef: RefObject<HTMLDivElement | null>; labelRef: RefObject<HTMLSpanElement | null> }) {
	return (
		<div className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-1 md:flex">
			<div className="h-32 w-px overflow-hidden rounded-full bg-[var(--hairline-strong)]">
				<div ref={barRef} className="h-full w-full origin-top rounded-full bg-foreground/50" style={{ transform: "scaleY(0)" }} />
			</div>
			<span ref={labelRef} className="mt-1 font-mono text-[9px] text-foreground/30">0%</span>
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
	const progressBarRef   = useRef<HTMLDivElement>(null);
	const progressLabelRef = useRef<HTMLSpanElement>(null);
	const columnTextRef    = useRef<HTMLSpanElement>(null);

	// Single cube state — progress drives Lissajous orbit, yOffset drives descent
	const cubeRef        = useRef({ progress: 0, yOffset: 0 });
	const cubeWrapperRef = useRef<HTMLDivElement>(null);

	// Carousel state
	const scrollRef      = useRef({ rotation: 0, y: 0 });

	const lastIndexRef   = useRef(0);
	const lastPercentRef = useRef(0);

	// Portal target — only available after mount (client-only)
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	// --- Hero section ---
	useEffect(() => {
		const hero = heroRef.current;
		if (!hero) return;

		const ctx = gsap.context(() => {
			const words = hero.querySelectorAll("[data-word]");
			gsap.set(words, { opacity: 0, y: 30, rotateX: -30 });

			// Cube + text entrance: fires when this section scrolls into view.
			// onLeaveBack resets so scroll-back works correctly.
			ScrollTrigger.create({
				trigger: hero,
				start: "top 60%",
				onEnter: () => {
					gsap.to(cubeWrapperRef.current, { opacity: 1, duration: 0.6, ease: "power2.out" });
					gsap.to(words, { opacity: 1, y: 0, rotateX: 0, duration: 0.5, ease: "power3.out", stagger: 0.06, delay: 0.2 });
				},
				onLeaveBack: () => {
					gsap.to(cubeWrapperRef.current, { opacity: 0, duration: 0.3, ease: "power2.in" });
					gsap.set(words, { opacity: 0, y: 30, rotateX: -30 });
				},
			});

			// When "top 60%" fires, the hero center is at the very bottom of the viewport
			// (60% + 40vh = 100%). The cube defaults to yOffset=0 = viewport center, so it
			// appears ~40% above the text. This trigger scrubs yOffset from -VIEWPORT_HALF
			// (cube at bottom, aligned with text) to 0 (cube at center) as the hero scrolls
			// to center — cube and text rise into the viewport together.
			// Range ends at "center center" (hero center = viewport center = Three.js y=0).
			// Does not overlap with the descent trigger which starts at "40% top".
			ScrollTrigger.create({
				trigger: hero,
				start: "top 60%",
				end: "center center",
				scrub: 0.5,
				onUpdate: (self) => {
					cubeRef.current.yOffset = -VIEWPORT_HALF * (1 - self.progress);
				},
			});

			// Text exits left/right on scroll — cube stays centered (progress=0 → [0,0,0])
			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: hero,
					start: "top top",
					end: "40% top",
					scrub: 0.3,
				},
			});
			tl.to(line1Ref.current, { xPercent: -120, opacity: 0, ease: "power2.in" }, 0);
			tl.to(line2Ref.current, { xPercent: 120, opacity: 0, ease: "power2.in" }, 0);

			// Cube descends as the hero scrolls away, bridging the gap to the sticky section.
			// endTrigger covers the "Selected Work" divider so no trigger-less gap exists.
			// yOffset follows a parabola (0 → -DESCENT → 0): the cube arcs down and rises
			// back to center exactly when the sticky section starts — no correction needed there.
			// PRE_ORBIT pre-seeds the Lissajous orbit so the cube is already moving laterally
			// before the sticky carousel kicks in.
			ScrollTrigger.create({
				trigger: hero,
				endTrigger: sectionRef.current!,
				start: "40% top",
				end: "top top",
				scrub: 1,
				onUpdate: (self) => {
					const p = self.progress;
					cubeRef.current.yOffset  = -(4 * p * (1 - p)) * DESCENT;
					cubeRef.current.progress = p * PRE_ORBIT;
				},
			});
		}, hero);

		return () => ctx.revert();
	}, []);

	// --- Sticky section ---
	useEffect(() => {
		const section = sectionRef.current;
		if (!section) return;

		const indicator = indicatorRef.current;
		const bar       = progressBarRef.current;
		const label     = progressLabelRef.current;

		if (indicator) indicator.textContent = projects[0].title;

		const ctx = gsap.context(() => {
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

					// Orbit continues from PRE_ORBIT (seeded during descent) — no vertical correction
					// needed since the descent trigger already returns yOffset to 0 at this point.
					cubeRef.current.progress = PRE_ORBIT + progress * (1 - PRE_ORBIT);
					cubeRef.current.yOffset  = 0;

					// Fade cube out from 75 % → 95 % of sticky scroll so it's fully hidden
					// well before the Testimonials section appears. Driven here (not a separate
					// ScrollTrigger) so the percentage is relative to carousel progress, not to
					// the section's pixel height (which varies with NUM).
					const cubeWrapper = cubeWrapperRef.current;
					if (cubeWrapper) {
						cubeWrapper.style.opacity = String(
							Math.max(0, 1 - Math.max(0, (progress - 0.75) / 0.2))
						);
					}

					const idx = Math.round(rotation / ANGLE_STEP) % NUM;
					if (idx !== lastIndexRef.current) {
						lastIndexRef.current = idx;
						if (indicator && projects[idx]) indicator.textContent = projects[idx].title;
					}

					if (bar) bar.style.transform = `scaleY(${progress})`;

					const pct = Math.round(progress * 100);
					if (pct !== lastPercentRef.current) {
						lastPercentRef.current = pct;
						if (label) label.textContent = `${pct}%`;
					}
				},
			});

			if (columnTextRef.current) {
				gsap.to(columnTextRef.current, {
					yPercent: -85,
					ease: "none",
					scrollTrigger: {
						trigger: section,
						start: "top top",
						end: "bottom bottom",
						scrub: 1,
					},
				});
			}
		});

		return () => ctx.revert();
	}, []);


	// -------------------------------------------------------------------------

	const cubePortal = mounted
		? createPortal(
				<div
					ref={cubeWrapperRef}
					style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", opacity: 0 }}
					aria-hidden="true"
				>
					<FloatingCubeLiteCanvas
						scrollRef={cubeRef}
						color="#c8ff00"
						path={DECORATION_PATH}
						position="absolute"
					/>
				</div>,
				document.body
		  )
		: null;

	return (
		<>
			{/* Single cube rendered at document.body — escapes overflow:hidden on all ancestors */}
			{cubePortal}

			<div ref={wrapperRef}>
				{/* Hero headline */}
				<div
					ref={heroRef}
					className="relative z-[2] flex h-[80vh] flex-col items-center justify-center overflow-hidden container-editorial"
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
							<span data-word className="inline-block" style={{ marginRight: "0.25em" }}>{t.projects.into}</span>
							<span data-word className="inline-block"><AccentWord>{t.projects.accent}</AccentWord></span>
						</span>
					</h2>
				</div>

				<div className="relative z-[2] flex items-center justify-center gap-6 pb-[calc(var(--section-py)/2)]">
					<span className="h-px w-16 bg-[var(--hairline-strong)]" />
					<span className="micro-label text-foreground/50">{t.projects.selectedWork}</span>
					<span className="h-px w-16 bg-[var(--hairline-strong)]" />
				</div>

				<section
					ref={sectionRef}
					aria-label="Featured projects showcase"
					className="relative z-[2]"
					style={{ height: `${200 + NUM * 55}vh` }}
				>
					<div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[0] h-[30vh] bg-gradient-to-b from-neutral-950 to-transparent" />
					<div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[0] h-[30vh] bg-gradient-to-t from-neutral-950 to-transparent" />

					<div className="sticky top-0 h-screen overflow-hidden">
						<CardBackgroundPreview />

						<div className="absolute right-8 top-20 z-20 hidden items-center gap-3 md:flex">
							<span className="micro-label text-foreground/60">{t.projects.sectionLabel}</span>
							<span className="h-px w-6 bg-[var(--hairline-strong)]" />
						</div>

						<CentralColumn textRef={columnTextRef} label={t.projects.columnLabel} />
						<Carousel3D projects={projects} scrollRef={scrollRef} locale={locale} />
						<ProjectIndicator nameRef={indicatorRef} />
						<ProgressBar barRef={progressBarRef} labelRef={progressLabelRef} />
					</div>
				</section>
			</div>
		</>
	);
}
