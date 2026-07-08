import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLanding, landings } from "@/data/landings";
import { BUSINESS, OG_IMAGE, SITE_URL, absoluteUrl } from "@/lib/seo";

/**
 * Landing pages SEO locales (/desarrollo-de-aplicaciones-vigo, …).
 *
 * Server components 100% estáticos: sin GSAP, sin Lenis, sin client JS.
 * No están enlazadas desde la navegación principal (decisión de diseño);
 * se descubren vía sitemap.xml, /servicios y el enlazado entre landings.
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

  return {
    title: landing.title,
    description: landing.metaDescription,
    alternates: { canonical: `/${landing.slug}` },
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: absoluteUrl(`/${landing.slug}`),
      siteName: "Action",
      title: landing.title,
      description: landing.metaDescription,
      images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height }],
    },
  };
}

function buildJsonLd(landing: NonNullable<ReturnType<typeof getLanding>>) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl(`/${landing.slug}`),
        url: absoluteUrl(`/${landing.slug}`),
        name: landing.title,
        description: landing.metaDescription,
        inLanguage: "es",
        isPartOf: { "@id": absoluteUrl("#website") },
      },
      {
        "@type": "Service",
        name: landing.serviceName,
        description: landing.metaDescription,
        url: absoluteUrl(`/${landing.slug}`),
        serviceType: landing.serviceName,
        provider: { "@id": absoluteUrl("#organization") },
        areaServed: landing.areaServed.map((name) => ({
          "@type": name === "Galicia" ? "AdministrativeArea" : "City",
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
            item: absoluteUrl(`/${landing.slug}`),
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(landing)) }}
      />

      {/* Top bar mínima — no reutiliza el Header animado de la home */}
      <header className="border-b border-border">
        <div className="container-editorial flex items-center justify-between py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              Action
            </span>
          </Link>
          <a
            href={BUSINESS.whatsappUrl}
            className="rounded-full border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            {BUSINESS.phoneDisplay}
          </a>
        </div>
      </header>

      <main className="pb-24">
        <article className="container-editorial">
          {/* Breadcrumb */}
          <nav aria-label="Migas de pan" className="pt-10">
            <ol className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted">
              <li>
                <Link href="/" className="transition-colors hover:text-accent">
                  Inicio
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href="/servicios" className="transition-colors hover:text-accent">
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
                <span className="text-accent">★ 5,0</span> · 20 reseñas en Google
              </li>
              <li>Respuesta en 24 horas</li>
              <li>Equipo senior · Sin subcontratas</li>
            </ul>
          </div>

          <div className="hairline my-16" />

          {/* Servicios */}
          <section aria-labelledby="ofertas">
            <h2 id="ofertas" className="display-m text-foreground">
              {landing.offersTitle}
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {landing.offers.map((offer) => (
                <div
                  key={offer.title}
                  className="rounded-lg border border-border bg-card p-7"
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

          {/* Proceso */}
          {landing.process && (
            <section aria-labelledby="proceso" className="mt-20">
              <h2 id="proceso" className="display-m text-foreground">
                Cómo trabajamos
              </h2>
              <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {landing.process.map((step) => (
                  <li
                    key={step.title}
                    className="rounded-lg border border-border p-6"
                  >
                    <h3 className="font-mono text-sm uppercase tracking-widest text-accent">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                      {step.text}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Prueba local */}
          <section aria-label="Clientes y resultados" className="mt-20">
            <blockquote className="rounded-lg border border-border bg-card p-8 md:p-10">
              <p className="prose-body text-lg">{landing.proof}</p>
              <a
                href={BUSINESS.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block font-mono text-xs uppercase tracking-widest text-accent transition-colors hover:text-foreground"
              >
                Ver reseñas en Google Maps →
              </a>
            </blockquote>
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
                  className="group rounded-lg border border-border bg-card"
                >
                  <summary className="cursor-pointer list-none p-6 font-medium text-foreground transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
                    <span className="flex items-start justify-between gap-4">
                      {faq.q}
                      <span
                        aria-hidden
                        className="text-accent transition-transform group-open:rotate-45"
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
            className="mt-20 rounded-lg border border-border bg-card p-8 text-center md:p-14"
          >
            <h2 className="display-m text-foreground">
              Cuéntanos tu proyecto
            </h2>
            <p className="lede mx-auto mt-4">
              Escríbenos y recibe una propuesta detallada en 24 horas. Sin
              compromiso y sin letra pequeña.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href={BUSINESS.whatsappUrl}
                className="rounded-full bg-accent px-7 py-3.5 font-medium text-background transition-transform hover:scale-105"
              >
                Hablar por WhatsApp
              </a>
              <a
                href={`mailto:${BUSINESS.email}`}
                className="rounded-full border border-border px-7 py-3.5 font-medium text-foreground transition-colors hover:border-accent"
              >
                {BUSINESS.email}
              </a>
            </div>
            <p className="mt-6 font-mono text-xs uppercase tracking-widest text-muted">
              {BUSINESS.address.street}, {BUSINESS.address.postalCode}{" "}
              {BUSINESS.address.locality} · {BUSINESS.phoneDisplay}
            </p>
          </section>

          {/* Enlazado interno */}
          <nav aria-label="Servicios relacionados" className="mt-20">
            <h2 className="micro-label">También te puede interesar</h2>
            <ul className="mt-5 flex flex-wrap gap-3">
              {landing.related.map((rel) => (
                <li key={rel.slug}>
                  <Link
                    href={`/${rel.slug}`}
                    className="inline-block rounded-full border border-border px-5 py-2.5 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
                  >
                    {rel.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/servicios"
                  className="inline-block rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  Todos los servicios
                </Link>
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
            <a href={`mailto:${BUSINESS.email}`} className="hover:text-accent">
              {BUSINESS.email}
            </a>{" "}
            · {BUSINESS.phoneDisplay}
          </p>
        </div>
      </footer>
    </>
  );
}
