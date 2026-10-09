import type { Metadata } from "next";
import {
  BUSINESS,
  GOOGLE_RATING,
  GOOGLE_RATING_TEXT,
  ORGANIZATION_ID,
  WEBSITE_ID,
  projects,
  type Project,
} from "@actiondev/shared";
import type { Landing, LandingCase } from "@/data/landings";
import { testimonials, type Testimonial } from "@/data/testimonials";
import { SITE_NAME, SITE_URL, absoluteUrl, ogImage } from "@/lib/seo";

/**
 * Landings SEO (`/[landing]`): metadatos, JSON-LD y contenido resuelto. Fuente
 * ÚNICA de la página de escritorio (`app/(site)/[landing]`) y de la móvil
 * (`app/(m)/m/[landing]`): paridad SEO por construcción. Extraído sin cambios
 * de la página de escritorio.
 */

/** Id del bloque del formulario: ancla de los CTA y de la barra fija (escritorio y móvil). */
export const LANDING_FORM_ID = "proyecto";

export function landingMetadata(landing: Landing): Metadata {
  const image = ogImage(landing.title, landing.h1);

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
      siteName: SITE_NAME,
      title: landing.title,
      description: landing.metaDescription,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: landing.title,
      description: landing.metaDescription,
      images: [image],
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
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": `${url}#service` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
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
        "@id": `${url}#faq`,
        mainEntity: landing.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
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

// ─── «Datos clave» ───────────────────────────────────────────────────────

/** Tipo de trabajo de la landing para sus «Datos clave». */
type LandingKind = "app" | "software" | "web" | "design" | "shop";

function landingKind(landing: Landing): LandingKind {
  if (landing.slug === "diseno-web-vigo") return "design";
  if (landing.slug === "tienda-online-vigo") return "shop";
  if (landing.leadNeed === "app") return "app";
  if (landing.leadNeed === "software") return "software";
  return "web";
}

/**
 * Qué se hace y con qué tecnología, por tipo. SOLO lo que respaldan los
 * proyectos (`technologies` de `projects.ts`, comprobadas en vivo el
 * 2026-10-09) o esta misma web: React Native y Expo (XauLabs, Óscar Soto,
 * Tratum), React y Node.js (Timetracker, Koopey), Next.js (PBB), Vite (Musa,
 * Samoa, Almudena Muhle, Patricia Avendaño), Shopify (Canelita, Cliché) y
 * Three.js (actiondev.es).
 */
const KIND_FACTS: Record<LandingKind, { service: string; tech: string }> = {
  app: { service: "Apps iOS y Android con panel y backend", tech: "React Native y Expo" },
  software: { service: "ERP, control horario e integraciones", tech: "React y Node.js" },
  web: { service: "Webs a medida: entradas, cuotas, reservas", tech: "React con Next.js o Vite" },
  design: { service: "Diseño web con identidad, motion y 3D", tech: "React, Vite y Three.js" },
  shop: { service: "Tiendas en Shopify o a medida", tech: "Shopify, React y Node.js" },
};

export interface LandingKeyFact {
  id: "rating" | "office" | "projects" | "response" | "service" | "tech" | "team";
  label: string;
  value: string;
  href?: string;
}

/**
 * Bloque «Datos clave» de cada landing (plan AEO, §4.4): hechos cortos y
 * comprobables junto al primer CTA, en el HTML del servidor, los MISMOS en
 * escritorio (`<dl>`) y en la web móvil v2 (celdas del hero). La valoración
 * sale de `GOOGLE_RATING` y los proyectos se cuentan en `projects.ts`: ninguna
 * cifra escrita a mano.
 */
export function landingKeyFacts(landing: Landing): LandingKeyFact[] {
  const kind = KIND_FACTS[landingKind(landing)];
  return [
    {
      id: "rating",
      label: "Google",
      value: `${GOOGLE_RATING_TEXT} sobre 5 · ${GOOGLE_RATING.count} reseñas`,
      href: BUSINESS.mapsUrl,
    },
    { id: "office", label: "Oficina", value: `${BUSINESS.address.street}, ${BUSINESS.address.locality}` },
    { id: "projects", label: "Proyectos", value: `${projects.length} publicados`, href: "/projects" },
    { id: "response", label: "Respuesta", value: "En 24 horas laborables" },
    { id: "service", label: "Qué hacemos", value: kind.service },
    { id: "tech", label: "Tecnología", value: kind.tech },
    { id: "team", label: "Equipo", value: "Interno, sin subcontratas" },
  ];
}
