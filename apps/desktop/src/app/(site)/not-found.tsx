"use client";

import Image from "next/image";
import { useT } from "@/lib/i18n";
import { HoloButton } from "@/components/ui/HoloButton";

/**
 * 404 de escritorio (también lo monta `app/global-not-found.tsx`). `<main
 * id="main-content">` (destino del «Saltar al contenido» del layout) y el
 * mensaje como `<h1>`: antes la página no tenía ni una ni otro. Mismas clases,
 * mismo aspecto: Tailwind deja `h1` y `main` sin estilo propio.
 */
export default function NotFound() {
  const t = useT();

  return (
    <main
      id="main-content"
      className="fixed inset-0 flex flex-col items-center justify-start gap-8 overflow-hidden bg-black px-6 pt-[8vh]"
    >
      {/* Por `next/image` como el resto: en crudo eran 68 KB de un original de
          1563×625 para pintar 48-56px de alto, y sin dimensiones el bloque
          saltaba al cargar. */}
      <Image
        src="/logos/logo.webp"
        alt="Action Development"
        width={140}
        height={56}
        priority
        className="h-12 w-auto invert opacity-80 md:h-14"
      />

      <Image
        src="/404.webp"
        alt="404"
        width={1200}
        height={520}
        priority
        sizes="(max-width: 768px) 92vw, min(70vw, 980px)"
        className="h-auto w-[min(70vw,980px)] max-w-[92vw]"
      />

      <h1 className="lede max-w-[44ch] text-center">
        {t.notFound.subtitle}
      </h1>

      <HoloButton href="/">{t.notFound.cta}</HoloButton>
    </main>
  );
}
