"use client";

import { useCallback, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { WebGLRenderer } from "three";

import { ArcadeWorld, type ArcadeWorldProps } from "./arcade/ArcadeWorld";
import { disposeArcadeTextures } from "./arcade/arcade-textures";
import { CAMERA_FOV, WALK } from "./arcade/arcade-config";

/**
 * Canvas de la sala recreativa de /projects.
 *
 * Se monta siempre con `dynamic(..., { ssr: false })`. Sin `<Suspense>`: nada
 * de lo que monta la escena suspende. Las capturas, los vídeos y el logo se
 * cargan por su cuenta y cada pantalla enseña su modo demo mientras tanto, así
 * que la persiana se recoge en cuanto hay un primer frame.
 */
export function ArcadeScene(props: ArcadeWorldProps) {
  // Se incrementa para remontar el Canvas entero tras perder el contexto WebGL
  // (mismo patrón que la plaza).
  const [canvasKey, setCanvasKey] = useState(0);

  const handleCreated = useCallback(({ gl }: { gl: WebGLRenderer }) => {
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", (e) => e.preventDefault());
    canvas.addEventListener("webglcontextrestored", () => setCanvasKey((k) => k + 1));
  }, []);

  // Las texturas procedurales son singletons de módulo: se liberan al salir de
  // la página, no al remontar el Canvas.
  useEffect(() => () => disposeArcadeTextures(), []);

  return (
    <div
      data-testid="arcade-scene"
      className="relative h-screen w-screen"
      style={{ background: props.palette.background }}
      role="img"
      aria-label="Sala recreativa 3D: un pasillo con una máquina por cada proyecto de Action y, al fondo, la puerta de contacto"
    >
      <Canvas
        key={canvasKey}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        camera={{ position: [0, WALK.eyeHeight, WALK.startZ], fov: CAMERA_FOV, near: 0.05, far: 80 }}
        style={{ width: "100vw", height: "100vh", touchAction: "none" }}
        onCreated={handleCreated}
      >
        <ArcadeWorld {...props} />
      </Canvas>
    </div>
  );
}
