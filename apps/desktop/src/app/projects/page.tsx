import type { Metadata } from "next";
import { StructuredData } from "@/components/seo/StructuredData";
import { SectionPage } from "@/components/layout/SectionPage";
import { Projects } from "@/components/sections/Projects";
import { ProjectsIndex } from "@/components/sections/ProjectsIndex";
import { BRAND, OG_IMAGE, absoluteUrl } from "@/lib/seo";

/**
 * /projects — antigua sección #projects de la home, movida a su propia ruta.
 * Server component: metadata + JSON-LD. Las secciones son client (GSAP).
 */
export const metadata: Metadata = {
  // Sin la marca: el `template` del layout raíz ya añade " — Action".
  title: "Proyectos",
  description:
    "Proyectos de desarrollo web y de aplicaciones de Action en Vigo: carrusel 3D de trabajos destacados e índice completo por categoría.",
  alternates: { canonical: "/projects" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/projects"),
    siteName: BRAND.name,
    title: "Proyectos — Action",
    description: "Trabajos destacados e índice completo de proyectos de Action.",
    images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height }],
  },
};

export default function ProjectsPage() {
  return (
    <SectionPage>
      <StructuredData kind="projects" />
      <div id="projects">
        <Projects />
        <ProjectsIndex />
      </div>
    </SectionPage>
  );
}
