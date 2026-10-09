import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { landings } from "@/data/landings";
import { projectsForPost } from "@/lib/project-blog";

/**
 * Webhook llamado por `apps/admin` justo después de escribir un post en
 * Firestore, para que aparezca en `/blog` sin esperar al `revalidate` por
 * tiempo ni a un redeploy. `revalidate` por tiempo en las páginas del blog
 * es la red de seguridad si esta llamada falla.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const secret = body?.secret;
  const slug = body?.slug;

  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ revalidated: false }, { status: 401 });
  }

  // Cada página del blog existe dos veces: la de escritorio y la de la web
  // móvil v2, que el middleware sirve desde `/m/blog/*` (ruta interna).
  for (const base of ["/blog", "/m/blog"]) {
    revalidatePath(base);
    if (typeof slug === "string" && slug) revalidatePath(`${base}/${slug}`);
  }
  // Los artículos se enlazan entre sí («Sigue leyendo») y desde las landings
  // («Guías relacionadas»): un post nuevo o retocado cambia esas listas. El
  // webhook no sabe a qué landing apuntaba ANTES el post, así que van todas
  // (10 × 2 árboles; el resto de artículos se refresca con su `revalidate`).
  for (const landing of landings) {
    revalidatePath(`/${landing.slug}`);
    revalidatePath(`/m/${landing.slug}`);
  }
  // Fichas cuyo caso cuenta este artículo («Caso contado en el blog»): el
  // enlace aparece (o desaparece) en cuanto el post cambia de estado.
  if (typeof slug === "string" && slug) {
    for (const project of projectsForPost(slug)) {
      revalidatePath(`/projects/${project}`);
      revalidatePath(`/m/projects/${project}`);
    }
  }
  // El post nuevo tiene que aparecer también en el sitemap (y en IndexNow) y
  // en las guías de `/llms.txt` y `/llms-full.txt` (generados, `lib/llms.ts`).
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
  revalidatePath("/llms-full.txt");

  return NextResponse.json({ revalidated: true });
}
