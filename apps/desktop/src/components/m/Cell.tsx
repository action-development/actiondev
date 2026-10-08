import type { ReactNode } from "react";
import { MLink } from "./MLink";

/**
 * Celdas etiqueta/valor (DESIGN.md §7). Técnica de Curro: el contenedor pinta
 * los filetes con `gap-px` sobre su propio fondo y cada celda lleva el suyo.
 * Base flexible de 160 px: dos por fila a 390 px; `full` ocupa la fila.
 */
export type CellTone = "paper" | "grey" | "ink" | "lime";

const TONE: Record<CellTone, string> = {
  paper: "bg-paper text-ink",
  grey: "bg-grey text-ink",
  ink: "on-ink bg-ink text-paper",
  lime: "bg-lime text-ink",
};

/** Contenedor de celdas. `dark` = filetes `line-dark` (celdas sobre tinta, como el pie). */
export function Cells({
  children,
  dark = false,
  className,
}: {
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap gap-px ${dark ? "bg-line-dark" : "border-b-2 border-ink bg-ink"}${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  );
}

/** Etiqueta de 12 px en caja alta encima de un valor. `onInk` = sobre tinta. */
export function Label({ children, onInk = false, className }: { children: ReactNode; onInk?: boolean; className?: string }) {
  return (
    <span
      className={`font-display text-label uppercase ${onInk ? "text-muted-dark" : "text-muted"}${className ? ` ${className}` : ""}`}
    >
      {children}
    </span>
  );
}

export function Cell({
  label,
  children,
  tone = "paper",
  full = false,
  href,
  className,
  "data-testid": testId,
}: {
  label: ReactNode;
  /** El valor: Condensed 800 de 21 px en caja alta. Para un email, envolverlo en `<span className="normal-case">`. */
  children: ReactNode;
  tone?: CellTone;
  full?: boolean;
  /** Con `href`, toda la celda es el enlace (se invierte a tinta al pulsar). */
  href?: string;
  className?: string;
  "data-testid"?: string;
}) {
  const onInk = tone === "ink";
  const cls = `flex min-w-0 ${full ? "flex-[1_1_100%]" : "flex-[1_1_160px]"} flex-col justify-between gap-1.5 px-4 pt-3.5 pb-4 ${TONE[tone]}${
    href ? (onInk ? " hover:bg-paper hover:text-ink active:bg-paper active:text-ink" : " group hover:bg-ink hover:text-paper active:bg-ink active:text-paper") : ""
  }${className ? ` ${className}` : ""}`;
  const content = (
    <>
      <Label onInk={onInk} className={href && !onInk ? "group-hover:text-muted-dark group-active:text-muted-dark" : undefined}>
        {label}
      </Label>
      <span className="break-words font-display text-value uppercase">{children}</span>
    </>
  );
  if (href) {
    return (
      <MLink href={href} className={cls} data-testid={testId}>
        {content}
      </MLink>
    );
  }
  return (
    <div className={cls} data-testid={testId}>
      {content}
    </div>
  );
}
