"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { testimonials } from "@/data/testimonials";
import { PLAZA_PALETTES, currentPlazaMode, type PlazaMode } from "@/components/canvas/plaza/plaza-mode";
import { Header } from "@/components/layout/Header";
import { PlazaHud } from "@/components/plaza/PlazaHud";
import { ReviewCard } from "@/components/plaza/ReviewCard";
import { SceneCurtain } from "@/components/ui/SceneCurtain";
import { useT } from "@/lib/i18n";

// Mismo patrón que GameScene en src/app/page.tsx: escena Three.js siempre
// lazy + ssr:false, nunca en el bundle inicial del servidor.
const PlazaScene = dynamic(
  () => import("@/components/canvas/PlazaScene").then((m) => m.PlazaScene),
  { ssr: false }
);

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

      <SceneCurtain ready={ready} label={t.plaza.loading} testId="plaza-curtain" />
    </div>
  );
}
