"use client";

import { useEffect, useState } from "react";
import type { PlazaMode } from "@/components/canvas/plaza/plaza-mode";
import { testimonials } from "@/data/testimonials";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { HoloButton } from "@/components/ui/HoloButton";
import { PlazaHint } from "./PlazaHint";
import { BUSINESS } from "@/lib/seo";
import { useLocale, useT } from "@/lib/i18n";

interface PlazaHudProps {
  /** Día o noche: de día el cielo es claro y el texto blanco del sitio no se
   * lee, así que el chrome se invierte a tinta oscura. */
  mode: PlazaMode;
  /** Nº de reseñas de la ficha de Google (`GOOGLE_RATING`), el mismo que en el resto del sitio. */
  count: number;
  /** Oculta el CTA de abajo cuando ya hay una ficha abierta (lo taparía: en
   * móvil la ficha es una hoja inferior y en desktop sube por la derecha). */
  ctaVisible: boolean;
  /** Pista de click de abajo. Quien decide es la página: se retira para
   * siempre al abrir la primera ficha (ya sabe jugar) y también mientras se
   * lleva un muñeco en la mano. NO hay leyenda de controles de arrastre — se
   * retiró por decisión del cliente y no vuelve. */
  hintVisible: boolean;
}

/**
 * Chrome DOM de /resenas: pista de click (`PlazaHint`, abajo al centro) +
 * "Ver lista" (mismo patrón que la recreativa de /projects: todas las reseñas
 * en texto, en el HTML del servidor aunque el panel esté cerrado con `hidden`)
 * + enlace a la ficha de Google (el titular ya no se pinta — decisión del
 * cliente, no reponerlo; el h1 sigue en el DOM para SEO y lectores de pantalla
 * porque es el único de la página). La navegación (incl.
 * volver al inicio) la lleva el Header global de PlazaPage. Sobre el fondo
 * oscuro del sitio: tokens semánticos de globals.css.
 */
export function PlazaHud({ mode, ctaVisible, hintVisible }: PlazaHudProps) {
  const t = useT();
  const { locale } = useLocale();
  const [listOpen, setListOpen] = useState(false);
  // Con una ficha abierta la lista se retira (la taparía, igual que al CTA).
  const listShown = listOpen && ctaVisible;
  const day = mode === "dia";

  // Escape cierra la lista, como cualquier desplegable (el de PlazaPage ya
  // cierra la ficha; los dos a la vez no chocan).
  useEffect(() => {
    if (!listOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setListOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [listOpen]);
  // Tinta del chrome. De noche, los tokens del sitio; de día, gris muy oscuro
  // sobre el cielo claro (no negro puro: encima de un fondo pastel canta).
  const ctaChrome = day
    ? "border-[#1b2430]/25 bg-white/70 text-[#1b2430] hover:border-[#1b2430]/60"
    : "border-border bg-card/70 text-muted hover:border-accent hover:text-accent";

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-end px-6 pb-6 pt-24 md:px-10 md:pb-10">
      {/* El titular se retiró de la vista: la plaza se presenta sola. El h1
          sigue aquí, solo para tecnologías de asistencia y buscadores —es el
          único encabezado de la página—, nunca visible. */}
      <h1 className="sr-only">{t.plaza.title}</h1>

      {/* Pista de click: mismo cartel y misma altura que el tutorial del hero
          (`TutorialOverlay`), bajo la cápsula del Header. Va en absoluto para
          no empujar nada del flujo del HUD. */}
      <div className="absolute inset-x-0 top-[max(12vh,104px)] flex justify-center">
        <PlazaHint visible={hintVisible} label={t.plaza.hint} />
      </div>

      <section className="flex flex-col items-end gap-3" aria-label={t.plaza.title}>
        {/* Lista de reseñas: el camino para quien no quiera jugar y el texto
            rastreable de todas las reseñas. Cerrada va con `hidden` (contenido
            plegado: fuera de la vista y del árbol accesible, pero en el HTML). */}
        <div
          id="plaza-list"
          data-testid="plaza-list"
          hidden={!listShown}
          className="holo-surface holo-solid holo-corners pointer-events-auto max-h-[min(62vh,560px)] w-[min(420px,calc(100vw-3rem))] overflow-y-auto p-2"
        >
          <h2 className="micro-label px-3 pb-2 pt-2">{t.plaza.title}</h2>
          <ul>
            {testimonials.map((r) => (
              <li key={r.id} className="border-t border-border px-3 py-3 first:border-t-0">
                <figure>
                  <blockquote className="text-sm leading-relaxed text-foreground">
                    <p>{locale === "es" ? (r.quoteEs ?? r.quote) : r.quote}</p>
                  </blockquote>
                  <figcaption className="micro-label mt-2 flex items-center gap-2">
                    <span className="text-foreground">{r.name}</span>
                    <span aria-hidden className="text-accent">
                      {"★".repeat(r.rating)}
                    </span>
                    <span className="sr-only">
                      {t.plaza.ratingAriaLabel.replace("{rating}", String(r.rating))}
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
          <a
            href={BUSINESS.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-sweep micro-label mx-3 mb-2 mt-3 inline-block hover:text-accent"
          >
            {t.plaza.googleCta} ↗
          </a>
        </div>

        <div className="flex items-center gap-3">
          {/* Ver lista — se retira con la ficha abierta, como el CTA. `invisible`
              (no solo opacidad) para que tampoco se pueda enfocar. */}
          <div
            className={`transition-opacity duration-300 ${
              ctaVisible ? "pointer-events-auto opacity-100" : "invisible opacity-0"
            }`}
          >
            <HoloButton
              variant="quiet"
              size="sm"
              aria-expanded={listShown}
              aria-controls="plaza-list"
              data-testid="plaza-list-toggle"
              onClick={() => setListOpen(!listOpen)}
            >
              {listOpen ? t.arcade.close : t.arcade.list}
            </HoloButton>
          </div>

          {/* CTA a la ficha de Google — esquina inferior derecha. En reposo es
              solo la "G"; se desvanece cuando hay una ficha abierta. */}
          <div aria-hidden={!ctaVisible}>
            <a
              href={BUSINESS.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={ctaVisible ? undefined : -1}
              className={`group inline-flex items-center rounded-full border p-3 backdrop-blur-sm transition-[color,border-color,opacity] duration-300 ${ctaChrome} ${
                ctaVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <GoogleIcon className="h-5 w-5 shrink-0" />
              {/* La etiqueta se despliega al hover/foco. La columna del grid pasa
                  de 0fr a 1fr: así se anima el ancho sin tener que medir el texto
                  (`width: auto` no es animable) y sin sacarlo del DOM, que lo
                  dejaría fuera del nombre accesible del enlace. */}
              <span className="grid grid-cols-[0fr] transition-[grid-template-columns] duration-300 group-hover:grid-cols-[1fr] group-focus-visible:grid-cols-[1fr]">
                <span className="overflow-hidden whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.18em]">
                  <span className="pl-2.5 pr-1">{t.plaza.googleCta}</span>
                </span>
              </span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
