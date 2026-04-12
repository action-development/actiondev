"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useGSAP } from "@gsap/react";

import { testimonials, type Testimonial } from "@/data/testimonials";

gsap.registerPlugin(ScrollTrigger);

const FloatingCubeCanvas = dynamic(
	() => import("@/components/canvas/FloatingCube").then((m) => m.FloatingCubeCanvas),
	{ ssr: false }
);

// Import path separately to avoid dynamic import issues
import { CUBE_PATHS } from "@/components/canvas/FloatingCube";

/**
 * Testimonials — Hero headline transitions into split layout on scroll.
 *
 * 1. Page opens with "Trusted by visionaries" centered fullscreen
 * 2. On scroll, headline moves to left column (sticky)
 * 3. Cards appear on the right — initially showing challenge + author only
 * 4. As each card scrolls into view, the result quote reveals smoothly
 */

function ReviewCard({ t, expanded }: { t: Testimonial; expanded: boolean }) {
	const expandRef = useRef<HTMLDivElement>(null);
	const collapsed = useRef(false);

	// Collapse on first render — before GSAP runs, the element is full size in the DOM
	useGSAP(() => {
		const expand = expandRef.current;
		if (!expand || collapsed.current) return;
		gsap.set(expand, { height: 0, overflow: "hidden", opacity: 0 });
		collapsed.current = true;
	}, { scope: expandRef });

	// Expand when triggered
	useGSAP(() => {
		const expand = expandRef.current;
		if (!expand || !expanded) return;

		// Temporarily set auto to measure real height
		gsap.set(expand, { height: "auto" });
		const realHeight = expand.offsetHeight;
		gsap.set(expand, { height: 0 });

		gsap.to(expand, {
			height: realHeight,
			opacity: 1,
			duration: 0.9,
			ease: "power2.out",
			onComplete: () => {
				gsap.set(expand, { height: "auto", overflow: "visible" });
			},
		});
	}, { dependencies: [expanded] });

	return (
		<div
			className="group relative rounded-2xl border border-white/[0.06] bg-[#0e0e0e] px-10 py-9 transition-all duration-500 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-[#141414] hover:shadow-[0_8px_40px_rgba(255,255,255,0.03)]"
		>
			{/* Hover inner glow — top edge */}
			<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/0 to-transparent transition-all duration-500 group-hover:via-white/[0.15]" />

			{/* Challenge + Author — always visible */}
			<div className="flex items-start justify-between gap-6">
				<div className="flex-1">
					<p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/25">
						The challenge
					</p>
					<p className="max-w-2xl text-base leading-relaxed text-white/50 italic">
						&ldquo;{t.idea}&rdquo;
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-3 pt-4">
					<Image
						src={t.avatar}
						alt={t.name}
						width={40}
						height={40}
						className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10 transition-all duration-500 group-hover:ring-white/20"
					/>
					<div>
						<p className="text-sm font-semibold text-foreground/80">{t.name}</p>
						<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
							{t.project}
						</p>
					</div>
				</div>
			</div>

			{/* Expandable result — grows downward on scroll */}
			<div ref={expandRef}>
				<div className="mt-7 h-px w-full bg-white/[0.08]" />
				<div className="pt-7">
					<p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/25">
						What they said
					</p>
					<p className="max-w-2xl text-xl font-medium leading-[1.5] tracking-tight text-foreground/90">
						&ldquo;{t.quote}&rdquo;
					</p>
				</div>
			</div>
		</div>
	);
}

export function Testimonials() {
	const sectionRef = useRef<HTMLDivElement>(null);
	const heroRef = useRef<HTMLDivElement>(null);
	const headlineRef = useRef<HTMLHeadingElement>(null);
	const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
	const expandedSet = useRef(new Set<number>());
	const [expandedState, setExpandedState] = useState<boolean[]>(
		() => testimonials.map(() => false)
	);
	const cubeScrollRef = useRef({ progress: 0 });

	// Cube scroll progress
	useEffect(() => {
		const section = sectionRef.current;
		if (!section) return;

		const ctx = gsap.context(() => {
			ScrollTrigger.create({
				trigger: section,
				start: "top top",
				end: "bottom bottom",
				onUpdate: (self) => {
					cubeScrollRef.current.progress = self.progress;
				},
			});
		});

		return () => ctx.revert();
	}, []);

	useGSAP(() => {
		const hero = heroRef.current;
		const headline = headlineRef.current;
		if (!hero || !headline) return;

		// Headline animation: center → left
		const maxW = 1280;
		const targetLeft = Math.max(24, (window.innerWidth - maxW) / 2);
		const targetTop = 128;
		const targetScale = 0.65;

		gsap.to(headline, {
			left: targetLeft,
			top: targetTop,
			xPercent: 0,
			yPercent: 0,
			scale: targetScale,
			transformOrigin: "top left",
			ease: "none",
			scrollTrigger: {
				trigger: hero,
				start: "top top",
				end: "bottom top",
				scrub: 0.5,
			},
		});

		// Single scroll listener — checks each card's real-time position
		const checkCards = () => {
			const threshold = window.innerHeight * 0.55;
			let changed = false;

			cardRefs.current.forEach((card, i) => {
				if (!card || expandedSet.current.has(i)) return;
				const rect = card.getBoundingClientRect();
				if (rect.top < threshold) {
					expandedSet.current.add(i);
					changed = true;
				}
			});

			if (changed) {
				setExpandedState(
					testimonials.map((_, i) => expandedSet.current.has(i))
				);
			}
		};

		ScrollTrigger.create({
			trigger: sectionRef.current,
			start: "top bottom",
			end: "bottom top",
			onUpdate: checkCards,
		});
	}, { scope: sectionRef });

	return (
		<div ref={sectionRef}>
			<FloatingCubeCanvas scrollRef={cubeScrollRef} color="#ec4899" path={CUBE_PATHS.reviews} />

			{/* ── Hero spacer ── */}
			<div ref={heroRef} className="h-screen" />

			{/* ── Headline: fixed, starts centered, animates to left ── */}
			<h2
				ref={headlineRef}
				className="fixed left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center text-6xl font-bold leading-[0.95] tracking-tighter will-change-transform md:text-8xl"
			>
				Trusted by
				<br />
				<span className="text-accent">visionaries</span>
			</h2>

			{/* ── Cards section ── */}
			<div className="relative z-[2] px-6 pb-[50vh]">
				<div className="mx-auto max-w-7xl md:pl-[40%]">
					<div className="flex flex-col gap-16">
						{testimonials.map((t, i) => (
							<div
								key={t.id}
								ref={(el) => { cardRefs.current[i] = el; }}
							>
								<ReviewCard t={t} expanded={expandedState[i]} />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
