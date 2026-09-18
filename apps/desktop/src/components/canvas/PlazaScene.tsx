"use client";

import { Suspense, useCallback, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import type { WebGLRenderer } from "three";

import { PlazaWorld } from "./plaza/PlazaWorld";
import { disposePlazaTextures } from "./plaza/plaza-textures";
import { disposeFaceTextures } from "./plaza/face-texture";
import { PLAZA_PALETTE } from "./plaza/plaza-config";

export interface PlazaSceneProps {
  /** Id del testimonio seleccionado, o `null`. Lo controla la página. */
  selectedId: string | null;
  /** Click en un muñeco, o en el vacío (→ `null`). */
  onSelect: (id: string | null) => void;
  /** La escena ya ha pintado su primer frame. */
  onReady?: () => void;
}

/**
 * Canvas de la plaza de reseñas.
 *
 * Se monta siempre con `dynamic(..., { ssr: false })`: dentro hay `window`,
 * `document` y generación de texturas en canvas 2D.
 *
 * Nada de lo que cuelga del `<Suspense>` descarga un asset. Las caras, el cielo
 * y el suelo se pintan con `CanvasTexture` en runtime — es la misma regla que
 * dejó clavado el loader de la home cuando el hero usaba un HDR remoto.
 */
export function PlazaScene({ selectedId, onSelect, onReady }: PlazaSceneProps) {
  // Se incrementa para remontar el Canvas entero tras perder el contexto WebGL:
  // texturas, shaders y buffers ya no existen, y recrearlos a mano sale más caro
  // y más frágil que un Canvas nuevo.
  const [canvasKey, setCanvasKey] = useState(0);

  const handleCreated = useCallback(({ gl }: { gl: WebGLRenderer }) => {
    gl.setSize(window.innerWidth, window.innerHeight);
    const canvas = gl.domElement;

    // Sin `preventDefault` el navegador no intenta restaurar el contexto nunca.
    const onLost = (e: Event) => e.preventDefault();
    const onRestored = () => setCanvasKey((k) => k + 1);

    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
  }, []);

  // Las texturas procedurales son singletons de módulo: sobreviven al remonte
  // del Canvas a propósito (no hay que regenerarlas al recuperar el contexto),
  // así que se liberan al salir de la página, no al desmontar el Canvas.
  useEffect(() => {
    return () => {
      disposePlazaTextures();
      disposeFaceTextures();
      document.body.style.cursor = "auto";
    };
  }, []);

  return (
    <div
      className="relative h-screen w-screen"
      style={{ background: PLAZA_PALETTE.skyBottom }}
      role="img"
      aria-label="Plaza 3D con un personaje por cada cliente de Action — haz clic en uno para leer su reseña"
    >
      <Canvas
        key={canvasKey}
        // Antialias activo: el contorno de cómic sin MSAA se ve dentado.
        gl={{ antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 3.6, 11.5], fov: 38 }}
        style={{ width: "100vw", height: "100vh" }}
        onCreated={handleCreated}
      >
        <Suspense fallback={null}>
          <PlazaWorld selectedId={selectedId} onSelect={onSelect} onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}
