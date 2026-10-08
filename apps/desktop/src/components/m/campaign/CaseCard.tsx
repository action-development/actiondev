import Image from "next/image";
import type { Project } from "@actiondev/shared";
import type { ReactNode } from "react";
import { Label } from "../Cell";
import { Icon } from "../Icon";
import { KIND_INFO, KindChips, projectKind } from "../ProjectKind";
import { mediaFit, projectMedia } from "../project-media";
import { ResultBand } from "../ResultBand";
import { Shape } from "../Shape";

/**
 * Tarjeta de caso de las landings de campaña (`.case` de
 * `docs/mobile-v2/landing-app.html`): portada a sangre → título + chip de
 * servicio + flecha → «Antes / Ahora» → banda de resultado si hay cifra real.
 *
 * Abre la ficha `/projects/{slug}` en pestaña NUEVA, como en escritorio: quien
 * llega de un anuncio no pierde la landing.
 *
 * Imagen: `projectMedia()` (mockup 3:2 o captura 16:10; cambiar los mockups es
 * solo cambiar datos). Sin imagen real, portada generativa con el tono y la forma del
 * servicio — nunca una caja gris vacía. La usan `/hablemos/[oferta]` y
 * `/hablemos/gracias`.
 */

/** Celda «Antes» / «Ahora»: etiqueta de 12 px y frase en texto corrido (no en caja alta). */
function CaseCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-[1_1_160px] flex-col gap-1.5 bg-paper px-4 pt-3.5 pb-4">
      <Label>{label}</Label>
      <span className="text-base leading-[1.4]">{children}</span>
    </div>
  );
}

export function CaseCard({
  project,
  before,
  after,
  "data-testid": testId,
}: {
  project: Project;
  /** «Antes» verificado (`project.beforeEs`). Sin él, solo «Ahora». */
  before?: string;
  /** «Ahora»: `project.afterEs` o, sin él, el texto de la página (nota del caso). */
  after: string;
  "data-testid"?: string;
}) {
  const kind = KIND_INFO[projectKind(project)];
  const media = projectMedia(project);

  return (
    <a
      href={`/projects/${project.slug}`}
      target="_blank"
      rel="noopener"
      data-testid={testId}
      className="group block border-b-2 border-ink bg-paper"
    >
      {media ? (
        <figure className={`relative overflow-hidden border-b border-ink bg-grey ${media.aspect}`}>
          {/* Decorativa, como en escritorio: el nombre del caso ya es el H3 del enlace. */}
          <Image src={media.src} alt="" fill sizes="(max-width: 480px) 100vw, 480px" className={mediaFit(media)} />
        </figure>
      ) : (
        <div
          aria-hidden="true"
          className={`flex aspect-[3/1] flex-col justify-between border-b border-ink p-4 ${kind.coverTone}`}
        >
          <Shape kind={kind.shape} />
          <span className="font-display text-h3 uppercase">{project.nicheEs ?? kind.label}</span>
        </div>
      )}

      <div className="flex items-stretch border-b border-ink">
        <div className="grid min-w-0 flex-1 gap-2 px-4 pt-4 pb-3.5">
          <h3 className="font-display text-h3 uppercase">{project.title}</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <KindChips project={project} />
            {project.nicheEs && <Label>{project.nicheEs}</Label>}
          </div>
        </div>
        <span
          aria-hidden="true"
          className="flex w-16 flex-none items-center justify-center border-l border-ink group-hover:bg-lime group-active:bg-lime"
        >
          <Icon name="arrow_outward" size={30} />
        </span>
      </div>

      <div className="flex flex-wrap gap-px bg-ink">
        {before && <CaseCell label="Antes">{before}</CaseCell>}
        <CaseCell label="Ahora">{after}</CaseCell>
      </div>

      <ResultBand project={project} />
    </a>
  );
}
