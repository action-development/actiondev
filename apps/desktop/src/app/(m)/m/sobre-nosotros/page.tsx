import { AboutFacts, AboutFaqList, AboutNotDone, AboutStats } from "@/components/m/about/AboutParts";
import { Breadcrumbs } from "@/components/m/Breadcrumbs";
import { CtaBlock } from "@/components/m/CtaBlock";
import { LandingCase } from "@/components/m/LandingCase";
import { MobileFooter } from "@/components/m/MobileFooter";
import { MobileHeader } from "@/components/m/MobileHeader";
import { MoreRow } from "@/components/m/MoreRow";
import { Section } from "@/components/m/Section";
import { Steps } from "@/components/m/Steps";
import { StickyCta } from "@/components/m/StickyCta";
import {
  ABOUT_ALL_PROJECTS,
  ABOUT_CASES,
  ABOUT_CRUMB,
  ABOUT_CTA,
  ABOUT_H1,
  ABOUT_INTRO,
  ABOUT_JSON_LD,
  ABOUT_METADATA,
  ABOUT_STEPS,
} from "@/lib/about-seo";

/**
 * /sobre-nosotros en la web móvil v2: la página de la entidad (plan AEO,
 * §4.2). Title, description, canonical, Open Graph y JSON-LD (AboutPage →
 * `#organization`, FAQPage, migas) y TODO el texto salen de
 * `lib/about-seo.ts`, la misma fuente que escritorio (regla de oro de la v2).
 *
 * Orden: migas → H1 y entradilla → tres cifras (Google, proyectos, oficina) →
 * la ficha de datos → casos (`LandingCase`, misma tarjeta que las landings,
 * con las notas de esta página) → cómo trabaja (`Steps`, la primera reunión
 * en lima porque es gratis) → lo que no hace → preguntas, todas abiertas →
 * CTA lima. La barra fija se ve desde el principio y se esconde con el CTA
 * del final a la vista (como `/servicios`).
 *
 * Server component: el único JS es el del menú y la barra.
 */
export const metadata = ABOUT_METADATA;

const CTA_ID = "sobre-nosotros-cta";

export default function MobileSobreNosotrosPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_JSON_LD) }} />
      <MobileHeader />
      <main id="main-content">
        <section aria-labelledby="m-about-h1" data-testid="m-about-hero">
          <Breadcrumbs items={[{ href: "/", label: "Inicio" }]} current={ABOUT_CRUMB} data-testid="m-about-crumbs" />
          <div className="grid gap-4 px-4 pt-6 pb-7">
            <h1 id="m-about-h1" data-testid="m-about-h1" className="font-display text-h1-long uppercase">
              {ABOUT_H1}
            </h1>
            {ABOUT_INTRO.map((paragraph, i) => (
              <p key={paragraph.slice(0, 32)} className={i === 0 ? "text-[18px] leading-[1.45]" : "text-base leading-[1.45]"}>
                {paragraph}
              </p>
            ))}
          </div>
          <AboutStats />
        </section>

        <Section id="datos" title="Action Development en datos">
          <AboutFacts />
        </Section>

        <Section id="proyectos" title="Proyectos que lo explican">
          {ABOUT_CASES.map((item) => (
            <LandingCase key={item.slug} item={item} />
          ))}
          <MoreRow href={ABOUT_ALL_PROJECTS.href} label="Todos los proyectos" data-testid="m-about-all-projects">
            {ABOUT_ALL_PROJECTS.label}
          </MoreRow>
        </Section>

        <Section id="como-trabaja" title="Cómo trabaja">
          <Steps steps={ABOUT_STEPS} free={0} data-testid="m-about-steps" />
        </Section>

        <Section id="no-hace" title="Lo que no hace">
          <AboutNotDone />
        </Section>

        <Section id="preguntas" title="Preguntas sobre Action Development">
          <AboutFaqList />
        </Section>

        <CtaBlock id={CTA_ID} data-testid="m-about-cta" title={ABOUT_CTA.title} sub={ABOUT_CTA.text} />
      </main>
      <MobileFooter />
      <StickyCta heroId={CTA_ID} />
    </>
  );
}
