import type { ReactNode } from "react";

/**
 * Sección con cabecera de H2 gigante (DESIGN.md §6-§7, `.sec-h`): 48 px
 * arriba, 16 px hasta el filete de 2 px del titular, y el contenido a sangre
 * debajo. Sin *eyebrow* encima del titular (DESIGN.md §10).
 */
export function Section({
  id,
  title,
  lead,
  aside,
  children,
  className,
  headingLevel = 2,
  "data-testid": testId,
}: {
  /** Ancla de la sección; el titular recibe `${id}-title` para `aria-labelledby`. */
  id?: string;
  title: ReactNode;
  /** Entradilla bajo el titular (Semi Condensed 500, 19 px, máx. 34ch). */
  lead?: ReactNode;
  /** Algo a la derecha del titular: un enlace corto («Ver todos»). */
  aside?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Nivel del titular. 2 por defecto; 1 solo si la sección abre la página. */
  headingLevel?: 1 | 2;
  "data-testid"?: string;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const titleId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={titleId} data-testid={testId} className={className}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b-2 border-ink px-4 pt-12 pb-4">
        <Heading id={titleId} className="font-display text-h2 uppercase">
          {title}
        </Heading>
        {aside}
        {lead && <p className="max-w-[34ch] basis-full text-lead">{lead}</p>}
      </div>
      {children}
    </section>
  );
}
