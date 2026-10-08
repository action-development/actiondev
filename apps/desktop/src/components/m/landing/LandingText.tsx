/**
 * Párrafos de una landing (intro, contexto local y secciones propias), a
 * sangre bajo su titular: Semi Condensed de 17 px con 1,5 de interlineado y
 * medianil de 16 px. Es el texto indexable de escritorio, entero y visible.
 */
export function LandingText({ paragraphs, className = "" }: { paragraphs: readonly string[]; className?: string }) {
  return (
    <div className={`grid gap-4 border-b-2 border-ink px-4 pt-6 pb-9 text-[17px] leading-[1.5] ${className}`}>
      {paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 32)} className="max-w-[40em]">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
