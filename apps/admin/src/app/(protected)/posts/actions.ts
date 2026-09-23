"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { BlogPost } from "@actiondev/shared";
import { createClient } from "@/lib/supabase/server";
import { postToRow, type PostWriteInput } from "@/lib/posts";
import { revalidateSite } from "@/lib/revalidate-site";
import { isDevBypass } from "@/lib/dev-bypass-auth";
import { fakeCreatePost, fakeUpdatePost, fakeDeletePost } from "@/lib/dev-fake-posts";

export async function createPost(input: PostWriteInput) {
  // ⚠️ Bypass temporal mientras Supabase no está conectado — ver
  // lib/dev-bypass-auth.ts y lib/dev-fake-posts.ts. Quitar al conectar Supabase real.
  if (await isDevBypass()) {
    const post = fakeCreatePost(input);
    revalidatePath("/posts");
    redirect(`/posts/${post.id}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .insert(postToRow(input))
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (input.status === "published") await revalidateSite(input.slug);
  revalidatePath("/posts");
  redirect(`/posts/${data.id}`);
}

export async function updatePost(id: string, input: PostWriteInput) {
  if (await isDevBypass()) {
    fakeUpdatePost(id, input);
    revalidatePath("/posts");
    revalidatePath(`/posts/${id}`);
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("posts").update(postToRow(input)).eq("id", id);

  if (error) throw new Error(error.message);

  await revalidateSite(input.slug);
  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
}

export async function deletePost(id: string, slug: string) {
  if (await isDevBypass()) {
    fakeDeletePost(id);
    revalidatePath("/posts");
    redirect("/posts");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) throw new Error(error.message);

  await revalidateSite(slug);
  revalidatePath("/posts");
  redirect("/posts");
}

export async function setPostStatus(
  id: string,
  slug: string,
  status: BlogPost["status"],
) {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").update({ status }).eq("id", id);

  if (error) throw new Error(error.message);

  await revalidateSite(slug);
  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
}
