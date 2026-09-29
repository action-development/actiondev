import { AUTHORS, SERVICE_LANDINGS, type BlogPost } from "@actiondev/shared";
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

const OPTIONAL_TEXT_FIELDS = ["updatedAt", "author", "targetLanding", "keyword", "image"] as const;

/**
 * Normaliza el payload antes de escribirlo: Firestore (Admin SDK) rechaza
 * `undefined`, y un campo opcional vacío tiene que DESAPARECER del documento,
 * no quedarse como `""` (la plantilla del blog lo trataría como presente).
 * También descarta lo que no esté en las listas cerradas (landing, autor):
 * el formulario ya lo limita, pero la server action es la puerta real.
 */
export function cleanPostInput(input: PostWriteInput): PostWriteInput {
  const clean: PostWriteInput = { ...input };

  for (const key of OPTIONAL_TEXT_FIELDS) {
    const value = clean[key]?.trim();
    if (value) clean[key] = value;
    else delete clean[key];
  }

  if (clean.targetLanding && !SERVICE_LANDINGS.some((l) => l.slug === clean.targetLanding)) {
    delete clean.targetLanding;
  }
  if (clean.author && !(clean.author in AUTHORS)) delete clean.author;
  if (clean.updatedAt && clean.updatedAt <= clean.date) delete clean.updatedAt;

  const faqs = (clean.faqs ?? [])
    .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
    .filter((f) => f.question && f.answer);
  if (faqs.length) clean.faqs = faqs;
  else delete clean.faqs;

  return clean;
}
