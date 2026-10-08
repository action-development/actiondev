/**
 * Pasos del proceso (DESIGN.md §7, `.steps`, `<ol>`): número 01-04 en una
 * columna de 72 px | título H3 + texto. El paso gratuito (la primera reunión,
 * `free`, índice desde 0) lleva la celda del número en lima. La usan la home y
 * las landings SEO.
 */
export function Steps({
  steps,
  free = 0,
  "data-testid": testId,
}: {
  steps: readonly { title: string; text: string }[];
  /** Índice del paso gratuito; `null` si ninguno lo es. */
  free?: number | null;
  "data-testid"?: string;
}) {
  return (
    <ol className="border-b-2 border-ink" data-testid={testId}>
      {steps.map((step, i) => (
        <li key={step.title} className="grid grid-cols-[72px_1fr] border-b border-ink last:border-b-0">
          <span
            className={`flex justify-center border-r border-ink pt-[18px] font-display text-[40px] font-black leading-[0.9] ${
              i === free ? "bg-lime" : ""
            }`}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="grid content-start gap-1.5 px-4 pt-[18px] pb-5">
            <h3 className="font-display text-h4 uppercase">{step.title}</h3>
            <p className="text-base leading-[1.42]">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
