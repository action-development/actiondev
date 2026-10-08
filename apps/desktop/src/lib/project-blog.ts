import type { BlogPost } from "@actiondev/shared";
import { getPost } from "@/lib/blog";

/**
 * Proyecto → artículo del blog que cuenta su caso («Caso contado en el blog»
 * en la ficha, escritorio y web móvil v2). Slugs REALES de `projects.ts` y de
 * los posts del plan de contenidos (`docs/seo-plan-contenidos-2026-10-08.md`).
 * Varios proyectos pueden compartir artículo.
 */
export const PROJECT_BLOG_POSTS: Readonly<Record<string, string>> = {
  "autoescuela-gti": "software-autoescuela",
  "pbb-porrino": "inscripciones-online-club-deportivo",
  musa: "vender-entradas-online",
  "ticketera-la-fabrica": "vender-entradas-online",
  samoa: "carta-digital-restaurante",
  nautirent: "sistema-reservas-online",
  "oscar-soto": "app-entrenador-personal",
  "pro-lift-formacion": "plataforma-cursos-online-propia",
  "kairos-futures": "plataforma-cursos-online-propia",
  xaulabs: "plataforma-cursos-online-propia",
};

/** Fichas que enlazan a un artículo: las que revalida `/api/revalidate` al guardarlo. */
export function projectsForPost(postSlug: string): string[] {
  return Object.entries(PROJECT_BLOG_POSTS)
    .filter(([, post]) => post === postSlug)
    .map(([project]) => project);
}

/**
 * El artículo del caso, SOLO si está publicado (`getPost` filtra por
 * `status == "published"`). Si Firestore falla, `undefined`: la ficha se pinta
 * sin el enlace en vez de romperse (al contrario que el blog, donde un fallo
 * debe lanzar para que ISR conserve la versión buena: aquí el enlace es un
 * extra y la ficha tiene que salir siempre).
 */
export async function projectBlogPost(projectSlug: string): Promise<BlogPost | undefined> {
  const postSlug = PROJECT_BLOG_POSTS[projectSlug];
  if (!postSlug) return undefined;
  try {
    return await getPost(postSlug);
  } catch (error) {
    console.error(`[project-blog] sin artículo para ${projectSlug}:`, error);
    return undefined;
  }
}
