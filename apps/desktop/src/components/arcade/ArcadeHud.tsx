"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { MachineSpec } from "@/components/canvas/arcade/arcade-config";
import { ControlSign, type SignKey } from "@/components/ui/ControlSign";
import { HoloButton } from "@/components/ui/HoloButton";
import { useLocale, useT } from "@/lib/i18n";

/** Paso del tutorial: andar → elegir → hecho (ya no vuelve). */
export type ArcadeHintStep = "walk" | "pick" | "done";

interface ArcadeHudProps {
  machines: readonly MachineSpec[];
  /** Máquina enfocada en el pasillo, o `null`. */
  focused: MachineSpec | null;
  /** Hay una máquina acoplada: su pantalla manda y el HUD del pasillo se retira. */
  docked: boolean;
  /** Acoplar una máquina (la ficha de abajo hace lo mismo que un clic en ella). */
  onSelect: (index: number) => void;
  hintStep: ArcadeHintStep;
  listOpen: boolean;
  onListOpenChange: (open: boolean) => void;
}

const CURSOR_GLYPH = (
  <svg width="15" height="15" viewBox="0 0 16 16">
    <path
      d="M3 2 L3 13.5 L6.2 10.6 L8.1 14.6 L10.2 13.6 L8.3 9.8 L12.5 9.4 Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
  </svg>
);

const WALK_KEYS: SignKey[] = [{ label: "▲" }, { label: "▼" }];
const PICK_KEYS: SignKey[] = [{ label: "◀" }, { label: "▶" }, { label: CURSOR_GLYPH }];

/**
 * Chrome DOM de /projects, encima del pasillo:
 * - arriba, el MISMO cartel del tutorial del hero y de la plaza (`ControlSign`)
 *   en dos pasos: andar y elegir máquina. Se retira para siempre al enfocar la
 *   primera máquina;
 * - abajo al centro, la ficha de la máquina enfocada (botón que la acopla);
 * - abajo a la derecha, "Ver lista": el camino para quien no quiera jugar, y el
 *   índice rastreable de los 32 proyectos (los enlaces están en el HTML aunque
 *   el panel esté cerrado).
 */
export function ArcadeHud({
  machines,
  focused,
  docked,
  onSelect,
  hintStep,
  listOpen,
  onListOpenChange,
}: ArcadeHudProps) {
  const t = useT();
  const { locale } = useLocale();
  const category = (m: MachineSpec) =>
    locale === "es" ? (m.project.categoryEs ?? m.project.category) : m.project.category;

  // Escape cierra la lista, como cualquier desplegable.
  useEffect(() => {
    if (!listOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onListOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [listOpen, onListOpenChange]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-10 transition-opacity ${docked ? "invisible opacity-0" : "opacity-100"}`}
    >
      <h1 className="sr-only">{t.arcade.title}</h1>

      {/* Tutorial: misma altura que en el hero y la plaza, bajo la cápsula del Header. */}
      <div
        data-testid="arcade-hint"
        data-step={hintStep}
        aria-hidden={hintStep === "done"}
        className="absolute inset-x-0 top-[max(12vh,104px)] grid justify-items-center"
      >
        {(["walk", "pick"] as const).map((step) => (
          <div
            key={step}
            className={`col-start-1 row-start-1 transition-opacity ${hintStep === step ? "opacity-100" : "opacity-0"}`}
          >
            <ControlSign
              keys={step === "walk" ? WALK_KEYS : PICK_KEYS}
              action={step === "walk" ? t.arcade.hintWalk : t.arcade.hintPick}
            />
          </div>
        ))}
      </div>

      {/* Ficha de la máquina enfocada. `key` = proyecto: al cambiar de máquina
          la ficha vuelve a entrar en vez de cambiar el texto en seco. */}
      <div className="absolute inset-x-0 bottom-8 flex justify-center px-6" aria-live="polite">
        {focused && !listOpen && !docked && (
          <button
            type="button"
            key={focused.project.id}
            onClick={() => onSelect(focused.index)}
            data-testid="arcade-focus"
            data-project={focused.project.slug}
            className="holo-surface holo-solid holo-corners holo-link pointer-events-auto flex min-w-[280px] animate-fade-in flex-col items-center gap-2 px-7 py-4 text-center"
          >
            <span className="micro-label">
              {category(focused)} · {focused.project.year}
            </span>
            <span className="text-2xl font-bold tracking-tight text-foreground">{focused.project.title}</span>
            <span className="micro-label micro-label-accent">↵ {t.arcade.play}</span>
          </button>
        )}
      </div>

      {/* Ver lista */}
      <nav className="absolute bottom-8 right-8 flex flex-col items-end gap-3" aria-label={t.arcade.listTitle}>
        <div
          id="arcade-list"
          data-testid="arcade-list"
          // Cerrado va con `hidden`: fuera de la vista y del árbol accesible,
          // pero los enlaces siguen en el HTML para los buscadores.
          hidden={!listOpen}
          className="holo-surface holo-solid holo-corners pointer-events-auto max-h-[min(62vh,560px)] w-[min(360px,calc(100vw-4rem))] overflow-y-auto p-2"
        >
          <p className="micro-label px-3 pb-2 pt-2">{t.arcade.listTitle}</p>
          <ul>
            {machines.map((m) => (
              <li key={m.project.id}>
                <Link
                  href={`/projects/${m.project.slug}`}
                  className="flex items-baseline justify-between gap-4 px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent/10 hover:text-accent focus-visible:bg-accent/10"
                >
                  <span className="font-bold">{m.project.title}</span>
                  <span className="micro-label shrink-0">{category(m)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="pointer-events-auto">
          <HoloButton
            variant="quiet"
            size="sm"
            aria-expanded={listOpen}
            aria-controls="arcade-list"
            data-testid="arcade-list-toggle"
            onClick={() => onListOpenChange(!listOpen)}
          >
            {listOpen ? t.arcade.close : t.arcade.list}
          </HoloButton>
        </div>
      </nav>
    </div>
  );
}
