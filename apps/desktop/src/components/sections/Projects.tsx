"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import { type RefObject, useEffect, useRef } from "react";
import { CardBackgroundPreview } from "@/components/effects/card-background-preview";
import { projects } from "@/data/projects";

const Carousel3D = dynamic(
	() => import("@/components/effects/carousel-3d").then((m) => m.Carousel3D),
	{ ssr: false }
);

const FloatingCubeLiteCanvas = dynamic(
	() => import("@/components/canvas/FloatingCubeLite").then((m) => m.FloatingCubeLiteCanvas),
	{ ssr: false }
);

gsap.registerPlugin(ScrollTrigger);

// --- Constants ──────────────────────────────────────────────────────────────

const NUM = projects.length;
const ANGLE_STEP = 75;
const TOTAL_ROTATION = (NUM - 1) * ANGLE_STEP;
const Y_STEP = 280;
const TOTAL_Y = (NUM - 1) * Y_STEP;

// --- Sub-components (DOM overlays) ──────────────────────────────────────────

function CentralColumn({ textRef }: { textRef: RefObject<HTMLSpanElement | null> }) {
	return (
		<div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center overflow-hidden">
			<div
				className="relative flex h-screen items-start justify-center"
				style={{ perspective: "800px" }}
			>
				<span
					ref={textRef}
					className="block font-mono font-bold leading-[0.75] tracking-[-0.05em] text-white/[0.12] will-change-transform"
					style={{
						writingMode: "vertical-rl",
						textOrientation: "mixed",
						fontSize: "clamp(18rem, 40vh, 45rem)",
						transform: "rotateY(-12deg) rotateX(3deg) translateY(10%)",
						transformStyle: "preserve-3d",
					}}
				>
					PROJECTS
				</span>
			</div>
		</div>
	);
}

function ProjectIndicator({ nameRef }: { nameRef: RefObject<HTMLSpanElement | null> }) {
	return (
		<div className="absolute bottom-8 right-8 z-20 hidden items-center gap-4 md:flex">
			<span className="font-mono text-xs text-white/30">&lt;&lt;</span>
			<span
				ref={nameRef}
				className="min-w-[140px] text-center font-mono text-[11px] uppercase tracking-[0.2em] text-white/50"
			/>
			<span className="font-mono text-xs text-white/30">&gt;&gt;</span>
		</div>
	);
}

function ProgressBar({
	barRef,
	labelRef,
}: {
	barRef: RefObject<HTMLDivElement | null>;
	labelRef: RefObject<HTMLSpanElement | null>;
}) {
	return (
		<div className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-1 md:flex">
			<div className="h-32 w-px overflow-hidden rounded-full bg-white/10">
				<div
					ref={barRef}
					className="h-full w-full origin-top rounded-full bg-white/40"
					style={{ transform: "scaleY(0)" }}
				/>
			</div>
			<span ref={labelRef} className="mt-1 font-mono text-[9px] text-white/30">
				0%
			</span>
		</div>
	);
}

// --- Projects (main section) ────────────────────────────────────────────────

