import type { Metadata } from "next";
import { BRAND, OG_IMAGE, absoluteUrl } from "@/lib/seo";

/**
 * Metadatos del índice `/projects`: una sola fuente para la sala recreativa
 * de escritorio y la lista del árbol móvil v2.
 */
export const PROJECTS_METADATA: Metadata = {
  // Sin la marca: el `template` del layout raíz ya añade " — Action".
  title: "Proyectos de desarrollo web y apps en Vigo",
  description:
    "Apps, webs a medida y tiendas online hechas en Vigo para negocios de Vigo, Redondela, O Porriño y toda Galicia. Casos reales, uno por máquina recreativa.",
  alternates: { canonical: "/projects" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/projects"),
    siteName: BRAND.name,
    title: "Proyectos de desarrollo web y apps en Vigo — Action",
    description: "Una máquina recreativa por cada proyecto de Action. Elige una y juega.",
    images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height }],
  },
};
