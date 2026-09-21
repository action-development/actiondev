"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import { projects, type Project } from "@/data/projects";
import { AccentWord } from "@/components/ui/AccentWord";
import { useLocale, useT } from "@/lib/i18n";
import hud from "./projects-hud.module.css";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const SCRAMBLE_DURATION = 0.6;

interface ScrambleTitleProps {
	text: string;
	active: boolean;
	className?: string;
}

function ScrambleTitle({ text, active, className }: ScrambleTitleProps) {
	const ref = useRef<HTMLSpanElement>(null);
	const progress = useRef({ value: 0 });
	const tween = useRef<gsap.core.Tween | null>(null);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;

		tween.current?.kill();

		if (!active) {
			node.textContent = text;
			return;
		}

		progress.current.value = 0;
		tween.current = gsap.to(progress.current, {
			value: 1,
			duration: SCRAMBLE_DURATION,
			ease: "power2.out",
			onUpdate: () => {
				const p = progress.current.value;
				const revealed = Math.floor(text.length * p);
				let out = "";
				for (let i = 0; i < text.length; i++) {
					const ch = text[i];
					if (i < revealed || ch === " ") {
						out += ch;
					} else {
						out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
					}
				}
				node.textContent = out;
			},
			onComplete: () => {
				node.textContent = text;
			},
		});

		return () => {
			tween.current?.kill();
		};
	}, [active, text]);

	return (
		<span ref={ref} className={className}>
			{text}
		</span>
	);
}

interface ProjectRowProps {
	project: Project;
	locale: "en" | "es";
	onHover: (project: Project | null) => void;
}

function ProjectRow({ project, locale, onHover }: ProjectRowProps) {
	const [hovered, setHovered] = useState(false);
	const isPlaceholder = project.url === "#";
	const category = locale === "es" ? project.categoryEs ?? project.category : project.category;

	const Tag = isPlaceholder ? "div" : "a";
	const linkProps = isPlaceholder
		? {}
		: { href: project.url, target: "_blank", rel: "noopener noreferrer" };

	return (
		<Tag
			{...linkProps}
			data-row
			className={[
				hud.row,
				"group relative flex items-center gap-4 py-4 transition-colors duration-300 md:py-[1.15rem]",
				isPlaceholder ? "cursor-default" : "cursor-pointer",
			].join(" ")}
			onMouseEnter={() => {
				setHovered(true);
				onHover(project);
			}}
			onMouseLeave={() => {
				setHovered(false);
				onHover(null);
			}}
			aria-label={`${project.title} — ${category}`}
		>
			<ScrambleTitle
				text={project.title}
				active={hovered}
				className="min-w-0 flex-1 truncate font-display font-bold tracking-[-0.02em] text-foreground text-[clamp(1.05rem,1.5vw,1.4rem)] leading-tight transition-colors duration-300 group-hover:text-accent"
			/>

			<span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/40 transition-colors duration-300 group-hover:text-foreground/70 sm:inline">
				{category}
			</span>

			<span
				aria-hidden
				className="pointer-events-none absolute -bottom-0.5 left-0 h-0.5 w-0 bg-accent transition-[width] duration-500 ease-out group-hover:w-full"
			/>
		</Tag>
	);
}

export function ProjectsIndex() {
	const t = useT();
	const { locale } = useLocale();
	const sectionRef = useRef<HTMLElement>(null);
	const cursorRef = useRef<HTMLDivElement>(null);
	const cursorImgRef = useRef<HTMLDivElement>(null);
	const xTo = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
	const yTo = useRef<ReturnType<typeof gsap.quickTo> | null>(null);

	const [hovered, setHovered] = useState<Project | null>(null);

	useEffect(() => {
		const cursor = cursorRef.current;
		if (!cursor) return;

		xTo.current = gsap.quickTo(cursor, "x", { duration: 0.45, ease: "power3.out" });
		yTo.current = gsap.quickTo(cursor, "y", { duration: 0.45, ease: "power3.out" });

		const onMove = (e: MouseEvent) => {
			xTo.current?.(e.clientX);
			yTo.current?.(e.clientY);
		};

		window.addEventListener("mousemove", onMove);
		return () => window.removeEventListener("mousemove", onMove);
	}, []);

	useEffect(() => {
		const cursor = cursorRef.current;
		if (!cursor) return;
		gsap.to(cursor, {
			opacity: hovered ? 1 : 0,
			scale: hovered ? 1 : 0.85,
			duration: 0.35,
			ease: "power2.out",
		});
	}, [hovered]);

	useGSAP(
		() => {
			const rows = gsap.utils.toArray<HTMLElement>("[data-row]");
			gsap.from(rows, {
				opacity: 0,
				y: 40,
				duration: 0.7,
				ease: "power3.out",
				stagger: 0.05,
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top 75%",
					once: true,
				},
			});
		},
		{ scope: sectionRef, dependencies: [projects.length] }
	);

	const allWorkLabel = locale === "es" ? "Todo el trabajo." : "Every project.";

	return (
		<>
			<section
				ref={sectionRef}
				id="projects-index"
				aria-label={locale === "es" ? "Índice completo de proyectos" : "Full project index"}
				className={`${hud.hud} relative z-[2] section-padding`}
			>
				<div className="container-editorial">
					<h2 className="display-l max-w-2xl pb-12 text-foreground md:pb-16">{allWorkLabel}</h2>

					<div className="grid grid-cols-1 gap-x-14 border-t-2 border-[rgba(241,234,214,0.1)] md:grid-cols-2">
						{projects.map((project) => (
							<ProjectRow
								key={project.id}
								project={project}
								locale={locale}
								onHover={setHovered}
							/>
						))}
					</div>

					<div
						data-end-coda
						className="mt-20 flex flex-col items-center gap-7 text-center md:mt-28"
					>
						<h3 className="display-l max-w-3xl text-foreground/90">
							{locale === "es" ? (
								<>
									Esto es una <AccentWord>selección</AccentWord>.
								</>
							) : (
								<>
									This is a <AccentWord>selection</AccentWord>.
								</>
							)}
						</h3>

						<p className="flex items-center gap-2 max-w-md font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/45">
							<span>
								{locale === "es"
									? "La lista completa no cabría aquí — nuevos proyectos cada mes"
									: "The full list wouldn't fit — new projects shipping monthly"}
							</span>
							<span
								aria-hidden
								className="inline-block h-[0.9em] w-[0.45em] animate-pulse bg-accent"
							/>
						</p>
					</div>
				</div>
			</section>

			{/* Viñeta de cómic que sigue al cursor: papel, marco de tinta, sombra dura y pie con el nombre */}
			<div
				ref={cursorRef}
				aria-hidden
				className={`${hud.hud} pointer-events-none fixed left-0 top-0 z-[60] hidden md:block`}
				style={{
					opacity: 0,
					transform: "translate3d(0,0,0)",
					marginLeft: "32px",
					marginTop: "-140px",
				}}
			>
				<div className={`${hud.panel} w-[420px]`}>
					<div ref={cursorImgRef} className={hud.panelInner} style={{ aspectRatio: "1600 / 947" }}>
						{hovered ? (
							<Image
								src={hovered.image}
								alt=""
								fill
								sizes="420px"
								className="object-cover"
								priority={false}
							/>
						) : null}
					</div>
					<div className={hud.panelCaption}>
						<span className="truncate">{hovered?.title ?? ""}</span>
						<span className="shrink-0 font-mono text-[10px] font-bold tracking-[0.12em] opacity-60">
							{hovered?.year ?? ""}
						</span>
					</div>
				</div>
			</div>
		</>
	);
}
