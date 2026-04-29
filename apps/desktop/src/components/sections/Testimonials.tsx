"use client";

import { useRef, useState, useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import Image from "next/image";
import { useGSAP } from "@gsap/react";

import { testimonials, type Testimonial } from "@/data/testimonials";
import { AccentWord } from "@/components/ui/AccentWord";
import { useLocale, useT } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// Editorial review — no container chrome, pure typography.

function ReviewCard({ t, expanded }: { t: Testimonial; expanded: boolean }) {
	const { locale } = useLocale();
	const idea  = locale === "es" ? (t.ideaEs  ?? t.idea)  : t.idea;
	const quote = locale === "es" ? (t.quoteEs ?? t.quote) : t.quote;
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
				delay: 0.3,
				duration: 1.0,
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
		<article>
			<header className="mb-10 flex items-center gap-4">
				<Image
					src={t.avatar}
					alt={`Portrait of ${t.name}`}
					width={40}
					height={40}
					sizes="40px"
					loading="lazy"
					className="h-10 w-10 rounded-full object-cover"
				/>
				<div className="flex items-baseline gap-3">
					<span className="font-display text-[15px] font-medium tracking-[-0.01em] text-foreground">{t.name}</span>
					<span className="text-muted" aria-hidden>·</span>
					<span className="micro-label">{t.project}</span>
				</div>
			</header>

			<p className="font-display text-[19px] font-normal leading-[1.5] tracking-[-0.02em] max-w-[52ch] text-foreground/65">
				&ldquo;{idea}&rdquo;
			</p>

			<div ref={expandRef}>
				<p className="font-display mt-10 max-w-[38ch] text-[clamp(1.25rem,1.9vw,1.65rem)] font-normal leading-[1.45] tracking-[-0.025em] text-foreground/90">
					&ldquo;{quote}&rdquo;
				</p>
			</div>
		</article>
	);
}

// ─────────────────────────────────────────────────────────────────────────────

const HEADLINE_MAX_W = 1280;
const HEADLINE_TARGET_TOP = 128;
const HEADLINE_TARGET_SCALE = 0.62;

export function Testimonials() {
	const tStr = useT();
	const sectionRef = useRef<HTMLDivElement>(null);
	const heroRef    = useRef<HTMLDivElement>(null);
	const headlineRef = useRef<HTMLHeadingElement>(null);
	const cardRefs   = useRef<(HTMLDivElement | null)[]>([]);
	const expandedSet = useRef(new Set<number>());
	const [expandedState, setExpandedState] = useState<boolean[]>(
		() => testimonials.map(() => false)
	);

	useGSAP(() => {
		const hero     = heroRef.current;
		const headline = headlineRef.current;
		const section  = sectionRef.current;
		if (!hero || !headline || !section) return;

		// ── Initial state ───────────────────────────────────────────────────
		// autoAlpha:0 hides via opacity+visibility so there's no flash before
		// the scroll animation takes over. transformOrigin top-left keeps the
		// scale pivot at the element's natural corner (final resting position).
		gsap.set(headline, {
			autoAlpha: 0,
			transformOrigin: "top left",
			left: "50%",
			top: "50%",
			xPercent: -50,
			yPercent: -50,
			scale: 1,
		});

		// ── Main timeline: single ScrollTrigger on heroRef ──────────────────
		// Using one timeline + one ScrollTrigger avoids the cached-start-value
		// bug that appears when multiple ScrollTriggers target the same element.
		//
		// Scroll range: hero top enters at 80% of viewport → hero bottom exits top.
		// That gives ~180vh of scroll to run the full animation.
		//
		// Timeline layout (proportional durations, scrub normalises to scroll):
		//   0.0 – 0.25  fade in (opacity 0 → 1), position stays centered
		//   0.25 – 1.0  move from center to corner + scale down
		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: hero,
				start: "top 30%",
				end: "bottom top",
				scrub: 0.6,
				invalidateOnRefresh: true,
			},
		});

		// Phase 1: fade in — element stays centered while becoming visible
		tl.fromTo(
			headline,
			{ autoAlpha: 0 },
			{ autoAlpha: 1, duration: 0.25, ease: "power2.out" }
		);

		// Phase 2: move from center to corner (starts right after phase 1)
		tl.fromTo(
			headline,
			{
				left: "50%",
				top: "50%",
				xPercent: -50,
				yPercent: -50,
				scale: 1,
			},
			{
				left: () => Math.max(24, (window.innerWidth - HEADLINE_MAX_W) / 2),
				top: HEADLINE_TARGET_TOP,
				xPercent: 0,
				yPercent: 0,
				scale: HEADLINE_TARGET_SCALE,
				ease: "none",
				duration: 0.75,
			}
		);

		// ── Fade out when section scrolls away ──────────────────────────────
		// immediateRender: false is required — without it, fromTo immediately
		// applies { autoAlpha: 1 } when created, overriding the autoAlpha: 0
		// set by the main timeline and making the headline visible on all sections.
		gsap.fromTo(
			headline,
			{ autoAlpha: 1 },
			{
				autoAlpha: 0,
				immediateRender: false,
				ease: "power2.in",
				scrollTrigger: {
					trigger: section,
					start: "bottom 40%",
					end: "bottom top",
					scrub: 0.4,
				},
			}
		);

	}, { scope: sectionRef });

	// Card expand / collapse — IntersectionObserver instead of getBoundingClientRect
	// on every scroll frame. IO runs natively (off-tick), fires only on real
	// intersection changes, and never triggers React re-renders mid-scroll.
	// rootMargin "-30% 0px -25% 0px" → effective zone: 30%–75% of viewport.
	// A card entering from below (top < 75%) expands; exiting back above (top > 75%)
	// or scrolled past the top (bottom < 30%) collapses — matching the old thresholds.
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				let changed = false;
				entries.forEach((entry) => {
					const index = cardRefs.current.findIndex((el) => el === entry.target);
					if (index === -1) return;
					const wasExpanded = expandedSet.current.has(index);
					if (entry.isIntersecting !== wasExpanded) {
						if (entry.isIntersecting) expandedSet.current.add(index);
						else expandedSet.current.delete(index);
						changed = true;
					}
				});
				if (changed) {
					setExpandedState(testimonials.map((_, i) => expandedSet.current.has(i)));
				}
			},
			{ rootMargin: "-30% 0px -25% 0px", threshold: 0 },
		);

		cardRefs.current.forEach((card) => { if (card) observer.observe(card); });
		return () => observer.disconnect();
	}, []);

	return (
		<div ref={sectionRef}>
			{/* 100vh scroll space drives the headline animation */}
			<div ref={heroRef} className="h-screen" />

			{/*
				GSAP owns position + opacity entirely.
				No Tailwind translate-* or visibility classes here.
			*/}
			<h2
				ref={headlineRef}
				className="display-xl fixed z-20"
				style={{ visibility: "hidden" }}
			>
				{tStr.testimonials.trusted}
				<br />
				<AccentWord>{tStr.testimonials.visionaries}</AccentWord>
			</h2>

			<div className="relative z-[2] container-editorial pb-[50vh]">
				<div className="md:pl-[50%]">
					<div className="space-y-24 md:space-y-28">
						{testimonials.map((t, i) => (
							<div key={t.id} className="relative">
								{i > 0 && (
									<div className="absolute inset-x-0 -top-12 md:-top-14 h-px bg-[var(--hairline)]" />
								)}
								<div ref={(el) => { cardRefs.current[i] = el; }}>
									<ReviewCard t={t} expanded={expandedState[i]} />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
