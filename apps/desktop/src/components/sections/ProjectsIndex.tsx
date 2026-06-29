"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import { projects, type Project } from "@/data/projects";
import { AccentWord } from "@/components/ui/AccentWord";
import { useLocale, useT } from "@/lib/i18n";

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
	index: number;
	locale: "en" | "es";
	onHover: (project: Project | null) => void;
	viewLabel: string;
}

function ProjectRow({ project, index, locale, onHover, viewLabel }: ProjectRowProps) {
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
				"group relative grid grid-cols-[64px_1fr_auto] items-center gap-x-6 border-b border-[var(--hairline)] py-7 transition-colors duration-300 md:grid-cols-[80px_1fr_140px_80px_48px] md:py-9",
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
			<span className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/35">
				{String(index + 1).padStart(2, "0")}
			</span>

			<ScrambleTitle
				text={project.title}
				active={hovered}
				className="font-display font-bold tracking-[-0.025em] text-foreground text-[clamp(1.5rem,3vw,2.75rem)] leading-[1.05]"
			/>

			<span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/45 md:inline">
				{category}
			</span>

			<span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/45 md:inline">
				{project.year}
			</span>

			<span
				aria-hidden
				className="flex items-center justify-end font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/35 transition-all duration-300 group-hover:text-accent group-hover:translate-x-1 md:justify-center"
			>
				{isPlaceholder ? "—" : viewLabel}
			</span>

			<span
				aria-hidden
				className="pointer-events-none absolute bottom-0 left-0 h-px w-0 bg-accent transition-[width] duration-500 ease-out group-hover:w-full"
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
	const [filter, setFilter] = useState<string>("ALL");

	const categories = useMemo(() => {
		const labelAll = locale === "es" ? "TODOS" : "ALL";
		const set = new Set<string>();
		for (const p of projects) {
			const cat = locale === "es" ? p.categoryEs ?? p.category : p.category;
			set.add(cat);
		}
		return [{ key: "ALL", label: labelAll }, ...Array.from(set).map((c) => ({ key: c, label: c.toUpperCase() }))];
	}, [locale]);

	const visibleProjects = useMemo(() => {
		if (filter === "ALL") return projects;
		return projects.filter((p) => {
			const cat = locale === "es" ? p.categoryEs ?? p.category : p.category;
			return cat === filter;
		});
	}, [filter, locale]);

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
		{ scope: sectionRef, dependencies: [visibleProjects.length] }
	);

	const viewLabel = locale === "es" ? "VER" : "VIEW";
	const indexLabel = locale === "es" ? "ÍNDICE" : "INDEX";
	const allWorkLabel = locale === "es" ? "Todo el trabajo." : "Every project.";
	const countLabel = locale === "es"
		? `${visibleProjects.length} PROYECTOS`
		: `${visibleProjects.length} PROJECTS`;

	return (
		<>
			<section
				ref={sectionRef}
				id="projects-index"
				aria-label={locale === "es" ? "Índice completo de proyectos" : "Full project index"}
				className="relative z-[2] section-padding"
			>
				<div className="container-editorial">
					<div className="flex flex-col items-start gap-6 pb-12 md:flex-row md:items-end md:justify-between md:pb-16">
						<div className="flex flex-col gap-4">
							<div className="flex items-center gap-3">
								<span className="h-px w-10 bg-[var(--hairline-strong)]" />
								<span className="micro-label text-foreground/60">{indexLabel}</span>
							</div>
							<h2 className="display-l max-w-2xl text-foreground">{allWorkLabel}</h2>
						</div>

						<span className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/40">
							{countLabel}
						</span>
					</div>

					<div className="flex flex-wrap gap-2 pb-8 md:pb-12">
						{categories.map((cat) => {
							const active = filter === cat.key;
							return (
								<button
									key={cat.key}
									type="button"
									onClick={() => setFilter(cat.key)}
									className={[
										"rounded-full border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors duration-300",
										active
											? "border-accent bg-accent text-background"
											: "border-[var(--hairline-strong)] text-foreground/60 hover:border-foreground/40 hover:text-foreground",
									].join(" ")}
									aria-pressed={active}
								>
									{cat.label}
								</button>
							);
						})}
					</div>

					<div className="border-t border-[var(--hairline)]">
						{visibleProjects.map((project, i) => (
							<ProjectRow
								key={project.id}
								project={project}
								index={i}
								locale={locale}
								onHover={setHovered}
								viewLabel={viewLabel}
							/>
						))}
					</div>

					<div
						data-end-coda
						className="mt-20 flex flex-col items-center gap-7 text-center md:mt-28"
					>
						<div className="flex items-center gap-3">
							<span className="h-px w-10 bg-[var(--hairline-strong)]" />
							<span className="micro-label text-foreground/45">
								{locale === "es" ? "Fin del índice" : "End of index"}
							</span>
							<span className="h-px w-10 bg-[var(--hairline-strong)]" />
						</div>

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

			<div
				ref={cursorRef}
				aria-hidden
				className="pointer-events-none fixed left-0 top-0 z-[60] hidden md:block"
				style={{
					opacity: 0,
					transform: "translate3d(0,0,0)",
					marginLeft: "32px",
					marginTop: "-120px",
				}}
			>
				<div
					ref={cursorImgRef}
					className="relative w-[400px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--hairline-strong)] bg-card"
					style={{ aspectRatio: "1600 / 947" }}
				>
					{hovered ? (
						<Image
							src={hovered.image}
							alt=""
							fill
							sizes="400px"
							className="object-contain"
							priority={false}
						/>
					) : null}
				</div>
			</div>
		</>
	);
}
