"use client";

import { useState, useCallback } from "react";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import type { WebGLRenderer } from "three";
import { useGameState } from "@/hooks/use-game-state";
import { GameWorld } from "./GameWorld";
import { PowerBar } from "./overlays/PowerBar";
import { TutorialOverlay } from "./overlays/TutorialOverlay";
import { ScoreHint } from "./overlays/ScoreHint";

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
      aria-label="Interactive 3D game — navigate the site by throwing cubes into the basket"
    >
      <Canvas
        key={canvasKey}
        shadows="soft"
        camera={{ position: [0, -3, 28], fov: 40 }}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        frameloop={renderPaused ? "never" : "always"}
        style={{ width: "100vw", height: "100vh" }}
        onCreated={handleCreated}
      >
        <color attach="background" args={["#0a0a12"]} />
        <Suspense fallback={null}>
          <GameWorld paused={paused} physicsPaused={physicsPaused} physicsActive={physicsActive} onNavigate={onNavigate} gameState={gameState} onReady={onReady} />
        </Suspense>
      </Canvas>

      <PowerBar gameState={gameState} />
      <TutorialOverlay gameState={gameState} />
      <ScoreHint />
    </div>
  );
}
