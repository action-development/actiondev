import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { MLink } from "./MLink";

/**
 * Botón de la web móvil v2 (DESIGN.md §7-§8). Caja a sangre, texto en
 * Condensed caja alta y la flecha ↗ a la derecha. Estados secos, sin
 * transición: al apuntar (solo puntero fino: `hover:` de Tailwind v4 ya va
 * dentro de `@media (hover: hover)`) y al pulsar se INVIERTE; al pulsar,
 * además, baja 1 px.
 *
 * Con `href` es un enlace (`MLink` elige `<Link>` o `<a>`); sin él, `<button>`.
 */
export type ButtonVariant = "ink" | "lime" | "line";
export type ButtonSize = "md" | "bar" | "xl";

const VARIANT: Record<ButtonVariant, string> = {
  ink: "bg-ink text-paper hover:bg-lime hover:text-ink active:bg-lime active:text-ink",
  lime: "bg-lime text-ink hover:bg-ink hover:text-lime active:bg-ink active:text-lime",
  line: "border-2 border-ink bg-transparent text-ink hover:bg-ink hover:text-paper active:bg-lime active:text-ink",
};

const SIZE: Record<ButtonSize, { box: string; icon: number }> = {
  /** Botón normal: 56 px. */
  md: { box: "min-h-14 text-[19px] font-extrabold tracking-[0.05em]", icon: 26 },
  /** Barra fija: 64 px. */
  bar: { box: "min-h-16 text-[22px] font-black tracking-[0.03em]", icon: 26 },
  /** CTA del menú: 76 px. */
  xl: { box: "min-h-[76px] text-[26px] font-black tracking-[0.05em]", icon: 26 },
};

export const buttonClass = (variant: ButtonVariant = "ink", size: ButtonSize = "md") =>
  `flex w-full select-none items-center justify-between gap-3 px-4 text-left font-display uppercase leading-none active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-busy:opacity-50 ${SIZE[size].box} ${VARIANT[variant]}`;

type Common = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icono a la derecha. Por defecto la flecha de marca ↗; `null` para ninguno. */
  icon?: IconName | null;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "data-testid"?: string;
};

export type ButtonProps = Common &
  (
    | { href: string; onClick?: () => void }
    | { href?: undefined; type?: "button" | "submit"; onClick?: () => void; disabled?: boolean; "aria-busy"?: boolean }
  );

export function Button(props: ButtonProps) {
  const { children, variant = "ink", size = "md", icon = "arrow_outward", className, ...rest } = props;
  const cls = `${buttonClass(variant, size)}${className ? ` ${className}` : ""}`;
  const content = (
    <>
      <span>{children}</span>
      {icon && <Icon name={icon} size={SIZE[size].icon} />}
    </>
  );

  if (rest.href !== undefined) {
    const { href, ...linkRest } = rest;
    return (
      <MLink href={href} className={cls} {...linkRest}>
        {content}
      </MLink>
    );
  }
  const { type = "button", ...buttonRest } = rest;
  return (
    <button type={type} className={cls} {...buttonRest}>
      {content}
    </button>
  );
}
