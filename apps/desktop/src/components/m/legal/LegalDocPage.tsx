import type { ReactNode } from "react";
import { formatLegalDate } from "@/components/legal/legal-entity";
import { LEGAL_UPDATED } from "@/lib/seo";
import { MLink } from "../MLink";
import { MobileFooter } from "../MobileFooter";
import { MobileHeader } from "../MobileHeader";
import { LEGAL_LINKS } from "../nav";

/**
 * Página de un documento legal en la web móvil v2 (`/legal/*`). Fuera del
 * escaparate, como en escritorio: son documentos para leer y verificar.
 *
 * - Los cuatro documentos en una rejilla 2 × 2 (el `nav` «Documentos legales»
 *   de escritorio); el actual en tinta con `aria-current`.
 * - Cabecera: el ÚNICO `<h1>`, la entradilla y la línea con el marco legal y
 *   la «Última actualización» (`LEGAL_UPDATED`, la misma fecha que escritorio).
 * - El cuerpo lo pone cada página con el texto compartido
 *   (`components/legal/docs/*`) y los huecos de `LegalSlots`.
 * - Sin barra fija ni CTA: aquí no se vende (en escritorio, tampoco salta el
 *   popup de contacto en `/legal/*`). El pie sí, con titularidad y enlaces.
 */
export function LegalDocPage({
  href,
  header,
  jsonLd,
  children,
}: {
  href: (typeof LEGAL_LINKS)[number]["href"];
  header: { eyebrow: string; title: string; lede: string };
  jsonLd: object;
  children: ReactNode;
}) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MobileHeader />
      <main id="main-content">
        <nav aria-label="Documentos legales" data-testid="m-legal-nav">
          <ul className="grid grid-cols-2 gap-px border-b-2 border-ink bg-ink">
            {LEGAL_LINKS.map((item) => {
              const current = item.href === href;
              return (
                <li key={item.href} className="flex">
                  <MLink
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={`flex min-h-12 w-full items-center px-4 font-display text-[15px] font-extrabold uppercase tracking-[0.06em] ${
                      current
                        ? "on-ink bg-ink text-paper"
                        : "bg-paper text-ink hover:bg-ink hover:text-paper active:bg-ink active:text-paper"
                    }`}
                  >
                    {item.label}
                  </MLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <header className="grid gap-4 border-b-2 border-ink px-4 pt-6 pb-7">
          <h1 data-testid="m-legal-h1" className="font-display text-h1-long uppercase">
            {header.title}
          </h1>
          <p className="text-lead">{header.lede}</p>
          <p className="flex flex-wrap gap-x-3 gap-y-1 font-display text-label uppercase text-muted">
            <span>{header.eyebrow}</span>
            <span>
              Última actualización: <time dateTime={LEGAL_UPDATED}>{formatLegalDate(LEGAL_UPDATED)}</time>
            </span>
          </p>
        </header>

        {children}
      </main>
      <MobileFooter withBar={false} />
    </>
  );
}
