/**
 * Marco de encuadre tipo retícula de imprenta.
 *
 * Es FIJO al viewport, no absoluto a una sección: en la referencia las
 * cruces se quedan clavadas en las esquinas de la ventana mientras el
 * contenido pasa por debajo. Con `absolute` dentro del hero solo se verían
 * en la primera pantalla y el encuadre se perdería al hacer scroll.
 *
 * z-40 lo deja por debajo del grano (z-50) y por encima de todo lo demás.
 */
export function FrameMarks() {
  const positions = [
    "left-[var(--gutter)] top-[var(--frame-top)]",
    "right-[var(--gutter)] top-[var(--frame-top)]",
    "left-[var(--gutter)] bottom-[var(--gutter)]",
    "right-[var(--gutter)] bottom-[var(--gutter)]",
    "left-1/2 top-[var(--frame-top)] -translate-x-1/2 hidden md:block",
    "left-1/2 bottom-[var(--gutter)] -translate-x-1/2 hidden md:block",
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 mix-blend-difference"
    >
      {positions.map((pos) => (
        <span key={pos} className={`absolute block h-3 w-3 text-[#8a8a8a] ${pos}`}>
          <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current" />
          <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current" />
        </span>
      ))}
    </div>
  );
}
