"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./CorkBoard.module.css";

/**
 * El corcho de `/blog` a pantalla completa: TODA la página es tablero y no
 * queda texto sobre el fondo negro. Es la escena 3D — `perspective` en el
 * corcho y los papeles (`Pinned`) a distintas profundidades.
 *
 * La cámara es `perspective-origin`, en píxeles del tablero, y SOLO sigue al
 * centro del viewport con el scroll: si no, en una página alta los papeles de
 * abajo se verían desde muy arriba y se deformarían. NO sigue al puntero
 * (decisión del cliente: los pósits no se mueven al mover el ratón; lo único
 * que responde al puntero es el pósit apuntado). Sin estado de React: un rAF
 * por evento escribe el estilo. Con `prefers-reduced-motion` la perspectiva
 * se quita en CSS y aquí no se escucha nada. El marco de madera es
 * `position: fixed` y vive FUERA del corcho: un ancestro con `perspective` se
 * convierte en su bloque contenedor.
 */
export function CorkBoard({ children }: { children: ReactNode }) {
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const board = boardRef.current;
    if (!board || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const frame = () => {
      raf = 0;
      const y = window.scrollY - board.offsetTop + window.innerHeight / 2;
      board.style.perspectiveOrigin = `50% ${y.toFixed(1)}px`;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    kick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
    };
  }, []);

  return (
    <div className={styles.root}>
      <div ref={boardRef} className={styles.board} data-testid="pin-board">
        {children}
      </div>
      <div className={styles.frame} aria-hidden="true" />
    </div>
  );
}
