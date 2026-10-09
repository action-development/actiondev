import { ABOUT_FACTS, ABOUT_FAQS, ABOUT_NOT_DONE, ABOUT_STATS, type Segment } from "@/lib/about-seo";
import { Cell, Cells, Label } from "../Cell";
import { Icon } from "../Icon";
import { MLink } from "../MLink";
import { Stars } from "../Rating";

/**
 * Piezas de `/sobre-nosotros` en la web móvil v2. El texto es el de
 * `lib/about-seo.ts`, el MISMO que pinta escritorio: aquí solo cambia la piel
 * (DESIGN.md: celdas a sangre, filetes de tinta, Condensed en caja alta para
 * rótulos y Semi Condensed para leer).
 */

/** Enlace dentro de un texto: subrayado grueso, inversión seca al pulsar. */
const INLINE_LINK =
  "font-semibold underline decoration-2 underline-offset-4 hover:bg-ink hover:text-paper active:bg-lime active:text-ink";

export function AboutSegments({ segments }: { segments: readonly Segment[] }) {
  return segments.map((segment, i) =>
    typeof segment === "string" ? (
      segment
    ) : (
      <MLink key={`${segment.href}-${i}`} href={segment.href} className={INLINE_LINK}>
        {segment.text}
      </MLink>
    ),
  );
}

/**
 * Tres cifras comprobables bajo el H1: la valoración (a la ficha de Google)
 * a lo ancho, y debajo los proyectos y la oficina. Cada celda es el enlace.
 */
export function AboutStats() {
  const [rating, work, office] = ABOUT_STATS;
  return (
    <Cells className="border-t-2 border-t-ink">
      <Cell label={rating.label} href={rating.href} full data-testid="m-about-rating">
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <Stars />
          {rating.value}
        </span>
      </Cell>
      <Cell label={work.label} href={work.href} data-testid="m-about-projects">
        {work.value}
      </Cell>
      <Cell label={office.label} href={office.href}>
        {office.value}
      </Cell>
    </Cells>
  );
}

/**
 * «Action Development en datos»: `<dl>` de verdad (copiable, legible por
 * lectores de pantalla y por máquinas) en filas etiqueta/valor, con el valor
 * en texto normal: son datos para cotejar, no rótulos.
 */
export function AboutFacts() {
  return (
    <dl data-testid="m-about-facts" className="grid gap-px border-b-2 border-ink bg-ink">
      {ABOUT_FACTS.map((fact) => (
        <div key={fact.label} className="grid gap-1.5 bg-paper px-4 pt-3.5 pb-4">
          <dt>
            <Label>{fact.label}</Label>
          </dt>
          <dd className="text-[17px] leading-[1.42] break-words">
            <AboutSegments segments={fact.value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** «Lo que no hace»: filas con un aspa en su columna, sin numerar (no es una secuencia). */
export function AboutNotDone() {
  return (
    <ul className="border-b-2 border-ink" data-testid="m-about-not-done">
      {ABOUT_NOT_DONE.map((item) => (
        <li key={item} className="grid grid-cols-[56px_1fr] border-b border-ink last:border-b-0">
          <span className="flex justify-center border-r border-ink pt-4">
            <Icon name="close" size={24} />
          </span>
          <span className="px-4 pt-4 pb-[18px] text-[17px] leading-[1.4]">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Preguntas de marca, TODAS abiertas: a diferencia de `Faq` (acordeón de la
 * home y las landings), aquí cada respuesta es la frase que deben poder citar
 * los motores, así que no se pliega ninguna.
 */
export function AboutFaqList() {
  return (
    <div className="border-b-2 border-ink" data-testid="m-about-faq">
      {ABOUT_FAQS.map((faq) => (
        <div key={faq.q} className="grid gap-2.5 border-b border-ink px-4 pt-5 pb-6 last:border-b-0">
          <h3 className="font-display text-[21px] font-extrabold uppercase leading-[1.05]">{faq.q}</h3>
          <p className="max-w-[40ch] text-[17px] leading-[1.45]">
            <AboutSegments segments={faq.a} />
          </p>
        </div>
      ))}
    </div>
  );
}
