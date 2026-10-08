import type { Metadata } from "next";
import { PLACEHOLDER_IMAGE, hasCaseStudy, projects, type Project } from "@actiondev/shared";
import { projectCategoryLabel, relatedService } from "@/lib/project-case";
import { OG_IMAGE, SITE_URL, absoluteUrl } from "@/lib/seo";

/**
 * SEO de la ficha de proyecto (`/projects/[slug]`): una sola fuente para la
 * página de escritorio y la del árbol móvil v2 (`app/(m)/m/projects/[slug]`),
 * así que ambas emiten EXACTAMENTE el mismo `<title>`, canonical, robots,
 * Open Graph y JSON-LD.
 */

export function findProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
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
  const description = project.descriptionEs ?? project.description;
  const ogUrl = `${OG_IMAGE.url}?title=${encodeURIComponent(project.title)}`;

  const title = projectSeoTitle(project);

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
      images: [{ url: ogUrl, width: OG_IMAGE.width, height: OG_IMAGE.height }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Action`,
      description,
      images: [ogUrl],
    },
  };
}

export function buildProjectJsonLd(project: Project) {
  const service = relatedService(project);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": absoluteUrl(`/projects/${project.slug}`),
        url: absoluteUrl(`/projects/${project.slug}`),
        name: project.title,
        description: project.descriptionEs ?? project.description,
        dateCreated: String(project.year),
        inLanguage: "es",
        creator: { "@id": absoluteUrl("#organization") },
        isPartOf: { "@id": absoluteUrl("#website") },
        genre: projectCategoryLabel(project),
        about: {
          "@type": "Service",
          name: service.label,
          url: absoluteUrl(service.href),
          provider: { "@id": absoluteUrl("#organization") },
        },
        ...(project.image !== PLACEHOLDER_IMAGE && { image: absoluteUrl(project.image) }),
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
          { "@type": "ListItem", position: 2, name: "Trabajo", item: absoluteUrl("/projects") },
          {
            "@type": "ListItem",
            position: 3,
            name: project.title,
            item: absoluteUrl(`/projects/${project.slug}`),
          },
        ],
      },
    ],
  };
}
