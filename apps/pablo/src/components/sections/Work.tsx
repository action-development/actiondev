import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { PixelWipe } from "@/components/ui/PixelWipe";
import { work } from "@/data/work";

/**
 * Trabajos, en panel morado.
 *
 * Cierra el arco de color: hero morado → manifiesto morado → crema para
 * la lectura larga → morado otra vez para el bloque de imágenes. El
 * fondo oscuro además hace trabajar a las capturas, que sobre crema
 * competían con el fondo.
 *
 * El barrido entra AL REVÉS que el de Capabilities (`up`): el morado
 * sube desde abajo. Alternar la dirección evita que las dos
 * transiciones se lean como el mismo recurso repetido.
 *
 * La primera imagen lleva `priority` y el resto `loading="lazy"` por
 * defecto de next/image. `sizes` declarado a mano: sin él, next/image
 * asume 100vw y en desktop sirve un archivo el doble de grande del que
 * cabe en la columna.
 *
 * El aspect ratio sale de `orientation` en `work.ts`: los mockups
 * verticales en un contenedor 16/9 perdían medio encuadre con
 * `object-cover`, así que van en 4/5 y limitados en ancho.
 */
const FRAME = {
  landscape: "aspect-[4/3] md:aspect-[16/9]",
  portrait: "aspect-[4/5] md:mx-auto md:w-[62%]",
} as const;

export function Work() {
  return (
    <section id="trabajos" className="panel-grape relative">
      <PixelWipe from="var(--paper)" to="var(--grape)" direction="up" rows={4} />

      <div className="pixel-grid-bg relative overflow-hidden bg-background px-[var(--gutter)] pt-4 pb-10 md:pb-20">
        <h2 className="display relative z-10 text-[clamp(3.5rem,18vw,11rem)]">Work</h2>

        {/* La prueba necesita marco. Sin esta línea, la lista se lee
            como un porfolio; con ella, se lee como "esto ya lo he
            resuelto para alguien como tú". */}
        <p className="mono-type relative z-10 mt-4 max-w-[52ch] text-muted">
          Ocho de los más de cuarenta productos entregados con el equipo de
          Action. Empiezo por las dos apps móviles, que es a lo que más
          tiempo dedico.
        </p>

        <ul className="relative z-10 mt-8 md:mt-14">
          {work.map((project, index) => (
            <Reveal
              as="li"
              key={project.id}
              className="border-t border-border pt-6 pb-12 md:pb-20"
            >
              {/* Borde en el color del panel y no en el del token de
                  borde: sobre morado, la captura necesita un filo que la
                  separe del fondo, no una línea que se funda con él. */}
              <div
                className={`relative overflow-hidden border border-foreground/70 bg-border ${FRAME[project.orientation]}`}
              >
                <Image
                  src={project.image}
                  alt={`${project.title} — ${project.kind}`}
                  fill
                  priority={index === 0}
                  sizes={
                    project.orientation === "portrait"
                      ? "(min-width: 1280px) 750px, 100vw"
                      : "(min-width: 1280px) 1200px, 100vw"
                  }
                  className="object-cover"
                />
              </div>

              <div className="mono-type mt-6 text-muted">
                <p className="text-foreground">{project.title}</p>
                <p>{project.kind}</p>
                <p className="mt-5 max-w-[68ch]">{project.body}</p>
                <p className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                  <span>{project.year}</span>
                  {project.stack.map((tech) => (
                    <span key={tech}>{tech}</span>
                  ))}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>

        {/* Cierre de sección con salida: quien llega hasta aquí ya ha
            visto la prueba. Dejarle sin puerta sería tirar el trabajo
            de las ocho fichas anteriores. */}
        <a
          href="#hablemos"
          className="mono-type group relative z-10 mt-4 flex items-center justify-between border-y border-foreground/70 py-6 transition-colors duration-[--duration] hover:text-accent-soft"
        >
          <span className="max-w-[34ch]">
            ¿Tu app se parece a alguna de estas? Cuéntamela y te digo qué
            haría yo.
          </span>
          <span className="transition-transform duration-[--duration] group-hover:translate-x-1">
            Hablemos →
          </span>
        </a>
      </div>
    </section>
  );
}
