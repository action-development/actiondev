"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Entrada al hacer scroll. IntersectionObserver + una clase, sin librería
 * de animación: esta app no carga GSAP y por un fundido de 20px no merece
 * la pena meter 70KB en el bundle — y menos con móvil como prioridad.
 *
 * Se dispara UNA vez y se desconecta: reanimar al volver a subir marea y
 * además obliga a mantener vivo el observer durante toda la sesión.
 *
 * El estado inicial (opacity 0) vive en CSS y se anula entero bajo
 * `prefers-reduced-motion`, así que quien lo tenga activado ve el
 * contenido pintado desde el primer frame, no un fundido acelerado.
 */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  className = "",
  children,
}: {
  as?: ElementType;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      // 12% del bloque dentro y con 10% de margen inferior recortado: el
      // elemento arranca cuando ya se ve de verdad, no al asomar 1px.
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`reveal ${visible ? "is-in" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}
