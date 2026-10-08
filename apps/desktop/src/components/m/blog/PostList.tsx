import type { BlogPost } from "@actiondev/shared";
import { Label } from "../Cell";
import { Icon } from "../Icon";
import { MLink } from "../MLink";

/**
 * Lista de artículos del blog (el tablero de pósits de escritorio, en móvil):
 * el más reciente en un bloque de tinta a sangre y el resto en filas con
 * filete. Cada artículo es UN enlace con lo mismo que el pósit: categoría,
 * título (`<h2>`), entradilla y minutos de lectura. Sin fecha visible
 * (decisión del cliente, igual que en escritorio). Al pulsar se invierten.
 */
export function PostList({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) {
    return <p className="border-b-2 border-ink px-4 py-10 text-lead">Todavía no hay artículos publicados.</p>;
  }
  const [latest, ...rest] = posts;
  return (
    <ul data-testid="m-blog-list">
      <li>
        <MLink
          href={`/blog/${latest.slug}`}
          data-testid="m-blog-post"
          className="on-ink group grid grid-cols-[1fr_64px] border-b-2 border-ink bg-ink text-paper hover:bg-paper hover:text-ink active:bg-paper active:text-ink"
        >
          <span className="grid min-w-0 content-start gap-3 px-4 pt-6 pb-7">
            <Label onInk className="group-hover:text-muted group-active:text-muted">
              Lo último · {latest.category}
            </Label>
            <h2 className="font-display text-h3 break-words uppercase">{latest.title}</h2>
            <span className="text-[17px] leading-[1.45]">{latest.excerpt}</span>
            <Label onInk className="group-hover:text-muted group-active:text-muted">
              {latest.readingTime} min de lectura
            </Label>
          </span>
          <span className="flex items-start justify-center border-l border-line-dark pt-6 group-hover:border-ink group-active:border-ink">
            <Icon name="arrow_outward" size={30} />
          </span>
        </MLink>
      </li>
      {rest.map((post) => (
        <li key={post.slug} className="border-b border-ink last:border-b-2">
          <MLink
            href={`/blog/${post.slug}`}
            data-testid="m-blog-post"
            className="group grid grid-cols-[1fr_52px] bg-paper text-ink hover:bg-ink hover:text-paper active:bg-ink active:text-paper"
          >
            <span className="grid min-w-0 content-start gap-2 px-4 pt-[18px] pb-5">
              <Label className="group-hover:text-muted-dark group-active:text-muted-dark">{post.category}</Label>
              <h2 className="font-display text-h4 break-words uppercase">{post.title}</h2>
              <span className="text-base leading-[1.42]">{post.excerpt}</span>
              <Label className="group-hover:text-muted-dark group-active:text-muted-dark">
                {post.readingTime} min de lectura
              </Label>
            </span>
            <span className="flex items-start justify-center pt-[18px]">
              <Icon name="arrow_outward" size={26} />
            </span>
          </MLink>
        </li>
      ))}
    </ul>
  );
}
