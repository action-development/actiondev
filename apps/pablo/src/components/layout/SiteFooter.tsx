import { PixelSkyline } from "@/components/ui/PixelSkyline";
import { navigation } from "@/data/navigation";
import { IG_PROFILE, SITE } from "@/lib/seo";

const contact = [
  { label: `Instagram · @${SITE.instagram}`, href: IG_PROFILE },
  { label: "LinkedIn", href: "https://www.linkedin.com/" },
  { label: "GitHub", href: "https://github.com/" },
  { label: `Email · ${SITE.email}`, href: `mailto:${SITE.email}` },
];

/**
 * Cierre a sangre en color.
 *
 * Fondo ÁCIDO con tipografía en morado: 14.78:1 medido, más del triple
 * del 4.5:1 de AA. Es el amarillo con el que están puestos los titulares
 * del hero, así que el cierre devuelve el color con el que la página
 * abre —el acorde se cierra donde empezó— en vez de estrenar un tercer
 * color en la última pantalla.
 *
 * Los colores no se escriben aquí: `panel-acid` redefine los tokens y
 * las utilidades que ya había en el JSX (`text-foreground`,
 * `bg-background`, `border-foreground/70`) se resuelven solas.
 */
export function SiteFooter() {
  return (
    <footer id="hablemos" className="panel-acid relative">
      {/* El perfil escalonado se recorta contra el morado de Work: es la
          tercera transición de la página y la única que no necesita
          celdas, porque la propia silueta ya es la retícula. Sin margen
          superior — cualquier hueco dejaría asomar el crema del body
          entre las dos secciones. */}
      <div className="bg-[var(--grape)]">
        <PixelSkyline />
      </div>

      <div className="bg-background px-[var(--gutter)] pt-14 pb-[calc(var(--gutter)*1.5)]">
        <div className="select-box border-y border-foreground/70 py-10">
          <p className="display max-w-[13ch] text-[clamp(2.25rem,9vw,4.5rem)]">
            Cuéntame tu app
          </p>
          {/* Tres frenos habituales, desarmados en orden: no sé si es
              viable, no sé cuánto cuesta, no quiero que me vendan. */}
          <p className="mono-type mt-6 max-w-[46ch]">
            No hace falta que la tengas clara. Me cuentas la idea, te digo si
            se sostiene, cuánto cuesta y cuánto tarda. Si no soy la persona
            adecuada, te lo digo también.
          </p>
          <p className="mono-type mt-4 max-w-[46ch] text-foreground/70">
            Primera conversación sin coste ni compromiso · Respondo en menos
            de 24 h.
          </p>

          {/* ── CTA principal ──────────────────────────────────────
              Un solo destino, del ancho completo y con 5rem de alto:
              muy por encima de los 44px de área táctil de Apple, y
              imposible de confundir con un enlace de texto. Antes esto
              era un `mailto:` en cuerpo pequeño al final de otro
              bloque; quien llegaba con ganas de escribir tenía que
              buscarlo.

              Invierte la paleta del panel —morado sobre el ácido— en
              vez de sumar un color nuevo: sobre un fondo tan claro, el
              elemento oscuro es el que el ojo va a buscar primero.
              14.78:1 medido.

              Va al PERFIL, no a `ig.me/m/`: el enlace de perfil es el
              que está probado y no depende de un dominio de
              redirección. Cuesta un toque más —abrir el mensaje desde
              el propio perfil— a cambio de no fallar nunca.

              OJO con el color del rótulo: `.display` fija su color con
              `--display-ink`, que dentro de `panel-acid` vale morado.
              Sobre el botón —que es morado— el texto desaparecía. Se
              reescribe el TOKEN en el propio botón, y otra vez al pasar
              por encima, en vez de pelear la cascada con un
              `!important`. */}
          <a
            id="escribeme"
            href={IG_PROFILE}
            target="_blank"
            rel="noreferrer"
            className="group mt-8 scroll-mt-8 flex min-h-[5rem] items-center justify-between gap-4 border-2 border-foreground bg-foreground px-6 py-6 text-background transition-colors duration-[--duration] ease-[--ease-step] [--display-ink:var(--acid)] hover:bg-background hover:text-foreground hover:[--display-ink:var(--grape)]"
          >
            <span className="display text-[clamp(1.5rem,7vw,2.5rem)] leading-none">
              Escríbeme por Instagram
            </span>
            {/* Cuadro de la retícula, no una flecha suelta: el mismo
                motivo que numera las secciones. */}
            <span
              aria-hidden="true"
              className="block h-4 w-4 shrink-0 bg-background transition-transform duration-[--duration] ease-[--ease-step] group-hover:translate-x-1 group-hover:bg-foreground"
            />
          </a>

          {/* Salida alternativa, deliberadamente secundaria: quien
              prefiere correo lo encuentra, pero no compite con el CTA. */}
          <p className="mono-type mt-4 text-foreground/70">
            ¿Prefieres correo?{" "}
            <a
              href={`mailto:${SITE.email}?subject=Quiero%20hacer%20una%20app`}
              className="text-foreground underline underline-offset-4 transition-opacity duration-[--duration] hover:opacity-60"
            >
              {SITE.email}
            </a>
          </p>
        </div>

        <div className="select-box border-b border-foreground/70 py-10">
          <h2 className="text-[clamp(1.5rem,6vw,2rem)]">Enlaces</h2>
          <ul className="mono-type mt-6 flex flex-col gap-3">
            {navigation.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="transition-opacity duration-[--duration] hover:opacity-60"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="flex items-center gap-3">
              <a href="#hablemos" className="transition-opacity duration-[--duration] hover:opacity-60">
                Hablemos
              </a>
              <span aria-hidden="true" className="block h-2 w-2 bg-foreground" />
            </li>
          </ul>

          <p className="mono-type mt-10 text-foreground/70">Disponibilidad</p>
          <p className="mono-type mt-3 flex items-center gap-3">
            <span aria-hidden="true" className="block h-2 w-2 animate-pulse bg-foreground" />
            Abierto a proyectos de app · Vigo y remoto
          </p>
        </div>

        <div className="select-box border-b border-foreground/70 py-10">
          <h2 className="text-[clamp(1.5rem,6vw,2rem)]">Contacto</h2>
          <ul className="mono-type mt-6 flex flex-col gap-3">
            {contact.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  className="transition-opacity duration-[--duration] hover:opacity-60"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Cierra el bucle de autoridad: el nombre propio es la puerta,
              pero detrás hay un estudio con oficina en Vigo. Enlace real
              a actiondev.es — es la señal de entidad que Google necesita
              para asociar a la persona con el negocio. */}
          <p className="mono-type mt-8 max-w-[46ch] text-foreground/70">
            Trabajo desde{" "}
            <a
              href="https://actiondev.es"
              className="text-foreground underline underline-offset-4 transition-opacity duration-[--duration] hover:opacity-60"
            >
              Action
            </a>
            , estudio de desarrollo de aplicaciones y webs en Rúa Colón 20,
            Vigo. Cuando el proyecto pide más manos, las hay.
          </p>

          {/* Aquí ya NO va otro botón de escribir. Había tres llamadas
              a la acción compitiendo en el mismo pie —el titular, este
              enlace y la lista— y tres destinos son cero destinos. La
              única puerta grande vive arriba. */}
        </div>

        {/* Wordmark convertido en llamada. Ya no es un rótulo pasivo:
            es el último elemento de la página y ocupa casi el ancho
            completo, así que dejarlo sin destino era desperdiciar el
            objeto más grande del pie. Lleva de vuelta al botón grande.

            Los signos de apertura son DOS CIERRES GIRADOS 180°, no el
            carácter «¡»: Bootzy no tiene ese glifo —está excluido a
            propósito del `unicode-range` en globals.css— y escribirlo
            haría que los dos primeros signos cayeran a system-ui,
            en otra tipografía y a 10rem de cuerpo. Girando el «!» que
            la fuente SÍ tiene, la palabra entera se compone con un
            único tipo.

            `-mb` recorta el descendente contra el borde inferior para
            que la palabra muerda el filo, como en la referencia. */}
        <a
          href="#escribeme"
          aria-label="Háblame"
          className="display mt-14 -mb-2 flex items-center justify-center text-center text-[clamp(3rem,15vw,9rem)] transition-opacity duration-[--duration] hover:opacity-70"
        >
          <span aria-hidden="true" className="inline-block rotate-180 leading-none">
            !!
          </span>
          <span aria-hidden="true">HÁBLAME!!</span>
        </a>
      </div>
    </footer>
  );
}
