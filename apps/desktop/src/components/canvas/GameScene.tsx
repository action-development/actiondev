"use client";

import { useState, useCallback, useMemo } from "react";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import type { WebGLRenderer } from "three";
import { useGameState } from "@/hooks/use-game-state";
import { GameWorld } from "./GameWorld";
import { TutorialOverlay } from "./overlays/TutorialOverlay";
import { ScoreHint } from "./overlays/ScoreHint";
import { RemoteControl } from "./overlays/RemoteControl";
import { GullTally } from "./overlays/GullTally";
import Image from "next/image";
import { PALETTES, resolveTimeOfDay } from "./port/time-of-day";
import { CAMERA_FOV, PAINTED_BACKDROPS, resolveSceneMode } from "./port/painted-backdrops";

interface GameSceneProps {
  paused?: boolean;
  physicsPaused?: boolean;
  physicsActive?: boolean;
  renderPaused?: boolean;
  onNavigate?: (href: string) => void;
  onReady?: () => void;
}

export function GameScene({ paused = false, physicsPaused = false, physicsActive = false, renderPaused = false, onNavigate, onReady }: GameSceneProps) {
  const gameState = useGameState();

  // Fase del día resuelta UNA vez al montar (hora local o `?hora=`). GameScene
  // es `ssr: false`, así que leer `window` aquí no provoca desajuste de hidratación.
  const { timeOfDay, mode } = useMemo(() => {
    const search = new URLSearchParams(window.location.search);
    // En dev forzamos `atardecer` (fase en la que se está trabajando) salvo que
    // la query pida otra. En producción manda la hora local del visitante.
    const devDefault = process.env.NODE_ENV === "development" ? "atardecer" : null;
    const tod = resolveTimeOfDay(new Date(), search.get("hora") ?? devDefault);
    return { timeOfDay: tod, mode: resolveSceneMode(tod, search) };
  }, []);
  const palette = PALETTES[timeOfDay];
  const backdrop = mode === "painted" ? PAINTED_BACKDROPS[timeOfDay] : undefined;

  // Incremented to force a full Canvas remount after WebGL context loss.
  // This re-creates the renderer and re-uploads all GPU resources cleanly.
  const [canvasKey, setCanvasKey] = useState(0);

  const handleCreated = useCallback(({ gl }: { gl: WebGLRenderer }) => {
    // Force correct renderer dimensions on mount — ResizeObserver fires async,
    // so the first frame can use wrong dimensions if we don't set this explicitly.
    gl.setSize(window.innerWidth, window.innerHeight);

    const canvas = gl.domElement;

    // Allow the browser to attempt context restoration after reclaiming GPU memory
    // (required — without preventDefault the context stays permanently lost).
    const onLost = (e: Event) => e.preventDefault();

    // Full remount on restoration: Three.js state (textures, shaders, buffers)
    // is already gone; cheapest correct recovery is a fresh Canvas.
    const onRestored = () => setCanvasKey((k) => k + 1);

    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    // No cleanup needed — the canvas DOM element is destroyed on Canvas unmount,
    // removing all its listeners automatically.
  }, []);

  return (
    <div
      className="w-screen h-screen bg-black relative animate-fade-in"
      role="img"
      aria-label="Puerto de Vigo interactivo — maneja la grúa y carga contenedores en el barco para navegar"
      data-time-of-day={timeOfDay}
      data-scene-mode={mode}
    >
      {/*
        Fondo pintado: todo lo estático. Fuera del <Suspense> de GameWorld, así
        que no retrasa onReady. object-cover + PaintedFraming mantienen el 3D alineado.
      */}
      {backdrop && (
        <Image src={backdrop} alt="" aria-hidden fill priority sizes="100vw" className="object-cover" />
      )}
      <Canvas
        key={canvasKey}
        shadows="percentage"
        camera={{ position: [0, -3, 28], fov: CAMERA_FOV }}
        // antialias ON: el contorno de cómic sin MSAA se ve en dientes de sierra.
        gl={{ antialias: true, alpha: mode === "painted", powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        frameloop={renderPaused ? "never" : "always"}
        style={{ width: "100vw", height: "100vh", position: "relative" }}
        onCreated={handleCreated}
      >
        <Suspense fallback={null}>
          <GameWorld paused={paused} physicsPaused={physicsPaused} physicsActive={physicsActive} onNavigate={onNavigate} gameState={gameState} palette={palette} mode={mode} onReady={onReady} />
        </Suspense>
      </Canvas>

      {/*
        Velo superior para que la navegación (texto claro) se lea también sobre
        el cielo de día. En CSS: capa compuesta por el navegador, coste cero.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-40"
        style={{ background: "linear-gradient(to bottom, rgba(5,8,24,0.55), transparent)" }}
      />

      {/* Velo inferior: el aviso "Carga el barco…" sobre el muelle claro de día. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-32"
        style={{ background: "linear-gradient(to top, rgba(5,8,24,0.5), transparent)" }}
      />

      <TutorialOverlay gameState={gameState} />
      <ScoreHint />
      <RemoteControl />
      <GullTally gameState={gameState} />
    </div>
  );
}
