import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

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

  revalidatePath("/blog");
  if (typeof slug === "string" && slug) revalidatePath(`/blog/${slug}`);

  return NextResponse.json({ revalidated: true });
}
