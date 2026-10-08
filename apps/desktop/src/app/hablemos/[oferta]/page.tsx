import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PLACEHOLDER_IMAGE, projects } from "@actiondev/shared";
import { adsLandings, getAdsLanding, type AdsLanding } from "@/data/ads-landings";
import { testimonials } from "@/data/testimonials";
import { FormJumpLink, LEAD_FORM_ID } from "@/components/leads/FormJump";
import { LeadForm } from "@/components/leads/LeadForm";
import { BUSINESS, OG_IMAGE, absoluteUrl } from "@/lib/seo";

/**
 * Landings de campaña (`/hablemos/app`, `/hablemos/software`): destino de
 * Google Ads y Meta Ads. Cortas, rápidas y con UNA salida: el formulario.
 *
 * Server components estáticos (el H1 de texto es el LCP): sin GSAP, Lenis ni
 * 3D; el único JS propio es el formulario y la barra fija de móvil. `noindex`
 * y fuera del sitemap a propósito — son páginas de campaña, no de buscador
 * (las SEO son `[landing]`). Datos en `data/ads-landings.ts`.
 */

interface PageProps {
  params: Promise<{ oferta: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return adsLandings.map((l) => ({ oferta: l.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { oferta } = await params;
  const landing = getAdsLanding(oferta);
  if (!landing) return {};
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

/** «5,0» y nº de reseñas, calculados igual que en las landings SEO. */
function reviewSummary() {
  const rating = (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length)
    .toFixed(1)
    .replace(".", ",");
  return { rating, count: testimonials.length };
}

/**
 * Reseña del hero: la de `landing.heroReview.id`, sin reescribir. El recorte
 * (`excerpt`) solo se usa si es un fragmento literal de la reseña; si no, entera.
 */
function resolveHeroReview(landing: AdsLanding) {
  const t = testimonials.find((x) => x.id === landing.heroReview.id);
  if (!t) return null;
  const full = t.quoteEs ?? t.quote;
  const { excerpt } = landing.heroReview;
  const literal = excerpt && full.includes(excerpt.replace(/^…|…$/g, "").trim());
  return { name: t.name, text: literal ? excerpt : full };
}

function Bullets({ landing }: { landing: AdsLanding }) {
  return (
    <ul data-testid="ads-bullets" className="divide-y divide-border border-y border-border">
      {landing.bullets.map((bullet) => (
        <li key={bullet} className="flex gap-4 py-5">
          <span aria-hidden className="mt-[0.55rem] h-2 w-2 shrink-0 bg-accent" />
          <p className="text-[1.0625rem] leading-snug text-foreground">{bullet}</p>
        </li>
      ))}
    </ul>
  );
}

export default async function AdsLandingPage({ params }: PageProps) {
  const { oferta } = await params;
  const landing = getAdsLanding(oferta);
  if (!landing) notFound();

  // Casos y reseñas se resuelven contra sus fuentes: un slug o id que ya no
  // exista se cae en silencio en vez de pintar una tarjeta rota.
  const cases = landing.cases.flatMap((c) => {
    const project = projects.find((p) => p.slug === c.slug);
    return project ? [{ ...c, project }] : [];
  });
  // La reseña del hero no se repite en la sección de reseñas.
  const quotes = landing.testimonials
    .filter((id) => id !== landing.heroReview.id)
    .flatMap((id) => {
      const t = testimonials.find((x) => x.id === id);
      return t ? [t] : [];
    });
  const heroReview = resolveHeroReview(landing);
  const { rating, count } = reviewSummary();

  return (
    <main id="main-content">
      <div className="container-editorial grid gap-x-14 gap-y-6 pt-3 pb-16 sm:gap-y-10 sm:pt-8 lg:grid-cols-12 lg:pt-14 lg:pb-24">
        {/* Hero: texto. En móvil el formulario sigue justo debajo. */}
        <div id="hero" className="lg:col-span-7">
          <h1
            data-testid="ads-h1"
            className="text-[clamp(1.625rem,5.4vw,3.25rem)] font-bold leading-[1.03] tracking-[-0.035em] text-foreground"
          >
            {landing.h1}
          </h1>
          <p className="mt-3 max-w-[52ch] text-[0.875rem] leading-[1.45] text-foreground/80 sm:mt-4 sm:text-lg sm:leading-relaxed">
            {landing.subtitle}
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] sm:mt-4 sm:text-sm text-foreground/80">
            <a
              href={BUSINESS.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="ads-reviews-link"
              className="link-sweep font-semibold hover:text-accent"
            >
              <span className="text-accent">★ {rating}</span> · {count} reseñas en Google
            </a>
            <span>
              {BUSINESS.address.street} · {BUSINESS.address.locality}
            </span>
          </p>
          {heroReview && (
            <figure
              data-testid="ads-hero-review"
              className="mt-2 text-[12px] leading-snug text-foreground/85 sm:mt-4 sm:border-l-2 sm:border-accent sm:pl-3 sm:text-sm"
            >
              <blockquote className="inline">
                <p className="inline">«{heroReview.text}»</p>
              </blockquote>{" "}
              <figcaption className="inline text-muted">— {heroReview.name}</figcaption>
            </figure>
          )}
        </div>

        {/* Formulario: a la derecha y fijo en escritorio. */}
        <div
          id={LEAD_FORM_ID}
          className="scroll-mt-4 max-sm:-mt-3 lg:sticky lg:top-6 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto"
        >
          <LeadForm defaultNeed={landing.defaultNeed} source="ads_landing" offer={landing.slug} />
        </div>

        <div className="space-y-16 lg:col-span-7 lg:space-y-20">
          <Bullets landing={landing} />

          {/* Casos reales → ficha /projects/{slug}, en pestaña nueva para no perder la landing */}
          {cases.length > 0 && (
            <section aria-labelledby="casos">
              <h2 id="casos" className="text-2xl font-bold tracking-tight text-foreground">
                {landing.casesTitle}
              </h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {cases.map(({ slug, note, project }) => (
                  <li key={slug}>
                    <Link
                      href={`/projects/${slug}`}
                      target="_blank"
                      rel="noopener"
                      data-testid={`ads-case-${slug}`}
                      className="holo-surface holo-corners holo-link group flex h-full flex-col"
                    >
                      {project.image && project.image !== PLACEHOLDER_IMAGE && (
                        <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-border">
                          <Image
                            src={project.image}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 340px, (min-width: 640px) 45vw, 100vw"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-5">
                        <p className="micro-label">{project.nicheEs ?? project.categoryEs ?? project.category}</p>
                        <h3 className="mt-2.5 text-lg font-semibold text-foreground transition-colors group-hover:text-accent">
                          {project.title}
                        </h3>
                        <p className="mt-2.5 flex-1 text-[0.95rem] leading-relaxed text-foreground/75">{note}</p>
                        <span className="micro-label micro-label-accent mt-4 inline-block">Ver el caso</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Reseñas reales de Google */}
          <section aria-labelledby="resenas">
            <h2 id="resenas" className="text-2xl font-bold tracking-tight text-foreground">
              Lo que dicen en Google
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {quotes.map((t) => (
                <figure key={t.id} className="flex flex-col border-2 border-border bg-card p-5">
                  <blockquote className="flex-1 text-[0.95rem] leading-relaxed text-foreground/85">
                    <p>«{t.quoteEs ?? t.quote}»</p>
                  </blockquote>
                  <figcaption className="micro-label mt-4">
                    <span className="text-accent" aria-hidden>
                      {"★".repeat(t.rating)}
                    </span>{" "}
                    {t.name}
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-5">
              <a
                href={BUSINESS.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-sweep micro-label micro-label-accent hover:text-foreground"
              >
                Ver las {count} reseñas en Google
              </a>
            </p>
          </section>

          {/* Proceso */}
          <section aria-labelledby="proceso">
            <h2 id="proceso" className="text-2xl font-bold tracking-tight text-foreground">
              Cómo trabajamos
            </h2>
            <ol className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {landing.steps.map((step, i) => (
                <li key={step.title} className="border-t-2 border-border pt-4">
                  <p className="micro-label micro-label-accent">0{i + 1}</p>
                  <h3 className="mt-3 text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-foreground/75">{step.text}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* FAQ: <details> nativo, sin JS */}
          <section aria-labelledby="faq">
            <h2 id="faq" className="text-2xl font-bold tracking-tight text-foreground">
              Preguntas frecuentes
            </h2>
            <div className="mt-6 space-y-3">
              {landing.faqs.map((faq) => (
                <details key={faq.q} className="disclosure holo-surface holo-corners group">
                  <summary className="cursor-pointer list-none p-5 font-medium text-foreground transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
                    <span className="flex items-start justify-between gap-4">
                      {faq.q}
                      <span aria-hidden className="shrink-0 text-accent transition-transform group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="px-5 pb-5 leading-relaxed text-foreground/80">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>

        {/* Cierre */}
        <section
          aria-labelledby="cierre"
          className="holo-surface holo-corners holo-solid p-8 text-center sm:p-12 lg:col-span-12"
        >
          <h2 id="cierre" className="text-[clamp(1.5rem,3.4vw,2.5rem)] font-bold leading-tight tracking-tight text-foreground">
            {landing.cta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] text-foreground/80">{landing.cta.text}</p>
          <div className="mt-8">
            <FormJumpLink className="holo-btn holo-btn-solid min-h-[52px] px-8 text-[13px]" data-testid="ads-closing-cta">
              Contar mi proyecto
            </FormJumpLink>
          </div>
        </section>
      </div>
    </main>
  );
}
