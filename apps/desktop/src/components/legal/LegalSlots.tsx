import type { ComponentType, ReactNode } from "react";

/**
 * «Huecos» de los documentos legales (`components/legal/docs/*`): el texto es
 * uno solo y cada árbol decide cómo se pinta. Escritorio pasa `LegalProse`
 * (`.legal-prose` de `globals.css`) y `LegalEntityCard`; la web móvil v2, los
 * suyos de `components/m/legal/` (`.m-prose` de `mobile.css`).
 */
export interface LegalSlots {
  /** Contenedor de un tramo de prosa (h2, h3, p, ul, strong, code, enlaces). */
  Prose: ComponentType<{ children: ReactNode }>;
  /** Ficha identificativa del titular (art. 10 LSSI-CE). Solo el aviso legal. */
  EntityCard: ComponentType;
}

/** Prosa de escritorio. */
export function LegalProse({ children }: { children: ReactNode }) {
  return <div className="legal-prose">{children}</div>;
}
