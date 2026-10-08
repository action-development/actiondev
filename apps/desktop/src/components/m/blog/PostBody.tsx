import type { BlogContentBlock } from "@actiondev/shared";
import { parseInline } from "@/lib/blog-seo";
import { Icon } from "../Icon";
import { MLink } from "../MLink";

/**
 * Texto en línea de un artículo (`parseInline` de `lib/blog-seo.ts`, el mismo
 * troceado que escritorio): negritas y enlaces INTERNOS. Los enlaces van por
 * `MLink` (`<Link>` si la ruta tiene árbol móvil publicado) y llevan su
 * subrayado propio, porque también se pintan fuera de `.m-prose` (FAQ).
 */
export function renderInline(text: string) {
  return parseInline(text).map((part, i) => {
    if (part.kind === "strong") return <strong key={i}>{part.text}</strong>;
    if (part.kind === "link") {
      return (
        <MLink
          key={i}
          href={part.href}
          className="font-semibold underline decoration-2 underline-offset-[3px] active:bg-lime active:text-ink"
        >
          {part.text}
        </MLink>
      );
    }
    return <span key={i}>{part.text}</span>;
  });
}

/**
 * Cuerpo del artículo: los bloques de Firestore (`heading`, `paragraph`,
 * `list`, `quote`) como HTML semántico dentro de `.m-prose` (mobile.css), la
 * tipografía de lectura del sistema. Los `<h2>` llevan el ancla del índice
 * (`headingIds`, la misma que escritorio).
 */
export function PostBody({ content, ids }: { content: BlogContentBlock[]; ids: Map<number, string> }) {
  return (
    <div data-testid="m-post-body" className="m-prose border-b-2 border-ink px-4 pt-8 pb-12">
      {content.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <h2 key={index} id={ids.get(index)}>
                {block.text}
              </h2>
            );
          case "paragraph":
            return <p key={index}>{renderInline(block.text)}</p>;
          case "list":
            return (
              <ul key={index}>
                {block.items.map((item) => (
                  <li key={item.slice(0, 24)}>{renderInline(item)}</li>
                ))}
              </ul>
            );
          case "quote":
            return <blockquote key={index}>{renderInline(block.text)}</blockquote>;
        }
      })}
    </div>
  );
}

/**
 * Índice «En este artículo» (a partir de 3 subtítulos, como escritorio): una
 * fila por apartado con la flecha hacia abajo del salto. Sin numeración
 * propia: muchos subtítulos ya la llevan en el texto («1. El alcance…») y
 * saldría doble. Filas de 48 px como mínimo: son objetivos táctiles.
 */
export function PostToc({ items }: { items: { id: string; text: string }[] }) {
  return (
    <nav aria-labelledby="m-post-toc-title" data-testid="m-post-toc" className="border-b-2 border-ink">
      <p
        id="m-post-toc-title"
        className="border-b border-ink px-4 pt-5 pb-3 font-display text-label uppercase text-muted"
      >
        En este artículo
      </p>
      <ol>
        {items.map((item) => (
          <li key={item.id} className="border-b border-ink last:border-b-0">
            <a
              href={`#${item.id}`}
              className="flex min-h-12 items-center justify-between gap-3 py-2.5 pr-3 pl-4 hover:bg-ink hover:text-paper active:bg-lime active:text-ink"
            >
              <span className="font-display text-[17px] font-bold uppercase leading-[1.15] tracking-[0.02em]">
                {item.text}
              </span>
              <Icon name="arrow_downward" size={22} className="flex-none" />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
