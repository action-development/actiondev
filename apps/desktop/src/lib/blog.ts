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

/**
 * Un fallo de Firestore SE LANZA, no se convierte en «sin posts»: estas
 * lecturas alimentan páginas ISR (`/blog`, artículos, landings, sitemap) y un
 * render fallido hace que Next siga sirviendo la última versión buena. Con el
 * `catch` que devolvía `[]`/`undefined`, un corte de Firestore durante una
 * revalidación cacheaba durante una hora un blog vacío, artículos en 404 y un
 * sitemap sin posts (auditoría SEO, M9). En el build, el error para el deploy:
 * mejor que publicar la web sin blog.
 */
function firestoreError(what: string, error: unknown): Error {
  return new Error(`[blog] Firestore falló al leer ${what}`, { cause: error });
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
  } catch (error) {
    throw firestoreError("los posts", error);
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
  } catch (error) {
    throw firestoreError(`el post «${slug}»`, error);
  }
}
