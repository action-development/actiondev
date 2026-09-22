"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-config";
import { projects, type Project } from "@/data/projects";
import { HoloButton } from "@/components/ui/HoloButton";
import { getLenis } from "@/hooks/use-lenis";
import { useLocale } from "@/lib/i18n";
import hud from "./projects-hud.module.css";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const SCRAMBLE_DURATION = 0.6;
/** Ancho de la viñeta que acompaña al cursor. */
const PANEL_W = 380;
/** Separación entre el puntero y la viñeta, y el borde al que se voltea de lado. */
const PANEL_GAP = 40;

/* De entrada NO se ve ningún trabajo: sólo el titular y el botón que abre la
   lista. El índice completo es una decisión del visitante, no un muro de 31
   filas nada más llegar. */

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
	onEnter: (project: Project) => void;
}

function ProjectRow({ project, locale, onEnter }: ProjectRowProps) {
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
				hud.lanes,
				"group relative grid py-6 md:py-7",
				isPlaceholder ? "cursor-default" : "cursor-pointer",
			].join(" ")}
			onMouseEnter={() => {
				setHovered(true);
				onEnter(project);
			}}
			onMouseLeave={() => setHovered(false)}
			aria-label={`${project.title} — ${category}`}
		>
			<ScrambleTitle
				text={project.title}
				active={hovered}
				className="min-w-0 truncate font-display font-bold tracking-[-0.02em] text-foreground text-[clamp(1.35rem,2vw,2.25rem)] leading-tight transition-colors duration-300 group-hover:text-accent"
			/>

			<span className="shrink-0 text-right font-mono text-[0.9375rem] uppercase tracking-[0.1em] text-muted transition-colors duration-300 group-hover:text-foreground">
				{category}
			</span>

			{/* `scaleX` y no `width`: animar el ancho obliga al navegador a
			    recalcular la caja en cada frame de las 31 filas. El trazo es el
			    mismo, el coste no. */}
			<span
				aria-hidden
				className="pointer-events-none absolute -bottom-0.5 left-0 h-0.5 w-full origin-left scale-x-0 bg-accent transition-transform duration-500 ease-out group-hover:scale-x-100"
			/>
		</Tag>
	);
}

