import { Cell, Cells } from "../Cell";
import { CtaBlock } from "../CtaBlock";
import { OFFICE_SHORT } from "../nav";
import { RATING_SUMMARY, Stars } from "../Rating";
import { WhatsappRow } from "../WhatsappRow";
import { HOME_HERO_CTA_ID, HOME_WHATSAPP_TEXT } from "./home-data";

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
        {/* H1 con la keyword y la ciudad, como el title y el H1 de escritorio
            («Desarrollo de Aplicaciones y Webs en Vigo»): es el que indexa Google. */}
        <h1 id="m-home-title" className="font-display text-hero uppercase">
          Desarrollo de apps y webs en Vigo
        </h1>
        <p className="max-w-[34ch] text-lead">
          Apps, programas de gestión y webs a medida, diseñados y programados en nuestra oficina. Antes de empezar, te
          damos un presupuesto cerrado y por escrito.
        </p>
      </div>

      <CtaBlock
        id={HOME_HERO_CTA_ID}
        data-testid="m-hero-cta"
        sub="La primera reunión es gratis y sin compromiso. Te respondemos en 24 horas laborables."
      />

      <WhatsappRow text={HOME_WHATSAPP_TEXT} data-testid="m-hero-whatsapp" />

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
