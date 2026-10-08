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

/**
 * Tipo de proyecto en español legible, para el `<title>` de la ficha. El
 * `categoryEs` de los datos está pensado para la etiqueta de la recreativa
 * ("Web", "E-commerce") y en un título de buscador se queda corto.
 */
const CATEGORY_LABEL_ES: Record<string, string> = {
  "Mobile App": "App móvil",
  "Desktop App": "App de escritorio",
  "Web Application": "Aplicación web",
  Website: "Página web",
  "Landing Page": "Landing page",
  "E-commerce": "Tienda online",
};

export function projectCategoryLabel(project: Project): string {
  return CATEGORY_LABEL_ES[project.category] ?? project.categoryEs ?? project.category;
}

export interface RelatedService {
  /** Ruta de la landing SEO (ver `data/landings.ts`). */
  href: string;
  /** Ancla descriptiva: el mismo texto con el que las landings se enlazan entre sí. */
  label: string;
}

const SERVICE_BY_CATEGORY: Record<string, RelatedService> = {
  "Mobile App": { href: "/desarrollo-de-aplicaciones-vigo", label: "Desarrollo de aplicaciones en Vigo" },
  "Desktop App": { href: "/desarrollo-de-aplicaciones-vigo", label: "Desarrollo de aplicaciones en Vigo" },
  "Web Application": { href: "/desarrollo-web-vigo", label: "Desarrollo web en Vigo" },
  Website: { href: "/desarrollo-web-vigo", label: "Desarrollo web en Vigo" },
  "Landing Page": { href: "/diseno-web-vigo", label: "Diseño web en Vigo" },
  "E-commerce": { href: "/tienda-online-vigo", label: "Tiendas online en Vigo" },
};

/**
 * Landings que un proyecto puede pedir por `relatedLanding` cuando su
 * categoría apunta a otra. Mapa corto a propósito: este módulo lo importa la
 * recreativa (cliente) y `data/landings.ts` no debe entrar en ese bundle.
 */
const SERVICE_BY_LANDING: Record<string, RelatedService> = {
  "software-a-medida-vigo": { href: "/software-a-medida-vigo", label: "Software a medida en Vigo" },
  "desarrollo-web-redondela": { href: "/desarrollo-web-redondela", label: "Páginas web para negocios de Redondela" },
};

/** Landing de servicio más pertinente para el proyecto: la suya propia o la de su categoría. */
export function relatedService(project: Project): RelatedService {
  const own = project.relatedLanding ? SERVICE_BY_LANDING[project.relatedLanding] : undefined;
  return own ?? SERVICE_BY_CATEGORY[project.category] ?? SERVICE_BY_CATEGORY.Website;
}
