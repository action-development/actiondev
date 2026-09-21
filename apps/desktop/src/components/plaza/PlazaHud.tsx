"use client";

import type { ReactNode } from "react";

import { useT } from "@/lib/i18n";

interface PlazaHudProps {
  /** Número de reseñas presentes en la plaza. */
  count: number;
  /** Oculta el hint de interacción cuando ya hay una ficha abierta. */
  hintVisible: boolean;
  /** Se está llevando un muñeco: la pista pasa a la leyenda de controles. */
  holding?: boolean;
}

/** Eje impreso en la leyenda de arrastre: tapa con borde de acento, sin
 * sombras (regla de diseño del sitio). */
function Axis({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-accent/50 px-2 py-0.5 font-mono text-[10px] leading-none text-accent">
      {children}
    </span>
  );
}

/**
 * Chrome DOM de /resenas: título, contador y hint de interacción. La navegación
 * (incl. volver al inicio) la lleva el Header global de PlazaPage. Sobre el fondo oscuro del sitio: tokens semánticos de globals.css.
 */
export function PlazaHud({ count, hintVisible, holding = false }: PlazaHudProps) {
  const t = useT();

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between px-6 pb-6 pt-28 md:px-10 md:pb-10">
      {/* Cabecera — título + contador (bajo el Header fijo, ~84px) */}
      <div className="pointer-events-auto flex items-start justify-between gap-6">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            {t.plaza.countLabel.replace("{count}", String(count))}
          </p>
          <h1 className="font-display mt-1 text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] text-foreground">
            {t.plaza.title}
          </h1>
          <p className="mt-1 max-w-[42ch] text-sm text-muted">
            {t.plaza.subtitle}
          </p>
        </div>
      </div>

      {/* Hint de interacción — abajo, se retira cuando hay una ficha abierta.
          Con un muñeco en la mano pasa a ser la leyenda de ejes: el arrastre
          solo mueve de lado y en profundidad, nunca hacia arriba (ver
          `canvas/plaza/drag-depth.ts`). */}
      <div
        className={`flex justify-center transition-opacity duration-300 ${
          hintVisible || holding ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden={!hintVisible && !holding}
      >
        {holding ? (
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
            <Axis>← →</Axis>
            <span>{t.plaza.hintAxisSide}</span>
            <span className="text-muted">·</span>
            <Axis>↑ ↓</Axis>
            <span>{t.plaza.hintAxisDepth}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">{t.plaza.hintDrop}</span>
          </p>
        ) : (
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{t.plaza.hint}</p>
        )}
      </div>
    </div>
  );
}
