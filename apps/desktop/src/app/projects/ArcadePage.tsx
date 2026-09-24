"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { projects } from "@/data/projects";
import { usePageTransition } from "@/components/animations/PageTransition";
import { ArcadeHud, type ArcadeHintStep } from "@/components/arcade/ArcadeHud";
import { ArcadeScreen } from "@/components/arcade/ArcadeScreen";
import { buildMachines } from "@/components/canvas/arcade/arcade-config";
import { ARCADE_PALETTES, currentArcadeMode, type ArcadeMode } from "@/components/canvas/arcade/arcade-mode";
import { Header } from "@/components/layout/Header";
import { SceneCurtain } from "@/components/ui/SceneCurtain";
import { useT } from "@/lib/i18n";

// Escena Three.js siempre lazy + ssr:false (mismo patrón que la plaza y el hero).
const ArcadeScene = dynamic(() => import("@/components/canvas/ArcadeScene").then((m) => m.ArcadeScene), {
  ssr: false,
});

/** Nunca cambia dentro de una sesión: el modo se resuelve al cargar. */
const subscribeNever = () => () => {};

/**
 * Client wrapper de /projects: la sala recreativa.
 *
 * Orquesta la escena (`canvas/ArcadeScene`) y el chrome DOM (`arcade/ArcadeHud`).
 * Pantalla completa sin scroll, sin Lenis ni Footer, con el Header global —
 * como /resenas. Elegir una máquina NO navega: la cámara se acopla a su
 * pantalla y la ficha del proyecto se enciende dentro (`arcade/ArcadeScreen`);
 * desde ahí se vuelve al pasillo o se pasa a la de al lado. La única salida
 * del pasillo es la puerta del fondo → `/contact`: se abre, la cámara entra en
 * la sala de neón y su pared de lamas ES la persiana del sitio, que toma el
 * relevo ya cerrada (`navigate(..., { covered: true })`).
 */
export function ArcadePage() {
  const t = useT();
  const { navigate } = usePageTransition();
  // Día o noche: el servidor pinta la noche y el cliente sustituye en la
  // primera pasada, sin warning de hidratación (ver PlazaPage).
  const mode = useSyncExternalStore<ArcadeMode>(subscribeNever, currentArcadeMode, () => "noche");
  const palette = ARCADE_PALETTES[mode];
  const machines = useMemo(() => buildMachines(projects), []);

  const [ready, setReady] = useState(false);
  const [focused, setFocused] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [docked, setDocked] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [walked, setWalked] = useState(false);
  const [picked, setPicked] = useState(false);
  /** Cruzando la puerta: el chrome se retira para que el último frame sea
   * solo la pared de lamas (la persiana) y el relevo no deje nada colgado. */
  const [exiting, setExiting] = useState(false);

  const handleReady = useCallback(() => setReady(true), []);
  const handleWalked = useCallback(() => setWalked(true), []);
  const handleFocus = useCallback((index: number | null) => {
    setFocused(index);
    if (index !== null) setPicked(true);
  }, []);
  const handleSelect = useCallback((index: number) => {
    setSelected(index);
    setPicked(true);
    setListOpen(false);
  }, []);
  const handleClose = useCallback(() => setSelected(null), []);
  const handleExitStart = useCallback(() => {
    setExiting(true);
    setListOpen(false);
  }, []);
  const handleReachDoor = useCallback((covered: boolean) => navigate("/contact", { covered }), [navigate]);

  // Enfocar una máquina con el ratón también enseña el gesto: el tutorial se da
  // por hecho aunque no se haya andado.
  const hintStep: ArcadeHintStep = picked ? "done" : walked ? "pick" : "walk";

  return (
    <div className="fixed inset-0" style={{ background: palette.background }}>
      <div
        className={exiting ? "pointer-events-none opacity-0" : "opacity-100"}
        style={{ transition: "opacity var(--duration) var(--ease)" }}
      >
        <Header />
      </div>

      <main id="main-content">
        <ArcadeScene
          mode={mode}
          palette={palette}
          machines={machines}
          doorLabel={t.arcade.door}
          paused={listOpen || selected !== null || exiting}
          selected={selected}
          onReady={handleReady}
          onFocusChange={handleFocus}
          onWalked={handleWalked}
          onSelect={handleSelect}
          onDockedChange={setDocked}
          onExitStart={handleExitStart}
          onReachDoor={handleReachDoor}
        />

        <ArcadeHud
          machines={machines}
          focused={focused === null ? null : (machines[focused] ?? null)}
          docked={selected !== null || exiting}
          onSelect={handleSelect}
          hintStep={hintStep}
          listOpen={listOpen}
          onListOpenChange={setListOpen}
        />

        {selected !== null && (
          <ArcadeScreen
            machines={machines}
            index={selected}
            docked={docked}
            onSelect={handleSelect}
            onClose={handleClose}
          />
        )}
      </main>

      <SceneCurtain ready={ready} label={t.arcade.loading} testId="arcade-curtain" />
    </div>
  );
}
