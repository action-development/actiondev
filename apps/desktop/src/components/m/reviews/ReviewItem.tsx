import type { Testimonial } from "@/data/testimonials";
import { Icon } from "../Icon";
import { MLink } from "../MLink";
import { Stars } from "../Rating";
import { projectSlugOf, reviewLabel } from "./review-meta";

/**
 * Reseña (DESIGN.md §7 `.review`): estrellas, cita en español VISIBLE (Semi
 * Condensed 500, 20 px, 34ch), nombre y empresa. Sin avatar ni comillas
 * decorativas. Si `testimonials.ts` indica un proyecto, enlace a su ficha.
 */
export function ReviewItem({ testimonial: t }: { testimonial: Testimonial }) {
  const label = reviewLabel(t);
  const slug = projectSlugOf(t);
  return (
    <li>
      <figure
        data-testid="m-review"
        className="grid gap-3.5 border-b border-ink px-4 pt-6 pb-[22px]"
      >
        <Stars rating={t.rating} label={`${t.rating} de 5 estrellas`} />
        <blockquote className="max-w-[34ch] text-quote">{t.quoteEs ?? t.quote}</blockquote>
        <figcaption className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
          <span className="grid gap-1">
            <span className="font-display text-value uppercase">{t.name}</span>
            {label && <span className="font-display text-label uppercase text-muted">{label}</span>}
          </span>
          {slug && (
            <MLink
              href={`/projects/${slug}`}
              data-testid="m-review-project"
              className="inline-flex min-h-11 items-center gap-1.5 font-display text-[15px] font-extrabold uppercase tracking-[0.05em] underline decoration-2 underline-offset-4 hover:bg-lime active:bg-lime"
            >
              Ver el proyecto
              <Icon name="arrow_outward" size={18} />
            </MLink>
          )}
        </figcaption>
      </figure>
    </li>
  );
}
