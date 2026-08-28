"use client";

import { useEffect, useState, type CSSProperties } from "react";

/**
 * Pantalla de carga: telón negro que se deshace de ABAJO ARRIBA en
 * cuadrados planos.
 *
 * ── Por qué `visibility` y no `opacity` ────────────────────────────
 * La celda desaparece de golpe, sin fundido. Es lo que da el borde
 * duro tipo bloque; con opacity se convierte en un desvanecido suave
 * y se pierde el efecto. Además `visibility` no genera capa de
 * composición, así que 300 celdas no cuestan nada.
 *
 * ── Por qué el desorden es determinista ────────────────────────────
 * El retardo de cada celda sale de un hash de (fila, columna), NO de
 * Math.random(). Con random el servidor y el cliente generarían
 * valores distintos y React tiraría un desajuste de hidratación.
 *
 * ── Por qué el telón se pinta en el servidor ───────────────────────
 * En SSR se emite un div negro sólido sin retícula. Así la pantalla
 * ya sale negra en el primer pintado; si esperásemos a montar, se
 * vería un destello del contenido antes del telón.
 */

const CELL_PX = { mobile: 48, desktop: 76 };
/** Retardo entre filas consecutivas. */
const ROW_STEP_MS = 55;
/** Desorden máximo dentro de una misma fila. */
const JITTER_MS = 190;
/** Mínimo que el telón permanece, para que no dé un flashazo. */
const MIN_HOLD_MS = 600;

/** Hash determinista clásico: devuelve 0..1 a partir de dos enteros. */
function hash(row: number, col: number) {
  const n = Math.sin(row * 127.1 + col * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function PixelLoader() {
  const [grid, setGrid] = useState<{ cols: number; rows: number } | null>(null);
  const [dissolving, setDissolving] = useState(false);
  const [done, setDone] = useState(false);

  // Medir la retícula en cuanto monta.
  useEffect(() => {
    const cell = window.innerWidth < 768 ? CELL_PX.mobile : CELL_PX.desktop;
    setGrid({
      cols: Math.ceil(window.innerWidth / cell),
      rows: Math.ceil(window.innerHeight / cell),
    });
  }, []);

  // Arrancar cuando la página esté lista, respetando el mínimo.
  useEffect(() => {
    if (!grid) return;

    const mounted = performance.now();
    let timer = 0;

    const begin = () => {
      const waited = performance.now() - mounted;
      timer = window.setTimeout(
        () => setDissolving(true),
        Math.max(MIN_HOLD_MS - waited, 0),
      );
    };

    if (document.readyState === "complete") begin();
    else window.addEventListener("load", begin, { once: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("load", begin);
    };
  }, [grid]);

  // Desmontar al acabar: un overlay fijo que se queda vivo se come los
  // clics aunque sea invisible.
  useEffect(() => {
    if (!dissolving || !grid) return;
    const total = grid.rows * ROW_STEP_MS + JITTER_MS + 120;
    const timer = window.setTimeout(() => setDone(true), total);
    return () => window.clearTimeout(timer);
  }, [dissolving, grid]);

  if (done) return null;

  return (
    <div
      className={`pixel-loader ${dissolving ? "is-dissolving" : ""}`}
      role="presentation"
      aria-hidden="true"
    >
      {grid ? (
        <div
          className="pixel-loader-grid"
          style={{
            gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
            gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
          }}
        >
          {Array.from({ length: grid.rows * grid.cols }, (_, i) => {
            const row = Math.floor(i / grid.cols);
            const col = i % grid.cols;
            // Se van las de abajo primero → invertimos el índice de fila.
            const delay =
              (grid.rows - 1 - row) * ROW_STEP_MS + hash(row, col) * JITTER_MS;
            return (
              <span
                key={i}
                className="pixel-loader-cell"
                style={{ "--cell-delay": `${delay}ms` } as CSSProperties}
              />
            );
          })}
        </div>
      ) : (
        <div className="pixel-loader-solid" />
      )}
    </div>
  );
}
