import Image from "next/image";
import type { Project } from "@actiondev/shared";
import { projectCategoryLabel } from "@/lib/project-case";
import { Label } from "./Cell";
import { KIND_INFO, projectKind } from "./ProjectKind";
import { mediaFit, projectMedia } from "./project-media";
import { Shape } from "./Shape";

export function coverAlt(project: Project): string {
  return `${project.title}: ${projectCategoryLabel(project).toLowerCase()}`;
}

/**
 * Portada de un proyecto a sangre (`projectMedia`: mockup 3:2, vertical 4:5 o
 * captura 16:10), `next/image` con `sizes` del ancho real. `vertical` = usar
 * el mockup vertical si lo hay (hero de la ficha). Sin imagen, PORTADA
 * GENERATIVA (DESIGN.md §7): el tono del servicio, su forma y el nombre.
 * Nunca una caja gris vacía. La usan la lista y la ficha de proyectos y los
 * casos de las landings SEO. `alt=""` cuando la portada va dentro de un enlace
 * que ya nombra el proyecto (tarjeta de caso): no repetirlo al lector.
 */
export function ProjectCover({
  project,
  sizes,
  priority = false,
  vertical = false,
  alt,
  band = false,
  className = "",
}: {
  project: Project;
  sizes: string;
  priority?: boolean;
  vertical?: boolean;
  /** Texto alternativo; por defecto `coverAlt(project)`. */
  alt?: string;
  /**
   * Portada generativa en BANDA 3:1 con el sector (como `campaign/CaseCard`)
   * en vez de 16:10 con el nombre: para tarjetas que ya llevan el nombre
   * debajo, donde un bloque de color de media pantalla no aporta nada.
   */
  band?: boolean;
  className?: string;
}) {
  const media = projectMedia(project, { vertical });
  if (!media) {
    const info = KIND_INFO[projectKind(project)];
    return (
      <div
        aria-hidden={band || undefined}
        className={`flex ${band ? "aspect-[3/1]" : "aspect-[16/10]"} flex-col justify-between border-b border-ink p-4 ${info.coverTone} ${className}`}
      >
        <Shape kind={info.shape} />
        <span className="font-display text-h3 uppercase">{band ? (project.nicheEs ?? info.label) : project.title}</span>
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden border-b border-ink bg-grey ${media.aspect} ${className}`}>
      <Image src={media.src} alt={alt ?? coverAlt(project)} fill sizes={sizes} priority={priority} className={mediaFit(media)} />
    </div>
  );
}

/** Antes / Ahora en dos celdas; con solo «Ahora», una celda entera. Sin ninguno, nada. */
export function BeforeAfter({ project, className = "" }: { project: Project; className?: string }) {
  const { beforeEs, afterEs } = project;
  if (!beforeEs && !afterEs) return null;
  const both = Boolean(beforeEs && afterEs);
  const cells = [
    beforeEs && { label: "Antes", text: beforeEs },
    afterEs && { label: "Ahora", text: afterEs },
  ].filter((c): c is { label: string; text: string } => Boolean(c));
  return (
    <div className={`grid gap-px bg-ink ${both ? "grid-cols-2" : "grid-cols-1"} ${className}`}>
      {cells.map((cell) => (
        <div key={cell.label} className="grid min-w-0 content-start gap-1.5 bg-paper px-4 pt-3.5 pb-4">
          <Label>{cell.label}</Label>
          <p className="text-[16px] leading-[1.4] break-words">{cell.text}</p>
        </div>
      ))}
    </div>
  );
}
