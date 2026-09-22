"use client";

import type { PlazaMode } from "@/components/canvas/plaza/plaza-mode";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { PlazaHint } from "./PlazaHint";
import { BUSINESS } from "@/lib/seo";
import { useT } from "@/lib/i18n";

interface PlazaHudProps {
  /** Día o noche: de día el cielo es claro y el texto blanco del sitio no se
   * lee, así que el chrome se invierte a tinta oscura. */
  mode: PlazaMode;
  /** Número de reseñas presentes en la plaza. */
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
 * enlace a la ficha de Google (el titular ya no se pinta — decisión del
 * cliente, no reponerlo; el h1 sigue en el DOM para SEO y lectores de pantalla
 * porque es el único de la página). La navegación (incl.
 * volver al inicio) la lleva el Header global de PlazaPage. Sobre el fondo
 * oscuro del sitio: tokens semánticos de globals.css.
 */
export function PlazaHud({ mode, ctaVisible, hintVisible }: PlazaHudProps) {
  const t = useT();
  const day = mode === "dia";
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

      <div className="flex justify-end">
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
    </div>
  );
}
