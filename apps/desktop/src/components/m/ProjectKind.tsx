import type { Project } from "@actiondev/shared";
import { SERVICE_STYLE, Shape, type ServiceNeed, type ShapeKind } from "./Shape";

/**
 * Tipo de trabajo de un proyecto en la web móvil v2: UNA sola tabla de
 * `category` (`projects.ts`) a tipo, para la lista y la ficha de proyectos, los
 * casos de la home y los de las landings de campaña. Rótulos de las maquetas
 * aprobadas (`docs/mobile-v2/{home,proyectos,landing-app}.html`) y del
 * vocabulario de servicios de DESIGN.md §4: «App», «Programa de gestión»,
 * «Web», «Tienda online». Tono y forma, los del servicio (`SERVICE_STYLE`).
 *
 * «Web Application» es «Web»: en los datos son webs con reservas, entradas o
 * zona de clientes (La Fábrica, Musa, Samoa…), como las pinta la maqueta. El
 * tipo largo y descriptivo («Aplicación web», «Página web») sigue siendo
 * `projectCategoryLabel()` de `lib/project-case.ts`, el del `<title>` de la ficha.
 */

export type ProjectKind = "app" | "software" | "web" | "shop";

const KIND_BY_CATEGORY: Record<string, ProjectKind> = {
  "Mobile App": "app",
  "Desktop App": "software",
  "Web Application": "web",
  Website: "web",
  "Landing Page": "web",
  "E-commerce": "shop",
};

/**
 * Casos con más de un servicio, SOLO con respaldo en `projects.ts`. Autoescuela
 * GTI = «ERP a medida […] con una app móvil» (`descriptionEs`).
 */
const KINDS_BY_SLUG: Record<string, readonly ProjectKind[]> = {
  "autoescuela-gti": ["app", "software"],
};

export const KIND_INFO: Record<
  ProjectKind,
  { label: string; filter: string; need: ServiceNeed; shape: ShapeKind; tone: string; coverTone: string }
> = {
  app: { label: "App", filter: "Apps", need: "app", ...style("app") },
  software: { label: "Programa de gestión", filter: "Programas de gestión", need: "software", ...style("software") },
  web: { label: "Web", filter: "Webs", need: "web", ...style("web") },
  shop: { label: "Tienda online", filter: "Tiendas online", need: "web", ...style("web") },
};

/** Tono del chip = el del servicio; la portada generativa de una web va en gris (en papel no se vería). */
function style(need: ServiceNeed) {
  const { shape, tone } = SERVICE_STYLE[need];
  return { shape, tone, coverTone: need === "web" ? "bg-grey text-ink" : tone };
}

export const KIND_ORDER: readonly ProjectKind[] = ["app", "software", "web", "shop"];

/** Todos los tipos del proyecto, el principal primero. */
export function projectKinds(project: Project): readonly ProjectKind[] {
  return KINDS_BY_SLUG[project.slug] ?? [KIND_BY_CATEGORY[project.category] ?? "web"];
}

/** Tipo principal: decide el tono de la portada generativa. */
export function projectKind(project: Project): ProjectKind {
  return projectKinds(project)[0];
}

/** Chip de tipo (DESIGN.md §7, `.chip`): borde de 1 px, forma de 12 px y rótulo en caja alta. */
export function KindChip({ kind }: { kind: ProjectKind }) {
  const info = KIND_INFO[kind];
  return (
    <span
      data-testid="m-kind-chip"
      className={`inline-flex items-center gap-[7px] whitespace-nowrap border border-ink px-[9px] pt-[5px] pb-1 font-display text-[13px] font-extrabold uppercase leading-none tracking-[0.07em] ${info.tone}`}
    >
      <Shape kind={info.shape} size="sm" />
      {info.label}
    </span>
  );
}

/** Los chips de todos los tipos del proyecto. */
export function KindChips({ project }: { project: Project }) {
  return projectKinds(project).map((kind) => <KindChip key={kind} kind={kind} />);
}