export function Projects() {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const sectionRef = useRef<HTMLElement>(null);
	const heroRef = useRef<HTMLDivElement>(null);
	const line1Ref = useRef<HTMLSpanElement>(null);
	const line2Ref = useRef<HTMLSpanElement>(null);
	const indicatorRef = useRef<HTMLSpanElement>(null);
	const progressBarRef = useRef<HTMLDivElement>(null);
	const progressLabelRef = useRef<HTMLSpanElement>(null);
	const columnTextRef = useRef<HTMLSpanElement>(null);

	const lastIndexRef = useRef(0);
	const lastPercentRef = useRef(0);

	// Mutable scroll state shared with Three.js scenes (no re-renders)
	const scrollRef = useRef({ rotation: 0, y: 0 });
	// Page-wide scroll progress for the floating cube (0→1 over entire page)
	const cubeScrollRef = useRef({ progress: 0 });

	// --- Hero headline animations ---
	useEffect(() => {
		const hero = heroRef.current;
		if (!hero) return;

		const ctx = gsap.context(() => {
			// Entrance: words reveal with stagger — fast, no delay
			const words = hero.querySelectorAll("[data-word]");
			gsap.set(words, { opacity: 0, y: 30, rotateX: -30 });
			gsap.to(words, {
				opacity: 1,
				y: 0,
				rotateX: 0,
				duration: 0.5,
				ease: "power3.out",
				stagger: 0.06,
			});

			// Scroll exit: lines split to opposite sides
			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: hero,
					start: "top top",
					end: "40% top",
					scrub: 0.3,
				},
			});

			tl.to(
				line1Ref.current,
				{ xPercent: -120, opacity: 0, ease: "power2.in" },
				0
			);
			tl.to(
				line2Ref.current,
				{ xPercent: 120, opacity: 0, ease: "power2.in" },
				0
			);
		}, hero);

		return () => ctx.revert();
	}, []);

	// --- All scroll animations (single context, fewer ScrollTrigger instances) ---
	useEffect(() => {
		const wrapper = wrapperRef.current;
		const section = sectionRef.current;
		if (!wrapper || !section) return;

		const indicator = indicatorRef.current;
		const bar = progressBarRef.current;
		const label = progressLabelRef.current;

		if (indicator) indicator.textContent = projects[0].title;

		const ctx = gsap.context(() => {
			// Page-wide progress for floating cube
			ScrollTrigger.create({
				trigger: wrapper,
				start: "top top",
				end: "bottom bottom",
				onUpdate: (self) => {
					cubeScrollRef.current.progress = self.progress;
				},
			});

			// Carousel rotation + UI overlays (single trigger)
			ScrollTrigger.create({
				trigger: section,
				start: "top top",
				end: "bottom bottom",
				scrub: 1,
				onUpdate: (self) => {
					const progress = self.progress;
					const rotation = progress * TOTAL_ROTATION;

					scrollRef.current.rotation = rotation;
					scrollRef.current.y = progress * TOTAL_Y;

					const idx = Math.round(rotation / ANGLE_STEP) % NUM;
					if (idx !== lastIndexRef.current) {
						lastIndexRef.current = idx;
						if (indicator && projects[idx]) {
							indicator.textContent = projects[idx].title;
						}
					}

					if (bar) bar.style.transform = `scaleY(${progress})`;

					const pct = Math.round(progress * 100);
					if (pct !== lastPercentRef.current) {
						lastPercentRef.current = pct;
						if (label) label.textContent = `${pct}%`;
					}
				},
			});

			// Column text scroll
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

	return (
		<div ref={wrapperRef}>
			{/* Floating cube — scroll-driven, drifts behind all content */}
			<FloatingCubeLiteCanvas scrollRef={cubeScrollRef} />

			{/* Hero headline — text reveals on load, splits on scroll */}
			<div
				ref={heroRef}
				className="relative z-[2] flex h-[80vh] flex-col items-center justify-center overflow-hidden px-6"
				style={{ perspective: "600px" }}
			>
				<h1 className="max-w-5xl text-center text-[clamp(2.8rem,7vw,6.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-white">
					<span ref={line1Ref} className="block will-change-transform">
						{"Transform your ideas".split(" ").map((word, i) => (
							<span
								key={i}
								data-word
								className="inline-block"
								style={{ marginRight: "0.25em" }}
							>
								{word}
							</span>
						))}
					</span>
					<span ref={line2Ref} className="block will-change-transform">
						{"into".split(" ").map((word, i) => (
							<span
								key={`b-${i}`}
								data-word
								className="inline-block"
								style={{ marginRight: "0.25em" }}
							>
								{word}
							</span>
						))}
						<span data-word className="inline-block italic">
							sales
						</span>
					</span>
				</h1>
			</div>

			<div className="relative z-[2] flex items-center justify-center gap-6 pb-24">
				<span className="h-px w-16 bg-white/15" />
				<span className="font-mono text-sm uppercase tracking-[0.3em] text-white/40">
					Selected Work
				</span>
				<span className="h-px w-16 bg-white/15" />
			</div>

			<section
				id="projects"
				ref={sectionRef}
				aria-label="Featured projects showcase"
				className="relative z-[2]"
				style={{ height: `${200 + NUM * 55}vh` }}
			>
				{/* Gradient transitions */}
				<div
					aria-hidden
					className="pointer-events-none absolute inset-x-0 top-0 z-[0] h-[30vh] bg-gradient-to-b from-neutral-950 to-transparent"
				/>
				<div
					aria-hidden
					className="pointer-events-none absolute inset-x-0 bottom-0 z-[0] h-[30vh] bg-gradient-to-t from-neutral-950 to-transparent"
				/>

				<div className="sticky top-0 h-screen overflow-hidden">
				{/* Fullscreen background preview on hover */}
				<CardBackgroundPreview />

				{/* Section label */}
				<div className="absolute right-8 top-20 z-20 hidden items-center gap-3 md:flex">
					<span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
						Projects
					</span>
					<span className="h-px w-6 bg-white/15" />
				</div>

				<CentralColumn textRef={columnTextRef} />

				{/* Three.js 3D Carousel */}
				<Carousel3D projects={projects} scrollRef={scrollRef} />

				{/* UI Overlays */}
				<ProjectIndicator nameRef={indicatorRef} />
				<ProgressBar barRef={progressBarRef} labelRef={progressLabelRef} />
			</div>
		</section>
		</div>
	);
}
