import { CtaBlock } from "@/components/m/CtaBlock";
import { MobileFooter } from "@/components/m/MobileFooter";
import { MobileHeader } from "@/components/m/MobileHeader";
import { RatingBand } from "@/components/m/Rating";
import { ReviewItem } from "@/components/m/ReviewItem";
import { StickyCta } from "@/components/m/StickyCta";
import { testimonials } from "@/data/testimonials";
import { RESENAS_JSON_LD, RESENAS_METADATA } from "@/lib/resenas-seo";

/**
 * /resenas — las reseñas de Google en lista (móvil v2). Sin plaza 3D. Mismo
 * title, description, canonical y JSON-LD de página (`WebPage` +
 * `BreadcrumbList`) que el escritorio (`lib/resenas-seo.ts`).
 * SIN JSON-LD de reseñas (ni `aggregateRating` ni `Review`): prohibido por
 * CLAUDE.md. Las 22 citas, en español, visibles.
 */
export const metadata = RESENAS_METADATA;

const CTA_ID = "resenas-cta";

export default function MobileResenasPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(RESENAS_JSON_LD) }} />
      <MobileHeader />
      <main id="main-content">
        <section aria-labelledby="m-resenas-title">
          <div className="grid gap-[18px] border-b-2 border-ink px-4 pt-[26px] pb-7">
            <h1 id="m-resenas-title" className="font-display text-h1 uppercase">
              Reseñas de clientes en Vigo
            </h1>
            <p className="max-w-[34ch] text-lead">
              Lo que dicen de Action quienes ya trabajan con nosotros. Son reseñas de Google, con nombre.
            </p>
          </div>
          <RatingBand reviewLink />
        </section>

        <section aria-label="Reseñas de clientes">
          <ul data-testid="m-review-list" className="border-b-2 border-ink">
            {testimonials.map((t) => (
              <ReviewItem key={t.id} testimonial={t} />
            ))}
          </ul>
        </section>

        <CtaBlock
          id={CTA_ID}
          data-testid="m-resenas-cta"
          title="¿Tienes un proyecto en la cabeza?"
          sub="La primera reunión es gratis y sin compromiso. Te respondemos en 24 horas laborables."
        />
      </main>
      <MobileFooter />
      <StickyCta heroId={CTA_ID} />
    </>
  );
}
