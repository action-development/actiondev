"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { testimonials } from "@/data/testimonials";
import { Header } from "@/components/layout/Header";
import { PlazaHud } from "@/components/plaza/PlazaHud";
import { ReviewCard } from "@/components/plaza/ReviewCard";
import { useT } from "@/lib/i18n";

// Mismo patrón que GameScene en src/app/page.tsx: escena Three.js siempre
// lazy + ssr:false, nunca en el bundle inicial del servidor.
const PlazaScene = dynamic(
  () => import("@/components/canvas/PlazaScene").then((m) => m.PlazaScene),
  { ssr: false }
);

/**
 * Loader propio de /resenas — NO reutiliza LoadingScreen.tsx (persiana de la
 * home, con fases). Mismo logo de marca sobre `bg-background`, sin contador:
 * esta escena no tiene el mismo coste de física/shaders que el hero.
 */
function PlazaLoader({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/logos/logo.webp"
          alt="Action"
          width={1563}
          height={625}
          priority
          className="h-auto w-32"
        />
        <p
          aria-live="polite"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
        >
          {label}
        </p>
      </div>
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
export function PlazaPage() {
  const t = useT();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [holding, setHolding] = useState(false);

  const handleReady = useCallback(() => setReady(true), []);

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
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
    <div className="fixed inset-0 bg-background">
      {!ready && <PlazaLoader label={t.plaza.loading} />}

      <PlazaScene
        selectedId={selectedId}
        onSelect={handleSelect}
        onReady={handleReady}
        onHoldChange={setHolding}
      />

      <Header />

      <PlazaHud count={testimonials.length} hintVisible={selectedId === null} holding={holding} />

      <ReviewCard selectedId={selectedId} onClose={handleClose} />
    </div>
  );
}
