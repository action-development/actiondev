import type { Metadata } from "next";
import { ORGANIZATION_ID, projects, type Project } from "@actiondev/shared";
import type { Landing, LandingCase } from "@/data/landings";
import { testimonials, type Testimonial } from "@/data/testimonials";
import { OG_IMAGE, SITE_URL, absoluteUrl } from "@/lib/seo";

/**
 * Landings SEO (`/[landing]`): metadatos, JSON-LD y contenido resuelto. Fuente
 * ÚNICA de la página de escritorio (`app/(site)/[landing]`) y de la móvil
 * (`app/(m)/m/[landing]`): paridad SEO por construcción. Extraído sin cambios
 * de la página de escritorio.
 */

/** Id del bloque del formulario: ancla de los CTA y de la barra fija (escritorio y móvil). */
export const LANDING_FORM_ID = "proyecto";

export function landingMetadata(landing: Landing): Metadata {
  const ogUrl = `${OG_IMAGE.url}?title=${encodeURIComponent(landing.h1)}`;

  return {
    // `absolute`: landing.title ya es un título SEO autoconclusivo ("X | Y"),
    // sin el `title.template` del layout raíz — con él se sumaban dos
    // separadores distintos ("X | Y — Action").
    title: { absolute: landing.title },
    description: landing.metaDescription,
    alternates: { canonical: `/${landing.slug}` },
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: absoluteUrl(`/${landing.slug}`),
      siteName: "Action",
      title: landing.title,
      description: landing.metaDescription,
      images: [{ url: ogUrl, width: OG_IMAGE.width, height: OG_IMAGE.height }],
    },
    twitter: {
      card: "summary_large_image",
      title: landing.title,
      description: landing.metaDescription,
      images: [ogUrl],
    },
  };
}

export function buildLandingJsonLd(landing: Landing) {
  const url = absoluteUrl(`/${landing.slug}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: landing.title,
        description: landing.metaDescription,
        inLanguage: "es",
        isPartOf: { "@id": absoluteUrl("#website") },
        about: { "@id": `${url}#service` },
      },
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: landing.serviceName,
        description: landing.metaDescription,
        url,
        serviceType: landing.serviceType,
        // Misma entidad que emiten desktop y mobile (`organizationSchema`).
        provider: { "@id": ORGANIZATION_ID },
        areaServed: landing.areaServed.map(({ name, type }) => ({
          "@type": type,
          name,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: landing.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Servicios",
            item: absoluteUrl("/servicios"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: landing.serviceName,
            item: url,
          },
        ],
      },
    ],
  };
}

export type ResolvedLandingCase = LandingCase & { project: Project };

/**
 * Casos y reseñas se resuelven contra sus fuentes (projects.ts,
 * testimonials.ts): un slug o id que ya no exista se cae en silencio en vez
 * de pintar una tarjeta rota.
 */
export function resolveLandingContent(landing: Landing): {
  cases: ResolvedLandingCase[];
  quotes: Testimonial[];
} {
  const cases = landing.cases.flatMap((c) => {
    const project = projects.find((p) => p.slug === c.slug);
    return project ? [{ ...c, project }] : [];
  });
  const quotes = landing.proof.testimonials.flatMap((id) => {
    const t = testimonials.find((x) => x.id === id);
    return t ? [t] : [];
  });
  return { cases, quotes };
}
