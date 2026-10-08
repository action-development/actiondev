import { Icon } from "../Icon";
import { Section } from "../Section";
import { HOME_FAQS } from "./home-data";
import { MoreRow } from "./parts";

/**
 * «Dudas habituales» (DESIGN.md §7, `.faq`): `<details>` nativos, sin JS. La
 * pregunta abierta pasa a tinta y el «+» a «−». La primera viene abierta, como
 * en la maqueta. Debajo, la fila al blog, donde están las respuestas largas.
 */
export function HomeFaq() {
  return (
    <Section id="dudas" title="Dudas habituales" data-testid="m-home-faq">
      <div className="border-b-2 border-ink">
        {HOME_FAQS.map((faq, i) => (
          <details
            key={faq.q}
            open={i === 0}
            data-testid="m-home-faq-item"
            className="group border-b border-ink last:border-b-0"
          >
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 py-3.5 pl-4 font-display text-[21px] font-extrabold uppercase leading-[1.05] group-open:bg-ink group-open:text-paper group-open:focus-visible:outline-lime active:bg-lime active:text-ink [&::-webkit-details-marker]:hidden">
              <span className="min-w-0">{faq.q}</span>
              <span className="-my-3.5 flex w-14 shrink-0 items-center justify-center self-stretch border-l border-ink group-open:border-line-dark">
                <Icon name="add" size={28} className="group-open:hidden" />
                <Icon name="remove" size={28} className="hidden group-open:block" />
              </span>
            </summary>
            <p className="max-w-[40ch] px-4 pt-4 pb-[22px] text-[17px]">{faq.a}</p>
          </details>
        ))}
      </div>
      <MoreRow href="/blog" label="Blog" data-testid="m-home-blog">
        Más respuestas en el blog
      </MoreRow>
    </Section>
  );
}
