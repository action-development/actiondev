import type { Landing } from "@/data/landings";
import { Icon } from "../Icon";
import { MLink } from "../MLink";

const rowClass =
  "flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3.5 font-display text-[19px] font-extrabold uppercase leading-[1.1] tracking-[0.02em] hover:bg-ink hover:text-paper active:bg-ink active:text-paper";

/**
 * «Servicios relacionados»: el enlazado interno entre landings de escritorio,
 * con las MISMAS anclas (`related[].label`, distintas en cada landing a
 * propósito) y «Todos los servicios» → `/servicios`. Filas a sangre separadas
 * por filetes; al pulsar se invierten.
 */
export function LandingRelated({ landing }: { landing: Landing }) {
  return (
    <nav aria-labelledby="m-landing-related-title" data-testid="m-landing-related">
      <h2
        id="m-landing-related-title"
        className="border-b-2 border-ink px-4 pt-10 pb-4 font-display text-h3 uppercase"
      >
        Servicios relacionados
      </h2>
      <ul className="grid gap-px border-b-2 border-ink bg-ink">
        {landing.related.map((rel) => (
          <li key={rel.slug} className="flex bg-paper">
            <MLink href={`/${rel.slug}`} data-testid="m-landing-related-link" className={rowClass}>
              <span className="min-w-0 text-balance">{rel.label}</span>
              <Icon name="arrow_outward" size={24} />
            </MLink>
          </li>
        ))}
        <li className="flex bg-grey">
          <MLink href="/servicios" data-testid="m-landing-related-all" className={rowClass}>
            <span>Todos los servicios</span>
            <Icon name="arrow_outward" size={24} />
          </MLink>
        </li>
      </ul>
    </nav>
  );
}
