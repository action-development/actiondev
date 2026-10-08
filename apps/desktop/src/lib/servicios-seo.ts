import type { Metadata } from "next";
import type { Landing } from "@/data/landings";
import { OG_IMAGE, absoluteUrl } from "@/lib/seo";

/**
 * Hub /servicios: grupos, metadatos y JSON-LD. Fuente ÚNICA compartida por la
 * página de escritorio (`app/(site)/servicios`) y la móvil (`app/(m)/m/servicios`):
 * paridad SEO por construcción. Extraído sin cambios de la página de escritorio.
 */

export const SERVICIOS_GROUPS: { id: Landing["group"]; title: string; text: string }[] = [
  {
    id: "servicio",
    title: "Por servicio",
    text: "Lo que hacemos, explicado con casos reales. Todas estas páginas parten de nuestra oficina de Vigo, que es donde más clientes tenemos.",
  },
  {
    id: "zona",
    title: "Por zona",
    text: "Cómo trabajamos fuera de Vigo: la provincia de Pontevedra, Redondela y el resto de Galicia, con los clientes que tenemos en cada sitio.",
  },
];

export const SERVICIOS_METADATA: Metadata = {
  title: "Servicios: Apps, Software a Medida y Webs",
  description:
    "Apps, software a medida, webs y tiendas online desde Vigo para empresas de Pontevedra, Redondela y toda Galicia. Casos reales enlazados en cada servicio.",
  alternates: { canonical: "/servicios" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/servicios"),
    siteName: "Action",
    title: "Servicios: Apps, Software a Medida y Webs — Action",
    description:
      "Desarrollo de aplicaciones, software a medida, desarrollo y diseño web y tiendas online para empresas de Vigo, Pontevedra y Galicia.",
    images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height }],
  },
};

export const SERVICIOS_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": absoluteUrl("/servicios"),
      url: absoluteUrl("/servicios"),
      name: "Servicios de Action — Desarrollo de aplicaciones y diseño web",
      inLanguage: "es",
      isPartOf: { "@id": absoluteUrl("#website") },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
        {
          "@type": "ListItem",
          position: 2,
          name: "Servicios",
          item: absoluteUrl("/servicios"),
        },
      ],
    },
  ],
};
