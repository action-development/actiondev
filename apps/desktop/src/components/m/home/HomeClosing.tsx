import { landings } from "@/data/landings";
import { FinalCta } from "../FinalCta";
import { Icon } from "../Icon";
import { MLink } from "../MLink";
import { HOME_FINAL_CTA_ID, HOME_WHATSAPP_TEXT } from "./home-data";

/**
 * CTA final de la home (`FinalCta`): la pregunta, la entradilla y los dos
 * botones. Con él a la vista, la barra fija se esconde (`HOME_FINAL_CTA_ID`).
 */
export function HomeFinalCta() {
  return (
    <FinalCta
      id={HOME_FINAL_CTA_ID}
      title="¿Tienes un proyecto en la cabeza?"
      text="Cuéntanos qué problema quieres resolver y para quién. Te respondemos en 24 horas laborables."
      whatsappText={HOME_WHATSAPP_TEXT}
      data-testid="m-home-final-cta"
    />
  );
}

/**
 * «Servicios por zona»: las 10 landings SEO de `landings.ts`, VISIBLES y con
 * su `serviceName` como ancla (el mismo texto con el que las enlazaba el nav
 * `sr-only` de la home anterior). Discreto, justo antes del pie: celdas a
 * sangre separadas por filetes, dos por fila. `MLink` elige: `<Link>` si la
 * landing tiene árbol móvil publicado, `<a>` si aún la sirve el escritorio.
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