export function ProjectsIndex() {
	const { locale } = useLocale();
	const sectionRef = useRef<HTMLElement>(null);
	/** Nodo que GSAP mueve: sólo lleva la posición del puntero. */
	const cursorRef = useRef<HTMLDivElement>(null);
	/** Hijo que lleva el desplazamiento respecto al puntero — su transform NO es de GSAP. */
	const panelRef = useRef<HTMLDivElement>(null);
	const xTo = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
	const yTo = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
	/** Si la viñeta ya está a la vista, sigue al puntero; si aparece, se planta. */
	const shown = useRef(false);

	const [hovered, setHovered] = useState<Project | null>(null);
	const [expanded, setExpanded] = useState(false);
	const visible = expanded ? projects : [];

	useEffect(() => {
		const cursor = cursorRef.current;
		if (!cursor) return;

		xTo.current = gsap.quickTo(cursor, "x", { duration: 0.45, ease: "power3.out" });
		yTo.current = gsap.quickTo(cursor, "y", { duration: 0.45, ease: "power3.out" });

		const onMove = (e: MouseEvent) => {
			// Primer movimiento con la viñeta apagada: se planta donde está el
			// puntero en vez de volar desde la esquina.
			if (shown.current) {
				xTo.current?.(e.clientX);
				yTo.current?.(e.clientY);
			} else {
				gsap.set(cursor, { x: e.clientX, y: e.clientY });
			}

			// Cerca del borde derecho la viñeta cambia de lado, o se saldría.
			const panel = panelRef.current;
			if (panel) {
				const flip = e.clientX > window.innerWidth - (PANEL_W + PANEL_GAP * 2);
				panel.style.marginLeft = flip ? `-${PANEL_W + PANEL_GAP}px` : `${PANEL_GAP}px`;
			}
		};

		window.addEventListener("mousemove", onMove);
		return () => window.removeEventListener("mousemove", onMove);
	}, []);

	useEffect(() => {
		const cursor = cursorRef.current;
		if (!cursor) return;
		shown.current = Boolean(hovered);
		gsap.to(cursor, {
			autoAlpha: hovered ? 1 : 0,
			scale: hovered ? 1 : 0.9,
			duration: 0.3,
			ease: "power2.out",
		});
	}, [hovered]);

	const handleEnter = useCallback((project: Project) => setHovered(project), []);

	/* El apagado va en la LISTA, no en cada fila: entre dos filas contiguas el
	   `mouseleave` de una llega antes que el `mouseenter` de la otra, y apagar
	   ahí hacía parpadear la viñeta en cada salto. */
	const handleLeave = useCallback(() => setHovered(null), []);

	/* La lista entra al abrirse, no al entrar en pantalla: cuando la sección
	   aparece no hay ninguna fila que revelar. Un solo tween, escalonado. */
	useGSAP(
		() => {
			if (!expanded) return;
			const rows = gsap.utils.toArray<HTMLElement>("[data-row]");
			gsap.from(rows, {
				opacity: 0,
				y: 18,
				duration: 0.5,
				ease: "power3.out",
				stagger: 0.02,
			});
		},
		{ scope: sectionRef, dependencies: [expanded] }
	);

	const toggle = useCallback(() => {
		if (!expanded) {
			setExpanded(true);
			return;
		}
		// Al cerrar, el visitante está al final de una lista que se acorta de
		// golpe: se le devuelve al arranque para no dejarlo mirando el pie.
		setExpanded(false);
		requestAnimationFrame(() => {
			const node = sectionRef.current;
			if (!node) return;
			const lenis = getLenis();
			if (lenis) lenis.scrollTo(node, { offset: -80 });
			else node.scrollIntoView({ block: "start" });
		});
	}, [expanded]);

	// Sólo la primera palabra en lima: el resto del titular, en tinta del sitio.
	const allWork = locale === "es" ? ["Todo", " el trabajo."] : ["Every", " project."];
	const toggleLabel = expanded
		? locale === "es"
			? "Ver menos"
			: "Show less"
		: locale === "es"
			? `Ver los ${projects.length} trabajos`
			: `See all ${projects.length} projects`;

	return (
		<>
			<section
				ref={sectionRef}
				id="projects-index"
				aria-label={locale === "es" ? "Índice completo de proyectos" : "Full project index"}
				className={`${hud.hud} relative z-[2] section-padding`}
			>
				<div className="w-full px-6 md:px-12">
					<h2 className="display-l mx-auto max-w-4xl text-center text-foreground">
						<span className="text-accent">{allWork[0]}</span>
						{allWork[1]}
					</h2>

					{/* El botón no se hunde al apuntarlo ni al pulsarlo: aquí el acuse lo
					    da el color. El desplazamiento de `.holo-btn` es para la chapa
					    con sombra dura, y esta variante no la tiene. */}
					<div className="mt-8 flex justify-center md:mt-10">
						<HoloButton
							size="sm"
							variant="quiet"
							className="hover:transform-none focus-visible:transform-none active:transform-none"
							onClick={toggle}
							aria-expanded={expanded}
							aria-controls="projects-index-list"
							data-testid="projects-index-toggle"
						>
							{toggleLabel}
						</HoloButton>
					</div>

					<div
						id="projects-index-list"
						className={`${hud.index} relative ${
							expanded ? "mt-12 md:mt-16" : ""
						}`}
						onMouseLeave={handleLeave}
					>
						{visible.map((project) => (
							<ProjectRow
								key={project.id}
								project={project}
								locale={locale}
								onEnter={handleEnter}
							/>
						))}
					</div>
				</div>
			</section>

			{/* Viñeta de cómic que sigue al cursor: papel, marco de tinta y sombra
			    dura. Vive fuera de la sección porque va en `fixed`. */}
			<div
				ref={cursorRef}
				aria-hidden
				className={`${hud.hud} pointer-events-none fixed left-0 top-0 z-[60] hidden md:block`}
				style={{ opacity: 0, visibility: "hidden" }}
			>
				<div
					ref={panelRef}
					className="-translate-y-1/2"
					style={{ width: PANEL_W, marginLeft: PANEL_GAP }}
				>
					<div className={hud.panel}>
						<div className={hud.panelInner} style={{ aspectRatio: "1600 / 947" }}>
							{hovered ? (
								<Image
									src={hovered.image}
									alt=""
									fill
									sizes="380px"
									className="object-cover"
									priority={false}
								/>
							) : null}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
