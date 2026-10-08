import { whatsappHref } from "@/lib/leads/whatsapp";
import { Cell, Cells } from "../Cell";
import { CtaBlock } from "../CtaBlock";
import { Icon } from "../Icon";
import { RATING_SUMMARY, Stars } from "../Rating";
import { HOME_HERO_CTA_ID, HOME_WHATSAPP_TEXT, OFFICE_SHORT, PHONE_SHORT } from "./home-data";

/**
 * Primera pantalla de la home (DESIGN.md §7, «Hero de inicio»): el ÚNICO
 * `<h1>` de la página + entradilla → bloque lima «Contar mi proyecto» (lo
 * observa `StickyCta`) → fila negra de WhatsApp → celdas de prueba (reseñas,
 * oficina y presupuesto). Todo cabe en 390 × 844.
 */
export function HomeHero() {
  return (
    <section aria-labelledby="m-home-title" data-testid="m-home-hero">
      <div className="grid gap-[18px] px-4 py-[26px]">
        <h1 id="m-home-title" className="font-display text-hero uppercase">
          Apps, programas y webs para tu negocio
        </h1>
        <p className="max-w-[34ch] text-lead">
          Las diseñamos y programamos en nuestra oficina de Vigo. Antes de empezar, te damos un presupuesto cerrado y
          por escrito.
        </p>
      </div>

      <CtaBlock
        id={HOME_HERO_CTA_ID}
        data-testid="m-hero-cta"
        sub="La primera reunión es gratis y sin compromiso. Te respondemos en 24 horas laborables."
      />

      <a
        href={whatsappHref(HOME_WHATSAPP_TEXT)}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="m-hero-whatsapp"
        className="on-ink group flex min-h-[58px] items-center gap-3 bg-ink px-4 py-2 text-paper hover:bg-paper hover:text-ink active:bg-paper active:text-ink"
      >
        <Icon name="whatsapp" size={28} />
        <span className="min-w-0 font-display text-[19px] font-extrabold uppercase leading-[1.05] tracking-[0.05em]">
          Escribir por WhatsApp
        </span>
        <span className="ml-auto whitespace-nowrap font-display text-base font-bold tracking-[0.04em] text-muted-dark group-hover:text-muted group-active:text-muted">
          {PHONE_SHORT}
        </span>
      </a>

      <Cells>
        <Cell label="Reseñas" href="#resenas" full data-testid="m-hero-reviews">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <Stars />
            {RATING_SUMMARY}
          </span>
        </Cell>
        <Cell label="Oficina">{OFFICE_SHORT}</Cell>
        <Cell label="Presupuesto">Cerrado y por escrito</Cell>
      </Cells>
    </section>
  );
}
