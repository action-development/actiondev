import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LEAD_NEEDS_CAMPAIGN } from "@actiondev/shared";
import { ADS_OFFER_LINE } from "@/components/leads/copy";
import { CampaignLeadForm } from "@/components/m/campaign/CampaignLeadForm";
import { CaseCard } from "@/components/m/campaign/CaseCard";
import { Checklist, CtaFinal, FaqList, ProcessSteps, ReviewQuote, SectionTitle } from "@/components/m/campaign/parts";
import { MobileFooter } from "@/components/m/MobileFooter";
import { MobileHeader } from "@/components/m/MobileHeader";
import { RATING_SUMMARY, RatingBand, Stars } from "@/components/m/Rating";
import { StickyCta } from "@/components/m/StickyCta";
import { adsLandings, getAdsLanding } from "@/data/ads-landings";
import { testimonials } from "@/data/testimonials";
import { adsLandingMetadata, resolveAdsLandingContent } from "@/lib/ads-landing";
import { whatsappHref } from "@/lib/leads/whatsapp";

/**
 * Landings de campaña en la web móvil v2 (`/hablemos/app`, `/hablemos/software`):
 * destino de Google Ads y Meta Ads. Maqueta `docs/mobile-v2/landing-app.html`;
 * datos, metadatos (`noindex, follow` + canonical propio) y contenido resuelto
 * los MISMOS que escritorio (`data/ads-landings.ts` + `lib/ads-landing.ts`).
 *
 * Página de campaña = sin fugas: cabecera sin menú y con el logo SIN enlace
 * (el criterio de `CampaignBar`), pie mínimo con la titularidad legal y una
 * sola salida, el formulario. WhatsApp SIEMPRE con el mensaje de la oferta y
 * ningún `tel:` (el número solo atiende WhatsApp). Casos en pestaña nueva.
 *
 * Server component: el único JS propio es el formulario y la barra fija.
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
  return landing ? adsLandingMetadata(landing) : {};
}

/** Id del formulario: ancla de «Contar mi proyecto» y de la barra fija. */
const FORM_ID = "proyecto";
const HERO_ID = "hero";

/** Titular del proceso de la maqueta («Cuatro pasos»), con el número real de pasos. */
const STEP_COUNT: Record<number, string> = { 3: "Tres pasos", 4: "Cuatro pasos", 5: "Cinco pasos" };

export default async function MobileAdsLandingPage({ params }: PageProps) {
  const { oferta } = await params;
  const landing = getAdsLanding(oferta);
  if (!landing) notFound();

  const { cases, quotes } = resolveAdsLandingContent(landing);
  // La reseña del hero abre «Lo que dicen en Google», entera; `quotes` ya la excluye, así que no se repite.
  const hero = testimonials.find((x) => x.id === landing.heroReview.id);
  const reviews = hero ? [hero, ...quotes] : quotes;
  const wa = whatsappHref(landing.whatsappText);

  return (
    <>
      <MobileHeader menu={false} logoHref={null} whatsappText={landing.whatsappText} />
      <main id="main-content">
        {/*
          Hero corto a propósito: H1 (el mismo del anuncio), la valoración y la
          oferta de los anuncios («Primera reunión gratis», «Oficina en Vigo»).
          Lo que vende cabe en la primera pantalla real de Safari con el banner
          de cookies abierto; a pantalla completa (390×844), también el paso 1
          entero. La reseña del hero no va aquí: abre «Lo que dicen en Google»,
          entera. La entradilla (`subtitle`) abre «Cómo lo hacemos», justo
          debajo del formulario.
        */}
        <section id={HERO_ID} aria-labelledby="m-ads-h1" className="grid gap-2 border-b-2 border-ink px-4 pt-4 pb-3.5">
          <h1
            id="m-ads-h1"
            data-testid="m-ads-h1"
            className="font-display text-[clamp(28px,8.2vw,32px)] font-black uppercase leading-[0.9] tracking-[-0.01em]"
          >
            {landing.h1}
          </h1>
          <p
            data-testid="m-ads-rating"
            className="flex items-center gap-2 font-display text-[15px] font-extrabold uppercase leading-[1.2] tracking-[0.04em]"
          >
            <Stars size={15} />
            {RATING_SUMMARY}
          </p>
          <p data-testid="m-ads-offer" className="text-[15px] font-semibold leading-[1.35]">
            {ADS_OFFER_LINE}
          </p>
        </section>

        <CampaignLeadForm
          id={FORM_ID}
          defaultNeed={landing.defaultNeed}
          needs={LEAD_NEEDS_CAMPAIGN}
          source="ads_landing"
          offer={landing.slug}
          whatsappText={landing.whatsappText}
        />

        <section aria-labelledby="m-ads-como" className="border-t-2 border-ink">
          <SectionTitle id="m-ads-como" lead={landing.subtitle}>
            Cómo lo hacemos
          </SectionTitle>
          <Checklist items={landing.bullets} data-testid="m-ads-bullets" />
        </section>

        {cases.length > 0 && (
          <section aria-labelledby="m-ads-casos">
            <SectionTitle id="m-ads-casos">{landing.casesTitle}</SectionTitle>
            {cases.map(({ slug, note, project }) => (
              <CaseCard
                key={slug}
                project={project}
                before={project.beforeEs}
                after={project.afterEs ?? note}
                data-testid={`m-ads-case-${slug}`}
              />
            ))}
          </section>
        )}

        <section aria-labelledby="m-ads-resenas">
          <h2 id="m-ads-resenas" className="sr-only">
            Lo que dicen en Google
          </h2>
          <RatingBand />
          {reviews.map((t, i) => (
            <ReviewQuote key={t.id} testimonial={t} last={i === reviews.length - 1} />
          ))}
        </section>

        <section aria-labelledby="m-ads-proceso">
          <SectionTitle id="m-ads-proceso">{STEP_COUNT[landing.steps.length] ?? "Cómo trabajamos"}</SectionTitle>
          <ProcessSteps steps={landing.steps} />
        </section>

        <section aria-labelledby="m-ads-dudas">
          <SectionTitle id="m-ads-dudas">Dudas habituales</SectionTitle>
          <FaqList faqs={landing.faqs} />
        </section>

        <CtaFinal id="m-ads-cierre" title={landing.cta.title} text={landing.cta.text} formHref={`#${FORM_ID}`} whatsappHref={wa} />
      </main>
      <MobileFooter variant="minimal" whatsappText={landing.whatsappText} />
      <StickyCta href={`#${FORM_ID}`} heroId={HERO_ID} formId={FORM_ID} whatsappText={landing.whatsappText} />
    </>
  );
}
