"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

interface PlazaHudProps {
  /** Número de reseñas presentes en la plaza. */
  count: number;
  /** Oculta el hint de interacción cuando ya hay una ficha abierta. */
  hintVisible: boolean;
}

/**
 * Chrome DOM de /resenas: título, contador, hint de interacción y vuelta al
 * inicio. Sala blanca a propósito (ver PlazaPage.tsx) — por eso los tokens de
 * color son valores Tailwind explícitos (neutral-*) en vez de los semánticos
 * dark-first de globals.css (text-foreground, text-muted…), que aquí darían
 * texto claro sobre fondo claro.
 */
export function PlazaHud({ count, hintVisible }: PlazaHudProps) {
  const t = useT();

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-6 md:p-10">
      {/* Cabecera — título + contador + vuelta al inicio */}
      <div className="pointer-events-auto flex items-start justify-between gap-6">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {t.plaza.countLabel.replace("{count}", String(count))}
          </p>
          <h1 className="font-display mt-1 text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] text-neutral-900">
            {t.plaza.title}
          </h1>
          <p className="mt-1 max-w-[42ch] text-sm text-neutral-600">
            {t.plaza.subtitle}
          </p>
        </div>

        <Link
          href="/"
          aria-label={t.plaza.backAriaLabel}
          className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-neutral-300 bg-white/80 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-700 backdrop-blur-sm transition-colors duration-300 hover:border-neutral-900 hover:text-neutral-900"
        >
          <span aria-hidden className="transition-transform duration-300 group-hover:-translate-x-0.5">
            ←
          </span>
          {t.plaza.back}
        </Link>
      </div>

      {/* Hint de interacción — abajo, se retira cuando hay una ficha abierta */}
      <div
        className={`flex justify-center transition-opacity duration-300 ${
          hintVisible ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden={!hintVisible}
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500">
          {t.plaza.hint}
        </p>
      </div>
    </div>
  );
}
