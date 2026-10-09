import { BUSINESS, GOOGLE_RATING } from "@actiondev/shared";
import { reviewSummary } from "@/lib/ads-landing";
import { Icon } from "./Icon";
import { UnderlineLink } from "./UnderlineLink";

/**
 * Valoración de Google en la web móvil v2 (DESIGN.md §7, `.stars`, `.rating`
 * y celda «Reseñas» del hero). Una sola pieza para la home, `/resenas` y las
 * landings de campaña. Las cifras son las de escritorio (`reviewSummary()` de
 * `lib/ads-landing.ts`), que las lee de `GOOGLE_RATING`: nunca se escriben a
 * mano.
 */

const summary = reviewSummary();

/** «5,0»: media con coma decimal. */
export const REVIEW_AVERAGE = summary.rating;
/** Nº de reseñas de la ficha de Google (23). */
export const REVIEW_COUNT = summary.count;
/** ¿Todas de 5 estrellas? Solo si la media de la ficha es un 5 exacto. */
export const ALL_FIVE_STARS = GOOGLE_RATING.value === 5;
/** «5,0 en Google · 23 reseñas»: la línea de prueba del hero (home y campaña). */
export const RATING_SUMMARY = `${REVIEW_AVERAGE} en Google · ${REVIEW_COUNT} reseñas`;

/**
 * Estrellas (`.stars`, 18 px por defecto; 22 en la banda). Con `label`, el
 * conjunto se anuncia («5 de 5 estrellas»); sin él, es decorativo porque el
 * texto de al lado ya lo dice.
 */
export function Stars({
  rating = 5,
  size = 18,
  label,
  className,
}: {
  rating?: number;
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 gap-0.5${className ? ` ${className}` : ""}`}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {Array.from({ length: rating }, (_, i) => (
        <Icon key={i} name="star" size={size} />
      ))}
    </span>
  );
}

/**
 * Banda de valoración (`.rating`, el elemento firma): tinta, «5,0» a 132 px,
 * estrellas, «23 reseñas en Google», «Todas de 5 estrellas» y «Leerlas en
 * Google» a la ficha real (`mapsUrl`). `titleId` convierte el rótulo en el
 * `<h2>` de la sección (home); `reviewLink` añade «Deja tu reseña»
 * (`reviewUrl`, en `/resenas`).
 */
export function RatingBand({ titleId, reviewLink = false }: { titleId?: string; reviewLink?: boolean }) {
  const Title = titleId ? "h2" : "p";
  return (
    <div
      data-testid="m-rating-band"
      className="on-ink grid grid-cols-[auto_1fr] items-end gap-x-4 border-b-2 border-ink bg-ink px-4 pt-7 pb-6 text-paper"
    >
      <span className="font-display text-[132px] font-black leading-[0.76] tracking-[-0.03em]">{REVIEW_AVERAGE}</span>
      <div className="grid gap-2.5 pb-1">
        <Stars size={22} label={`${REVIEW_AVERAGE} de 5 estrellas`} />
        <Title id={titleId} className="font-display text-h4 uppercase">
          {REVIEW_COUNT} reseñas en Google
        </Title>
      </div>
      <div className="col-span-full mt-[22px] flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line-dark pt-2">
        {ALL_FIVE_STARS && <p className="text-sm leading-[1.4] text-muted-dark">Todas de 5 estrellas</p>}
        <UnderlineLink href={BUSINESS.mapsUrl} data-testid="m-google-profile">
          Leerlas en Google
        </UnderlineLink>
        {reviewLink && (
          <UnderlineLink href={BUSINESS.reviewUrl} data-testid="m-google-review">
            Deja tu reseña
          </UnderlineLink>
        )}
      </div>
    </div>
  );
}
