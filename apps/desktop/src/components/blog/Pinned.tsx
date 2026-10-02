import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import styles from "./CorkBoard.module.css";

interface PinnedProps {
  /** Etiqueta del objeto: `li` en la rejilla de pósits, `footer` en la tarjeta de visita… */
  as?: "div" | "li" | "section" | "footer";
  /** Con `href` la hoja entera es el enlace y se despega del corcho al apuntarla. */
  href?: string;
  /** Color del papel (hex o `var(--…)`). */
  paper: string;
  /** Giro en grados alrededor de la primera chincheta. */
  tilt?: number;
  dx?: number;
  dy?: number;
  /** A cuántos px del corcho flota la hoja (sombra y paralaje). */
  z?: number;
  /**
   * Pegada al corcho: sin el borde de abajo despegado. Para lo que va clavado
   * por las dos esquinas (la cartulina del título), que no puede combarse.
   */
  flat?: boolean;
  /** Chinchetas: posición horizontal de cada una, en % del ancho. */
  pins?: number[];
  className?: string;
  sheetClassName?: string;
  "data-testid"?: string;
  "aria-labelledby"?: string;
  children: ReactNode;
}

/**
 * Un papel clavado en el corcho de `/blog`, en 3D de verdad (CSS 3D, sin
 * canvas): la sombra queda en el plano del corcho y la hoja flota unos px por
 * delante (`translateZ`), así que con la cámara de `CorkBoard` se separan con
 * paralaje. Cada chincheta tiene cabeza, aguja y su propia sombra sobre la hoja.
 * Server component: el texto es HTML normal, enlazable e indexable.
 */
export function Pinned({
  as: Tag = "div",
  href,
  paper,
  tilt = 0,
  dx = 0,
  dy = 0,
  z = 16,
  flat = false,
  pins = [50],
  className = "",
  sheetClassName = "",
  children,
  ...rest
}: PinnedProps) {
  const style = {
    "--tilt": `${tilt}deg`,
    "--dx": `${dx}px`,
    "--dy": `${dy}px`,
    "--z": `${z}px`,
    ...(flat && { "--curl": "0deg" }),
    "--pin-x": `${pins[0]}%`,
    "--paper": paper,
  } as CSSProperties;

  const sheetClass = `${styles.sheet} ${sheetClassName}`;
  const pinEls = pins.map((x) => (
    <span key={x} className={styles.pin} style={{ left: `${x}%` }} aria-hidden="true">
      <span className={styles.needle} />
    </span>
  ));

  return (
    <Tag
      className={`${styles.object} ${href ? styles.interactive : ""} ${className}`}
      style={style}
      {...rest}
    >
      {href ? (
        <Link href={href} className={sheetClass}>
          {pinEls}
          {children}
        </Link>
      ) : (
        <div className={sheetClass}>
          {pinEls}
          {children}
        </div>
      )}
    </Tag>
  );
}
