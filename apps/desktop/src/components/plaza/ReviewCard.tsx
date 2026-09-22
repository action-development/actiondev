"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap-config";
import { useGSAP } from "@gsap/react";
import { EASING, DURATION } from "@/lib/animations";
import { testimonials, type Testimonial } from "@/data/testimonials";
import { useLocale, useT } from "@/lib/i18n";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { StarRating } from "@/components/ui/StarRating";

interface ReviewCardProps {
  /** id del testimonio seleccionado, o null si la ficha está cerrada. */
  selectedId: string | null;
  onClose: () => void;
}

function getTestimonial(id: string | null): Testimonial | undefined {
  if (!id) return undefined;
  return testimonials.find((t) => t.id === id);
}

/**
 * Ficha DOM de la reseña seleccionada en la plaza. La escena 3D solo avisa
 * qué id está seleccionado (o null); todo el contenido — texto, animación de
 * entrada/salida, foco — vive aquí, igual que la ficha de home en
 * Testimonials.tsx pero como overlay flotante en vez de scroll-driven.
 */
export function ReviewCard({ selectedId, onClose }: ReviewCardProps) {
  const t = useT();
  const { locale } = useLocale();
  const cardRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  const testimonial = getTestimonial(selectedId);
  // Última reseña mostrada: al cerrar, `testimonial` pasa a undefined en el
  // mismo render y la ficha se desvanecería ya vacía. Se sigue pintando el
  // contenido anterior hasta que termina el fade-out.
  // Estado derivado durante el render (patrón oficial de React para "valor
  // anterior"): un ref aquí rompería la regla de no leer refs en render.
  const [lastShown, setLastShown] = useState(testimonial);
  if (testimonial && testimonial !== lastShown) setLastShown(testimonial);
  const shown = testimonial ?? lastShown;
  const quote = shown ? (locale === "es" ? (shown.quoteEs ?? shown.quote) : shown.quote) : "";

  useGSAP(
    () => {
      const card = cardRef.current;
      if (!card) return;

      // `useGSAP` con `dependencies` no mata los tweens del render anterior al
      // reejecutarse (solo revierte al desmontar) — con clics rápidos entre
      // muñecos se acumulan tweens de abrir/cerrar en danza sobre la misma
      // tarjeta, y el último en terminar (no necesariamente el más reciente en
      // arrancar) decide el estado final: podía quedar "abierta" aunque
      // `selectedId` ya fuera null. Matar cualquier tween de la tarjeta antes
      // de lanzar el siguiente garantiza que el más reciente manda siempre.
      gsap.killTweensOf(card);

      if (testimonial) {
        // Guardar el foco previo para devolverlo al cerrar (accesibilidad).
        lastFocused.current = document.activeElement as HTMLElement | null;
        gsap.fromTo(
          card,
          { autoAlpha: 0, y: 24, scale: 0.97 },
          { autoAlpha: 1, y: 0, scale: 1, duration: DURATION.DEFAULT, ease: EASING.ENTER }
        );
        closeButtonRef.current?.focus();
      } else {
        gsap.to(card, { autoAlpha: 0, y: 16, scale: 0.98, duration: DURATION.FAST, ease: EASING.EXIT });
        lastFocused.current?.focus();
      }
    },
    { dependencies: [testimonial?.id ?? null] }
  );

  // Escape cierra la ficha — el listener global vive en PlazaPage.tsx; aquí
  // solo se gestiona el foco/trap básico del diálogo.
  useEffect(() => {
    if (!testimonial) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        // Ficha con un único elemento interactivo (cerrar) — el foco no debe
        // escaparse hacia el canvas de fondo.
        e.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [testimonial]);

  return (
    // El posicionamiento vive en un wrapper estático y GSAP anima solo la
    // ficha interior: GSAP debe ser el único dueño del transform (ERR-001), y
    // un `-translate-x-1/2` de Tailwind en el mismo nodo se pisaría con `y`.
    // Desktop: ficha a la derecha, centrada en vertical — la cámara encuadra
    // al personaje en el tercio izquierdo para que no quede tapado.
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 md:inset-y-0 md:left-auto md:right-12 md:flex md:items-center">
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={
          shown ? t.plaza.dialogAriaLabel.replace("{name}", shown.name) : undefined
        }
        aria-hidden={!testimonial}
        className="holo-surface holo-solid holo-corners holo-glass pointer-events-auto relative w-full p-8 md:w-[min(90vw,440px)]"
        style={{ visibility: "hidden" }}
      >
        {shown && (
          <>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label={t.plaza.closeAriaLabel}
              className="holo-btn holo-btn-icon absolute right-5 top-5"
            >
              <span aria-hidden>×</span>
            </button>

            <header className="mb-4 flex flex-col gap-1.5 pr-10">
              <span className="font-display text-lg font-semibold tracking-[-0.01em] text-foreground">
                {shown.name}
              </span>
              {/* "RESEÑA DE GOOGLE" es el project de relleno para clientes sin
                  negocio propio en la reseña — lo repetiría el badge de abajo,
                  así que solo se pinta cuando el dato aporta algo real. */}
              {shown.project !== "RESEÑA DE GOOGLE" && (
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  {shown.project}
                </span>
              )}
              <div className="flex items-center gap-2">
                <StarRating
                  rating={shown.rating}
                  className="flex items-center gap-0.5"
                />
                <span
                  role="img"
                  aria-label={t.plaza.ratingAriaLabel.replace("{rating}", String(shown.rating))}
                  className="sr-only"
                >
                  {t.plaza.ratingAriaLabel.replace("{rating}", String(shown.rating))}
                </span>
                <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                  <GoogleIcon className="h-3.5 w-3.5" />
                  {t.plaza.googleSource}
                </span>
              </div>
            </header>

            <p className="font-display max-w-[42ch] text-[1.1rem] leading-[1.5] tracking-[-0.01em] text-foreground">
              &ldquo;{quote}&rdquo;
            </p>
          </>
        )}
      </div>
    </div>
  );
}
