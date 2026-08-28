/**
 * Separador entre secciones que no cambian de color.
 *
 * Antes era una línea vertical con un cuadrado al medio. Ahora es una
 * columna de cuadros que se va reduciendo: mismo cometido, pero dicho
 * con el vocabulario de la retícula en vez de con una regla.
 *
 * Los tamaños se derivan de `--cell`, el mismo valor que gobierna la
 * cuadrícula de fondo y las transiciones, así que el motivo encaja en
 * la misma malla en toda la página.
 *
 * El color sale de `--display-ink`, el mismo token que tiñe los
 * titulares, así que dentro de un panel invertido el marcador se adapta
 * solo. El cuadro central va a opacidad plena y el resto al 40%: la
 * jerarquía la da la opacidad, no un segundo color — con cian sobre
 * crema el contraste caía a 1.4:1 y el cuadro desaparecía.
 */
const SIZES = [1, 0.62, 0.38, 0.62, 1];

export function SectionMarker() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col items-center gap-[0.35rem] py-14 text-[var(--display-ink)] md:py-24"
    >
      {SIZES.map((scale, i) => (
        <span
          key={i}
          className={`block bg-current ${i === 2 ? "opacity-100" : "opacity-40"}`}
          style={{
            width: `calc(var(--cell) * ${scale * 0.34})`,
            height: `calc(var(--cell) * ${scale * 0.34})`,
          }}
        />
      ))}
    </div>
  );
}
