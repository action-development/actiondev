import type { Landing } from "@/data/landings";
import { Breadcrumbs } from "../Breadcrumbs";
import { Cell, Cells } from "../Cell";
import { CtaBlock } from "../CtaBlock";
import { OFFICE_SHORT } from "../nav";
import { RATING_SUMMARY, Stars } from "../Rating";
import { WhatsappRow } from "../WhatsappRow";

/**
 * Primera pantalla de una landing SEO (DESIGN.md §7, «Hero de inicio» con el
 * H1 de landing a 42 px): migas (Inicio / Servicios, las del `BreadcrumbList`;
 * el último eslabón es el propio H1, justo debajo) → el ÚNICO `<h1>`
 * y el primer párrafo de la intro → bloque lima «Contar mi proyecto» que
 * baja al formulario de la página → fila de WhatsApp → celdas de prueba. A
 * 390 × 844 el CTA queda dentro de la primera pantalla.
 *
 * Las celdas recogen la franja de confianza de escritorio (reseñas, «Equipo
 * senior · Sin subcontratas», respuesta en 24 horas) más la oficina y el
 * presupuesto cerrado de la home.
 */
export function LandingHero({
  landing,
  ctaId,
  formId,
  whatsappText,
}: {
  landing: Landing;
  ctaId: string;
  formId: string;
  whatsappText: string;
}) {
  const [lead] = landing.intro;
  return (
    <section id="hero" aria-labelledby="m-landing-h1" data-testid="m-landing-hero">
      <Breadcrumbs
        items={[
          { href: "/", label: "Inicio" },
          { href: "/servicios", label: "Servicios" },
        ]}
        data-testid="m-landing-crumbs"
      />
      <div className="grid gap-4 px-4 pt-6 pb-7">
        <h1 id="m-landing-h1" data-testid="m-landing-h1" className="font-display text-h1-long uppercase">
          {landing.h1}
        </h1>
        {lead && <p className="text-[18px] leading-[1.45]">{lead}</p>}
      </div>

      <CtaBlock
        id={ctaId}
        href={`#${formId}`}
        data-testid="m-landing-cta"
        sub="La primera reunión es gratis y sin compromiso. Te respondemos en 24 horas laborables."
      />
      <WhatsappRow text={whatsappText} data-testid="m-landing-whatsapp" />

      <Cells>
        <Cell label="Reseñas" href="#resenas" full data-testid="m-landing-rating">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <Stars />
            {RATING_SUMMARY}
          </span>
        </Cell>
        <Cell label="Oficina">{OFFICE_SHORT}</Cell>
        <Cell label="Equipo">Senior · Sin subcontratas</Cell>
        <Cell label="Presupuesto">Cerrado y por escrito</Cell>
        <Cell label="Respuesta">En 24 horas laborables</Cell>
      </Cells>
    </section>
  );
}
