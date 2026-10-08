import { projects, type Project } from "@actiondev/shared";
import { hasRealImage } from "../project-media";

/**
 * Orden y niveles de la lista de proyectos móvil. Todo sale de `projects.ts`
 * (mockup, imagen, destacado): cambiar una imagen es cambiar datos, no esta
 * lógica. El tipo de trabajo (filtro y chips) vive en `../ProjectKind.tsx`.
 */

/** Tarjeta grande: mockup o destacado con captura. */
function isBig(project: Project): boolean {
  return Boolean(project.mockup) || (Boolean(project.featured) && hasRealImage(project));
}

export interface ProjectTiers {
  /** Tarjetas grandes: primero los de mockup, luego los destacados con captura. */
  big: Project[];
  /** Cuadrícula de capturas: el resto con imagen real. */
  tiles: Project[];
  /** Bloque final de texto: solo tienen `placeholder.webp`. */
  text: Project[];
}

export function projectTiers(): ProjectTiers {
  const big = projects.filter(isBig);
  return {
    big: [...big.filter((p) => p.mockup), ...big.filter((p) => !p.mockup)],
    tiles: projects.filter((p) => !isBig(p) && hasRealImage(p)),
    text: projects.filter((p) => !isBig(p) && !hasRealImage(p)),
  };
}

/** Orden de lectura de la lista; la ficha lo usa para «anterior» y «siguiente». */
export function orderedProjects(): Project[] {
  const { big, tiles, text } = projectTiers();
  return [...big, ...tiles, ...text];
}

export function projectNeighbors(slug: string): { prev: Project; next: Project } {
  const list = orderedProjects();
  const i = list.findIndex((p) => p.slug === slug);
  return { prev: list[(i - 1 + list.length) % list.length], next: list[(i + 1) % list.length] };
}

/** Sector y localidad en una línea: «Hostelería, Redondela». */
export function projectSubtitle(project: Project): string | undefined {
  const niche = project.nicheEs ?? project.niche;
  return [niche, project.location].filter(Boolean).join(", ") || undefined;
}
