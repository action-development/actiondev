import type { Landing } from "@/data/landings";
import { landingKeyFacts, type LandingKeyFact } from "@/lib/landing-seo";
import { Breadcrumbs } from "../Breadcrumbs";
import { Cell, Cells } from "../Cell";
import { CtaBlock } from "../CtaBlock";
import { Stars } from "../Rating";
import { WhatsappRow } from "../WhatsappRow";

/**
 * Primera pantalla de una landing SEO (DESIGN.md §7, «Hero de inicio» con el
 * H1 de landing a 42 px): migas (Inicio / Servicios, las del `BreadcrumbList`;
 * el último eslabón es el propio H1, justo debajo) → el ÚNICO `<h1>`
 * y el primer párrafo de la intro → bloque lima «Contar mi proyecto» que
 * baja al formulario de la página → fila de WhatsApp → celdas de prueba. A
 * 390 × 844 el CTA queda dentro de la primera pantalla.
 *
 * Las celdas son los «Datos clave» de escritorio (`landingKeyFacts`: Google,
 * oficina, proyectos, qué hacemos, tecnología, equipo y respuesta, los mismos
 * textos) más el presupuesto cerrado de la home.
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
  const facts = Object.fromEntries(landingKeyFacts(landing).map((f) => [f.id, f])) as Record<
    LandingKeyFact["id"],
    LandingKeyFact
  >;
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

      <section aria-label="Datos clave" data-testid="m-landing-key-facts">
        <Cells>
          <Cell label={facts.rating.label} href="#resenas" full data-testid="m-landing-rating">
            <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <Stars />
              {facts.rating.value}
            </span>
          </Cell>
          <Cell label={facts.office.label}>{facts.office.value}</Cell>
          <Cell label={facts.projects.label} href={facts.projects.href}>
            {facts.projects.value}
          </Cell>
          <Cell label={facts.service.label} full>
            {facts.service.value}
          </Cell>
          <Cell label={facts.tech.label}>{facts.tech.value}</Cell>
          <Cell label={facts.team.label}>{facts.team.value}</Cell>
          <Cell label={facts.response.label}>{facts.response.value}</Cell>
          <Cell label="Presupuesto">Cerrado y por escrito</Cell>
        </Cells>
      </section>
    </section>
  );
}
