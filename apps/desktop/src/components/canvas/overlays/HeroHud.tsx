"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CargoInfo, CraneHint, GameState } from "@/hooks/use-game-state";
import { useT } from "@/lib/i18n";
import styles from "./HeroHud.module.css";

/**
 * HUD de ayuda del hero "La Grúa": todo lo que explica el juego SIN tutorial.
 *
 * Overlays DOM fuera del `<Canvas>` (mismo motivo que el mando: no pasan por el
 * `<Suspense>` de GameScene y no cuentan como click del juego). Ninguno hace
 * polling: GameWorld los avisa por los callbacks de `useGameState` solo cuando
 * algo CAMBIA; la etiqueta flotante, además, recibe su posición por ref.
 */

const TOAST_MS = 2200;

/** `true` si el destino todavía no tiene página ("#equipo", "#galicia"…). */
function isSoon(href: string) {
  return !href.startsWith("/");
}

/** Etiqueta holográfica sobre el contenedor que hay bajo el puntero. */
export function HoverTag({ gameState }: { gameState: GameState }) {
  const t = useT();
  const [info, setInfo] = useState<CargoInfo | null>(null);

  useEffect(() => {
    gameState.onHover.current = setInfo;
    return () => {
      gameState.onHover.current = null;
    };
  }, [gameState]);

  return (
    <div
      ref={(el) => {
        gameState.hoverTagEl.current = el;
      }}
      className={styles.tagAnchor}
      aria-hidden
    >
      {info && (
        // `key`: cambiar de contenedor repite la entrada — se lee como "otro".
        <div key={info.id} className={`${styles.holo} ${styles.tag}`} data-soon={isSoon(info.href)} data-testid="hover-tag">
          <span className={`${styles.display} ${styles.glow} ${styles.tagTitle}`}>{info.label}</span>
          <span className={`${styles.mono} ${styles.tagDest}`}>
            {isSoon(info.href) ? t.game.hud.soon : `${t.game.hud.clickToGo} → ${info.href}`}
          </span>
        </div>
      )}
    </div>
  );
}

/** Pista contextual encima del mando mientras la grúa lleva carga. */
export function CraneHintBar({ gameState }: { gameState: GameState }) {
  const t = useT();
  const [hint, setHint] = useState<CraneHint>(null);

  useEffect(() => {
    gameState.onHint.current = setHint;
    return () => {
      gameState.onHint.current = null;
    };
  }, [gameState]);

  const copy: Record<Exclude<CraneHint, null>, { icon: string; text: string }> = {
    row: { icon: "▲▼", text: t.game.hud.hintRow },
    carry: { icon: "▶", text: t.game.hud.hintCarry },
    release: { icon: "●", text: t.game.hud.hintRelease },
  };

  return (
    <div
      className="pointer-events-none absolute bottom-[170px] left-1/2 z-40 -translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      {hint && (
        <div key={hint} className={`${styles.holo} ${styles.hint} ${styles.mono} ${styles.glow}`} data-hint={hint} data-testid="crane-hint">
          <span aria-hidden className={styles.hintIcon}>{copy[hint].icon}</span>
          {copy[hint].text}
        </div>
      )}
    </div>
  );
}

/** Aviso al entrar un contenedor en la bodega: "rumbo a…" o "próximamente". */
export function CargoToast({ gameState }: { gameState: GameState }) {
  const t = useT();
  const [info, setInfo] = useState<CargoInfo | null>(null);

  useEffect(() => gameState.subscribeCargo(setInfo), [gameState]);

  // Un destino real no hace falta ocultarlo: la persiana llega antes. El de
  // "próximamente" se va solo y el juego sigue.
  useEffect(() => {
    if (!info) return;
    const id = setTimeout(() => setInfo(null), TOAST_MS);
    return () => clearTimeout(id);
  }, [info]);

  if (!info) return null;
  const soon = isSoon(info.href);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[34vh] z-40 flex justify-center" role="status" aria-live="assertive">
      <div key={info.id} className={`${styles.holo} ${styles.toast}`} data-soon={soon} data-testid="cargo-toast">
        <span className={`${styles.mono} ${styles.toastKicker}`}>{soon ? t.game.hud.soon : t.game.hud.heading}</span>
        <span className={`${styles.display} ${styles.glow} ${styles.toastTitle}`}>{info.label}</span>
      </div>
    </div>
  );
}

/** Salida para quien no quiere jugar: las secciones como lista. */
export function SkipMenu() {
  const t = useT();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/projects", label: t.nav.work },
    { href: "/resenas", label: t.nav.reviews },
    { href: "/contact", label: t.nav.contact },
  ];

  // Escape cierra, como cualquier desplegable.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav className={`${styles.skip} absolute bottom-8 right-8 z-40`} aria-label={t.game.hud.skip}>
      {open && (
        <div id="hero-skip-list" className={`${styles.holo} ${styles.skipList}`}>
          {links.map((l, i) => (
            <Link key={l.href} href={l.href} className={`${styles.skipLink} ${styles.mono} ${styles.glow}`}>
              <span className={styles.skipIndex}>{String(i + 1).padStart(2, "0")}</span>
              {l.label}
            </Link>
          ))}
        </div>
      )}
      <button
        type="button"
        className={`${styles.holo} ${styles.skipBtn} ${styles.mono} ${styles.glow}`}
        aria-expanded={open}
        aria-controls="hero-skip-list"
        data-testid="hero-skip"
        onClick={() => setOpen((o) => !o)}
      >
        {t.game.hud.skip}
      </button>
    </nav>
  );
}
