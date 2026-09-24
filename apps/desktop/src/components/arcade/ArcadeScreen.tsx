"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { DOCK, neighborMachine, type MachineSpec } from "@/components/canvas/arcade/arcade-config";
import { HoloButton } from "@/components/ui/HoloButton";
import { useLocale, useT } from "@/lib/i18n";
import { projectCase } from "@/lib/project-case";
import styles from "./ArcadeScreen.module.css";

interface ArcadeScreenProps {
  machines: readonly MachineSpec[];
  /** Máquina acoplada. */
  index: number;
  /** La cámara ya está quieta delante del tubo: se enciende la ficha. */
  docked: boolean;
  onSelect: (index: number) => void;
  onClose: () => void;
}

// Mismo tamaño que la pantalla 3D con la cámara acoplada (ver `DOCK` y
// `dockPosition`): la fracción del eje que limite, en 4:3.
const FILL = DOCK.fill * 100;
const SCREEN_SIZE = { width: `min(${FILL}vw, ${FILL * (4 / 3)}vh)` };

const ARROW_LEFT = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
  </svg>
);
const ARROW_RIGHT = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
  </svg>
);

/**
 * La pantalla de la recreativa acoplada: aquí pasa todo lo del proyecto.
 *
 * Es DOM (texto nítido, enlaces de verdad, lector de pantalla) dimensionado
 * para caer encima del tubo 3D. Se monta en cuanto se elige la máquina —el
 * fondo transparente ya captura el clic de "salir"— pero la ficha solo se
 * enciende (efecto de tubo) cuando la cámara ha llegado.
 *
 * Salir tiene que ser obvio, así que hay varios caminos y todos se ven o se
 * adivinan: el botón "Volver al pasillo" con su tecla impresa, abajo al centro
 * (donde en el pasillo estaba la ficha); Esc (o ↓ / S, que en el pasillo es
 * "atrás"), y un clic fuera del tubo. Las flechas a los lados —con el nombre
 * de la máquina a la que llevan— pasan a la de al lado sin salir.
 */
export function ArcadeScreen({ machines, index, docked, onSelect, onClose }: ArcadeScreenProps) {
  const t = useT();
  const { locale } = useLocale();
  const machine = machines[index];
  const prev = neighborMachine(machines, index, -1);
  const next = neighborMachine(machines, index, 1);
  const dialogRef = useRef<HTMLElement>(null);
  const reduced = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  // Teclado de la pantalla. El pasillo está en pausa mientras tanto.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.code) {
        case "Escape":
        case "Backspace":
        case "ArrowDown":
        case "KeyS":
          onClose();
          break;
        case "ArrowLeft":
        case "KeyA":
          if (prev !== null) onSelect(prev);
          break;
        case "ArrowRight":
        case "KeyD":
          if (next !== null) onSelect(next);
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, onSelect, onClose]);

  // Foco: a la ficha al encenderse; de vuelta a donde estaba al salir.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    return () => before?.focus?.({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (docked) dialogRef.current?.focus({ preventScroll: true });
  }, [docked, index]);

  if (!machine) return null;
  const { project } = machine;
  const category = locale === "es" ? (project.categoryEs ?? project.category) : project.category;
  const niche = locale === "es" ? (project.nicheEs ?? project.niche) : project.niche;
  const { brief, result } = projectCase(project, locale);
  const counter = `${String(index + 1).padStart(2, "0")} / ${String(machines.length).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-20" data-testid="arcade-screen-layer">
      {/* Fuera del tubo = volver al pasillo. */}
      <div aria-hidden className="absolute inset-0 cursor-zoom-out" onClick={onClose} />

      <div
        className="absolute left-1/2 top-1/2 aspect-[4/3] -translate-x-1/2 -translate-y-1/2"
        style={SCREEN_SIZE}
      >
        {docked && (
          <section
            key={project.id}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="arcade-screen-title"
            tabIndex={-1}
            data-testid="arcade-screen"
            data-project={project.slug}
            className={styles.screen}
          >
            <div className={styles.content}>
              <p className={styles.meta}>
                <span className="text-accent">{counter}</span>
                <span>
                  {category}
                  {niche ? ` · ${niche}` : ""} · {project.year}
                </span>
              </p>
              <h2 id="arcade-screen-title" className={styles.title}>
                {project.title}
              </h2>

              <div className={styles.columns}>
                <div className={styles.side}>
                  <div className={styles.media}>
                    {project.video && !reduced ? (
                      <video
                        className="absolute inset-0 h-full w-full object-cover"
                        poster={machine.image ?? undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                      >
                        <source src={project.video} type="video/webm" />
                      </video>
                    ) : machine.image ? (
                      <Image
                        src={machine.image}
                        alt={project.title}
                        fill
                        sizes="(min-width: 1024px) 480px, 40vw"
                        className="object-cover"
                      />
                    ) : (
                      <span aria-hidden className={styles.mediaFallback}>
                        {project.title}
                      </span>
                    )}
                  </div>
                  <div className={styles.links}>
                    {project.url !== "#" && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-sweep text-foreground hover:text-accent"
                      >
                        {t.arcade.screen.site} ↗
                      </a>
                    )}
                    <Link
                      href={`/projects/${project.slug}`}
                      className="link-sweep text-muted hover:text-accent"
                    >
                      {t.arcade.screen.caseStudy} →
                    </Link>
                  </div>
                </div>

                <div className={styles.text}>
                  <p className={styles.label}>{t.arcade.screen.brief}</p>
                  <ul className={styles.brief}>
                    {brief.map((line) => (
                      <li key={line}>
                        <span aria-hidden className="text-accent">
                          ▸
                        </span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <p className={styles.label}>{t.arcade.screen.result}</p>
                  <p className={styles.result}>{result}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Máquina de al lado, sin salir: la flecha dice a cuál se va. */}
        {(
          [
            { hand: -1, target: prev, label: t.arcade.screen.prev, glyph: ARROW_LEFT, pos: "right-full mr-20" },
            { hand: 1, target: next, label: t.arcade.screen.next, glyph: ARROW_RIGHT, pos: "left-full ml-20" },
          ] as const
        ).map(({ hand, target, label, glyph, pos }) => (
          <div
            key={hand}
            className={`${styles.chrome} absolute top-1/2 -translate-y-1/2 ${pos}`}
            data-visible={docked && target !== null}
          >
            <button
              type="button"
              className={`${styles.neighbor} holo-surface holo-solid holo-corners holo-link`}
              aria-label={target === null ? label : `${label}: ${machines[target]?.project.title}`}
              data-testid={hand === -1 ? "arcade-screen-prev" : "arcade-screen-next"}
              disabled={target === null}
              onClick={() => target !== null && onSelect(target)}
            >
              <span className={styles.neighborKey}>{glyph}</span>
              <span className={styles.neighborTitle}>{target === null ? "" : machines[target]?.project.title}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Salida: visible desde el primer instante, abajo al centro — el mismo
          sitio donde en el pasillo estaba la ficha de la máquina. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-3">
        <div className="pointer-events-auto">
          <HoloButton variant="solid" onClick={onClose} data-testid="arcade-screen-close">
            {ARROW_LEFT}
            {t.arcade.screen.back}
            <kbd className={styles.kbd}>Esc</kbd>
          </HoloButton>
        </div>
        <p className={`${styles.chrome} micro-label`} data-visible={docked}>
          ◀ ▶ {t.arcade.screen.neighbors}
        </p>
      </div>
    </div>
  );
}
