import type { Project } from "@actiondev/shared";
import { Label } from "./Cell";

/**
 * Banda negra de «Resultado» de la tarjeta de caso (DESIGN.md §7, `.case`):
 * cifra en lima a 76 px + qué mide. SOLO con una cifra real del repo
 * (`resultFigureEs` + `resultFigureLabelEs` de `projects.ts`); sin ella, nada.
 * La usan la home, la lista y la ficha de proyectos y las landings de campaña.
 */
export function ResultBand({ project, "data-testid": testId }: { project: Project; "data-testid"?: string }) {
  const { resultFigureEs: figure, resultFigureLabelEs: label } = project;
  if (!figure || !label) return null;
  return (
    <div
      data-testid={testId}
      className="on-ink grid grid-cols-[auto_1fr] items-center gap-x-3.5 gap-y-1 border-t border-ink bg-ink px-4 pt-4 pb-[18px] text-paper"
    >
      <span className="row-span-2 font-display text-[76px] font-black leading-[0.8] tracking-[-0.03em] text-lime">
        {figure}
      </span>
      <Label onInk>Resultado</Label>
      <p className="text-base leading-[1.35]">{label}</p>
    </div>
  );
}
