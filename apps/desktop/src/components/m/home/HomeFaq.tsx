import { Faq } from "../Faq";
import { MoreRow } from "../MoreRow";
import { Section } from "../Section";
import { HOME_FAQS } from "./home-data";

/**
 * «Dudas habituales» (DESIGN.md §7, `.faq`): `Faq` con `<details>` nativos,
 * sin JS. Debajo, la fila al blog, donde están las respuestas largas.
 */
export function HomeFaq() {
  return (
    <Section id="dudas" title="Dudas habituales" data-testid="m-home-faq">
      <Faq items={HOME_FAQS} itemTestId="m-home-faq-item" />
      <MoreRow href="/blog" label="Blog" data-testid="m-home-blog">
        Más respuestas en el blog
      </MoreRow>
    </Section>
  );
}
