import type { Metadata } from "next";
import { StructuredData } from "@/components/seo/StructuredData";
import { PROJECTS_METADATA } from "@/lib/projects-metadata";
import { ArcadePage } from "./ArcadePage";

/**
 * /projects — sala recreativa 3D: un pasillo recto con una máquina por
 * proyecto a cada lado y, al fondo, la puerta de "Trabajemos juntos" que lleva
 * a /contact. Server component: metadata + JSON-LD. Todo lo interactivo vive
 * en ArcadePage.tsx (client).
 */
export const metadata: Metadata = PROJECTS_METADATA;

export default function ProjectsPage() {
  return (
    <>
      <StructuredData kind="projects" />
      <ArcadePage />
    </>
  );
}
