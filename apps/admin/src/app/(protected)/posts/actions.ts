"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { BlogPost } from "@actiondev/shared";
import { adminDb } from "@/lib/firebase/admin";
import { requireSessionUser } from "@/lib/firebase/session";
import type { PostWriteInput } from "@/lib/posts";
import { revalidateSite } from "@/lib/revalidate-site";

export async function createPost(input: PostWriteInput) {
  await requireSessionUser();

  const ref = await adminDb().collection("posts").add(input);

  if (input.status === "published") await revalidateSite(input.slug);
  revalidatePath("/posts");
  redirect(`/posts/${ref.id}`);
}

export async function updatePost(id: string, input: PostWriteInput) {
  await requireSessionUser();

  await adminDb().collection("posts").doc(id).set(input);

  await revalidateSite(input.slug);
  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
}

export async function deletePost(id: string, slug: string) {
  await requireSessionUser();

  await adminDb().collection("posts").doc(id).delete();

  await revalidateSite(slug);
  revalidatePath("/posts");
  redirect("/posts");
}

export async function setPostStatus(id: string, slug: string, status: BlogPost["status"]) {
  await requireSessionUser();

  await adminDb().collection("posts").doc(id).update({ status });

  await revalidateSite(slug);
  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
}
