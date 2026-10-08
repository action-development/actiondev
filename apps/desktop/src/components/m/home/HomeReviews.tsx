import { Label } from "../Cell";
import { REVIEW_COUNT, RatingBand, Stars } from "../Rating";
import { HOME_REVIEWS } from "./home-data";
import { MoreRow } from "./parts";

/**
 * Reseñas (DESIGN.md §7, `.rating` + `.review`): la banda de tinta con
 * «5,0» a 132 px —el elemento firma— y tres reseñas reales de
 * `testimonials.ts`, literales, con nombre y empresa. Cierra con la fila a
 * `/resenas`, que tiene las 22.
 */
export function HomeReviews() {
  return (
    <section id="resenas" aria-labelledby="resenas-title" data-testid="m-home-reviews">
      <RatingBand titleId="resenas-title" />

      <ul>
        {HOME_REVIEWS.map((t) => (
          <li key={t.id} className="border-b border-ink last:border-b-2">
            <figure data-testid="m-home-review" className="grid gap-3.5 px-4 pt-6 pb-[22px]">
              <Stars rating={t.rating} label={`${t.rating} de 5 estrellas`} />
              <blockquote className="max-w-[34ch] text-quote">{t.quoteEs ?? t.quote}</blockquote>
              <figcaption className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
                <span className="font-display text-value uppercase">{t.name}</span>
                <Label>{t.project}</Label>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <MoreRow href="/resenas" label="Reseñas" data-testid="m-home-reviews-all">
        Leer las {REVIEW_COUNT} reseñas
      </MoreRow>
    </section>
  );
}
