"use client";

import type { ReactNode } from "react";
import { HoloButton } from "@/components/ui/HoloButton";

/** Id del contenedor del formulario en las landings de campaña (ancla de los CTA). Las landings SEO usan `proyecto`. */
export const LEAD_FORM_ID = "formulario";

/**
 * Lleva al formulario y enfoca su primer campo (el nombre en el paso 2, la
 * necesidad elegida en el 1). `preventScroll` en el foco: el desplazamiento ya
 * lo hace `scrollIntoView` y, si no, el navegador pelearía con él.
 */
export function scrollToLeadForm(id: string = LEAD_FORM_ID): void {
  const host = document.getElementById(id);
  if (!host) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  host.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  focusLeadForm(id);
}

/** Enfoca el primer campo del formulario de `id` sin mover el scroll. */
export function focusLeadForm(id: string = LEAD_FORM_ID): void {
  const host = document.getElementById(id);
  const field =
    host?.querySelector<HTMLElement>('input[name="name"]') ??
    host?.querySelector<HTMLElement>('input[type="radio"]:checked');
  field?.focus({ preventScroll: true });
}

/**
 * Enlace a `#formulario` que, con JS, además enfoca el formulario. Sin JS sigue
 * siendo un ancla normal.
 */
export function FormJumpLink({
  className,
  children,
  "data-testid": testId,
}: {
  className: string;
  children: ReactNode;
  "data-testid"?: string;
}) {
  return (
    <a
      href={`#${LEAD_FORM_ID}`}
      data-testid={testId}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        scrollToLeadForm();
      }}
    >
      <span className="inline-flex items-center gap-2">{children}</span>
    </a>
  );
}

/**
 * `HoloButton` que lleva a `#id` y enfoca el formulario. El salto lo hace el
 * propio ancla (funciona sin JS y respeta `scroll-margin`); con JS solo se
 * añade el foco, con `preventScroll` para no pelear con el salto nativo.
 */
export function FormJumpButton({
  targetId,
  children,
  variant = "solid",
  className,
  "data-testid": testId,
}: {
  targetId: string;
  children: ReactNode;
  variant?: "outline" | "solid" | "quiet";
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <HoloButton
      href={`#${targetId}`}
      variant={variant}
      className={className}
      data-testid={testId}
      // Tras el salto: navegar a un fragmento NO enfocable desenfoca el documento,
      // así que enfocar dentro del propio click se perdería.
      onClick={() => window.setTimeout(() => focusLeadForm(targetId), 0)}
    >
      {children}
    </HoloButton>
  );
}
