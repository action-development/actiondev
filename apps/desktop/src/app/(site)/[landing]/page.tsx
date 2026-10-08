import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLanding, landings } from "@/data/landings";
import { GOOGLE_REVIEW_COUNT, testimonials } from "@/data/testimonials";
import { getPosts } from "@/lib/blog";
import { landingGuides } from "@/lib/blog-seo";
import { LANDING_FORM_ID, buildLandingJsonLd, landingMetadata, resolveLandingContent } from "@/lib/landing-seo";
import { BUSINESS } from "@/lib/seo";
import { HoloButton } from "@/components/ui/HoloButton";
import { HoloBar } from "@/components/layout/HoloBar";
import { LegalLinks } from "@/components/layout/LegalLinks";
import { FormJumpButton } from "@/components/leads/FormJump";
import { LeadForm } from "@/components/leads/LeadForm";
import { StickyCta } from "@/components/leads/StickyCta";

/** Id del bloque del formulario: ancla de los CTA y de la barra fija de móvil. */
const PROJECT_FORM_ID = LANDING_FORM_ID;

/**
 * Landing pages SEO locales (/desarrollo-de-aplicaciones-vigo, …).
 *
 * Server components 100% estáticos: sin GSAP, sin Lenis, sin client JS.
 * No están enlazadas desde la navegación principal (decisión de diseño);
 * se descubren vía sitemap.xml, /servicios, llms.txt, el nav sr-only de la
 * home y el enlazado entre landings. El contenido vive en `data/landings.ts`:
 * contexto local, casos reales (enlazados a `/projects/{slug}`), secciones
 * propias, proceso, reseñas citadas por id, FAQ y relacionadas. Las «Guías
 * relacionadas» son los posts del blog con `targetLanding` = esta landing
 * (`landingGuides`): por eso la página revalida como el blog.
 * Metadatos, JSON-LD y contenido resuelto salen de `lib/landing-seo.ts`, la
 * misma fuente que la versión de la web móvil v2 (`app/(m)/m/[landing]`), que
 * el middleware sirve en móvil cuando la ruta está publicada (o con la cookie
 * de vista previa). Si no, los móviles reciben esta misma página, responsive.
 */

interface LandingPageProps {
  params: Promise<{ landing: string }>;
}

export const dynamicParams = false;

/** Las guías salen de Firestore: misma red de seguridad que el blog (y el webhook `/api/revalidate`). */
export const revalidate = 3600;

export function generateStaticParams() {
  return landings.map((l) => ({ landing: l.slug }));
}

export async function generateMetadata({
  params,
}: LandingPageProps): Promise<Metadata> {
  const { landing: slug } = await params;
  const landing = getLanding(slug);
  return landing ? landingMetadata(landing) : {};
}

export default async function LandingPage({ params }: LandingPageProps) {
  const { landing: slug } = await params;
  const landing = getLanding(slug);
  if (!landing) notFound();

  const { cases, quotes } = resolveLandingContent(landing);
  const guides = landingGuides(await getPosts(), landing.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildLandingJsonLd(landing)) }}
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
          <div id="hero" className="pt-12 md:pt-16">
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

            {/* CTA tras la intro: la landing llega desde Google y el formulario
                está al final; este es el primer sitio donde ya se puede actuar. */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <FormJumpButton
                targetId={PROJECT_FORM_ID}
                variant="solid"
                className="min-h-[52px] px-8"
                data-testid="landing-cta-project"
              >
                Cuéntanos tu proyecto
              </FormJumpButton>
              <HoloButton
                href={BUSINESS.whatsappUrl}
                variant="quiet"
                className="min-h-[52px] px-8"
                data-testid="landing-cta-whatsapp"
              >
                WhatsApp
              </HoloButton>
            </div>

            {/* Franja de confianza */}
            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 font-mono text-xs uppercase tracking-widest text-muted">
              <li>
                <span className="text-accent">
                  ★ {(testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length)
                    .toFixed(1)
                    .replace(".", ",")}
                </span>{" "}
                · {GOOGLE_REVIEW_COUNT} reseñas en Google
              </li>
              <li>Respuesta en 24 horas laborables</li>
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

          {/* Formulario de leads (ancla #proyecto) + canales directos */}
          <section
            id={PROJECT_FORM_ID}
            aria-labelledby="proyecto-titulo"
            data-testid="landing-project"
            className="mt-20 scroll-mt-6"
          >
            <div className="mx-auto max-w-2xl">
              <h2 id="proyecto-titulo" className="display-m text-foreground">
                {landing.cta.title}
              </h2>
              <p className="lede mt-4">{landing.cta.text}</p>
              <div className="mt-8">
                <LeadForm
                  defaultNeed={landing.leadNeed}
                  needs={landing.leadNeeds}
                  source="seo_landing"
                  offer={landing.slug}
                />
              </div>

              <div className="mt-10 border-t border-border pt-8">
                <p className="micro-label">¿Prefieres escribirnos directamente?</p>
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <HoloButton href={BUSINESS.whatsappUrl} variant="quiet">
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
              </div>
            </div>
          </section>

          {/* Guías del blog que empujan a esta landing (enlazado landing → blog) */}
          {guides.length > 0 && (
            <nav aria-labelledby="guias" className="mt-20" data-testid="landing-guides">
              <h2 id="guias" className="micro-label">
                Guías relacionadas
              </h2>
              <ul className="mt-5 grid gap-4 md:grid-cols-3">
                {guides.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="holo-surface holo-corners holo-link group h-full p-6"
                    >
                      <p className="micro-label">{post.category}</p>
                      <h3 className="mt-3 font-semibold text-foreground transition-colors group-hover:text-accent">
                        {post.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

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

      <StickyCta heroId="hero" formId={PROJECT_FORM_ID} />

      <footer className="border-t border-border pb-24 lg:pb-0">
        <div className="container-editorial flex flex-col gap-3 pt-10 pb-5 font-mono text-xs uppercase tracking-widest text-muted md:flex-row md:items-center md:justify-between">
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
        <LegalLinks
          className="container-editorial pb-10 font-mono text-xs uppercase tracking-widest text-muted"
          linkClassName="link-sweep uppercase tracking-widest hover:text-accent"
        />
      </footer>
    </>
  );
}
