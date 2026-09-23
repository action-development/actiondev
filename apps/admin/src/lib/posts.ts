import type { BlogPost } from "@actiondev/shared";
import type { DocumentSnapshot } from "firebase-admin/firestore";

/** Payload de escritura (sin `id`, que lo genera Firestore). */
export type PostWriteInput = Omit<BlogPost, "id">;

export function postFromDoc(doc: DocumentSnapshot): BlogPost {
  return { id: doc.id, ...(doc.data() as PostWriteInput) };
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
