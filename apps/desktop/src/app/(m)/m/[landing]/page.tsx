import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Faq } from "@/components/m/Faq";
import { GuideList } from "@/components/m/GuideList";
import { LandingCase } from "@/components/m/LandingCase";
import { LandingHero } from "@/components/m/landing/LandingHero";
import { LandingRelated } from "@/components/m/landing/LandingRelated";
import { LandingText } from "@/components/m/landing/LandingText";
import { LANDING_HERO_CTA_ID, landingSteps, landingWhatsappText } from "@/components/m/landing/landing-data";
import { MobileLeadForm } from "@/components/m/leads/MobileLeadForm";
import { MobileFooter } from "@/components/m/MobileFooter";
import { MobileHeader } from "@/components/m/MobileHeader";
import { RatingBand } from "@/components/m/Rating";
import { ReviewItem } from "@/components/m/ReviewItem";
import { Section } from "@/components/m/Section";
import { Steps } from "@/components/m/Steps";
import { StickyCta } from "@/components/m/StickyCta";
import { getLanding, landings } from "@/data/landings";
import { getPosts } from "@/lib/blog";
import { landingGuides } from "@/lib/blog-seo";
import { LANDING_FORM_ID, buildLandingJsonLd, landingMetadata, resolveLandingContent } from "@/lib/landing-seo";

/**
 * Landings SEO en la web móvil v2 (`/desarrollo-de-aplicaciones-vigo`, …):
 * lo que indexa Google con mobile-first y adonde llegan los enlaces de sitio
 * de Google Ads. Title, description, canonical, Open Graph, JSON-LD (WebPage
 * + Service + FAQPage + BreadcrumbList) y contenido resuelto salen de
 * `lib/landing-seo.ts`, la MISMA fuente que escritorio; el copy, de
 * `data/landings.ts`. Todo el texto y todos los enlaces internos de la página
 * de escritorio están aquí, visibles (regla de oro de la v2).
 *
 * Orden pensado para convertir: qué hacemos y CTA en la primera pantalla →
 * prueba (casos reales y reseñas) → contexto y secciones propias → proceso →
 * preguntas → el formulario cualificador (`MobileLeadForm`, `seo_landing`,
 * `offer` = slug, como `LeadForm` en escritorio; debajo, su enlace a WhatsApp)
 * → guías del blog que empujan a esta landing (`landingGuides`) → servicios
 * relacionados. WhatsApp, email y oficina, en el pie. «Contar mi proyecto» (hero, menú y barra fija) baja
 * al formulario de la propia página.
 *
 * Server component: el único JS propio es el menú, el formulario y la barra.
 */

interface PageProps {
  params: Promise<{ landing: string }>;
}

export const dynamicParams = false;

/** Las guías salen de Firestore: misma red de seguridad que el blog (y el webhook `/api/revalidate`). */
export const revalidate = 3600;

export function generateStaticParams() {
  return landings.map((l) => ({ landing: l.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { landing: slug } = await params;
  const landing = getLanding(slug);
  return landing ? landingMetadata(landing) : {};
}

export default async function MobileLandingPage({ params }: PageProps) {
  const { landing: slug } = await params;
  const landing = getLanding(slug);
  if (!landing) notFound();

  const { cases, quotes } = resolveLandingContent(landing);
  const guides = landingGuides(await getPosts(), landing.slug);
  const whatsappText = landingWhatsappText(landing);
  const formHref = `#${LANDING_FORM_ID}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildLandingJsonLd(landing)) }}
      />
      <MobileHeader whatsappText={whatsappText} ctaHref={formHref} />
      <main id="main-content">
        <LandingHero landing={landing} ctaId={LANDING_HERO_CTA_ID} formId={LANDING_FORM_ID} whatsappText={whatsappText} />

        {landing.intro.length > 1 && <LandingText paragraphs={landing.intro.slice(1)} />}

        <Section id="que-hacemos" title={landing.offersTitle} data-testid="m-landing-offers">
          <ul className="border-b-2 border-ink">
            {landing.offers.map((offer) => (
              <li key={offer.title} className="grid gap-2 border-b border-ink px-4 pt-[18px] pb-5 last:border-b-0">
                <h3 className="font-display text-h4 uppercase">{offer.title}</h3>
                <p className="max-w-[40em] text-base leading-[1.45]">{offer.text}</p>
              </li>
            ))}
          </ul>
        </Section>

        {cases.length > 0 && (
          <Section id="casos" title={landing.casesTitle} data-testid="m-landing-cases">
            <ul>
              {cases.map((item) => (
                <li key={item.slug}>
                  <LandingCase item={item} />
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section id="resenas" title="Lo que dicen en Google" lead={landing.proof.text} data-testid="m-landing-reviews">
          <ul>
            {quotes.map((t) => (
              <ReviewItem key={t.id} testimonial={t} />
            ))}
          </ul>
          <RatingBand reviewLink />
        </Section>

        <Section id="contexto" title={landing.localContext.title}>
          <LandingText paragraphs={landing.localContext.paragraphs} />
        </Section>

        {landing.sections.map((section, i) => (
          <Section key={section.title} id={`seccion-${i}`} title={section.title}>
            <LandingText paragraphs={section.paragraphs} />
          </Section>
        ))}

        <Section id="proceso" title={landing.processTitle} data-testid="m-landing-process">
          <Steps steps={landingSteps(landing)} />
        </Section>

        {landing.faqs.length > 0 && (
          <Section id="faq" title="Preguntas frecuentes" data-testid="m-landing-faq">
            <Faq items={landing.faqs} itemTestId="m-landing-faq-item" />
          </Section>
        )}

        <section id={LANDING_FORM_ID} aria-labelledby="m-landing-form-title" data-testid="m-landing-form">
          <div className="grid gap-3 border-b-2 border-ink px-4 pt-12 pb-4">
            <h2 id="m-landing-form-title" className="font-display text-h2 uppercase">
              {landing.cta.title}
            </h2>
            <p className="max-w-[34ch] text-lead">{landing.cta.text}</p>
          </div>
          <MobileLeadForm
            defaultNeed={landing.leadNeed}
            needs={landing.leadNeeds}
            source="seo_landing"
            offer={landing.slug}
          />
        </section>

        <GuideList id="guias" title="Guías relacionadas" posts={guides} data-testid="m-landing-guides" />

        <LandingRelated landing={landing} />
      </main>
      <MobileFooter whatsappText={whatsappText} />
      <StickyCta href={formHref} heroId={LANDING_HERO_CTA_ID} formId={LANDING_FORM_ID} whatsappText={whatsappText} />
    </>
  );
}
