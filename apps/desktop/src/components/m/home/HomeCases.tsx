import Image from "next/image";
import type { Project } from "@actiondev/shared";
import { projectCategoryLabel } from "@/lib/project-case";
import { Label } from "../Cell";
import { Icon } from "../Icon";
import { MLink } from "../MLink";
import { KindChips, projectKinds } from "../ProjectKind";
import { ResultBand } from "../ResultBand";
import { Section } from "../Section";
import { UnderlineLink } from "../UnderlineLink";
import { mediaFit, projectMedia } from "../project-media";
import { FEATURED_CASES, STRIP_CASES, caseKind, caseName, caseSector } from "./home-data";

/**
 * «Trabajo real» (DESIGN.md §7, `.case` + `.strip`): los casos con mockup de
 * `projects.ts`. Tarjeta = portada a sangre (mockup 3:2) → nombre + chips +
 * celda de flecha → Antes / Ahora (solo con
 * texto verificado; sin `beforeEs`, solo Ahora) → banda de Resultado si hay
 * cifra real. El enlace es el nombre (accesible y ancla SEO limpia) y se
 * estira a toda la tarjeta con `after:`.
 */
export function HomeCases() {
  return (
    <Section
      id="trabajo"
      title="Trabajo real"
      lead="Proyectos que ya están funcionando, y lo que cambió con cada uno."
      aside={
        <UnderlineLink href="/projects" data-testid="m-home-projects-all">
          Ver todos
        </UnderlineLink>
      }
      data-testid="m-home-cases"
    >
      {FEATURED_CASES.map((project) => (
        <CaseCard key={project.slug} project={project} />
      ))}
      {STRIP_CASES.length > 0 && <CaseStrip projects={STRIP_CASES} />}
    </Section>
  );
}

function CaseCard({ project }: { project: Project }) {
  const name = caseName(project);
  // Con dos chips (Autoescuela GTI) no cabe también el sector.
  const sector = projectKinds(project).length === 1 ? caseSector(project) : undefined;
  const media = projectMedia(project);

  return (
    <article data-testid="m-case" className="group relative border-b-2 border-ink bg-paper">
      {media && (
        <div className={`relative overflow-hidden border-b border-ink bg-grey ${media.aspect}`}>
          <Image
            src={media.src}
            alt={`${projectCategoryLabel(project)} de ${name}`}
            fill
            sizes="(max-width: 480px) 100vw, 480px"
            className={mediaFit(media)}
          />
        </div>
      )}

      <div className="flex items-stretch border-b border-ink">
        <div className="grid min-w-0 flex-1 gap-2 px-4 pt-4 pb-3.5">
          <h3 className="font-display text-h3 uppercase">
            <MLink
              href={`/projects/${project.slug}`}
              data-testid="m-case-link"
              className="after:absolute after:inset-0 after:content-['']"
            >
              {name}
            </MLink>
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <KindChips project={project} />
            {sector && <Label className="ml-1">{sector}</Label>}
          </div>
        </div>
        <span
          aria-hidden="true"
          className="flex w-16 shrink-0 items-center justify-center border-l border-ink group-hover:bg-lime group-active:bg-lime"
        >
          <Icon name="arrow_outward" size={30} />
        </span>
      </div>

      <div className="flex flex-wrap gap-px bg-ink">
        {project.beforeEs && (
          <p className="flex min-w-0 flex-[1_1_160px] flex-col gap-1.5 bg-paper px-4 pt-3.5 pb-4">
            <Label>Antes</Label>
            <span>{project.beforeEs}</span>
          </p>
        )}
        {project.afterEs && (
          <p className="flex min-w-0 flex-[1_1_160px] flex-col gap-1.5 bg-paper px-4 pt-3.5 pb-4">
            <Label>Ahora</Label>
            <span>{project.afterEs}</span>
          </p>
        )}
      </div>

      <ResultBand project={project} />
    </article>
  );
}

/** Tira horizontal con *snap* (`.strip`): tarjetas de 232 px con el mockup vertical 4:5. */
function CaseStrip({ projects }: { projects: Project[] }) {
  return (
    <ul
      aria-label="Más proyectos"
      data-testid="m-case-strip"
      className="grid snap-x snap-mandatory auto-cols-[232px] grid-flow-col gap-px overflow-x-auto border-b-2 border-ink bg-ink [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {projects.map((project) => {
        const media = projectMedia(project, { vertical: true });
        return (
          <li key={project.slug} className="flex snap-start bg-paper">
            <MLink
              href={`/projects/${project.slug}`}
              data-testid="m-case-link"
              className="group flex w-full flex-col hover:bg-ink hover:text-paper active:bg-ink active:text-paper"
            >
              {media && (
                <span className={`relative block overflow-hidden border-b border-ink bg-grey ${media.aspect}`}>
                  <Image src={media.src} alt="" fill sizes="232px" className={mediaFit(media)} />
                </span>
              )}
              <span className="grid gap-1 px-3.5 pt-3 pb-3.5">
                <span className="font-display text-value uppercase">{caseName(project)}</span>
                <span className="text-sm leading-[1.4] text-muted group-hover:text-muted-dark group-active:text-muted-dark">
                  {caseKind(project)}
                </span>
              </span>
            </MLink>
          </li>
        );
      })}
    </ul>
  );
}
