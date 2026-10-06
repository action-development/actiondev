import { buildDecor, type DecorKind, type DecorSpec } from "../plaza-config";
import { ORBIT } from "../plaza-camera";

/**
 * Colocación del decorado respecto a la cámara.
 *
 * `buildDecor` (plaza-config) reparte los anillos regulares; aquí se retira lo
 * que se le plantaría a la cámara en primer plano. Vive FUERA de plaza-config
 * porque `plaza-camera` importa `PLAZA_FRONT_ANGLE` de ahí: leer `ORBIT` desde
 * plaza-config sería un ciclo de módulos con riesgo de TDZ.
 *
 * El pasillo se mide sobre `ORBIT` EN RUNTIME (centro y amplitud del vaivén),
 * así que si LUZ+CÁMARA los cambia, el hueco se mueve con la cámara. Para el
 * foco (`FOCUS`) basta lo mismo: la cámara se planta a `FOCUS.distance` del
 * muñeco en dirección `ORBIT.center`, o sea, siempre dentro del mismo arco, y
 * como los muñecos pasean por dentro de r ≈ 6,5 la cámara queda a r ≲ 9,9.
 *
 * Solo se vacía lo que está POR DENTRO del radio de la cámara más el foco
 * (farolas, bancos, papeleras, setos). Árboles y palmeras viven por fuera
 * (r ≥ 13,7), detrás de la cámara, y no estorban.
 */

/** Margen angular (rad) a cada lado del centro de la cámara, MÁS la amplitud
 * del vaivén, dentro del cual no se coloca la pieza. Lo alto y fino (farola)
 * necesita menos que lo ancho (banco, seto): un poste en primer plano corta
 * el encuadre, pero a 40° del eje ya queda en el borde del plano. */
const CLEAR_MARGIN: Partial<Record<DecorKind, number>> = {
  lamp: (18 * Math.PI) / 180,
  // 45° + vaivén (22°) = 67°: deja fuera las piezas a ~60° de la cámara, que en
  // los extremos del barrido quedaban cortadas en la esquina del encuadre.
  bench: (45 * Math.PI) / 180,
  bin: (45 * Math.PI) / 180,
  hedge: (45 * Math.PI) / 180,
};

/** Diferencia angular absoluta mínima entre dos ángulos. */
function angularDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % (Math.PI * 2);
  return d > Math.PI ? Math.PI * 2 - d : d;
}

/** Una papelera sin su banco al lado es atrezzo huérfano: se conserva solo si
 * queda algún banco a menos de esta distancia angular (rad). */
const BIN_BENCH_PAIR = 0.3;

/** Mobiliario de la plaza con el pasillo de cámara despejado. Determinista. */
export function buildDecorLayout(): DecorSpec[] {
  const kept = buildDecor().filter((spec) => {
    const margin = CLEAR_MARGIN[spec.kind];
    if (margin === undefined) return true;
    const angle = Math.atan2(spec.pos[1], spec.pos[0]);
    return angularDistance(angle, ORBIT.center) > ORBIT.sweep + margin;
  });
  const benches = kept.filter((s) => s.kind === "bench").map((s) => Math.atan2(s.pos[1], s.pos[0]));
  return kept.filter(
    (s) =>
      s.kind !== "bin" ||
      benches.some((b) => angularDistance(b, Math.atan2(s.pos[1], s.pos[0])) < BIN_BENCH_PAIR),
  );
}
