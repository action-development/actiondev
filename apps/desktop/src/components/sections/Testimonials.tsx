"use client";

import { useRef, useState, useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import Image from "next/image";
import { useGSAP } from "@gsap/react";

import { testimonials, type Testimonial } from "@/data/testimonials";
import { AccentWord } from "@/components/ui/AccentWord";
import { useLocale, useT } from "@/lib/i18n";

// TODO: replace with the exact Google Business profile URL (g.page/r/…) when available.
const GOOGLE_REVIEWS_URL = "https://www.google.com/maps/search/?api=1&query=Action+Development+Vigo";

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function AvatarBadge({ name, src }: { name: string; src?: string }) {
	if (src) {
		return (
			<Image
				src={src}
				alt={`Portrait of ${name}`}
				width={40}
				height={40}
				sizes="40px"
				loading="lazy"
				className="h-10 w-10 rounded-full object-cover"
			/>
		);
	}
	return (
		<span
			aria-hidden="true"
			className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-card font-mono text-[11px] font-medium tracking-[0.05em] text-foreground/70"
		>
			{getInitials(name)}
		</span>
	);
}

function ReviewCard({ t }: { t: Testimonial }) {
	const { locale } = useLocale();
	const quote = locale === "es" ? (t.quoteEs ?? t.quote) : t.quote;

	return (
		<article>
			<header className="mb-8 flex items-center gap-4">
				<AvatarBadge name={t.name} src={t.avatar} />
				<div className="flex items-baseline gap-3">
					<span className="font-display text-[15px] font-medium tracking-[-0.01em] text-foreground">{t.name}</span>
					<span className="text-muted" aria-hidden>·</span>
					<span className="micro-label">{t.project}</span>
				</div>
			</header>

			<p className="font-display max-w-[42ch] text-[clamp(1.25rem,1.9vw,1.65rem)] font-normal leading-[1.45] tracking-[-0.025em] text-foreground/90">
				&ldquo;{quote}&rdquo;
			</p>
		</article>
	);
}

interface GoogleReviewsBadgeProps {
	label: string;
	rating: string;
	year: string;
	cta: string;
}

function GoogleReviewsBadge({ label, rating, year, cta }: GoogleReviewsBadgeProps) {
	return (
		<a
			href={GOOGLE_REVIEWS_URL}
			target="_blank"
			rel="noopener noreferrer"
			className="group relative inline-flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--hairline-strong)] bg-transparent px-7 py-5 backdrop-blur-sm transition-colors duration-500 hover:border-accent"
			aria-label={`${cta} — ${label}`}
		>
			<div className="flex items-center justify-between gap-8">
				<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/55 transition-colors duration-500 group-hover:text-accent">
					{label}
				</span>
				<span className="font-display text-[15px] font-medium leading-none tracking-tight text-foreground/80 transition-colors duration-500 group-hover:text-accent">
					{year}
				</span>
			</div>
			<div className="h-px w-full bg-[var(--hairline)]" />
			<div className="flex items-center justify-between gap-8">
				<span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/70">
					<span aria-hidden className="text-accent">★★★★★</span>
					<span>{rating}</span>
				</span>
				<span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/80 transition-all duration-500 group-hover:translate-x-1 group-hover:text-accent">
					{cta}
					<span aria-hidden>↗</span>
				</span>
			</div>
		</a>
	);
}

// ─────────────────────────────────────────────────────────────────────────────

const HEADLINE_MAX_W = 1280;
const HEADLINE_TARGET_TOP = 128;
const HEADLINE_TARGET_SCALE = 0.62;

export function Testimonials() {
	const tStr = useT();
	const { locale } = useLocale();
	const sectionRef = useRef<HTMLDivElement>(null);
	const heroRef    = useRef<HTMLDivElement>(null);
	const headlineRef = useRef<HTMLHeadingElement>(null);
	const badgeRef = useRef<HTMLDivElement>(null);

	useGSAP(() => {
		const hero     = heroRef.current;
		const headline = headlineRef.current;
		const section  = sectionRef.current;
		const badge    = badgeRef.current;
		if (!hero || !headline || !section) return;

		gsap.set(headline, {
			autoAlpha: 0,
			transformOrigin: "top left",
			left: "50%",
			top: "50%",
			xPercent: -50,
			yPercent: -50,
			scale: 1,
		});

		if (badge) {
			gsap.set(badge, { autoAlpha: 0, y: 24 });
		}

		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: hero,
				start: "top 30%",
				end: "bottom top",
				scrub: 0.6,
				invalidateOnRefresh: true,
			},
		});

		tl.fromTo(
			headline,
			{ autoAlpha: 0 },
			{ autoAlpha: 1, duration: 0.25, ease: "power2.out" }
		);

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

		if (badge) {
			tl.to(
				badge,
				{ autoAlpha: 1, y: 0, duration: 0.25, ease: "power2.out" },
				">-0.05"
			);
		}

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

		if (badge) {
			gsap.fromTo(
				badge,
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
		}

	}, { scope: sectionRef });

	const badgeLabel = locale === "es" ? "Google Reviews" : "Google Reviews";
	const badgeYear = "2026";
	const badgeRating = locale === "es" ? "20+ Reseñas" : "20+ Reviews";
	const badgeCta = locale === "es" ? "Leer en Google" : "Read on Google";

	return (
		<div ref={sectionRef}>
			<div ref={heroRef} className="h-screen" />

			<h2
				ref={headlineRef}
				className="display-xl fixed z-20"
				style={{ visibility: "hidden" }}
			>
				{tStr.testimonials.trusted}
				<br />
				<AccentWord>{tStr.testimonials.visionaries}</AccentWord>
			</h2>

			<div
				ref={badgeRef}
				className="pointer-events-auto fixed z-20"
				style={{
					left: "max(24px, calc((100vw - 1280px) / 2))",
					top: "calc(128px + (clamp(2.75rem, 8vw, 7rem) * 0.62 * 2.2))",
					visibility: "hidden",
				}}
				aria-hidden={false}
			>
				<GoogleReviewsBadge
					label={badgeLabel}
					rating={badgeRating}
					year={badgeYear}
					cta={badgeCta}
				/>
			</div>

			<div className="relative z-[2] container-editorial pb-[50vh]">
				<div className="md:pl-[50%]">
					<div className="space-y-24 md:space-y-28">
						{testimonials.map((t, i) => (
							<div key={t.id} className="relative">
								{i > 0 && (
									<div className="absolute inset-x-0 -top-12 md:-top-14 h-px bg-[var(--hairline)]" />
								)}
								<ReviewCard t={t} />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
