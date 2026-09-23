import type { BlogPost } from "@actiondev/shared";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { PLACEHOLDER_POSTS } from "@/lib/blog-placeholders";

/** Documento crudo de la colección `posts` en Firestore — sin `id`, que es el ID del doc. */
type PostDoc = Omit<BlogPost, "id">;

function docToPost(id: string, data: PostDoc): BlogPost {
  return { id, ...data };
}

// ⚠️ PLACEHOLDER TEMPORAL — ver lib/blog-placeholders.ts. En cuanto
// NEXT_PUBLIC_FIREBASE_PROJECT_ID esté en el entorno, getPosts/getPost pasan
// a leer de Firestore solos — no hace falta tocar nada más al conectar.
function isFirebaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

export async function getPosts(): Promise<BlogPost[]> {
  if (!isFirebaseConfigured()) return PLACEHOLDER_POSTS;

  try {
    const snapshot = await getDocs(
      query(collection(getDb(), "posts"), where("status", "==", "published")),
    );
    return snapshot.docs
      .map((d) => docToPost(d.id, d.data() as PostDoc))
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

export async function getPost(slug: string): Promise<BlogPost | undefined> {
  if (!isFirebaseConfigured()) {
    return PLACEHOLDER_POSTS.find((p) => p.slug === slug);
  }

  try {
    const snapshot = await getDocs(
      query(
        collection(getDb(), "posts"),
        where("slug", "==", slug),
        where("status", "==", "published"),
        limit(1),
      ),
    );
    const found = snapshot.docs[0];
    return found ? docToPost(found.id, found.data() as PostDoc) : undefined;
  } catch {
    return undefined;
  }
}
