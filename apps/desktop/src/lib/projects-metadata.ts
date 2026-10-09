import type { Metadata } from "next";
import { ORGANIZATION_ID, WEBSITE_ID, hasCaseStudy, projects } from "@actiondev/shared";
import { BUSINESS, SITE_NAME, SITE_URL, absoluteUrl, ogImage } from "@/lib/seo";

/**
 * Metadatos y JSON-LD del índice `/projects`: una sola fuente para la sala
 * recreativa de escritorio y la lista del árbol móvil v2.
 */
const TITLE = "Proyectos de desarrollo web y apps en Vigo";
const DESCRIPTION =
  "Apps, webs a medida y tiendas online hechas en Vigo para negocios de Vigo, Redondela, O Porriño y toda Galicia. Casos reales, uno por máquina recreativa.";

export const PROJECTS_METADATA: Metadata = {
  // Sin la marca: el `template` del layout raíz ya añade " — Action".
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/projects" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/projects"),
    siteName: SITE_NAME,
    title: `${TITLE} — Action`,
    description: "Una máquina recreativa por cada proyecto de Action. Elige una y juega.",
    images: [ogImage(`${TITLE} — Action`)],
  },
};

/**
 * `CollectionPage` + `ItemList` + `BreadcrumbList`. La lista lleva SOLO las
 * fichas indexables (`hasCaseStudy`, las mismas del sitemap): antes metía
 * también las 7 en `noindex`, con la imagen de relleno y el tipo en inglés.
 * Cada elemento es la URL de su ficha (patrón «página de resumen» de Google);
 * el detalle (`CreativeWork`) lo emite cada ficha con `lib/project-seo.ts`.
 */
export function buildProjectsJsonLd() {
  const url = absoluteUrl("/projects");
  const listed = projects.filter(hasCaseStudy);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: TITLE,
        description: DESCRIPTION,
        inLanguage: "es",
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": ORGANIZATION_ID },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        mainEntity: { "@id": `${url}#list` },
      },
      {
        "@type": "ItemList",
        "@id": `${url}#list`,
        name: `Proyectos de ${BUSINESS.alternateName}`,
        numberOfItems: listed.length,
        itemListElement: listed.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: p.title,
          url: absoluteUrl(`/projects/${p.slug}`),
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Proyectos", item: url },
        ],
      },
    ],
  };
}
