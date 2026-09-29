"use client";

import type { BlogFaq } from "@actiondev/shared";

/**
 * Lista editable de preguntas frecuentes del post. Se pintan visibles al final
 * del artículo y alimentan el FAQPage del JSON-LD — por eso una pregunta sin
 * respuesta (o al revés) se descarta al guardar (`cleanPostInput`).
 */
export function FaqEditor({
  faqs,
  onChange,
}: {
  faqs: BlogFaq[];
  onChange: (faqs: BlogFaq[]) => void;
}) {
  function update(index: number, patch: Partial<BlogFaq>) {
    onChange(faqs.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  return (
    <div className="flex flex-col gap-4">
      {faqs.length === 0 && (
        <p className="rounded-[var(--radius-md)] border border-dashed border-border p-5 text-center text-sm text-muted">
          Sin preguntas. Con 3-5 preguntas reales que haga un cliente basta.
        </p>
      )}

      {faqs.map((faq, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Pregunta {index + 1}
            </span>
            <button
              type="button"
              onClick={() => onChange(faqs.filter((_, i) => i !== index))}
              className="text-sm text-danger hover:opacity-70"
            >
              Eliminar
            </button>
          </div>
          <input
            value={faq.question}
            placeholder="Ej: ¿Cuánto se tarda en publicar una app?"
            onChange={(e) => update(index, { question: e.target.value })}
            className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-base outline-none focus:border-foreground"
          />
          <textarea
            value={faq.answer}
            placeholder="Respuesta corta y directa…"
            rows={3}
            onChange={(e) => update(index, { answer: e.target.value })}
            className="resize-y rounded-[var(--radius-sm)] border border-border px-3 py-2 text-base outline-none focus:border-foreground"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...faqs, { question: "", answer: "" }])}
        className="self-start rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-sm text-foreground hover:border-foreground"
      >
        + Añadir pregunta
      </button>
    </div>
  );
}
