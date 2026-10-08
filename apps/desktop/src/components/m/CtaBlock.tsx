import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { MLink } from "./MLink";
import { PROJECT_CTA_HREF, PROJECT_CTA_LABEL } from "./nav";

/**
 * Bloque lima a sangre con la acción principal (DESIGN.md §7, «Hero de
 * inicio»): «CONTAR MI PROYECTO» a 40 px, flecha ↗ de 58 px y una frase
 * debajo. Al apuntar o pulsar se invierte a tinta con texto lima.
 *
 * Su `id` es el que observa `StickyCta` (`heroId`): la barra fija aparece
 * cuando este bloque sale de pantalla.
 */
export function CtaBlock({
  href = PROJECT_CTA_HREF,
  title = PROJECT_CTA_LABEL,
  sub,
  id,
  className,
  "data-testid": testId,
}: {
  /** Destino: ancla del formulario de la página (`#formulario`) o `/contact`. */
  href?: string;
  title?: ReactNode;
  /** Frase bajo el titular (p. ej. «La primera reunión es gratis y sin compromiso…»). */
  sub?: ReactNode;
  id?: string;
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <MLink
      href={href}
      id={id}
      data-testid={testId}
      className={`grid grid-cols-[1fr_auto] gap-x-3 gap-y-2.5 border-t-2 border-ink bg-lime px-4 py-[18px] text-ink hover:bg-ink hover:text-lime active:bg-ink active:text-lime${className ? ` ${className}` : ""}`}
    >
      <span className="font-display text-[40px] font-black uppercase leading-[0.86] tracking-[-0.01em] text-balance">
        {title}
      </span>
      <Icon name="arrow_outward" size={58} className="-mr-2 -mt-1.5" />
      {sub && (
        <span className="col-span-full max-w-[36ch] text-[15px] font-medium leading-[1.35]">{sub}</span>
      )}
    </MLink>
  );
}
