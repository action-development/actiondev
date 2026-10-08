import type { BlogPost } from "@actiondev/shared";
import { Label } from "./Cell";
import { Icon } from "./Icon";
import { MLink } from "./MLink";

/**
 * Fila de un artículo del blog: categoría, título, entradilla y, si se pide,
 * minutos de lectura; UN enlace a `/blog/<slug>` con filete abajo, que se
 * invierte al pulsar. La usan la lista del blog (`blog/PostList`, título en
 * `<h2>`) y las guías relacionadas de landings y artículos (`GuideList`,
 * título en `<h3>` bajo el `<h2>` de su sección).
 */
export function PostRow({
  post,
  headingAs: Heading = "h2",
  readingTime = false,
  "data-testid": testId = "m-blog-post",
}: {
  post: BlogPost;
  headingAs?: "h2" | "h3";
  readingTime?: boolean;
  "data-testid"?: string;
}) {
  return (
    <li className="border-b border-ink last:border-b-2">
      <MLink
        href={`/blog/${post.slug}`}
        data-testid={testId}
        className="group grid grid-cols-[1fr_52px] bg-paper text-ink hover:bg-ink hover:text-paper active:bg-ink active:text-paper"
      >
        <span className="grid min-w-0 content-start gap-2 px-4 pt-[18px] pb-5">
          <Label className="group-hover:text-muted-dark group-active:text-muted-dark">{post.category}</Label>
          <Heading className="font-display text-h4 break-words uppercase">{post.title}</Heading>
          <span className="text-base leading-[1.42]">{post.excerpt}</span>
          {readingTime && (
            <Label className="group-hover:text-muted-dark group-active:text-muted-dark">
              {post.readingTime} min de lectura
            </Label>
          )}
        </span>
        <span className="flex items-start justify-center pt-[18px]">
          <Icon name="arrow_outward" size={26} />
        </span>
      </MLink>
    </li>
  );
}
