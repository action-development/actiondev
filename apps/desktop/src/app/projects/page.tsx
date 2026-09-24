import type { Metadata } from "next";
import { StructuredData } from "@/components/seo/StructuredData";
import { BRAND, OG_IMAGE, absoluteUrl } from "@/lib/seo";
import { ArcadePage } from "./ArcadePage";

/**
 * /projects — sala recreativa 3D: un pasillo recto con una máquina por
 * proyecto a cada lado y, al fondo, la puerta de "Trabajemos juntos" que lleva
 * a /contact. Server component: metadata + JSON-LD. Todo lo interactivo vive
 * en ArcadePage.tsx (client).
 */
export const metadata: Metadata = {
  // Sin la marca: el `template` del layout raíz ya añade " — Action".
  title: "Proyectos",
  description:
    "Proyectos de desarrollo web y de aplicaciones de Action en Vigo: recorre la sala recreativa, una máquina por cada trabajo, o abre la lista completa.",
  alternates: { canonical: "/projects" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/projects"),
    siteName: BRAND.name,
    title: "Proyectos — Action",
    description: "Una máquina recreativa por cada proyecto de Action. Elige una y juega.",
    images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height }],
  },
};

export default function ProjectsPage() {
  return (
    <>
      <StructuredData kind="projects" />
      <ArcadePage />
    </>
  );
}
