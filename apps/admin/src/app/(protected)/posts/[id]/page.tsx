import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { postFromDoc } from "@/lib/posts";
import { PostForm } from "@/components/posts/PostForm";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const doc = await adminDb().collection("posts").doc(id).get();
  if (!doc.exists) notFound();

  return <PostForm post={postFromDoc(doc)} />;
}
