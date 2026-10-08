import type { Metadata } from "next";
import { projects, type Project } from "@actiondev/shared";
import type { AdsCase, AdsLanding } from "@/data/ads-landings";
import { GOOGLE_REVIEW_COUNT, testimonials, type Testimonial } from "@/data/testimonials";
import { OG_IMAGE, absoluteUrl } from "@/lib/seo";

/**
 * Landings de campaña (`/hablemos/[oferta]`): metadatos y contenido resuelto.
 * Fuente ÚNICA para la página de escritorio (`app/(site)/hablemos/[oferta]`) y
 * la móvil (`app/(m)/m/hablemos/[oferta]`): mismo `noindex, follow`, mismo
 * canonical y mismos casos, reseñas y «5,0». Extraído sin cambios de la página
 * de escritorio.
 */

export function adsLandingMetadata(landing: AdsLanding): Metadata {
  const path = `/hablemos/${landing.slug}`;

  return {
    title: landing.title,
    description: landing.metaDescription,
    alternates: { canonical: path },
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: absoluteUrl(path),
      siteName: "Action",
      title: `${landing.title} — Action`,
      description: landing.metaDescription,
      images: [
        {
          url: `${OG_IMAGE.url}?title=${encodeURIComponent(landing.h1)}`,
          width: OG_IMAGE.width,
          height: OG_IMAGE.height,
        },
      ],
    },
  };
}

/**
 * «5,0» (media de las reseñas con texto) y nº de reseñas de la ficha de Google
 * (`GOOGLE_REVIEW_COUNT`: incluye las que solo tienen estrellas). Una sola
 * fuente para landings SEO, campaña y web móvil.
 */
export function reviewSummary() {
  const rating = (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length)
    .toFixed(1)
    .replace(".", ",");
  return { rating, count: GOOGLE_REVIEW_COUNT };
}

/**
 * Reseña del hero: la de `landing.heroReview.id`, sin reescribir. El recorte
 * (`excerpt`) solo se usa si es un fragmento literal de la reseña; si no, entera.
 */
export function resolveHeroReview(landing: AdsLanding) {
  const t = testimonials.find((x) => x.id === landing.heroReview.id);
  if (!t) return null;
  const full = t.quoteEs ?? t.quote;
  const { excerpt } = landing.heroReview;
  const literal = excerpt && full.includes(excerpt.replace(/^…|…$/g, "").trim());
  return { name: t.name, text: literal ? excerpt : full };
}

/**
 * Casos y reseñas resueltos contra sus fuentes: un slug o id que ya no exista
 * se cae en silencio en vez de pintar una tarjeta rota. La reseña del hero no
 * se repite en la sección de reseñas.
 */
export function resolveAdsLandingContent(landing: AdsLanding): {
  cases: (AdsCase & { project: Project })[];
  quotes: Testimonial[];
} {
  const cases = landing.cases.flatMap((c) => {
    const project = projects.find((p) => p.slug === c.slug);
    return project ? [{ ...c, project }] : [];
  });
  const quotes = landing.testimonials
    .filter((id) => id !== landing.heroReview.id)
    .flatMap((id) => {
      const t = testimonials.find((x) => x.id === id);
      return t ? [t] : [];
    });
  return { cases, quotes };
}
