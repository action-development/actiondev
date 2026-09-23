import Link from "next/link";
import type { BlogPost } from "@actiondev/shared";
import { createClient } from "@/lib/supabase/server";
import { rowToPost, type PostRow } from "@/lib/posts";
import { isDevBypass } from "@/lib/dev-bypass-auth";
import { fakeListPosts } from "@/lib/dev-fake-posts";

export default async function PostsPage() {
  // ⚠️ Bypass temporal mientras Supabase no está conectado — ver
  // lib/dev-bypass-auth.ts y lib/dev-fake-posts.ts. Quitar al conectar Supabase real.
  if (await isDevBypass()) {
    return <PostsList posts={fakeListPosts()} />;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("date", { ascending: false });

  const posts: BlogPost[] = error ? [] : (data as PostRow[]).map(rowToPost);
  return <PostsList posts={posts} error={error?.message} />;
}

function PostsList({ posts, error }: { posts: BlogPost[]; error?: string }) {

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Artículos del blog
          </h1>
          <p className="mt-2 text-sm text-muted">
            Todo lo que has escrito. Toca un título para editarlo.
          </p>
        </div>
        <Link
          href="/posts/new"
          className="shrink-0 rounded-[var(--radius-sm)] bg-foreground px-4 py-2.5 text-sm font-medium text-background"
        >
          + Escribir artículo
        </Link>
      </div>

      {error && (
        <p className="text-sm text-danger">No se pudieron cargar los artículos: {error}</p>
      )}

      {!error && posts.length === 0 && (
        <p className="rounded-[var(--radius-md)] border border-dashed border-border p-8 text-center text-sm text-muted">
          Todavía no hay artículos. Pulsa &quot;+ Escribir artículo&quot; para crear el primero.
        </p>
      )}

      <ul className="divide-y divide-border border-t border-border">
        {posts.map((post) => (
          <li key={post.id} className="py-6">
            <Link href={`/posts/${post.id}`} className="group block">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-medium text-foreground">{post.title}</h2>
                <span
                  className={
                    "shrink-0 rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium " +
                    (post.status === "published"
                      ? "border-foreground text-foreground"
                      : "border-border text-muted")
                  }
                >
                  {post.status === "published" ? "Publicado" : "Borrador"}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {post.category} · {post.date}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
