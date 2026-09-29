import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ORGANIZATION_ID, projects } from "@actiondev/shared";
import { getLanding, landings, type Landing } from "@/data/landings";
import { testimonials } from "@/data/testimonials";
import { BUSINESS, OG_IMAGE, SITE_URL, absoluteUrl } from "@/lib/seo";
import { HoloButton } from "@/components/ui/HoloButton";
import { HoloBar } from "@/components/layout/HoloBar";

/**
 * Landing pages SEO locales (/desarrollo-de-aplicaciones-vigo, …).
 *
 * Server components 100% estáticos: sin GSAP, sin Lenis, sin client JS.
 * No están enlazadas desde la navegación principal (decisión de diseño);
 * se descubren vía sitemap.xml, /servicios, llms.txt, el nav sr-only de la
 * home y el enlazado entre landings. El contenido vive en `data/landings.ts`:
 * contexto local, casos reales (enlazados a `/projects/{slug}`), secciones
 * propias, proceso, reseñas citadas por id, FAQ y relacionadas.
 * Responsive: los móviles reciben esta misma página (el middleware solo
 * reescribe "/" hacia la zona mobile).
 */

interface LandingPageProps {
  params: Promise<{ landing: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return landings.map((l) => ({ landing: l.slug }));
}

export async function generateMetadata({
  params,
}: LandingPageProps): Promise<Metadata> {
  const { landing: slug } = await params;
  const landing = getLanding(slug);
  if (!landing) return {};

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

function buildJsonLd(landing: Landing) {
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

export default async function LandingPage({ params }: LandingPageProps) {
  const { landing: slug } = await params;
  const landing = getLanding(slug);
  if (!landing) notFound();

  // Casos y reseñas se resuelven contra sus fuentes (projects.ts,
  // testimonials.ts): un slug o id que ya no exista se cae en silencio en vez
  // de pintar una tarjeta rota.
  const cases = landing.cases.flatMap((c) => {
    const project = projects.find((p) => p.slug === c.slug);
    return project ? [{ ...c, project }] : [];
  });
  const quotes = landing.proof.testimonials.flatMap((id) => {
    const t = testimonials.find((x) => x.id === id);
    return t ? [t] : [];
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(landing)) }}
      />

      {/* Misma proyección que el Header de la home, pero estática: esta página
          es server component puro y tiene que pintar al instante. */}
      <HoloBar phone={BUSINESS.phoneDisplay} phoneHref={BUSINESS.whatsappUrl} />

      <main id="main-content" className="pb-24">
        <article className="container-editorial">
          {/* Breadcrumb */}
          <nav aria-label="Migas de pan" className="pt-10">
            <ol className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted">
              <li>
                <Link href="/" className="link-sweep hover:text-accent">
                  Inicio
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href="/servicios" className="link-sweep hover:text-accent">
                  Servicios
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-foreground" aria-current="page">
                {landing.h1}
              </li>
            </ol>
          </nav>

          {/* Hero */}
          <div className="pt-12 md:pt-16">
            <p className="micro-label">
              {BUSINESS.address.street} · {BUSINESS.address.locality}
            </p>
            <h1 className="display-l mt-4 text-foreground">{landing.h1}</h1>
            <div className="mt-8 space-y-5">
              {landing.intro.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="prose-body text-lg">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Franja de confianza */}
            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 font-mono text-xs uppercase tracking-widest text-muted">
              <li>
                <span className="text-accent">
                  ★ {(testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length)
                    .toFixed(1)
                    .replace(".", ",")}
                </span>{" "}
                · {testimonials.length} reseñas en Google
              </li>
              <li>Respuesta en 24 horas</li>
              <li>Equipo senior · Sin subcontratas</li>
            </ul>
          </div>

          {/* Contexto local */}
          <section aria-labelledby="contexto" className="mt-20">
            <h2 id="contexto" className="display-m text-foreground">
              {landing.localContext.title}
            </h2>
            <div className="mt-8 space-y-5">
              {landing.localContext.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="prose-body">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          {/* Servicios */}
          <section aria-labelledby="ofertas" className="mt-20">
            <h2 id="ofertas" className="display-m text-foreground">
              {landing.offersTitle}
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {landing.offers.map((offer) => (
                <div
                  key={offer.title}
                  className="holo-surface holo-corners p-7"
                >
                  <h3 className="text-lg font-semibold text-foreground">
                    {offer.title}
                  </h3>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
                    {offer.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Casos reales → ficha /projects/{slug} */}
          {cases.length > 0 && (
            <section aria-labelledby="casos" className="mt-20">
              <h2 id="casos" className="display-m text-foreground">
                {landing.casesTitle}
              </h2>
              <ul className="mt-10 grid gap-4 md:grid-cols-2">
                {cases.map(({ slug, note, project }) => (
                  <li key={slug}>
                    <Link
                      href={`/projects/${slug}`}
                      className="holo-surface holo-corners holo-link group h-full p-7"
                    >
                      <p className="micro-label">
                        {project.nicheEs ?? project.categoryEs ?? project.category}
                      </p>
                      <h3 className="mt-3 text-lg font-semibold text-foreground transition-colors group-hover:text-accent">
                        {project.title}
                      </h3>
                      <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
                        {note}
                      </p>
                      <span className="micro-label micro-label-accent mt-5 inline-block">
                        Ver el caso
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Secciones propias de la landing */}
          {landing.sections.map((section, i) => (
            <section
              key={section.title}
              aria-labelledby={`seccion-${i}`}
              className="mt-20"
            >
              <h2 id={`seccion-${i}`} className="display-m text-foreground">
                {section.title}
              </h2>
              <div className="mt-8 space-y-5">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)} className="prose-body">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          {/* Proceso */}
          <section aria-labelledby="proceso" className="mt-20">
            <h2 id="proceso" className="display-m text-foreground">
              {landing.processTitle}
            </h2>
            <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {landing.process.map((step) => (
                <li key={step.title} className="holo-surface holo-corners p-6">
                  <h3 className="micro-label micro-label-accent">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* Reseñas reales citadas (distintas en cada landing) */}
          <section aria-labelledby="resenas" className="mt-20">
            <h2 id="resenas" className="display-m text-foreground">
              Lo que dicen en Google
            </h2>
            <p className="prose-body mt-6">{landing.proof.text}</p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {quotes.map((t) => (
                <figure key={t.id} className="holo-surface holo-corners p-7">
                  <blockquote className="prose-body">
                    <p>«{t.quoteEs ?? t.quote}»</p>
                  </blockquote>
                  <figcaption className="micro-label mt-5">
                    <span className="text-accent" aria-hidden>
                      {"★".repeat(t.rating)}
                    </span>{" "}
                    {t.name} · Reseña de Google
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
              <a
                href={BUSINESS.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-sweep micro-label micro-label-accent hover:text-foreground"
              >
                Ver todas las reseñas en Google
              </a>
              <a
                href={BUSINESS.reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-sweep micro-label hover:text-accent"
              >
                ¿Ya eres cliente? Deja tu reseña en Google
              </a>
            </p>
          </section>

          {/* FAQ */}
          <section aria-labelledby="faq" className="mt-20">
            <h2 id="faq" className="display-m text-foreground">
              Preguntas frecuentes
            </h2>
            <div className="mt-10 space-y-3">
              {landing.faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="disclosure holo-surface holo-corners group"
                >
                  <summary className="cursor-pointer list-none p-6 font-medium text-foreground transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
                    <span className="flex items-start justify-between gap-4">
                      {faq.q}
                      <span
                        aria-hidden
                        className="shrink-0 text-accent transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="px-6 pb-6 leading-relaxed text-muted">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section
            aria-label="Contacto"
            className="holo-surface holo-corners mt-20 p-8 text-center md:p-14"
          >
            <h2 className="display-m text-foreground">{landing.cta.title}</h2>
            <p className="lede mx-auto mt-4">{landing.cta.text}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <HoloButton href={BUSINESS.whatsappUrl} variant="solid">
                Hablar por WhatsApp
              </HoloButton>
              <HoloButton href={`mailto:${BUSINESS.email}`} data>
                {BUSINESS.email}
              </HoloButton>
            </div>
            <p className="mt-6 font-mono text-xs uppercase tracking-widest text-muted">
              {BUSINESS.address.street}, {BUSINESS.address.postalCode}{" "}
              {BUSINESS.address.locality} · {BUSINESS.phoneDisplay}
            </p>
          </section>

          {/* Enlazado interno */}
          <nav aria-label="Servicios relacionados" className="mt-20">
            <h2 className="micro-label">Servicios relacionados</h2>
            <ul className="mt-5 flex flex-wrap gap-3">
              {landing.related.map((rel) => (
                <li key={rel.slug}>
                  <HoloButton href={`/${rel.slug}`} size="sm">
                    {rel.label}
                  </HoloButton>
                </li>
              ))}
              <li>
                <HoloButton href="/servicios" size="sm">
                  Todos los servicios
                </HoloButton>
              </li>
            </ul>
          </nav>
        </article>
      </main>

      <footer className="border-t border-border">
        <div className="container-editorial flex flex-col gap-3 py-10 font-mono text-xs uppercase tracking-widest text-muted md:flex-row md:items-center md:justify-between">
          <p>
            Action — {BUSINESS.address.street}, {BUSINESS.address.postalCode}{" "}
            {BUSINESS.address.locality}, {BUSINESS.address.region}
          </p>
          <p>
            <a href={`mailto:${BUSINESS.email}`} className="link-sweep hover:text-accent">
              {BUSINESS.email}
            </a>{" "}
            · {BUSINESS.phoneDisplay}
          </p>
        </div>
      </footer>
    </>
  );
}
