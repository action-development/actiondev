"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useGSAP } from "@gsap/react";

import { testimonials, type Testimonial } from "@/data/testimonials";

gsap.registerPlugin(ScrollTrigger);

const FloatingCubeLiteCanvas = dynamic(
	() => import("@/components/canvas/FloatingCubeLite").then((m) => m.FloatingCubeLiteCanvas),
	{ ssr: false }
);

import { CUBE_PATHS } from "@/components/canvas/FloatingCubeLite";

function ReviewCard({ t, expanded }: { t: Testimonial; expanded: boolean }) {
	const expandRef = useRef<HTMLDivElement>(null);
	const collapsed = useRef(false);

	useGSAP(() => {
		const expand = expandRef.current;
		if (!expand || collapsed.current) return;
		gsap.set(expand, { height: 0, overflow: "hidden", opacity: 0 });
		collapsed.current = true;
	}, { scope: expandRef });

	useGSAP(() => {
		const expand = expandRef.current;
		if (!expand) return;

		if (expanded) {
			gsap.set(expand, { height: "auto", overflow: "hidden" });
			const realHeight = expand.offsetHeight;
			gsap.set(expand, { height: 0 });

			gsap.to(expand, {
				height: realHeight,
				opacity: 1,
				delay: 0.4,
				duration: 1.1,
				ease: "power3.out",
				onComplete: () => {
					gsap.set(expand, { height: "auto", overflow: "visible" });
				},
			});
		} else if (collapsed.current) {
			gsap.to(expand, {
				height: 0,
				opacity: 0,
				duration: 0.5,
				ease: "power2.in",
				overwrite: true,
				onComplete: () => {
					gsap.set(expand, { overflow: "hidden" });
				},
			});
		}
	}, { dependencies: [expanded] });

	return (
		<article
			className="group relative overflow-hidden rounded-2xl border border-white/[0.04] bg-card px-8 py-8 transition-all duration-500 hover:border-white/[0.08] hover:bg-card-hover md:px-10 md:py-10"
		>
			{/* Top line — reveals on hover */}
			<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/0 to-transparent transition-all duration-700 group-hover:via-white/[0.08]" />

			{/* Author row */}
			<div className="mb-6 flex items-center gap-4">
				<Image
					src={t.avatar}
					alt={`Photo of ${t.name}`}
					width={48}
					height={48}
					sizes="48px"
					loading="lazy"
					className="h-12 w-12 rounded-full object-cover ring-2 ring-white/[0.06]"
				/>
				<div>
					<h3 className="text-[15px] font-semibold text-foreground">{t.name}</h3>
					<p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
						{t.project}
					</p>
				</div>
			</div>

			{/* Challenge */}
			<div>
				<p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
					The challenge
				</p>
				<p className="max-w-2xl text-[15px] leading-[1.7] text-white/50">
					&ldquo;{t.idea}&rdquo;
				</p>
			</div>

			{/* Expandable result */}
			<div ref={expandRef}>
				<div className="mb-6 mt-6 h-px w-full bg-white/[0.05]" />
				<div>
					<p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
						What they said
					</p>
					<p className="max-w-2xl text-lg font-medium leading-[1.6] tracking-tight text-foreground/90">
						&ldquo;{t.quote}&rdquo;
					</p>
				</div>
			</div>
		</article>
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

		const checkCards = () => {
			const vh = window.innerHeight;
			const expandAt = vh * 0.7;
			const collapseAt = vh * 0.9;
			let changed = false;

			cardRefs.current.forEach((card, i) => {
				if (!card) return;
				const rect = card.getBoundingClientRect();

				if (!expandedSet.current.has(i) && rect.top < expandAt) {
					expandedSet.current.add(i);
					changed = true;
				} else if (expandedSet.current.has(i) && rect.top > collapseAt) {
					expandedSet.current.delete(i);
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
			<FloatingCubeLiteCanvas scrollRef={cubeScrollRef} color="#ec4899" path={CUBE_PATHS.reviews} />

			<div ref={heroRef} className="h-screen" />

			<h2
				ref={headlineRef}
				className="fixed left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center text-6xl font-bold leading-[0.95] tracking-tighter will-change-transform md:text-8xl"
			>
				Trusted by
				<br />
				<span className="text-accent">visionaries</span>
			</h2>

			<div className="relative z-[2] px-6 pb-[50vh]">
				<div className="mx-auto max-w-7xl md:pl-[40%]">
					<div className="flex flex-col gap-8">
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
