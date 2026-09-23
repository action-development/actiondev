import type { BlogPost } from "@actiondev/shared";
import { createClient } from "@/lib/supabase/server";

/** Fila cruda de la tabla `posts` en Supabase — snake_case de la migración. */
interface PostRow {
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

function rowToPost(row: PostRow): BlogPost {
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

export async function getPosts(): Promise<BlogPost[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .order("date", { ascending: false });

  if (error || !data) return [];
  return (data as PostRow[]).map(rowToPost);
}

export async function getPost(slug: string): Promise<BlogPost | undefined> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) return undefined;
  return rowToPost(data as PostRow);
}
