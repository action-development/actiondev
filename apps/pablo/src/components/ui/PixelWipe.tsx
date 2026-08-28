"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Transición de cuadrícula entre secciones.
 *
 * La banda se pinta con el color de la sección que QUEDA ATRÁS y se
 * rellena, cuadro a cuadro, con el color de la que ENTRA. Al terminar
 * la banda es del color nuevo y empalma sin costura con la sección
 * siguiente — por eso vive dentro de ella, no entre las dos.
 *
 * Las columnas se cuentan en JS porque los retardos dependen de la
 * posición (fila, columna) de cada celda, y eso el CSS no lo sabe. Lo
 * que sí es CSS es la ALTURA (`rows × --cell`), así que en el primer
 * pintado el hueco ya está reservado: no hay salto de layout cuando
 * llegan las celdas.
 *
 * El jitter sale de un hash de (fila, columna) y no de `Math.random`:
 * con random, servidor y cliente generarían valores distintos y React
 * marcaría error de hidratación.
 */
const ROW_STEP_MS = 60;
const JITTER_MS = 200;

/**
 * Densidad de las filas del BORDE, de fuera hacia dentro.
 *
 * Las últimas filas en llegar no se rellenan enteras: solo el
 * porcentaje que dice esta tabla. Lo que queda al terminar la
 * animación no es un rectángulo liso con un canto recto, sino un filo
 * dentado que se deshace en cuadros — el motivo de la página dicho en
 * el sitio donde antes había una línea de corte.
 *
 * Dos filas y no una: con una sola, el dentado se lee como un borde
 * irregular. Con dos densidades distintas (34% fuera, 72% dentro) se
 * lee como profundidad, que es lo que hace que parezca construido a
 * bloques y no recortado con tijera.
 */
const EDGE_DENSITY = [0.34, 0.72];

function hash(row: number, col: number) {
  const n = Math.sin(row * 12.9898 + col * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/** Segundo hash, con constantes distintas. Si el dentado se calculara
 *  con `hash()`, las celdas que sobreviven serían justo las que menos
 *  retardo tienen y el borde se formaría de golpe en vez de rellenarse. */
function edgeHash(row: number, col: number) {
  const n = Math.sin(row * 39.3468 + col * 11.1357) * 24634.6345;
  return n - Math.floor(n);
}

export function PixelWipe({
  rows = 4,
  direction = "up",
  from,
  to,
  edge = true,
  className = "",
}: {
  rows?: number;
  /**
   * Deja las dos filas exteriores a medio rellenar para que el canto
   * quede dentado de forma PERMANENTE. `false` devuelve la banda
   * maciza de siempre (canto recto).
   */
  edge?: boolean;
  /** "up": las celdas suben desde el borde inferior. "down": bajan. */
  direction?: "up" | "down";
  /** Color de la sección anterior (fondo de la banda). */
  from: string;
  /** Color de la sección que entra (color de las celdas). */
  to: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // La misma fórmula que `--cell` en CSS: clamp(28px, 7vw, 52px). Se
    // recalcula en cada resize porque el número de columnas depende del
    // ancho y una rotación de móvil cambia los dos a la vez.
    const measure = () => {
      const cell = Math.min(52, Math.max(28, window.innerWidth * 0.07));
      setCols(Math.ceil(el.clientWidth / cell));
    };
    measure();
    window.addEventListener("resize", measure);

    // Se dispara una vez y se desconecta, igual que Reveal: rehacer el
    // barrido al volver a subir marea y obliga a mantener vivo el
    // observer toda la sesión.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.25 },
    );
    observer.observe(el);

    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pixel-wipe ${visible ? "is-in" : ""} ${className}`}
      style={{
        background: from,
        height: `calc(${rows} * var(--cell))`,
        gridTemplateColumns: cols ? `repeat(${cols}, 1fr)` : undefined,
        gridAutoRows: "1fr",
      }}
    >
      {cols > 0 &&
        Array.from({ length: rows * cols }, (_, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const rank = direction === "up" ? rows - 1 - row : row;
          const delay = rank * ROW_STEP_MS + hash(row, col) * JITTER_MS;

          // `depth` 0 = fila más exterior (la última en llegar), que es
          // la que hace de filo contra la sección que queda atrás.
          const depth = rows - 1 - rank;
          if (edge && depth < EDGE_DENSITY.length) {
            // El hueco se pinta igual (mantiene la rejilla del grid),
            // pero sin fondo: por él se ve el color de la sección
            // anterior, que es lo que dibuja el dentado.
            if (edgeHash(row, col) > EDGE_DENSITY[depth]) {
              return <span key={i} />;
            }
          }

          return (
            <span
              key={i}
              className="pixel-wipe-cell"
              style={
                {
                  background: to,
                  "--cell-delay": `${Math.round(delay)}ms`,
                } as React.CSSProperties
              }
            />
          );
        })}
    </div>
  );
}
