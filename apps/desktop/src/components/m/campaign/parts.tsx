import type { ReactNode } from "react";
import type { AdsFaq, AdsStep } from "@/data/ads-landings";
import type { Testimonial } from "@/data/testimonials";
import { buttonClass } from "../Button";
import { Label } from "../Cell";
import { Icon } from "../Icon";
import { Stars } from "../Rating";

/**
 * Piezas de las landings de campaña móviles (`/hablemos/*`), calcadas de
 * `docs/mobile-v2/landing-app.html`. Server components sin estado: el único JS
 * de la página es el formulario y la barra fija.
 */

/** Enlace de texto subrayado en grueso (`.link-u` de la maqueta), 44 px de alto táctil. */
export const linkUnderlineClass =
  "inline-flex min-h-11 items-center gap-2 font-display text-[17px] font-extrabold uppercase leading-none tracking-[0.06em] underline decoration-[3px] underline-offset-[6px] active:bg-lime active:text-ink";

/** Cabecera de sección (`.sec-h`) con el H2 gigante y, si hace falta, su entradilla. Sin *eyebrow*. */
export function SectionTitle({ id, lead, children }: { id: string; lead?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-3 border-b-2 border-ink px-4 pt-12 pb-4">
      <h2 id={id} className="font-display text-h2 uppercase">
        {children}
      </h2>
      {lead && <p className="max-w-[34ch] text-lead">{lead}</p>}
    </div>
  );
}

/**
 * Lista de comprobación (`.checks` de la maqueta de proyectos): una fila por
 * punto, con el check de marca. Para los `bullets` de la oferta: no son una
 * secuencia, así que no se numeran.
 */
export function Checklist({ items, "data-testid": testId }: { items: readonly string[]; "data-testid"?: string }) {
  return (
    <ul data-testid={testId} className="border-b-2 border-ink">
      {items.map((item) => (
        <li
          key={item}
          className="grid grid-cols-[28px_1fr] items-start gap-3 border-b border-ink px-4 py-3.5 text-[17px] leading-[1.4] last:border-b-0"
        >
          <Icon name="check" size={26} className="-mt-px" />
          <span className="max-w-[36ch]">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Reseña literal (`.review`): estrellas, cita sin comillas decorativas, nombre y procedencia. */
export function ReviewQuote({ testimonial, last = false }: { testimonial: Testimonial; last?: boolean }) {
  return (
    <figure className={`grid gap-3.5 px-4 pt-6 pb-[22px] ${last ? "border-b-2" : "border-b"} border-ink`}>
      <Stars rating={testimonial.rating} label={`${testimonial.rating} de 5 estrellas`} />
      <blockquote className="max-w-[34ch] text-quote">
        <p>{testimonial.quoteEs ?? testimonial.quote}</p>
      </blockquote>
      <figcaption className="flex items-end justify-between gap-3">
        <span className="font-display text-value uppercase">{testimonial.name}</span>
        <Label>{testimonial.project}</Label>
      </figcaption>
    </figure>
  );
}

/**
 * Pasos del proceso (`.steps`, `<ol>`): número 01-04 en una columna de 72 px.
 * El de la primera reunión va en lima porque es el gratuito: el 01 en las
 * landings (`free`, índice desde 0).
 */
export function ProcessSteps({
  steps,
  free = 0,
  "data-testid": testId,
}: {
  steps: readonly AdsStep[];
  free?: number;
  "data-testid"?: string;
}) {
  return (
    <ol data-testid={testId} className="border-b-2 border-ink">
      {steps.map((step, i) => (
        <li key={step.title} className="grid grid-cols-[72px_1fr] border-b border-ink last:border-b-0">
          <span
            aria-hidden="true"
            className={`flex justify-center border-r border-ink pt-[18px] font-display text-[40px] font-black leading-[0.9] ${i === free ? "bg-lime" : ""}`}
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
  );
}

/**
 * Preguntas (`.faq`): `<details>` nativo, sin JS. Abierta = cabecera en tinta
 * y «−». La primera llega abierta, como en la maqueta.
 */
export function FaqList({ faqs }: { faqs: readonly AdsFaq[] }) {
  return (
    <div className="border-b-2 border-ink">
      {faqs.map((faq, i) => (
        <details key={faq.q} open={i === 0} className="group border-b border-ink last:border-b-0">
          <summary className="flex min-h-16 cursor-pointer list-none items-stretch justify-between gap-3 pl-4 font-display text-[21px] font-extrabold uppercase leading-[1.05] group-open:bg-ink group-open:text-paper active:bg-lime active:text-ink [&::-webkit-details-marker]:hidden">
            <span className="self-center py-3.5">{faq.q}</span>
            <span
              aria-hidden="true"
              className="flex w-14 flex-none items-center justify-center border-l border-ink group-open:border-line-dark"
            >
              <Icon name="add" size={28} className="group-open:hidden" />
              <Icon name="remove" size={28} className="hidden group-open:block" />
            </span>
          </summary>
          <p className="max-w-[40ch] px-4 pt-4 pb-[22px] text-[17px]">{faq.a}</p>
        </details>
      ))}
    </div>
  );
}

/**
 * CTA final (`.cta-final`): bloque lima con la pregunta, la entradilla y dos
 * salidas — el formulario (tinta) y WhatsApp (contorno).
 */
export function CtaFinal({
  id,
  title,
  text,
  formHref,
  whatsappHref,
}: {
  id: string;
  title: string;
  text: string;
  formHref: string;
  whatsappHref: string;
}) {
  return (
    <section aria-labelledby={id} className="grid gap-[18px] border-b-2 border-ink bg-lime px-4 pt-10 pb-7 text-ink">
      <h2 id={id} className="font-display text-h1 uppercase">
        {title}
      </h2>
      <p className="max-w-[34ch] text-lead">{text}</p>
      <div className="mt-1.5 grid gap-2.5">
        <a href={formHref} data-testid="m-ads-closing-cta" className={`${buttonClass("ink")} on-ink`}>
          <span>Contar mi proyecto</span>
          <Icon name="arrow_outward" size={26} />
        </a>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="m-ads-closing-whatsapp"
          className={buttonClass("line")}
        >
          <span>Escribir por WhatsApp</span>
          <Icon name="whatsapp" size={26} />
        </a>
      </div>
    </section>
  );
}
