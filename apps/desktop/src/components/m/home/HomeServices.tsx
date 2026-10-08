import { Icon } from "../Icon";
import { MLink } from "../MLink";
import { Section } from "../Section";
import { SERVICE_STYLE, Shape } from "../Shape";
import { UnderlineLink } from "../UnderlineLink";
import { HOME_SERVICES, HOME_STEPS } from "./home-data";

/**
 * «Qué hacemos» (DESIGN.md §4 y §7, `.svc`): cuatro filas a sangre con su
 * tono, forma (columna de 76 px), nombre + frase y flecha. Cada fila enlaza a
 * su landing SEO. Al pulsar se invierten: las claras a tinta, la de tinta a lima.
 */
export function HomeServices() {
  return (
    <Section
      id="servicios"
      title="Qué hacemos"
      lead="Si no sabes cuál es lo tuyo, cuéntanos el problema y te lo decimos."
      aside={
        <UnderlineLink href="/servicios" data-testid="m-home-services-all">
          Ver todos
        </UnderlineLink>
      }
      data-testid="m-home-services"
    >
      <ul className="grid gap-px border-b-2 border-ink bg-ink">
        {HOME_SERVICES.map(({ need, text, href }) => {
          const service = SERVICE_STYLE[need];
          const ink = need === "software";
          return (
            <li key={need} className="flex">
              <MLink
                href={href}
                data-testid="m-home-service"
                className={`grid min-h-[132px] w-full grid-cols-[76px_1fr_52px] ${service.tone} ${
                  ink
                    ? "on-ink hover:bg-lime hover:text-ink active:bg-lime active:text-ink"
                    : "hover:bg-ink hover:text-paper active:bg-ink active:text-paper"
                }`}
              >
                <span className={`flex justify-center border-r pt-5 ${ink ? "border-line-dark" : "border-current"}`}>
                  <Shape kind={service.shape} />
                </span>
                <span className="grid min-w-0 content-start gap-2 pt-[18px] pr-3.5 pb-[18px] pl-4">
                  <h3 className="font-display text-h4 uppercase">{service.name}</h3>
                  <span className="text-base leading-[1.4]">{text}</span>
                </span>
                <span className="flex items-end justify-center pb-[18px]">
                  <Icon name="arrow_outward" size={28} />
                </span>
              </MLink>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/** «Cómo trabajamos» (`.steps`, `<ol>`): 01-04 en una columna de 72 px; el 01, gratuito, en lima. */
export function HomeProcess() {
  return (
    <Section
      id="proceso"
      title="Cómo trabajamos"
      lead="Cuatro pasos. En cada uno sabes qué viene después."
      data-testid="m-home-process"
    >
      <ol className="border-b-2 border-ink">
        {HOME_STEPS.map((step, i) => (
          <li key={step.title} className="grid grid-cols-[72px_1fr] border-b border-ink last:border-b-0">
            <span
              className={`flex justify-center border-r border-ink pt-[18px] font-display text-[40px] font-black leading-[0.9] ${
                i === 0 ? "bg-lime" : ""
              }`}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="grid content-start gap-1.5 px-4 pt-[18px] pb-5">
              <h3 className="font-display text-h4 uppercase">{step.title}</h3>
              <p className="text-base leading-[1.42]">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
