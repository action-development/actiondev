import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Botón del sitio — chapa física: contorno grueso + sombra dura desplazada,
 * mismo lenguaje que la etiqueta de categoría del carrusel de `/projects`.
 *
 * Existe porque el mismo par de botones estaba copiado a mano en `/servicios`,
 * en las seis landings, en `/contact` y en el 404, cada uno con su propio
 * radio (`rounded-full`), su propio hover (`scale-105`) y su propio peso. Uno
 * solo, y la identidad llega a todos a la vez.
 *
 * `solid` es la acción de salida (ya materializada); `outline` es el
 * contorno vacío, que se rellena al apuntarlo. Una `solid` por pantalla.
 * `quiet` apaga la sombra conservando la caja: para `/contact`, donde el
 * visitante viene a por un teléfono y el peso visual resta confianza.
 */

interface HoloButtonProps {
  /** Enlace. SIN `href` el componente es un `<button type="button">` de acción. */
  href?: string;
  /** Acción en la propia página (desplegar, filtrar). Sólo se usa sin `href`. */
  onClick?: () => void;
  children: ReactNode;
  variant?: "outline" | "solid" | "quiet";
  size?: "md" | "sm";
  /** El rótulo es un dato (correo, teléfono): se lee tal cual, sin troquelar. */
  data?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  "data-testid"?: string;
}

export function HoloButton({
  href,
  onClick,
  children,
  variant = "outline",
  size = "md",
  data = false,
  className = "",
  "aria-label": ariaLabel,
  "aria-expanded": ariaExpanded,
  "aria-controls": ariaControls,
  "data-testid": testId,
}: HoloButtonProps) {
  const classes = [
    "holo-btn",
    variant === "solid" && "holo-btn-solid",
    variant === "quiet" && "holo-btn-quiet",
    size === "sm" && "holo-btn-sm",
    data && "holo-btn-data",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // El hijo va envuelto SIEMPRE: `.holo-btn::after` es el relleno que barre y
  // se pinta sobre el fondo, así que el rótulo necesita su propio contexto de
  // apilado (`.holo-btn > *` lo sube a z-index 1). Texto suelto quedaría debajo.
  const body = <span className="inline-flex items-center gap-2">{children}</span>;

  // Sin destino, la chapa es un botón: mismo lenguaje para "ir a" y para
  // "desplegar". Antes sólo sabía ser enlace y cada acción de página se
  // escribía su propio botón a mano, que es justo lo que este archivo evita.
  if (!href) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={classes}
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        data-testid={testId}
      >
        {body}
      </button>
    );
  }

  // `mailto:`, `tel:` y enlaces externos no pasan por el router.
  const isInternal = href.startsWith("/");

  if (isInternal) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {body}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={classes}
      aria-label={ariaLabel}
      {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {body}
    </a>
  );
}
