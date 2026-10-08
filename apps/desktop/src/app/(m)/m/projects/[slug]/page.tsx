import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects } from "@actiondev/shared";
import { MobileFooter } from "@/components/m/MobileFooter";
import { MobileHeader } from "@/components/m/MobileHeader";
import { CASE_CTA_ID, ProjectCaseView } from "@/components/m/projects/ProjectCaseView";
import { projectNeighbors } from "@/components/m/projects/kinds";
import { StickyCta } from "@/components/m/StickyCta";
import { projectBlogPost } from "@/lib/project-blog";
import { buildProjectJsonLd, findProject, projectMetadata, relatedProjects } from "@/lib/project-seo";

/**
 * Ficha de proyecto en la web móvil v2 (maqueta `proyectos.html#ficha`).
 * `generateStaticParams`, `generateMetadata` (title = `proyecto — tipo [en
 * localidad]`, canonical, `noindex, follow` sin caso) y JSON-LD `CreativeWork`
 * vienen de `lib/project-seo.ts`, la MISMA fuente que la ficha de escritorio;
 * «Caso contado en el blog» (`lib/project-blog.ts`) y «Más proyectos»
 * (`relatedProjects`), también.
 */
interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

/** El artículo del caso sale de Firestore: como la ficha de escritorio. */
export const revalidate = 3600;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) return {};
  return projectMetadata(project);
}

export default async function MobileProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) notFound();
  const { prev, next } = projectNeighbors(slug);
  const post = await projectBlogPost(project.slug);
  const whatsappText = `Hola, vengo de vuestra web y quiero algo parecido a ${project.title}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildProjectJsonLd(project, post)) }}
      />
      <MobileHeader whatsappText={whatsappText} />
      <main id="main-content">
        <ProjectCaseView project={project} prev={prev} next={next} post={post} more={relatedProjects(project)} />
      </main>
      <MobileFooter whatsappText={whatsappText} />
      <StickyCta formId={CASE_CTA_ID} whatsappText={whatsappText} />
    </>
  );
}
