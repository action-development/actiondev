import type { ReactNode } from "react";
import { RESENAS_JSON_LD } from "@/lib/resenas-seo";

/**
 * Layout de `/resenas` (escritorio): SOLO emite el JSON-LD de la página
 * (`WebPage` + `BreadcrumbList`, el mismo que la web móvil v2). Va aquí y no
 * en `page.tsx` para no tocar ese archivo. Sin `Review` ni `aggregateRating`
 * (CLAUDE.md `[SEO]`).
 */
export default function ResenasLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(RESENAS_JSON_LD) }} />
      {children}
    </>
  );
}
