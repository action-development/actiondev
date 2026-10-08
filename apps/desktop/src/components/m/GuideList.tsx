import type { BlogPost } from "@actiondev/shared";
import { PostRow } from "./PostRow";
import { Section } from "./Section";

/**
 * Guías del blog enlazadas desde otra página: «Guías relacionadas» en las
 * landings (`landingGuides`) y «Sigue leyendo» al final de un artículo
 * (`relatedPosts`), las dos de `lib/blog-seo.ts`, las MISMAS listas que
 * escritorio. Sin posts no pinta nada.
 */
export function GuideList({
  id,
  title,
  posts,
  "data-testid": testId,
}: {
  id: string;
  title: string;
  posts: BlogPost[];
  "data-testid": string;
}) {
  if (posts.length === 0) return null;
  return (
    <Section id={id} title={title} data-testid={testId}>
      <ul>
        {posts.map((post) => (
          <PostRow key={post.slug} post={post} headingAs="h3" data-testid={`${testId}-link`} />
        ))}
      </ul>
    </Section>
  );
}
