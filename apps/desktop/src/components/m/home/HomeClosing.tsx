import { landings } from "@/data/landings";
import { whatsappHref } from "@/lib/leads/whatsapp";
import { Button } from "../Button";
import { Icon } from "../Icon";
import { MLink } from "../MLink";
import { HOME_FINAL_CTA_ID, HOME_WHATSAPP_TEXT } from "./home-data";

/**
 * CTA final (DESIGN.md §7, `.cta-final`): bloque lima con la pregunta,
 * entradilla, «Contar mi proyecto» en tinta y WhatsApp de contorno. Con
 * él a la vista, la barra fija se esconde (`HOME_FINAL_CTA_ID`).
 */
export function HomeFinalCta() {
  return (
    <section
      id={HOME_FINAL_CTA_ID}
      aria-labelledby="cta-final-title"
      data-testid="m-home-final-cta"
      className="grid gap-[18px] border-b-2 border-ink bg-lime px-4 pt-10 pb-7 text-ink"
    >
      <h2 id="cta-final-title" className="font-display text-h1 uppercase">
        ¿Tienes un proyecto en la cabeza?
      </h2>
      <p className="max-w-[34ch] text-lead">
        Cuéntanos qué problema quieres resolver y para quién. Te respondemos en 24 horas laborables.
      </p>
      <div className="mt-1.5 grid gap-2.5">
        <Button href="/contact" variant="ink" data-testid="m-final-cta-form">
          Contar mi proyecto
        </Button>
        <Button href={whatsappHref(HOME_WHATSAPP_TEXT)} variant="line" icon="whatsapp" data-testid="m-final-cta-whatsapp">
          Escribir por WhatsApp
        </Button>
      </div>
    </section>
  );
}

/**
 * «Servicios por zona»: las 10 landings SEO de `landings.ts`, VISIBLES y con
 * su `serviceName` como ancla (el mismo texto con el que las enlazaba el nav
 * `sr-only` de la home anterior). Discreto, justo antes del pie: celdas a
 * sangre separadas por filetes, dos por fila. `MLink` → `<a>`: las landings
 * son del árbol de escritorio.
 */
export function HomeZones() {
  return (
    <section aria-labelledby="zonas-title" data-testid="m-home-zones">
      <div className="grid gap-2 border-b-2 border-ink px-4 pt-10 pb-4">
        <h2 id="zonas-title" className="font-display text-h3 uppercase">
          Servicios por zona
        </h2>
        <p className="max-w-[36ch] text-base leading-[1.45] text-muted">
          Desarrollo de aplicaciones y webs desde nuestra oficina de Vigo, para empresas de Pontevedra y de toda
          Galicia.
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-px bg-ink">
        {landings.map((landing) => (
          <li key={landing.slug} className="flex bg-paper">
            <MLink
              href={`/${landing.slug}`}
              data-testid="m-home-landing"
              className="flex min-h-[76px] w-full min-w-0 items-start justify-between gap-2 px-4 pt-3.5 pb-4 font-display text-base font-extrabold uppercase leading-[1.1] tracking-[0.02em] hover:bg-ink hover:text-paper active:bg-ink active:text-paper"
            >
              <span className="min-w-0 text-balance break-words">{landing.serviceName}</span>
              <Icon name="arrow_outward" size={18} className="mt-px" />
            </MLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
