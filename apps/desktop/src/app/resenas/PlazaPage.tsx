"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { testimonials } from "@/data/testimonials";
import { PLAZA_PALETTES, currentPlazaMode, type PlazaMode } from "@/components/canvas/plaza/plaza-mode";
import { Header } from "@/components/layout/Header";
import { PlazaHud } from "@/components/plaza/PlazaHud";
import { ReviewCard } from "@/components/plaza/ReviewCard";
import { Blinds, blindsDuration } from "@/components/ui/Blinds";
import { useT } from "@/lib/i18n";

// Mismo patrón que GameScene en src/app/page.tsx: escena Three.js siempre
// lazy + ssr:false, nunca en el bundle inicial del servidor.
const PlazaScene = dynamic(
  () => import("@/components/canvas/PlazaScene").then((m) => m.PlazaScene),
  { ssr: false }
);

/**
 * Escotilla: si `onReady` no llega nunca (WebGL caído, chunk que no baja) la
 * plaza se quedaría tapada para siempre. Mismo criterio que el `STALL_TIMEOUT`
 * de `LoadingScreen`, más corto porque aquí no hay física ni shaders que
 * precompilar: se abre igual y la escena entrará tarde, pero la página queda
 * utilizable.
 */
const CURTAIN_STUCK_MS = 12_000;

/**
 * Telón de /resenas — la MISMA persiana del resto del sitio (`ui/Blinds`).
 *
 * Aquí había antes un loader propio: logo de marca + rótulo sobre el color del
 * cielo de la plaza. De día ese color es `#d3e2ee`, así que al recogerse la
 * persiana de `PageTransition` asomaba una pantalla casi BLANCA con el logo
 * —el lenguaje anterior a la persiana— hasta que la escena estaba lista.
 *
 * Al ser la misma pieza no hay costura ni doble barrido visible: la persiana de
 * la transición se recoge SOBRE esta, idéntica y cerrada, así que el visitante
 * ve una sola cortina que sigue bajada hasta que la plaza pinta su primer
 * frame. Va por encima del Header (`z-[60]`), como la de la transición: media
 * cápsula flotando sobre las lamas delataría que hay dos telones.
 *
 * Sin contador ni logo, igual que `LoadingScreen`; el rótulo sigue existiendo
 * para lectores de pantalla.
 */
function PlazaCurtain({ ready, label }: { ready: boolean; label: string }) {
  const [stuck, setStuck] = useState(false);
  const [gone, setGone] = useState(false);
  const open = ready || stuck;

  useEffect(() => {
    const id = window.setTimeout(() => setStuck(true), CURTAIN_STUCK_MS);
    return () => window.clearTimeout(id);
  }, []);

  // Se desmonta tras el barrido: son diez lamas con `will-change: transform`
  // que ya no pintan nada una vez recogidas.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => setGone(true), blindsDuration() + 50);
    return () => window.clearTimeout(id);
  }, [open]);

  if (gone) return null;

  return (
    <div
      data-testid="plaza-curtain"
      data-state={open ? "opening" : "closed"}
      className="fixed inset-0 z-[60]"
      style={{
        pointerEvents: open ? "none" : "auto",
        // Fondo del sitio DETRÁS de las lamas mientras está bajada: por los
        // huecos de 3px de la persiana se ve lo de atrás, y aquí atrás está el
        // cielo de la plaza (de día, casi blanco). Se retira al abrir, para que
        // por esos mismos huecos asome ya la plaza mientras se recoge.
        background: open ? undefined : "var(--background)",
      }}
    >
      <Blinds closed={!open} />
      <span className="sr-only" aria-live="polite">
        {label}
      </span>
    </div>
  );
}

/**
 * Client wrapper de /resenas. Controla qué muñeco está seleccionado y
 * orquesta escena 3D (canvas.PlazaScene, de otro agente) + chrome DOM (Hud +
 * ReviewCard, de este agente). Página a pantalla completa — sin
 * Lenis/SmoothScroll, no hay scroll que suavizar. Lleva el Header global
 * (fixed, z-50) pero no el Footer.
 */
/** Nunca cambia dentro de una sesión: el modo se resuelve al cargar. */
const subscribeNever = () => () => {};

export function PlazaPage() {
  const t = useT();
  /**
   * Día o noche. Con `useSyncExternalStore` en vez de un `useState` +
   * `useEffect`: el servidor no conoce la hora local del visitante, así que
   * pinta la versión de noche y el cliente sustituye en la primera pasada, sin
   * warning de hidratación ni `setState` dentro de un efecto.
   */
  const mode = useSyncExternalStore<PlazaMode>(subscribeNever, currentPlazaMode, () => "noche");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [holding, setHolding] = useState(false);
  /** La pista de click no vuelve: con la primera ficha abierta ya está
   * aprendido el gesto y la placa solo taparía plaza. */
  const [hintDone, setHintDone] = useState(false);

  const handleReady = useCallback(() => setReady(true), []);

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id !== null) setHintDone(true);
  }, []);

  const handleClose = useCallback(() => setSelectedId(null), []);

  // Escape deselecciona el muñeco activo.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0" style={{ background: PLAZA_PALETTES[mode].skyHorizon }}>
      <Header />

      {/*
        La plaza es una pantalla completa sin scroll, pero sigue necesitando su
        landmark: sin `<main id="main-content">` esta ruta no tenía destino para
        el "saltar al contenido" del layout raíz (axe lo marcaba como skip link
        sin destino) ni región principal que anunciar. `<main>` es un bloque sin
        estilo propio: la escena conserva su `h-screen w-screen` y el HUD y la
        ficha siguen anclados al viewport por su `fixed`. El Header queda FUERA,
        que es donde va un `banner`.
      */}
      <main id="main-content">
        <PlazaScene
          selectedId={selectedId}
          onSelect={handleSelect}
          onReady={handleReady}
          onHoldChange={setHolding}
        />

        <PlazaHud
          mode={mode}
          count={testimonials.length}
          ctaVisible={selectedId === null}
          hintVisible={!hintDone && selectedId === null && !holding}
        />

        <ReviewCard selectedId={selectedId} onClose={handleClose} />
      </main>

      <PlazaCurtain ready={ready} label={t.plaza.loading} />
    </div>
  );
}
