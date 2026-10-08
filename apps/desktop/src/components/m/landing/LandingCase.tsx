import type { ResolvedLandingCase } from "@/lib/landing-seo";
import { Label } from "../Cell";
import { Icon } from "../Icon";
import { MLink } from "../MLink";
import { KindChips } from "../ProjectKind";
import { ProjectCover } from "../ProjectParts";
import { ResultBand } from "../ResultBand";

/**
 * Caso real de una landing SEO (DESIGN.md §7, `.case`): portada a sangre →
 * título + chips de tipo + sector + flecha → la NOTA de la landing (el texto
 * indexable de escritorio, propio de cada landing: no se cambia por el
 * «Ahora» del proyecto) → banda de Resultado si el repo tiene cifra real.
 *
 * Toda la tarjeta enlaza a la ficha `/projects/{slug}` en la misma pestaña,
 * como en escritorio (aquí no hay anuncio que proteger).
 */
export function LandingCase({ item }: { item: ResolvedLandingCase }) {
  const { project, note } = item;
  const niche = project.nicheEs ?? project.categoryEs ?? project.category;
  return (
    <MLink
      href={`/projects/${project.slug}`}
      data-testid="m-landing-case"
      className="group block border-b-2 border-ink bg-paper"
    >
      <ProjectCover project={project} sizes="(max-width: 480px) 100vw, 480px" alt="" band />
      <span className="flex items-stretch border-b border-ink">
        <span className="grid min-w-0 flex-1 gap-2 px-4 pt-4 pb-3.5">
          <h3 className="font-display text-h3 break-words uppercase">{project.title}</h3>
          <span className="flex flex-wrap items-center gap-1.5">
            <KindChips project={project} />
            {niche && <Label>{niche}</Label>}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="flex w-16 flex-none items-center justify-center border-l border-ink group-hover:bg-lime group-active:bg-lime"
        >
          <Icon name="arrow_outward" size={30} />
        </span>
      </span>
      <span className="block px-4 pt-3.5 pb-5 text-base leading-[1.45]">
        <span>{note}</span>{" "}
        <span className="whitespace-nowrap font-display text-[15px] font-extrabold uppercase tracking-[0.05em] underline decoration-2 underline-offset-4">
          Ver el caso
        </span>
      </span>
      <ResultBand project={project} />
    </MLink>
  );
}
