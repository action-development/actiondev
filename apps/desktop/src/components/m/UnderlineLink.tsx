import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { MLink } from "./MLink";

/**
 * Enlace subrayado de las maquetas (`.link-u`): Condensed 800 en caja alta con
 * filete de 3 px y flecha. La caja exterior da los 44 px táctiles; el
 * subrayado va en la interior para que no se separe del texto. `MLink` elige
 * el elemento (externo en pestaña nueva, ruta móvil con `<Link>`).
 */
export function UnderlineLink({
  href,
  children,
  className,
  "data-testid": testId,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <MLink
      href={href}
      data-testid={testId}
      className={`group inline-flex min-h-11 items-end${className ? ` ${className}` : ""}`}
    >
      <span className="inline-flex items-center gap-2 border-b-[3px] border-current pt-1.5 pb-[3px] font-display text-[17px] font-extrabold uppercase leading-none tracking-[0.06em] group-active:bg-lime group-active:text-ink">
        {children}
        <Icon name="arrow_outward" size={18} />
      </span>
    </MLink>
  );
}
