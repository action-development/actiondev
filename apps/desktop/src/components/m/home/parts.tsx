import type { ReactNode } from "react";
import { Label } from "../Cell";
import { Icon } from "../Icon";
import { MLink } from "../MLink";

/**
 * Fila «siguiente» de la maqueta de proyectos (`.next`): etiqueta + valor a
 * la izquierda y una celda de tinta de 64 px con la flecha. Para salir de una
 * sección a su página completa (reseñas, blog).
 */
export function MoreRow({
  href,
  label,
  children,
  "data-testid": testId,
}: {
  href: string;
  label: string;
  children: ReactNode;
  "data-testid"?: string;
}) {
  return (
    <MLink
      href={href}
      data-testid={testId}
      className="group grid grid-cols-[1fr_64px] border-b-2 border-ink bg-paper text-ink hover:bg-ink hover:text-paper active:bg-ink active:text-paper"
    >
      <span className="grid gap-1.5 px-4 py-[18px]">
        <Label className="group-hover:text-muted-dark group-active:text-muted-dark">{label}</Label>
        <span className="font-display text-value uppercase">{children}</span>
      </span>
      <span className="flex items-center justify-center border-l border-ink bg-ink text-paper group-hover:bg-lime group-hover:text-ink group-active:bg-lime group-active:text-ink">
        <Icon name="arrow_outward" size={30} />
      </span>
    </MLink>
  );
}
