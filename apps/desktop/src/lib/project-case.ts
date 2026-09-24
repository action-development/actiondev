import type { Project } from "@actiondev/shared";

/**
 * El caso de un proyecto — qué nos pidieron y qué conseguimos — con el
 * placeholder genérico mientras no haya contenido real redactado. Una sola
 * fuente para la ficha (`/projects/[slug]`) y la pantalla de la recreativa.
 */

const PLACEHOLDER = {
  es: {
    brief: [
      "Una presencia digital a la altura de su marca frente a la competencia.",
      "Una web rápida, clara y fácil de gestionar en el día a día.",
      "Una identidad propia, sin recurrir a plantillas genéricas.",
    ],
    result:
      "Una web a medida construida desde cero, con una experiencia fluida en cualquier dispositivo y una base técnica pensada para crecer con el negocio.",
  },
  en: {
    brief: [
      "A digital presence that lives up to their brand against the competition.",
      "A fast, clear website that is easy to manage day to day.",
      "An identity of their own, without generic templates.",
    ],
    result:
      "A bespoke website built from scratch, with a smooth experience on any device and a technical foundation designed to grow with the business.",
  },
} as const;

export interface ProjectCase {
  brief: readonly string[];
  result: string;
}

export function projectCase(project: Project, locale: "es" | "en" = "es"): ProjectCase {
  if (locale === "es") {
    return {
      brief: project.briefEs ?? project.brief ?? PLACEHOLDER.es.brief,
      result: project.resultEs ?? project.result ?? PLACEHOLDER.es.result,
    };
  }
  return {
    brief: project.brief ?? PLACEHOLDER.en.brief,
    result: project.result ?? PLACEHOLDER.en.result,
  };
}
