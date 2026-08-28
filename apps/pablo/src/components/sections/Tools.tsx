"use client";

import { useState } from "react";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { tools } from "@/data/tools";

/**
 * EFECTOS — una pieza por pantalla.
 *
 * Toda la unidad (título, ficha, clip y flechas) cabe en UN viewport:
 * `h-svh` fijo, no `min-h`. El clip es el único bloque elástico
 * (`flex-1 min-h-0`), así que absorbe lo que sobra o se encoge cuando la
 * pantalla es corta, y las flechas nunca caen por debajo del pliegue.
 * Con `min-h-svh` la sección crecía con la ficha más larga y en móvil
 * las flechas quedaban fuera — que es justo lo que había que evitar.
 *
 * `svh` y no `vh`: en iOS, `vh` mide con la barra del navegador
 * retraída, así que el bloque siempre asomaba por debajo.
 *
 * Una sola pieza montada a la vez. El `key` en el <video> es
 * obligatorio: sin él React reutiliza el nodo y solo cambia el `src`,
 * y el navegador sigue pintando el fotograma del clip anterior hasta
 * que el nuevo carga.
 *
 * El índice se mueve con módulo en los dos sentidos — `(i - 1 + n) % n`,
 * no `i - 1`, que en la primera pieza daría -1.
 */
export function Tools() {
  const [index, setIndex] = useState(0);
  const tool = tools[index];
  const go = (step: number) =>
    setIndex((i) => (i + step + tools.length) % tools.length);

  return (
    <section className="px-[var(--gutter)]">
      <SectionMarker />

      {/* El ancla vive AQUÍ y no en la <section>: el marcador de arriba
          mide casi media pantalla, así que saltar desde el menú a la
          sección dejaba el bloque de efectos por debajo del pliegue.

          `pt-2` compensa el interlineado 0.84 de la display: la caja de
          la mayúscula sobresale por encima de su línea y, con
          `overflow-hidden`, el título salía descabezado. */}
      <div id="recursos" className="flex h-svh scroll-mt-0 flex-col overflow-hidden pt-2 pb-[var(--gutter)] md:pt-4">
        <h2 className="display shrink-0 text-center text-[clamp(3rem,15vw,9rem)]">
          Efectos
        </h2>

        {/* Sección de oficio, no de venta directa: lo que investigo
            fuera del encargo es lo que después puedo aplicar dentro. */}
        <p className="mono-type mt-2 shrink-0 text-center text-muted">
          Lo que investigo fuera del encargo. Después acaba dentro de una app.
        </p>

        <div className="mt-4 shrink-0 border-t border-foreground/70 pt-5">
          <h3 className="display text-[clamp(1.35rem,5vw,2rem)]">
            {tool.name}
          </h3>

          <p className="mono-type mt-4 max-w-[70ch] text-muted">{tool.body}</p>

          <p className="mono-type mt-4 text-muted">
            {String(index + 1).padStart(2, "0")} / {String(tools.length).padStart(2, "0")}
          </p>
        </div>

        {/* El clip manda sobre el espacio libre. `min-h-0` es lo que
            permite que un hijo de flex se encoja por debajo de su tamaño
            de contenido; sin él, el vídeo empuja y rompe el `h-svh`. */}
        <div
          className="mt-5 min-h-0 flex-1 overflow-hidden border border-foreground/70"
          style={{ backgroundColor: tool.bg }}
        >
          <video
            key={tool.id}
            src={tool.src}
            poster={tool.poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={`Clip del efecto ${tool.name}`}
            className="h-full w-full object-contain"
          />
        </div>

        {/* Flechas pegadas a los extremos. `type=button` explícito: sin
            él, dentro de un <form> futuro enviarían el formulario. */}
        <div className="mt-4 flex shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Efecto anterior"
            className="flex h-12 w-12 items-center justify-center border border-foreground text-lg transition-colors duration-[--duration] ease-[--ease-step] hover:bg-[var(--grape)] hover:text-[var(--acid)] md:h-14 md:w-14"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Efecto siguiente"
            className="flex h-12 w-12 items-center justify-center border border-foreground text-lg transition-colors duration-[--duration] ease-[--ease-step] hover:bg-[var(--grape)] hover:text-[var(--acid)] md:h-14 md:w-14"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
