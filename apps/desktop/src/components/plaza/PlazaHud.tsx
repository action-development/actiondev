"use client";

import { useT } from "@/lib/i18n";

interface PlazaHudProps {
  /** Número de reseñas presentes en la plaza. */
  count: number;
  /** Oculta el hint de interacción cuando ya hay una ficha abierta. */
  hintVisible: boolean;
  /** Se está llevando un muñeco en la mano. El HUD ya no lo pinta —la leyenda
   * de controles se retiró— pero el aviso sigue cableado desde la escena. */
  holding?: boolean;
}

/**
 * Chrome DOM de /resenas: título y hint de interacción. La navegación
 * (incl. volver al inicio) la lleva el Header global de PlazaPage. Sobre el fondo oscuro del sitio: tokens semánticos de globals.css.
 */
export function PlazaHud({ hintVisible }: PlazaHudProps) {
  const t = useT();

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between px-6 pb-6 pt-28 md:px-10 md:pb-10">
      {/* Cabecera — título (bajo el Header fijo, ~84px) */}
      <div className="pointer-events-auto flex items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] text-foreground">
            {t.plaza.title}
          </h1>
        </div>
      </div>

      {/* Hint de interacción — abajo, se retira cuando hay una ficha abierta.
          Una sola línea: el arrastre no lleva leyenda de controles (se quitó
          por decisión del cliente, no reintroducirla). */}
      <div
        className={`flex justify-center transition-opacity duration-300 ${
          hintVisible ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden={!hintVisible}
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{t.plaza.hint}</p>
      </div>
    </div>
  );
}
