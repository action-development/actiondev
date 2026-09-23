"use client";

import type { BlogContentBlock } from "@actiondev/shared";

const BLOCK_LABELS: Record<BlogContentBlock["type"], string> = {
  paragraph: "Párrafo",
  heading: "Subtítulo",
  list: "Lista",
  quote: "Cita",
};

const BLOCK_PLACEHOLDERS: Record<Exclude<BlogContentBlock["type"], "list">, string> = {
  paragraph: "Escribe aquí el texto normal del artículo…",
  heading: "Título corto para esta sección…",
  quote: "Una frase destacada, aparece resaltada en el artículo…",
};

function emptyBlock(type: BlogContentBlock["type"]): BlogContentBlock {
  if (type === "list") return { type, items: [""] };
  return { type, text: "" };
}

export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: BlogContentBlock[];
  onChange: (blocks: BlogContentBlock[]) => void;
}) {
  function updateBlock(index: number, block: BlogContentBlock) {
    onChange(blocks.map((b, i) => (i === index ? block : b)));
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addBlock(type: BlogContentBlock["type"]) {
    onChange([...blocks, emptyBlock(type)]);
  }

  return (
    <div className="flex flex-col gap-6">
      {blocks.length === 0 && (
        <p className="rounded-[var(--radius-md)] border border-dashed border-border p-6 text-center text-sm text-muted">
          Aún no has escrito nada. Empieza añadiendo un párrafo con el botón de abajo.
        </p>
      )}

      {blocks.map((block, index) => (
        <div key={index} className="rounded-[var(--radius-md)] border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              {BLOCK_LABELS[block.type]}
            </span>
            <div className="flex items-center gap-4 text-sm text-muted">
              <button
                type="button"
                onClick={() => moveBlock(index, -1)}
                disabled={index === 0}
                title="Mover arriba"
                className="hover:text-foreground disabled:opacity-30"
              >
                ↑ Subir
              </button>
              <button
                type="button"
                onClick={() => moveBlock(index, 1)}
                disabled={index === blocks.length - 1}
                title="Mover abajo"
                className="hover:text-foreground disabled:opacity-30"
              >
                ↓ Bajar
              </button>
              <button
                type="button"
                onClick={() => removeBlock(index)}
                className="text-danger hover:opacity-70"
              >
                Eliminar
              </button>
            </div>
          </div>

          <div className="mt-4">
            {block.type === "list" ? (
              <div className="flex flex-col gap-2">
                {block.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex gap-2">
                    <input
                      value={item}
                      placeholder="Un elemento de la lista…"
                      onChange={(e) => {
                        const items = [...block.items];
                        items[itemIndex] = e.target.value;
                        updateBlock(index, { ...block, items });
                      }}
                      className="flex-1 rounded-[var(--radius-sm)] border border-border px-3 py-2 text-base outline-none focus:border-foreground"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateBlock(index, {
                          ...block,
                          items: block.items.filter((_, i) => i !== itemIndex),
                        })
                      }
                      className="px-2 text-sm text-muted hover:text-danger"
                      title="Quitar este elemento"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateBlock(index, { ...block, items: [...block.items, ""] })
                  }
                  className="self-start text-sm text-muted hover:text-foreground"
                >
                  + Añadir elemento a la lista
                </button>
              </div>
            ) : (
              <textarea
                value={block.text}
                placeholder={BLOCK_PLACEHOLDERS[block.type]}
                onChange={(e) => updateBlock(index, { ...block, text: e.target.value })}
                rows={block.type === "paragraph" ? 4 : 2}
                className="w-full resize-y rounded-[var(--radius-sm)] border border-border px-3 py-2 text-base outline-none focus:border-foreground"
              />
            )}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2 border-t border-border pt-6">
        <span className="mb-1 w-full text-sm text-muted">Añadir al final del artículo:</span>
        {(Object.keys(BLOCK_LABELS) as BlogContentBlock["type"][]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className="rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-sm text-foreground hover:border-foreground"
          >
            + {BLOCK_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}
