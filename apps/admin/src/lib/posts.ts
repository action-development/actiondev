import type { BlogPost } from "@actiondev/shared";

/** Fila cruda de la tabla `posts` en Supabase — snake_case de la migración. */
export interface PostRow {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  category: string;
  date: string;
  reading_time: number;
  h1: string;
  excerpt: string;
  content: BlogPost["content"];
  status: BlogPost["status"];
}

export function rowToPost(row: PostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    metaDescription: row.meta_description,
    category: row.category,
    date: row.date,
    readingTime: row.reading_time,
    h1: row.h1,
    excerpt: row.excerpt,
    content: row.content,
    status: row.status,
  };
}

/** Payload de escritura (sin `id`, que lo genera la base de datos). */
export type PostWriteInput = Omit<BlogPost, "id">;

export function postToRow(post: PostWriteInput) {
  return {
    slug: post.slug,
    title: post.title,
    meta_description: post.metaDescription,
    category: post.category,
    date: post.date,
    reading_time: post.readingTime,
    h1: post.h1,
    excerpt: post.excerpt,
    content: post.content,
    status: post.status,
  };
}

export function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Estimación a ~200 palabras/minuto, mínimo 1 minuto. */
export function estimateReadingTime(content: BlogPost["content"]): number {
  const words = content
    .map((block) => (block.type === "list" ? block.items.join(" ") : block.text))
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.round(words / 200));
}
