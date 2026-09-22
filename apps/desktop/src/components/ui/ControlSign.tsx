import type { ReactNode } from "react";
import styles from "./ControlSign.module.css";

export interface SignKey {
  /** Texto de la tapa ("◀", "BAJAR"…) o un glifo suelto (SVG). */
  label: ReactNode;
  /** Tapa lima y redonda: el botón de acción del mando, no una flecha. */
  accent?: boolean;
}

interface ControlSignProps {
  keys: SignKey[];
  /** Lo que se hace con esas teclas. Corto: se pinta en caja alta y en una línea. */
  action: string;
  /** Para los e2e: `tutorial-sign` en el hero, `plaza-hint` en /resenas. */
  testId?: string;
}

/**
 * Cartel de controles del cómic: tapas físicas | filete | acción.
 *
 * Es el MISMO letrero en el hero (tutorial paso a paso) y en /resenas (pista de
 * click), de ahí que viva en `ui/` y no dentro de `canvas/overlays/`. Solo
 * pinta: quién lo enseña, cuándo y dónde es cosa de quien lo monta.
 *
 * Las tapas son decorativas (`aria-hidden`): lo que hay que leer es `action`.
 */
export function ControlSign({ keys, action, testId }: ControlSignProps) {
  return (
    <div className={styles.sign} data-testid={testId}>
      <div className={styles.keys} aria-hidden>
        {keys.map((k, i) => (
          <span key={i} className={`${styles.cap} ${k.accent ? styles.accent : ""}`}>
            {k.label}
          </span>
        ))}
      </div>
      <span aria-hidden className={styles.divider} />
      <span className={styles.action}>{action}</span>
    </div>
  );
}
