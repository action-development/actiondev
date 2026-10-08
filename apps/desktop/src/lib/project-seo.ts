import type { Metadata } from "next";
import {
  ORGANIZATION_ID,
  PLACEHOLDER_IMAGE,
  WEBSITE_ID,
  hasCaseStudy,
  projects,
  type BlogPost,
  type Project,
} from "@actiondev/shared";
import { projectCategoryLabel, relatedService } from "@/lib/project-case";
import { SITE_URL, absoluteUrl, metaDescription, ogImage } from "@/lib/seo";

/**
 * SEO de la ficha de proyecto (`/projects/[slug]`): una sola fuente para la
 * página de escritorio y la del árbol móvil v2 (`app/(m)/m/projects/[slug]`),
 * así que ambas emiten EXACTAMENTE el mismo `<title>`, canonical, robots,
 * Open Graph y JSON-LD.
 */

export function findProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** Cuántos proyectos enlaza «Más proyectos» al final de una ficha. */
export const RELATED_PROJECTS_MAX = 3;

/**
 * «Más proyectos» de una ficha (escritorio y web móvil v2): solo fichas
 * INDEXABLES (`hasCaseStudy`), primero las de la misma categoría, luego las
 * que comparten landing de servicio (`relatedService`) y, para completar, las
 * destacadas; dentro de cada grupo, el orden de `projects.ts`. Determinista:
 * los dos árboles enlazan exactamente las mismas.
 */
export function relatedProjects(project: Project, max = RELATED_PROJECTS_MAX): Project[] {
  const service = relatedService(project).href;
  const rank = (p: Project) =>
    p.category === project.category ? 0 : relatedService(p).href === service ? 1 : p.featured ? 2 : 3;
  return projects
    .filter((p) => p.slug !== project.slug && hasCaseStudy(p))
    .map((p, i) => ({ p, i }))
    .sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i)
    .slice(0, max)
    .map(({ p }) => p);
}

/**
 * Título SEO: proyecto + tipo en español + localidad si es verificable
 * ("Musa | Night Club — Aplicación web en Vigo"). El `template` del layout
 * añade " — Action"; el OG title la lleva escrita.
 */
export function projectSeoTitle(project: Project): string {
  const kind = projectCategoryLabel(project);
  return `${project.title} — ${kind}${project.location ? ` en ${project.location}` : ""}`;
}

export function projectMetadata(project: Project): Metadata {
  // ≤155 caracteres: algunas descripciones de `projects.ts` pasan de 200.
  const description = metaDescription(project.descriptionEs ?? project.description);
  const title = projectSeoTitle(project);
  const image = ogImage(`${title} — Action`, project.title);

  return {
    title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    // Sin caso redactado: fuera del índice (ver `hasCaseStudy`). `follow`
    // sigue repartiendo enlaces hacia la web del cliente y el resto del sitio.
    ...(!hasCaseStudy(project) && { robots: { index: false, follow: true } }),
    openGraph: {
      type: "article",
      locale: "es_ES",
      url: absoluteUrl(`/projects/${project.slug}`),
      siteName: "Action",
      title: `${title} — Action`,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Action`,
      description,
      images: [image],
    },
  };
}

/**
 * `CreativeWork` (el trabajo) + `BreadcrumbList`. El servicio de `about` es el
 * MISMO nodo que emite su landing (`/<landing>#service`), así Google ve un
 * grafo: proyecto → servicio → organización, en vez de un `Service` suelto
 * por ficha.
 */
export function buildProjectJsonLd(project: Project, post?: BlogPost) {
  const service = relatedService(project);
  const url = absoluteUrl(`/projects/${project.slug}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${url}#project`,
        url,
        mainEntityOfPage: url,
        name: project.title,
        description: project.descriptionEs ?? project.description,
        dateCreated: String(project.year),
        inLanguage: "es",
        creator: { "@id": ORGANIZATION_ID },
        isPartOf: { "@id": WEBSITE_ID },
        genre: projectCategoryLabel(project),
        about: {
          "@type": "Service",
          "@id": absoluteUrl(`${service.href}#service`),
          name: service.label,
          url: absoluteUrl(service.href),
          provider: { "@id": ORGANIZATION_ID },
        },
        ...(project.image !== PLACEHOLDER_IMAGE && { image: absoluteUrl(project.image) }),
        // El artículo que cuenta el caso (solo si está publicado; mismo @id que su BlogPosting).
        ...(post && { subjectOf: { "@id": `${absoluteUrl(`/blog/${post.slug}`)}#article` } }),
        ...(project.location && {
          locationCreated: {
            "@type": "Place",
            name: project.location,
            address: {
              "@type": "PostalAddress",
              addressLocality: project.location,
              addressCountry: "ES",
            },
          },
        }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Proyectos", item: absoluteUrl("/projects") },
          { "@type": "ListItem", position: 3, name: project.title, item: url },
        ],
      },
    ],
  };
}
