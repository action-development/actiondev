/**
 * Fila de estrellas para la puntuación de una reseña (1-5). Puramente visual:
 * el `aria-label` con el valor real lo pone quien la use (ver ReviewCard.tsx),
 * así que aquí el SVG siempre va `aria-hidden`.
 */
export function StarRating({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={className} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          width="14"
          height="14"
          className={`inline-block ${i < rating ? "text-accent" : "text-muted"}`}
        >
          <path
            d="M10 1.5l2.53 5.12 5.65.82-4.09 3.99.97 5.63L10 14.25l-5.06 2.81.97-5.63L1.82 7.44l5.65-.82L10 1.5z"
            fill={i < rating ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1}
          />
        </svg>
      ))}
    </div>
  );
}
