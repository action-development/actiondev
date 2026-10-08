import type { BlogPost, Project } from "@actiondev/shared";
import { projectCase, relatedService } from "@/lib/project-case";
import { Cell, Cells, Label } from "../Cell";
import { Button } from "../Button";
import { Icon } from "../Icon";
import { MLink } from "../MLink";
import { PROJECT_CTA_HREF, PROJECT_CTA_LABEL } from "../nav";
import { KIND_INFO, KindChips, projectKinds } from "../ProjectKind";
import { ResultBand } from "../ResultBand";
import { BeforeAfter, ProjectCover } from "../ProjectParts";
import { hasRealImage } from "../project-media";

/** Id del CTA final: `StickyCta` (`formId`) oculta la barra mientras está a la vista. */
export const CASE_CTA_ID = "ficha-cta";

function Video({ project, className = "" }: { project: Project; className?: string }) {
  return (
    <video
      controls
      playsInline
      preload="none"
      poster={hasRealImage(project) ? project.image : undefined}
      aria-label={`Vídeo de ${project.title}`}
      className={`block aspect-[16/10] w-full bg-ink object-cover ${className}`}
    >
      <source src={project.video} type="video/webm" />
    </video>
  );
}

function Neighbour({ project, dir }: { project: Project; dir: "prev" | "next" }) {
  const prev = dir === "prev";
  return (
    <MLink
      href={`/projects/${project.slug}`}
      data-testid={`m-case-${dir}`}
      className={`group grid border-b border-ink bg-paper ${prev ? "grid-cols-[64px_1fr]" : "grid-cols-[1fr_64px]"}`}
    >
      {prev && (
        <span aria-hidden="true" className="flex items-center justify-center border-r border-ink group-hover:bg-lime group-active:bg-lime">
          <Icon name="arrow_back" size={30} />
        </span>
      )}
      <span className="grid min-w-0 gap-1.5 px-4 py-[18px]">
        <span className="font-display text-label uppercase text-muted">
          {prev ? "Proyecto anterior" : "Siguiente proyecto"}
        </span>
        <span className="font-display text-h3 break-words uppercase">{project.title}</span>
      </span>
      {!prev && (
        <span aria-hidden="true" className="on-ink flex items-center justify-center border-l border-ink bg-ink text-paper group-hover:bg-lime group-hover:text-ink group-active:bg-lime group-active:text-ink">
          <Icon name="arrow_forward" size={30} />
        </span>
      )}
    </MLink>
  );
}

/** Fila de «Más proyectos»: tipo y localidad, nombre (`<h3>`) y descripción; un enlace con filete. */
function ProjectRow({ project }: { project: Project }) {
  const kinds = projectKinds(project).map((k) => KIND_INFO[k].label).join(" + ");
  return (
    <li className="border-b border-ink last:border-b-2">
      <MLink
        href={`/projects/${project.slug}`}
        data-testid="m-case-more-link"
        className="group grid grid-cols-[1fr_52px] bg-paper text-ink hover:bg-ink hover:text-paper active:bg-ink active:text-paper"
      >
        <span className="grid min-w-0 content-start gap-2 px-4 pt-[18px] pb-5">
          <Label className="group-hover:text-muted-dark group-active:text-muted-dark">
            {kinds}
            {project.location ? ` · ${project.location}` : ""}
          </Label>
          <h3 className="font-display text-h4 break-words uppercase">{project.title}</h3>
          <span className="text-base leading-[1.42]">{project.descriptionEs ?? project.description}</span>
        </span>
        <span className="flex items-start justify-center pt-[18px]">
          <Icon name="arrow_outward" size={26} />
        </span>
      </MLink>
    </li>
  );
}

