import type { LeadNeed } from "@actiondev/shared";
import type { IconName } from "./Icon";

/**
 * Las cuatro formas de servicio (DESIGN.md §4), sacadas del logo: círculo (el
 * punto final de «development.»), cuadrado, cruz y semicírculo (la media
 * esfera). Decorativas: `aria-hidden` siempre, el servicio lo nombra el texto.
 * Pintan en `currentColor`, así que el color lo da el contenedor.
 */
export type ShapeKind = "circle" | "square" | "plus" | "half";

const SIZES: Record<"sm" | "md", Record<ShapeKind, string>> = {
  md: {
    circle: "size-11 rounded-full",
    square: "size-10",
    plus: "size-11 [clip-path:polygon(35%_0,65%_0,65%_35%,100%_35%,100%_65%,65%_65%,65%_100%,35%_100%,35%_65%,0_65%,0_35%,35%_35%)]",
    half: "h-12 w-6 rounded-l-full",
  },
  sm: {
    circle: "size-3 rounded-full",
    square: "size-[11px]",
    plus: "size-3 [clip-path:polygon(35%_0,65%_0,65%_35%,100%_35%,100%_65%,65%_65%,65%_100%,35%_100%,35%_65%,0_65%,0_35%,35%_35%)]",
    half: "h-3 w-1.5 rounded-l-full",
  },
};

export function Shape({
  kind,
  size = "md",
  className,
}: {
  kind: ShapeKind;
  /** `md` = fila de servicios y portadas (40-48 px); `sm` = chips (12 px). */
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`block flex-none bg-current ${SIZES[size][kind]}${className ? ` ${className}` : ""}`}
    />
  );
}

/** Servicio con forma propia: todos los `LeadNeed` menos `unsure`. */
export type ServiceNeed = Exclude<LeadNeed, "unsure">;

/**
 * Tono, forma e icono de cada servicio (DESIGN.md §4): un servicio se reconoce
 * por las tres cosas a la vez, nunca solo por el color. `tone` son clases de
 * fondo + texto listas para usar.
 */
export const SERVICE_STYLE: Record<
  ServiceNeed,
  { name: string; tone: string; shape: ShapeKind; icon: IconName }
> = {
  app: { name: "Apps para móvil", tone: "bg-lime text-ink", shape: "circle", icon: "mobile_3" },
  software: { name: "Programas de gestión", tone: "bg-ink text-paper", shape: "square", icon: "dashboard" },
  integration: { name: "Conectar programas", tone: "bg-grey text-ink", shape: "plus", icon: "sync_alt" },
  web: { name: "Webs y tiendas online", tone: "bg-paper text-ink", shape: "half", icon: "web" },
};
