import { PLACEHOLDER_IMAGE, type Project } from "@actiondev/shared";

/**
 * Imagen de un proyecto en la web móvil v2 y su proporción, en UN sitio para
 * la home, la lista y la ficha de proyectos y las landings de campaña. Todo
 * sale de `projects.ts`: cambiar un mockup es cambiar el dato.
 *
 * Orden: `mockupVertical` (4:5, solo si se pide `vertical`) → `mockup` (3:2;
 * 4:5 si `mockupOrientation` es `portrait`) → captura `image` (16:10, recortada
 * por arriba) → `null` (sin imagen real: portada generativa, nunca una caja
 * gris vacía).
 */
export interface ProjectMedia {
  src: string;
  /** Clase de Tailwind con la proporción del archivo (`aspect-[3/2]`…). */
  aspect: string;
  /** Mockup (escena completa: `object-cover` centrado) o captura (`object-top`). */
  mockup: boolean;
}

export function hasRealImage(project: Project): boolean {
  return project.image !== PLACEHOLDER_IMAGE;
}

export function projectMedia(project: Project, { vertical = false }: { vertical?: boolean } = {}): ProjectMedia | null {
  if (vertical && project.mockupVertical) return { src: project.mockupVertical, aspect: "aspect-[4/5]", mockup: true };
  if (project.mockup) {
    const aspect = project.mockupOrientation === "portrait" ? "aspect-[4/5]" : "aspect-[3/2]";
    return { src: project.mockup, aspect, mockup: true };
  }
  if (hasRealImage(project)) return { src: project.image, aspect: "aspect-[16/10]", mockup: false };
  return null;
}

/** Clases de `next/image` según el tipo de imagen. */
export const mediaFit = (media: ProjectMedia) => (media.mockup ? "object-cover" : "object-cover object-top");
