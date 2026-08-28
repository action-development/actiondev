/**
 * Borde superior escalonado del footer.
 *
 * SVG con `preserveAspectRatio="none"` en vez de una fila de divs: así el
 * perfil se estira a cualquier ancho manteniendo exactamente los mismos
 * escalones, sin que el número de columnas dependa del viewport.
 *
 * El relleno es `--background`, no un color fijo: dentro de un panel
 * ese token ES el color del panel, así que el perfil escalonado se pinta
 * solo del color de la sección que entra. Es la misma idea que la banda
 * de píxeles, resuelta con una sola forma.
 *
 * `STEPS` son alturas en unidades de la rejilla (0 = ras del footer,
 * 4 = escalón más alto). El viewBox tiene tantas unidades de ancho como
 * escalones, de modo que cada uno es un cuadrado perfecto.
 */
const STEPS = [2, 2, 4, 4, 3, 3, 4, 4, 1, 1, 3, 3, 4, 4, 2, 2, 4, 4, 3, 3];
const HEIGHT = 4;

export function PixelSkyline() {
  // Perfil recorrido de izquierda a derecha: subir, avanzar uno, repetir.
  const points = [`0,${HEIGHT}`];
  STEPS.forEach((step, i) => {
    points.push(`${i},${HEIGHT - step}`, `${i + 1},${HEIGHT - step}`);
  });
  points.push(`${STEPS.length},${HEIGHT}`);

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${STEPS.length} ${HEIGHT}`}
      preserveAspectRatio="none"
      className="block h-[14vw] max-h-32 w-full"
    >
      <polygon points={points.join(" ")} fill="var(--background)" />
    </svg>
  );
}
