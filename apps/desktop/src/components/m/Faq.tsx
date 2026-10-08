import type { ReactNode } from "react";
import { Icon } from "./Icon";

export interface FaqItem {
  q: string;
  /** Respuesta: texto o nodos (el blog pinta negritas y enlaces internos). */
  a: ReactNode;
}

/**
 * Preguntas frecuentes (DESIGN.md §7, `.faq`): `<details>` nativos, sin JS. La
 * abierta pasa a tinta y el «+» a «−»; la primera llega abierta, como en la
 * maqueta. La usan la home, las landings SEO y los artículos del blog.
 *
 * `questionAs="h3"`: la pregunta va en un `<h3>` dentro del `<summary>` (así la
 * pinta el artículo de escritorio, bajo el `<h2>` «Preguntas frecuentes»).
 */
export function Faq({
  items,
  itemTestId,
  questionAs = "span",
  "data-testid": testId,
}: {
  items: readonly FaqItem[];
  itemTestId?: string;
  questionAs?: "span" | "h3";
  "data-testid"?: string;
}) {
  const Question = questionAs;
  return (
    <div className="border-b-2 border-ink" data-testid={testId}>
      {items.map((faq, i) => (
        <details key={faq.q} open={i === 0} data-testid={itemTestId} className="group border-b border-ink last:border-b-0">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 py-3.5 pl-4 font-display text-[21px] font-extrabold uppercase leading-[1.05] group-open:bg-ink group-open:text-paper group-open:focus-visible:outline-lime active:bg-lime active:text-ink [&::-webkit-details-marker]:hidden">
            <Question className="min-w-0">{faq.q}</Question>
            <span className="-my-3.5 flex w-14 shrink-0 items-center justify-center self-stretch border-l border-ink group-open:border-line-dark">
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
