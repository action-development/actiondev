import { Fragment } from "react";
import { MLink } from "./MLink";

function Separator() {
  return (
    <li aria-hidden="true" className="text-muted">
      /
    </li>
  );
}

/**
 * Migas de pan visibles (las mismas que el `BreadcrumbList` del JSON-LD y que
 * la miga de escritorio): una fila de 44 px bajo la cabecera, en etiqueta de
 * 13 px. Los enlaces ocupan toda la altura (objetivo táctil); la página actual
 * va sin enlace, con `aria-current`, y puede partir línea si es larga.
 */
export function Breadcrumbs({
  items,
  current,
  "data-testid": testId,
}: {
  items: readonly { href: string; label: string }[];
  /** Página actual (último eslabón, sin enlace). */
  current?: string;
  "data-testid"?: string;
}) {
  return (
    <nav aria-label="Migas de pan" data-testid={testId} className="border-b border-ink px-4">
      <ol className="flex flex-wrap items-center gap-x-2 font-display text-[13px] font-bold uppercase leading-[1.2] tracking-[0.1em]">
        {items.map((item, i) => (
          <Fragment key={item.href}>
            {i > 0 && <Separator />}
            <li>
              <MLink
                href={item.href}
                className="inline-flex min-h-11 items-center underline decoration-2 underline-offset-4 hover:bg-ink hover:text-paper active:bg-lime active:text-ink"
              >
                {item.label}
              </MLink>
            </li>
          </Fragment>
        ))}
        {current && (
          <>
            <Separator />
            <li aria-current="page" className="py-3 text-muted">
              {current}
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}
