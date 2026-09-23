import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rowToPost, type PostRow } from "@/lib/posts";
import { PostForm } from "@/components/posts/PostForm";
import { isDevBypass } from "@/lib/dev-bypass-auth";
import { fakeGetPost } from "@/lib/dev-fake-posts";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ⚠️ Bypass temporal mientras Supabase no está conectado — ver
  // lib/dev-bypass-auth.ts y lib/dev-fake-posts.ts. Quitar al conectar Supabase real.
  if (await isDevBypass()) {
    const post = fakeGetPost(id);
    if (!post) notFound();
    return <PostForm post={post} />;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select("*").eq("id", id).single();

  if (error || !data) notFound();

  return <PostForm post={rowToPost(data as PostRow)} />;
}
