"use client";

/**
 * Blinds — persiana de franjas horizontales en color de acento.
 *
 * Es SOLO la cortina: quién la cierra y cuándo la abre lo decide el padre
 * (`LoadingScreen` al arrancar, `PageTransition` al cambiar de ruta). Así el
 * mismo dibujo sirve para los dos momentos y el visitante lo lee como una única
 * pieza: la web "carga" tras la persiana y "cambia de pestaña" tras la persiana.
 *
 * Mecánica: cada lama es un `div` a pantalla completa de ancho que escala en Y.
 * Cerrar = 0 → 1 con origen arriba; abrir = 1 → 0 con origen abajo. La lama `i`
 * espera `i * STAGGER` para que el barrido vaya de arriba abajo en ambos
 * sentidos, como una persiana real. Solo se transiciona `transform`: el
 * `transform-origin` cambia de golpe en el mismo render, y como no está en
 * `transition-property` no se interpola (interpolarlo deformaría la lama).
 *
 * Sin GSAP a propósito: el estado lo renderiza React y GSAP pelearía con la
 * reconciliación (ver nota de `LoadingScreen`). Las transiciones CSS respetan
 * `prefers-reduced-motion` desde `globals.css` sin código extra; el padre debe
 * usar `blindsDuration()` para no esperar 900 ms a una animación de 0,01 ms.
 */

export const BLIND_COUNT = 10;
const STRIPE_MS = 480;
const STAGGER_MS = 45;
/** Hueco entre lamas: en reposo se leen como persiana, no como un bloque lima. */
const GAP_PX = 3;

/** Tiempo total de un barrido (última lama incluida). */
export const BLINDS_TOTAL_MS = STRIPE_MS + STAGGER_MS * (BLIND_COUNT - 1);

/** Duración real del barrido según la preferencia de movimiento del visitante. */
export function blindsDuration(): number {
  if (typeof window === "undefined") return BLINDS_TOTAL_MS;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : BLINDS_TOTAL_MS;
}

interface BlindsProps {
  /** `true` = lamas cubriendo la pantalla; `false` = recogidas. */
  closed: boolean;
  /** Cambiar de estado sin transición: la usa `PageTransition` cuando la
   * pantalla ya pinta la persiana cerrada (salida de /projects). */
  instant?: boolean;
  className?: string;
}

export function Blinds({ closed, instant = false, className = "" }: BlindsProps) {
  const h = 100 / BLIND_COUNT;
  return (
    <div aria-hidden className={`absolute inset-0 overflow-hidden ${className}`}>
      {Array.from({ length: BLIND_COUNT }, (_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 bg-accent will-change-transform"
          style={{
            top: `${i * h}%`,
            height: `calc(${h}% - ${GAP_PX}px)`,
            transform: `scaleY(${closed ? 1 : 0})`,
            transformOrigin: closed ? "top" : "bottom",
            // Propiedades sueltas, no el shorthand: React avisa si se mezcla
            // `transition` con `transitionDelay` entre renders.
            transitionProperty: "transform",
            transitionDuration: `${instant ? 0 : STRIPE_MS}ms`,
            transitionTimingFunction: "var(--ease)",
            transitionDelay: `${instant ? 0 : i * STAGGER_MS}ms`,
          }}
        />
      ))}
    </div>
  );
}
