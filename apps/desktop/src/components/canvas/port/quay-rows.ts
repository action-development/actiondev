/**
 * Filas del muelle — el eje de PROFUNDIDAD del juego.
 *
 * El puerto ya no es un plano: hay TRES filas de contenedores en z y la grúa
 * entera (pórtico, carro, cables y spreader) viaja de una a otra. Es lo único
 * que da volumen real a la escena: antes todo ocurría en z = 0.
 *
 * Índice 0 = la más cercana a la cámara; el índice crece hacia el fondo, así
 * que "subir de fila" (▲) es ALEJARSE. Las z son decrecientes a propósito: el
 * índice es lo que se guarda y se pulsa, la z solo se lee de aquí.
 *
 * `SHIP_ROW` es la fila del barco (z = 0, el antiguo plano de juego): la bodega
 * está ahí y ahí hay que volver para soltar la carga.
 */
export const QUAY_ROWS: readonly number[] = [3.2, 0, -3.2];

/** Fila del barco — donde está la bodega y donde se suelta para navegar. */
export const SHIP_ROW = 1;

/**
 * Separación entre filas. El paso (3,2) es el mismo que el mínimo entre dos
 * contenedores vecinos en x: el spreader mide 3,4 de ancho y necesita ese aire
 * para bajar sin rozar al de al lado, y por profundidad pasa lo mismo.
 */
export const ROW_STEP = 3.2;

/** Deja un índice de fila dentro del muelle. */
export function clampRow(index: number): number {
  return Math.min(Math.max(index, 0), QUAY_ROWS.length - 1);
}

/**
 * Fila a la que pertenece una z. Se pregunta por la POSICIÓN y no por el dato
 * de origen porque un contenedor puede acabar en otra fila: la grúa lo suelta
 * donde esté el pórtico, no donde nació.
 */
export function nearestRowIndex(z: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < QUAY_ROWS.length; i++) {
    const d = Math.abs(QUAY_ROWS[i] - z);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}
