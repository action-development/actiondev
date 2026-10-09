import { getLandingsByGroup } from "@/data/landings";
import { CtaBlock } from "@/components/m/CtaBlock";
import { Icon } from "@/components/m/Icon";
import { MLink } from "@/components/m/MLink";
import { MobileFooter } from "@/components/m/MobileFooter";
import { MobileHeader } from "@/components/m/MobileHeader";
import { Section } from "@/components/m/Section";
import { LandingLinks } from "@/components/m/services/LandingLinks";
import { ServiceRows } from "@/components/m/services/ServiceRows";
import { StickyCta } from "@/components/m/StickyCta";
import { SERVICIOS_GROUPS, SERVICIOS_H1, SERVICIOS_JSON_LD, SERVICIOS_METADATA } from "@/lib/servicios-seo";

/**
 * /servicios — hub de las 10 landings SEO (móvil v2). Title, description,
 * canonical y JSON-LD (CollectionPage + BreadcrumbList) SALEN del mismo módulo
 * que el escritorio (`lib/servicios-seo.ts`). Todo el texto indexable de la
 * página de escritorio está aquí, visible.
 */
export const metadata = SERVICIOS_METADATA;

const CTA_ID = "servicios-cta";

export default function MobileServiciosPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SERVICIOS_JSON_LD) }} />
      <MobileHeader />
      <main id="main-content">
        <section aria-labelledby="m-servicios-title">
          <div className="grid gap-[18px] border-b-2 border-ink px-4 pt-[26px] pb-7">
            <h1 id="m-servicios-title" className="font-display text-h1-long uppercase">
              {SERVICIOS_H1}
            </h1>
            <p className="max-w-[34ch] text-lead">
              Somos Action Development, un estudio de desarrollo con oficina en la Rúa Colón, 20, en el centro de Vigo. Hacemos
              aplicaciones móviles, software a medida, páginas web y tiendas online, y lo hacemos con el mismo equipo
              de principio a fin: quien diseña y programa tu proyecto es quien lo mantiene después.
            </p>
          </div>
        </section>

        <Section id="que-hacemos" title="Qué hacemos" lead="Si no sabes cuál es lo tuyo, cuéntanos el problema y te lo decimos.">
          <ServiceRows />
        </Section>

        {SERVICIOS_GROUPS.map((group) => (
          <Section key={group.id} id={`grupo-${group.id}`} title={group.title} lead={group.text}>
            <LandingLinks landings={getLandingsByGroup(group.id)} groupId={group.id} />
            <ul className="grid gap-px border-b-2 border-ink bg-ink" data-testid={`m-servicios-guides-${group.id}`}>
              {group.guides.map((guide) => (
                <li key={guide.href} className="flex bg-grey">
                  <MLink
                    href={guide.href}
                    className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3.5 text-[17px] leading-[1.3] hover:bg-ink hover:text-paper active:bg-ink active:text-paper"
                  >
                    <span className="min-w-0">
                      <span className="font-display font-extrabold uppercase tracking-[0.02em]">Guía del blog · </span>
                      {guide.label}
                    </span>
                    <Icon name="arrow_outward" size={24} />
                  </MLink>
                </li>
              ))}
            </ul>
          </Section>
        ))}

        <Section id="antes-de-elegir" title="Antes de elegir">
          <div className="grid max-w-[40ch] gap-4 border-b-2 border-ink px-4 pt-5 pb-8 text-[17px] leading-[1.45]">
            <p>
              Esta página reúne todo lo que hacemos, ordenado de dos maneras. Si ya sabes qué necesitas — una app, un
              ERP, una web que venda o una tienda online —, empieza por el bloque de servicios: cada página explica
              cómo trabajamos ese tipo de proyecto, de qué depende el presupuesto y qué casos reales puedes visitar. Si
              lo que te importa es la cercanía, el bloque por zonas cuenta cómo trabajamos con empresas de la provincia
              de Pontevedra, de Redondela y del resto de Galicia, y con qué clientes de cada sitio.
            </p>
            <p>
              No publicamos tarifas cerradas, porque dos proyectos con el mismo nombre pueden no parecerse en nada. Sí
              te explicamos en cada servicio qué mueve el precio, para que llegues a la primera conversación sabiendo
              qué preguntar. Y en todas las páginas encontrarás clientes con nombre y apellidos — Autoescuela GTI,
              Musa, PBB, Samoa Café, La Fábrica, Canelita, París de Noia — y reseñas reales de Google, no promesas
              genéricas.
            </p>
            <p>
              Trabajamos en persona con empresas de Vigo y su área, y en remoto con el resto de Galicia y de España. Si
              no encuentras aquí lo que buscas, escríbenos igualmente: muchas veces el proyecto correcto es una
              combinación de dos de estos servicios, o algo más pequeño de lo que imaginabas.
            </p>
          </div>
        </Section>

        <CtaBlock
          id={CTA_ID}
          data-testid="m-servicios-cta"
          title="¿Hablamos de tu proyecto?"
          sub="La primera reunión es gratis y sin compromiso. Te respondemos en 24 horas laborables."
        />
      </main>
      <MobileFooter />
      <StickyCta heroId={CTA_ID} />
    </>
  );
}
