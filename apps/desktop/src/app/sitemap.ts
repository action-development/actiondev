import type { MetadataRoute } from "next";
import { LEGAL_UPDATED, SITE_URL } from "@/lib/seo";
import { landings } from "@/data/landings";
import { getPosts } from "@/lib/blog";
import { hasCaseStudy, projects } from "@/data/projects";

const CORE_LANDING = "desarrollo-de-aplicaciones-vigo";

// Fecha del último cambio de contenido real de cada ruta propia. A mano y
// no `new Date()`: con la fecha de build, cada deploy le decía a Google
// "todo cambió hoy" sin que el contenido se hubiera tocado. Bump manual al
// editar contenido de esa ruta. 2026-10-08: la web móvil v2 (lo que indexa
// Googlebot Smartphone) se hizo pública en `/`, `/servicios`, `/projects` +
// fichas, `/resenas` y `/contact`; las landings estrenaron formulario y
// guías del blog, y `projects.ts` sumó proyectos y mockups. 2026-10-09: copy
// de las landings (títulos, FAQs, casos), H1 de los hubs y fichas corregidas
// contra las webs de los clientes en vivo.
const CONTENT_UPDATED = new Date("2026-10-09");
const LEGAL_LAST_MODIFIED = new Date(LEGAL_UPDATED);

// Se genera en el build: sin esto, un post publicado desde el admin no
// entraba en el sitemap (ni en `pnpm seo:indexnow`, que lo lee) hasta el
// siguiente deploy. El webhook `/api/revalidate` lo refresca al publicar;
// esto es la red de seguridad, igual que en `/blog`.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts();
  const postDate = (p: (typeof posts)[number]) => new Date(p.updatedAt ?? p.date);
  // El índice del blog cambia cuando cambia su post más reciente.
  const blogUpdated = posts.length
    ? new Date(Math.max(...posts.map((p) => postDate(p).getTime())))
    : CONTENT_UPDATED;

  const home: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/servicios`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/projects`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/resenas`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: blogUpdated,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Documentos legales — baja prioridad, pero indexables a propósito: un
  // organismo público debe poder encontrar por buscador quién hay detrás
  // de la marca (Alcasi Systems, S.L. + CIF) sin navegar la web.
  const legal: MetadataRoute.Sitemap = [
    "/legal/aviso-legal",
    "/legal/privacy",
    "/legal/terms",
    "/legal/cookies",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: LEGAL_LAST_MODIFIED,
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  const landingEntries: MetadataRoute.Sitemap = landings.map((l) => ({
    url: `${SITE_URL}/${l.slug}`,
    lastModified: CONTENT_UPDATED,
    changeFrequency: "monthly",
    priority: l.slug === CORE_LANDING ? 0.9 : 0.8,
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: postDate(p),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  // Solo fichas con caso redactado: las demás van `noindex` (ver `hasCaseStudy`).
  const projectEntries: MetadataRoute.Sitemap = projects.filter(hasCaseStudy).map((p) => ({
    url: `${SITE_URL}/projects/${p.slug}`,
    lastModified: CONTENT_UPDATED,
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  // Las URLs de portfolios de clientes (dominios externos) NO van en el
  // sitemap: un sitemap solo debe listar URLs del propio host, o Search
  // Console las marca como cross-domain y las ignora. Siguen enlazadas
  // como salientes desde las project cards, solo no aquí.
  return [...home, ...landingEntries, ...postEntries, ...projectEntries, ...legal];
}
