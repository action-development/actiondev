/**
 * Avisa a `apps/desktop` para que invalide `/blog` y `/blog/[slug]` justo
 * después de escribir en Firestore — así un post publicado aparece sin
 * esperar al `revalidate` por tiempo ni a un redeploy. Si falla (red, sitio
 * caído), no interrumpe el guardado: el `revalidate` por tiempo de
 * `apps/desktop` es la red de seguridad.
 */
export async function revalidateSite(slug: string) {
  const siteUrl = process.env.DESKTOP_SITE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!siteUrl || !secret) return;

  try {
    await fetch(`${siteUrl}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, slug }),
    });
  } catch {
    // No bloquear la publicación por un fallo de red hacia el sitio público.
  }
}
