import { buildAiAssistants } from "@/data/ai-assistants";
import { Icon } from "../Icon";
import { MLink } from "../MLink";

/**
 * Lo que queda de `/contact` debajo del formulario, con los mismos textos y
 * enlaces indexables que la calle 3D de escritorio: «Pregunta a la IA sobre
 * nosotros» (ChatGPT, Claude, Gemini con el prompt de `t.contact.aiPrompt`) y
 * las rutas que enlaza su cabecera y el menú móvil no tiene (`/blog`).
 * Server component: solo enlaces.
 */

const MORE_LINKS = [
  { href: "/projects", label: "Proyectos" },
  { href: "/resenas", label: "Reseñas" },
  { href: "/blog", label: "Blog" },
] as const;

const rowLinkClass =
  "flex min-h-14 items-center justify-between gap-2 bg-paper px-4 font-display font-extrabold uppercase tracking-[0.05em] hover:bg-ink hover:text-paper active:bg-ink active:text-paper";

export function ContactMore({ aiPrompt }: { aiPrompt: string }) {
  return (
    <>
      <section aria-labelledby="m-contact-ia" className="border-b-2 border-ink">
        <h2 id="m-contact-ia" className="border-b-2 border-ink px-4 pt-12 pb-4 font-display text-h3 uppercase">
          Pregunta a la IA sobre nosotros
        </h2>
        <ul className="grid grid-cols-3 gap-px bg-ink" data-testid="m-contact-ai">
          {buildAiAssistants(aiPrompt).map((ai) => (
            <li key={ai.name} className="flex">
              <a
                href={ai.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Pregunta a ${ai.name} sobre Action`}
                className={`${rowLinkClass} w-full text-[17px]`}
              >
                {ai.name}
                <Icon name="arrow_outward" size={18} />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <nav aria-labelledby="m-contact-mas" className="border-b-2 border-ink">
        <h2 id="m-contact-mas" className="border-b-2 border-ink px-4 pt-12 pb-4 font-display text-h3 uppercase">
          Antes de escribir, mira lo que hacemos
        </h2>
        <ul className="grid gap-px bg-ink">
          {MORE_LINKS.map((item) => (
            <li key={item.href} className="flex">
              <MLink href={item.href} className={`${rowLinkClass} w-full text-[22px]`}>
                {item.label}
                <Icon name="arrow_forward" size={24} />
              </MLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
