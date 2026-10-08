import type { Metadata } from "next";
import { ORGANIZATION_ID, WEBSITE_ID } from "@actiondev/shared";
import { landings, type Landing } from "@/data/landings";
import { SITE_URL, absoluteUrl, ogImage } from "@/lib/seo";

/**
 * Hub /servicios: grupos, metadatos y JSON-LD. Fuente ÚNICA compartida por la
 * página de escritorio (`app/(site)/servicios`) y la móvil (`app/(m)/m/servicios`):
 * paridad SEO por construcción. Extraído sin cambios de la página de escritorio.
 */

/** H1 de /servicios (escritorio y móvil): plan de contenidos 2026-10-08, §5.2. */
export const SERVICIOS_H1 = "Servicios de desarrollo de apps, software y webs en Vigo";

/** Guía del blog enlazada bajo un grupo. SOLO posts publicados: un borrador daría 404. */
export interface ServiciosGuide {
  href: `/blog/${string}`;
  label: string;
}

export const SERVICIOS_GROUPS: {
  id: Landing["group"];
  title: string;
  text: string;
  /** 1-2 guías del blog, las de más búsquedas del bloque (hub → spokes). */
  guides: ServiciosGuide[];
}[] = [
  {
    id: "servicio",
    title: "Por servicio",
    text: "Lo que hacemos, explicado con casos reales. Todas estas páginas parten de nuestra oficina de Vigo, que es donde más clientes tenemos.",
    guides: [
      { href: "/blog/cuanto-cuesta-desarrollar-una-app", label: "¿Cuánto cuesta crear una app?" },
      { href: "/blog/app-para-empleados-partes-fichajes", label: "App para fichar y partes de trabajo" },
    ],
  },
  {
    id: "zona",
    title: "Por zona",
    text: "Cómo trabajamos fuera de Vigo: la provincia de Pontevedra, Redondela y el resto de Galicia, con los clientes que tenemos en cada sitio.",
    guides: [
      {
        href: "/blog/como-elegir-agencia-desarrollo-web-galicia",
        label: "Cómo elegir agencia de desarrollo web en Galicia",
      },
      { href: "/blog/como-salir-en-google-maps-vigo", label: "Cómo salir en Google Maps con un negocio en Vigo" },
    ],
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
    images: [ogImage("Servicios: Apps, Software a Medida y Webs — Action")],
  },
};

const SERVICIOS_URL = absoluteUrl("/servicios");

/**
 * `CollectionPage` cuyo `mainEntity` es la lista de servicios: cada elemento
 * es el MISMO nodo `Service` que emite su landing (`/<landing>#service`), en
 * el orden de la página (por servicio, luego por zona).
 */
export const SERVICIOS_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": SERVICIOS_URL,
      url: SERVICIOS_URL,
      name: "Servicios de Action — Desarrollo de aplicaciones y diseño web",
      inLanguage: "es",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORGANIZATION_ID },
      breadcrumb: { "@id": `${SERVICIOS_URL}#breadcrumb` },
      mainEntity: { "@id": `${SERVICIOS_URL}#services` },
    },
    {
      "@type": "ItemList",
      "@id": `${SERVICIOS_URL}#services`,
      numberOfItems: landings.length,
      itemListElement: SERVICIOS_GROUPS.flatMap((group) => landings.filter((l) => l.group === group.id)).map(
        (landing, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Service",
            "@id": absoluteUrl(`/${landing.slug}#service`),
            name: landing.serviceName,
            url: absoluteUrl(`/${landing.slug}`),
          },
        }),
      ),
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${SERVICIOS_URL}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Servicios", item: SERVICIOS_URL },
      ],
    },
  ],
};
