import { projects } from "@actiondev/shared";
import type { Testimonial } from "@/data/testimonials";

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Títulos de `projects.ts` → slug, para casar con `Testimonial.project`. */
const SLUG_BY_TITLE = new Map(projects.map((p) => [normalize(p.title), p.slug]));

/**
 * Slug del proyecto SOLO si `testimonials.ts` lo indica: el campo `project`
 * coincide (sin tildes ni mayúsculas) con el título de un proyecto. No se
 * adivina por el nombre de la persona.
 */
export function projectSlugOf(t: Testimonial): string | undefined {
  return SLUG_BY_TITLE.get(normalize(t.project));
}

/** Etiquetas de relleno que no son una empresa ni un lugar: no se muestran. */
const GENERIC = /^(cliente\b|rese[nñ]a de google|local guide)/i;

/** Empresa, lugar o tipo de encargo de la reseña, o `undefined` si el dato es genérico. */
export function reviewLabel(t: Testimonial): string | undefined {
  return GENERIC.test(t.project.trim()) ? undefined : t.project;
}
