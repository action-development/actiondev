import { Reveal } from "@/components/ui/Reveal";
import { capabilities } from "@/data/capabilities";

/**
 * Lista de capacidades, sobre crema.
 *
 * Primera sección después del hero. Ya NO lleva banda de transición
 * propia: la que baja del hero entrega directamente en crema, y encadenar
 * dos barridos seguidos dejaba una franja de cuadros el doble de alta
 * que en el resto de la página.
 *
 * Sin numeración: los títulos entran directos, separados solo por la
 * línea de la retícula.
 */
export function Capabilities() {
  return (
    <section id="capacidades" className="relative">
      <h2 className="sr-only">Capacidades</h2>

      <div className="pixel-grid-bg relative overflow-hidden bg-background px-[var(--gutter)] pt-0 pb-24 md:pb-40">
        <ul className="relative">
          {capabilities.map((item) => (
            <Reveal
              as="li"
              key={item.id}
              className="border-t border-border py-8 last:border-b md:py-12"
            >
              {/* Caja mixta a propósito: el carácter de Bootzy vive en las
                  minúsculas. En versales esta fuente pierde justo lo que
                  la hace distinta. */}
              <h3 className="text-[clamp(1.9rem,7vw,3.25rem)] leading-[1.05] tracking-tight">
                {item.title}
              </h3>

              <p className="mono-type mt-4 max-w-[62ch] text-muted">{item.body}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
