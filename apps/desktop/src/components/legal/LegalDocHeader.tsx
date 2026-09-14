import { LEGAL_UPDATED } from "@/lib/seo";

/**
 * Cabecera común de cada documento legal: eyebrow, H1, entradilla y fecha de
 * última revisión. La fecha importa — un pliego público puede exigir que las
 * condiciones publicadas sean las vigentes en la fecha de la oferta.
 */

interface LegalDocHeaderProps {
  eyebrow: string;
  title: string;
  lede: string;
}

const UPDATED_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function LegalDocHeader({ eyebrow, title, lede }: LegalDocHeaderProps) {
  return (
    <header>
      <p className="micro-label">{eyebrow}</p>
      <h1 className="display-l mt-4 text-foreground">{title}</h1>
      <p className="lede mt-8">{lede}</p>
      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
        Última actualización:{" "}
        <time dateTime={LEGAL_UPDATED}>
          {UPDATED_FORMATTER.format(new Date(`${LEGAL_UPDATED}T00:00:00Z`))}
        </time>
      </p>
      <div className="hairline my-12" />
    </header>
  );
}