/**
 * Ficha de un proyecto (DESIGN.md §7, «Tarjeta de caso» ampliada; maqueta
 * `proyectos.html#ficha`). Server component. El contenido sale de `Project` y
 * de `projectCase` (el mismo que la ficha de escritorio): «Qué nos pidieron»
 * y «Qué conseguimos» como `<h2>`, Antes/Ahora solo si hay texto verificado,
 * «Ver web» solo con URL real y el vídeo bajo demanda (`preload="none"`).
 * Enlazado interno IGUAL que escritorio: «Caso contado en el blog» (`post`, solo
 * si está publicado), «Servicio relacionado» y «Más proyectos» (`more`,
 * `relatedProjects`); además, anterior y siguiente.
 */
export function ProjectCaseView({
  project,
  prev,
  next,
  post,
  more,
}: {
  project: Project;
  prev: Project;
  next: Project;
  post?: BlogPost;
  more: Project[];
}) {
  const { brief, result } = projectCase(project);
  const service = relatedService(project);
  const niche = project.nicheEs ?? project.niche;
  const hasUrl = project.url !== "#";
  // Con vídeo y sin mockup, el vídeo ES la portada (con la captura de póster);
  // con mockup, la portada es el mockup y el vídeo va aparte.
  const videoAsHero = Boolean(project.video) && !project.mockup;

  const facts: { label: string; value: string }[] = [
    ...(niche ? [{ label: "Sector", value: niche }] : []),
    // Mismos tipos que los chips (`ProjectKind.tsx`): «App + Programa de gestión», «Web»…
    { label: "Qué hicimos", value: projectKinds(project).map((k) => KIND_INFO[k].label).join(" + ") },
    ...(project.location ? [{ label: "Localidad", value: project.location }] : []),
  ];

  return (
    <article aria-labelledby="ficha-title">
      <nav aria-label="Migas" className="flex items-stretch border-b border-ink">
        <MLink
          href="/projects"
          className="flex min-h-12 items-center gap-2 border-r border-ink px-4 font-display text-[15px] font-extrabold tracking-[0.08em] uppercase hover:bg-ink hover:text-paper active:bg-ink active:text-paper"
        >
          <Icon name="arrow_back" size={20} />
          Proyectos
        </MLink>
        <span className="flex items-center px-4 font-display text-label uppercase text-muted">Caso</span>
      </nav>

      <header className="grid gap-3 border-b border-ink px-4 pt-[22px] pb-5">
        <h1 id="ficha-title" className="font-display text-h1 break-words uppercase">
          {project.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <KindChips project={project} />
        </div>
      </header>

      {videoAsHero ? (
        <Video project={project} className="border-b border-ink" />
      ) : (
        <ProjectCover project={project} sizes="(min-width: 640px) 640px, 100vw" priority vertical />
      )}

      {hasUrl && (
        <div className="border-b border-ink px-4 py-3">
          <MLink
            href={project.url}
            className="inline-flex min-h-11 items-center gap-2 border-b-[3px] border-current font-display text-[17px] leading-none font-extrabold tracking-[0.06em] uppercase active:bg-lime"
          >
            Ver web<span className="sr-only"> de {project.title} (se abre en otra pestaña)</span>
            <Icon name="arrow_outward" size={18} />
          </MLink>
        </div>
      )}

      <Cells>
        {facts.map((fact, i) => (
          <Cell key={fact.label} label={fact.label} full={facts.length % 2 === 1 && i === facts.length - 1}>
            {fact.value}
          </Cell>
        ))}
      </Cells>

      {(project.beforeEs || project.afterEs) && (
        <section aria-labelledby="ficha-antes" className="border-b-2 border-ink">
          <h2 id="ficha-antes" className="sr-only">
            Antes y ahora
          </h2>
          <BeforeAfter project={project} />
        </section>
      )}

      <section aria-labelledby="ficha-pidieron">
        <h2 id="ficha-pidieron" className="font-display text-h3 uppercase px-4 pt-7 pb-3">
          Qué nos pidieron
        </h2>
        <ul className="border-t border-ink">
          {brief.map((objective) => (
            <li key={objective} className="grid grid-cols-[28px_1fr] items-start gap-3 border-b border-ink px-4 py-3.5 text-[17px] leading-[1.4]">
              <Icon name="check" size={26} className="-mt-px" />
              <span>{objective}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ficha-conseguimos">
        <h2 id="ficha-conseguimos" className="font-display text-h3 uppercase px-4 pt-7 pb-3">
          Qué conseguimos
        </h2>
        <p className="max-w-[36ch] px-4 pb-6 text-[18px] leading-[1.45]">{result}</p>
        <ResultBand project={project} data-testid="m-case-result" />
      </section>

      {project.video && !videoAsHero && (
        <figure className="border-t-2 border-ink">
          <Video project={project} />
          <figcaption className="border-b border-ink px-4 pt-2.5 pb-3 text-[14px] text-muted">
            {project.title} en movimiento.
          </figcaption>
        </figure>
      )}

      {post && (
        <section aria-labelledby="ficha-blog" className="border-t-2 border-ink">
          <h2 id="ficha-blog" className="font-display text-h3 uppercase px-4 pt-7 pb-3">
            Caso contado en el blog
          </h2>
          <MLink
            href={`/blog/${post.slug}`}
            data-testid="m-case-blog"
            className="group grid grid-cols-[1fr_64px] border-y border-ink bg-paper"
          >
            <span className="grid min-w-0 gap-2 px-4 py-[18px]">
              <span className="font-display text-h4 break-words uppercase">{post.h1}</span>
              <span className="text-base leading-[1.42]">{post.excerpt}</span>
            </span>
            <span
              aria-hidden="true"
              className="flex items-center justify-center border-l border-ink group-hover:bg-lime group-active:bg-lime"
            >
              <Icon name="arrow_outward" size={30} />
            </span>
          </MLink>
        </section>
      )}

      <section aria-labelledby="ficha-servicio" className="border-t-2 border-ink">
        <h2 id="ficha-servicio" className="font-display text-h3 uppercase px-4 pt-7 pb-3">
          Servicio relacionado
        </h2>
        <MLink
          href={service.href}
          data-testid="m-case-service"
          className="group grid grid-cols-[1fr_64px] border-y border-ink bg-paper"
        >
          <span className="px-4 py-[18px] font-display text-h4 uppercase">{service.label}</span>
          <span
            aria-hidden="true"
            className="flex items-center justify-center border-l border-ink group-hover:bg-lime group-active:bg-lime"
          >
            <Icon name="arrow_outward" size={30} />
          </span>
        </MLink>
      </section>

      {more.length > 0 && (
        <nav aria-labelledby="ficha-mas" data-testid="m-case-more" className="mt-10">
          <h2 id="ficha-mas" className="border-b-2 border-ink px-4 pt-7 pb-3 font-display text-h3 uppercase">
            Más proyectos
          </h2>
          <ul>
            {more.map((item) => (
              <ProjectRow key={item.slug} project={item} />
            ))}
          </ul>
        </nav>
      )}

      <section
        id={CASE_CTA_ID}
        aria-labelledby="ficha-cta-title"
        className="mt-10 grid gap-3.5 border-y-2 border-ink bg-lime px-4 pt-8 pb-6"
      >
        <h2 id="ficha-cta-title" className="font-display text-h2 uppercase">
          ¿Quieres algo parecido?
        </h2>
        <p className="max-w-[34ch] text-lead">Cuéntanoslo. La primera reunión es gratis y sin compromiso.</p>
        <Button href={PROJECT_CTA_HREF} data-testid="m-case-cta">
          {PROJECT_CTA_LABEL}
        </Button>
      </section>

      <nav aria-label="Otros proyectos">
        <Neighbour project={prev} dir="prev" />
        <Neighbour project={next} dir="next" />
      </nav>
    </article>
  );
}
