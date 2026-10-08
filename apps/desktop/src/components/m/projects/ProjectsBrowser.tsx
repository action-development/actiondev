import Image from "next/image";
import type { Project } from "@actiondev/shared";
import { Icon } from "../Icon";
import { MLink } from "../MLink";
import { KIND_INFO, KIND_ORDER, KindChips, projectKind, projectKinds } from "../ProjectKind";
import { ResultBand } from "../ResultBand";
import { Section } from "../Section";
import { Shape } from "../Shape";
import { BeforeAfter, ProjectCover } from "../ProjectParts";
import { projectSubtitle, projectTiers } from "./kinds";
import "./projects.css";

/**
 * Lista de proyectos de la web móvil v2 (DESIGN.md §7: filtro, tarjeta de caso,
 * cuadrícula de capturas). Server component sin JS en cliente: el filtro son
 * radios + `:has()` (ver `projects.css`) porque (1) todos los enlaces tienen que
 * estar en el HTML que recibe Googlebot, visibles con «Todos» por defecto,
 * (2) no hay estado que hidratar ni bundle que pagar, y (3) los radios dan
 * teclado (flechas) y lector de pantalla gratis. `:has()` va en iOS 15.4+.
 *
 * El filtro es UNA fila con scroll horizontal (con los rótulos en plural ocupaba
 * 3 filas a 390 px); `min-w-0` en el `fieldset` es obligatorio (su `min-width`
 * por defecto es `min-content` y desbordaría la página).
 *
 * Tres niveles: tarjetas grandes (mockup o destacado con captura), cuadrícula
 * de capturas y, al final, «Más proyectos» en texto para los que solo tienen
 * `placeholder.webp` (sin caja gris vacía).
 */

const FILTERS = [{ id: "all", label: "Todos" }, ...KIND_ORDER.map((id) => ({ id, label: KIND_INFO[id].filter }))] as const;

function Arrow({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex items-center justify-center border-l border-ink group-hover:bg-lime group-active:bg-lime ${className}`}
    >
      <Icon name="arrow_outward" size={30} />
    </span>
  );
}

/** Tipos del proyecto para el filtro CSS (`[data-kind~=…]`): un caso puede tener dos. */
const dataKind = (project: Project) => projectKinds(project).join(" ");

function ProjectCard({ project, priority }: { project: Project; priority: boolean }) {
  const subtitle = projectSubtitle(project);
  const hasFacts = Boolean(project.beforeEs || project.afterEs);
  return (
    <li data-kind={dataKind(project)} className="border-b-2 border-ink">
      <MLink href={`/projects/${project.slug}`} className="group block bg-paper" data-testid="m-project-link">
        <ProjectCover project={project} sizes="(min-width: 640px) 640px, 100vw" priority={priority} />
        <div className="flex items-stretch border-b border-ink">
          <div className="grid min-w-0 flex-1 content-start gap-2 px-4 pt-4 pb-3.5">
            <h2 className="font-display text-h3 break-words uppercase">{project.title}</h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <KindChips project={project} />
              {subtitle && <span className="font-display text-label uppercase text-muted">{subtitle}</span>}
            </div>
          </div>
          <Arrow className="w-16" />
        </div>
        {hasFacts ? (
          <BeforeAfter project={project} />
        ) : (
          <div className="px-4 pt-3.5 pb-4">
            <p className="line-clamp-3 text-[16.5px] leading-[1.45]">{project.descriptionEs ?? project.description}</p>
          </div>
        )}
        <ResultBand project={project} />
      </MLink>
    </li>
  );
}

function ProjectTile({ project }: { project: Project }) {
  const subtitle = projectSubtitle(project);
  return (
    <li data-kind={dataKind(project)} className="border-r border-b border-ink">
      <MLink href={`/projects/${project.slug}`} className="group flex h-full flex-col bg-paper" data-testid="m-project-link">
        <div className="relative aspect-[16/10] overflow-hidden border-b border-ink bg-grey">
          <Image
            src={project.image}
            alt={`${project.title}: captura`}
            fill
            sizes="(min-width: 640px) 320px, 50vw"
            className="object-cover object-top"
          />
        </div>
        <span className="grid min-w-0 gap-[3px] px-3 pt-2.5 pb-3.5 group-hover:bg-lime group-active:bg-lime">
          <span className="font-display text-[18px] leading-[1.1] font-extrabold break-words uppercase">{project.title}</span>
          {subtitle && <span className="text-[14px] leading-[1.35] text-muted">{subtitle}</span>}
        </span>
      </MLink>
    </li>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const info = KIND_INFO[projectKind(project)];
  const subtitle = projectSubtitle(project);
  return (
    <li data-kind={dataKind(project)} className="border-b border-ink">
      <MLink
        href={`/projects/${project.slug}`}
        className="group grid min-h-16 grid-cols-[1fr_56px] bg-paper"
        data-testid="m-project-link"
      >
        <span className="grid min-w-0 content-center gap-1.5 px-4 py-3.5">
          <span className="font-display text-h4 break-words uppercase">{project.title}</span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] leading-[1.35] text-muted">
            <span className="inline-flex items-center gap-1.5 font-display text-[13px] font-extrabold uppercase tracking-[0.07em] text-ink">
              <Shape kind={info.shape} size="sm" />
              {info.label}
            </span>
            {subtitle}
          </span>
        </span>
        <Arrow />
      </MLink>
    </li>
  );
}

export function ProjectsBrowser() {
  const { big, tiles, text } = projectTiers();
  return (
    <div className="pf" data-testid="m-projects">
      <fieldset className="flex min-w-0 snap-x scroll-px-4 gap-1.5 overflow-x-auto overscroll-x-contain border-b-2 border-ink px-4 py-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-testid="m-projects-filter">
        <legend className="sr-only">Filtrar por tipo de trabajo</legend>
        {FILTERS.map((filter) => {
          const shape = filter.id === "all" ? null : KIND_INFO[filter.id].shape;
          return (
            <span key={filter.id} className="contents">
              <input
                type="radio"
                name="pf"
                id={`pf-${filter.id}`}
                defaultChecked={filter.id === "all"}
                className="peer sr-only"
              />
              <label
                htmlFor={`pf-${filter.id}`}
                data-testid={`m-filter-${filter.id}`}
                className="inline-flex min-h-11 shrink-0 cursor-pointer snap-start items-center gap-2 border-2 border-ink px-3.5 font-display text-[16px] font-extrabold tracking-[0.06em] whitespace-nowrap uppercase peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink active:bg-lime active:text-ink"
              >
                {shape && <Shape kind={shape} size="sm" />}
                {filter.label}
              </label>
            </span>
          );
        })}
      </fieldset>

      <div data-block>
        <ul>
          {big.map((project, i) => (
            <ProjectCard key={project.slug} project={project} priority={i === 0} />
          ))}
        </ul>
      </div>

      <div data-block>
        <Section id="otros-trabajos" title="Otros trabajos">
          <div className="overflow-x-clip border-b border-ink">
            <ul className="-mr-px grid grid-cols-2">
              {tiles.map((project) => (
                <ProjectTile key={project.slug} project={project} />
              ))}
            </ul>
          </div>
        </Section>
      </div>

      <div data-block>
        <Section id="mas-proyectos" title="Más proyectos">
          <ul className="border-b-2 border-ink">
            {text.map((project) => (
              <ProjectRow key={project.slug} project={project} />
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
