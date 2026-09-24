"use client";

import { useCallback, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { WebGLRenderer } from "three";

import { StreetWorld, type StreetWorldProps } from "./street/StreetWorld";
import { disposeStreetTextures } from "./street/street-textures";
import { CAMERA } from "./street/street-config";

/**
 * Canvas de /contact: el portal de C/ Colón 20.
 *
 * Se monta siempre con `dynamic(..., { ssr: false })`. Sin `<Suspense>`: nada
 * de lo que monta la escena suspende ni descarga un asset (todo es
 * `CanvasTexture`), así que la persiana se recoge con el primer frame.
 */
export function StreetScene(props: StreetWorldProps) {
  // Se incrementa para remontar el Canvas entero tras perder el contexto WebGL
  // (mismo patrón que la plaza y la recreativa).
  const [canvasKey, setCanvasKey] = useState(0);

  const handleCreated = useCallback(({ gl }: { gl: WebGLRenderer }) => {
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", (e) => e.preventDefault());
    canvas.addEventListener("webglcontextrestored", () => setCanvasKey((k) => k + 1));
  }, []);

  // Las texturas son singletons de módulo: se liberan al salir de la página,
  // no al remontar el Canvas.
  useEffect(() => () => disposeStreetTextures(), []);

  return (
    <div
      data-testid="street-scene"
      className="relative h-screen w-screen"
      style={{ background: props.palette.background }}
      role="img"
      aria-label="Calle Colón 20 de Vigo en 3D: el portal de la oficina de Action, con una cabina de teléfono para escribir por WhatsApp, un buzón para escribir un email y el portero automático para pedir que te llamemos"
    >
      <Canvas
        key={canvasKey}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        // `percentage`, no `soft`: three deprecó `PCFSoftShadowMap` en 0.183
        // (ver la plaza).
        shadows="percentage"
        dpr={[1, 1.5]}
        camera={{ position: [0, CAMERA.eyeY, CAMERA.distance], fov: CAMERA.fov, near: 0.3, far: 120 }}
        style={{ width: "100vw", height: "100vh", touchAction: "none" }}
        onCreated={handleCreated}
      >
        <StreetWorld {...props} />
      </Canvas>
    </div>
  );
}
