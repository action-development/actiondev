import type { Landing } from "@/data/landings";
import { Icon } from "../Icon";
import { MLink } from "../MLink";

/**
 * Enlaces a las landings SEO de un grupo, todos visibles (regla de oro SEO).
 * `MLink` elige: `<Link>` si la landing tiene árbol móvil publicado, `<a>` si
 * aún la sirve el escritorio. Cada fila: H3 + `hubSummary` (NO la meta description) +
 * flecha. Al pulsar se invierte a tinta (DESIGN.md §8).
 */
export function LandingLinks({ landings, groupId }: { landings: Landing[]; groupId: string }) {
  return (
    <ul className="grid gap-px border-b-2 border-ink bg-ink" data-testid={`m-landings-${groupId}`}>
      {landings.map((landing) => (
        <li key={landing.slug} className="bg-paper">
          <MLink
            href={`/${landing.slug}`}
            data-testid="m-landing-link"
            className="group grid min-h-[116px] grid-cols-[1fr_52px] bg-paper text-ink hover:bg-ink hover:text-paper active:bg-ink active:text-paper"
          >
            <span className="grid min-w-0 content-start gap-2 px-4 py-[18px]">
              <h3 className="font-display text-h4 uppercase">{landing.h1}</h3>
              <span className="text-base leading-[1.4]">{landing.hubSummary}</span>
            </span>
            <span className="flex items-end justify-center pb-[18px]">
              <Icon name="arrow_outward" size={28} />
            </span>
          </MLink>
        </li>
      ))}
    </ul>
  );
}
