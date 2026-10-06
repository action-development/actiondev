"use client";

import { Suspense, useCallback, useMemo, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";

import { PlazaWorld } from "./plaza/PlazaWorld";
import { disposePlazaTextures } from "./plaza/plaza-textures";
import { PLAZA_PALETTES, currentPlazaMode } from "./plaza/plaza-mode";
import { SceneWarmup } from "./SceneWarmup";
import { ORBIT, fovForAspect } from "./plaza/plaza-camera";

export interface PlazaSceneProps {
  /** Id del testimonio seleccionado, o `null`. Lo controla la página. */
  selectedId: string | null;
  /** Click en un muñeco, o en el vacío (→ `null`). */
  onSelect: (id: string | null) => void;
  /** La escena ya ha pintado su primer frame. */
  onReady?: () => void;
  /** Se está llevando un muñeco en la mano. */
  onHoldChange?: (holding: boolean) => void;
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
export function PlazaScene({ selectedId, onSelect, onReady, onHoldChange }: PlazaSceneProps) {
  // Día o noche, resuelto UNA vez al montar: por la hora local del visitante o
  // por `?hora=`. No cambia en caliente — al cruzar la medianoche con la
  // pestaña abierta, la plaza se queda como estaba hasta recargar.
  const mode = useMemo(() => currentPlazaMode(), []);
  // Se incrementa para remontar el Canvas entero tras perder el contexto WebGL:
  // texturas, shaders y buffers ya no existen, y recrearlos a mano sale más caro
  // y más frágil que un Canvas nuevo.
  const [canvasKey, setCanvasKey] = useState(0);
  // Bucle de render parado hasta tener los shaders compilados (ver SceneWarmup).
  const [warm, setWarm] = useState(false);
  const handleWarm = useCallback(() => setWarm(true), []);
  /**
   * Resolución de render adaptativa: `PerformanceMonitor` mide los fps y, si
   * el equipo no llega, baja a 1× (en una pantalla retina eso es la mitad de
   * píxeles que sombrear, con dos direccionales, IBL y seis farolas por
   * píxel). Si se recupera, vuelve a subir. Techo 1,5: por encima el coste
   * crece al cuadrado y en una escena mate no se aprecia.
   */
  const [dpr, setDpr] = useState(() =>
    typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 1.5),
  );
  const maxDpr = useMemo(
    () => (typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)),
    [],
  );

  const handleCreated = useCallback(
    ({ gl }: { gl: THREE.WebGLRenderer }) => {
      gl.setSize(window.innerWidth, window.innerHeight);

      /*
       * Tone mapping NEUTRAL (Khronos PBR Neutral), no el ACES que R3F pone por
       * defecto. ACES desatura y gira el tono de lo saturado — el lima del
       * acento, las camisetas y la piel salían lavados y hacia el naranja — y
       * multiplica por 1/0,6 antes de la curva. Neutral deja el color tal cual
       * hasta ~0,76 lineal y solo comprime las altas: lo que se elige en hex es
       * lo que se ve. Se fija aquí y no en la prop `gl` porque R3F solo pone su
       * ACES en la primera configuración; `onCreated` llega después.
       *
       * Cielo, suelo y pavimento van con `toneMapped={false}` y no les afecta
       * ni la curva ni la exposición: siguen casando con el `background` del
       * div. La niebla tampoco: three la mezcla después de la curva y en sRGB.
       */
      gl.toneMapping = THREE.NeutralToneMapping;
      gl.toneMappingExposure = PLAZA_PALETTES[mode].light.exposure;
      gl.outputColorSpace = THREE.SRGBColorSpace;

      const canvas = gl.domElement;

      // Sin `preventDefault` el navegador no intenta restaurar el contexto nunca.
      const onLost = (e: Event) => e.preventDefault();
      // Contexto nuevo = programas nuevos: se vuelve a precompilar.
      const onRestored = () => {
        setWarm(false);
        setCanvasKey((k) => k + 1);
      };

      canvas.addEventListener("webglcontextlost", onLost);
      canvas.addEventListener("webglcontextrestored", onRestored);
    },
    [mode],
  );

  // Las texturas procedurales son singletons de módulo: sobreviven al remonte
  // del Canvas a propósito (no hay que regenerarlas al recuperar el contexto),
  // así que se liberan al salir de la página, no al desmontar el Canvas.
  useEffect(() => {
    return () => {
      disposePlazaTextures();
      document.body.style.cursor = "auto";
    };
  }, []);

  return (
    <div
      className="relative h-screen w-screen"
      style={{ background: PLAZA_PALETTES[mode].skyHorizon }}
      role="img"
      aria-label="Plaza 3D con un personaje por cada cliente de Action — haz clic en uno para leer su reseña"
    >
      <Canvas
        key={canvasKey}
        frameloop={warm ? "always" : "never"}
        // Antialias activo: el contorno de cómic sin MSAA se ve dentado.
        gl={{ antialias: true, powerPreference: "high-performance" }}
        // Sombras proyectadas de verdad. Sin ellas el parque se lee como una
        // maqueta: muñecos, farolas y bancos flotan sobre el pavimento. El
        // sol lo monta `PlazaLighting` (solo de día: de noche no hay pase de
        // sombra) y la capa que las recibe, `PlazaRoom`.
        //
        // `percentage` (PCF), no `soft`: three deprecó `PCFSoftShadowMap` en
        // 0.183 y cae a PCF de todos modos, pero avisando por consola en cada
        // carga. El desenfoque lo da `shadow-radius` en la propia luz.
        shadows="percentage"
        dpr={dpr}
        // `near` MUY por encima del 0.1 por defecto: el suelo del parque llega
        // a 150 unidades y con near = 0.1 el z-buffer allí no distingue dos
        // planos separados 1 mm — el césped y el disco de suelo se peleaban y
        // salían cuñas blancas dentadas sobre la pradera. Con 0.6 la
        // precisión a 50 unidades es seis veces mejor y nada se recorta: lo
        // más cerca que llega la cámara es a ~3 de un muñeco.
        //
        // Posición y FOV iniciales = pose de reposo: `PlazaWorld` toma el
        // mando desde el primer frame (entrada incluida), esto solo evita un
        // primer frame con la óptica por defecto.
        camera={{
          position: [Math.cos(ORBIT.center) * ORBIT.radius, ORBIT.height, Math.sin(ORBIT.center) * ORBIT.radius],
          fov: typeof window === "undefined" ? 34 : fovForAspect(window.innerWidth / window.innerHeight),
          near: 0.6,
          far: 400,
        }}
        style={{ width: "100vw", height: "100vh", touchAction: "none" }}
        onCreated={handleCreated}
      >
        <PerformanceMonitor
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(maxDpr)}
          // Tras tres cambios de opinión se queda donde esté: un equipo en
          // el límite haría parpadear la nitidez.
          flipflops={3}
        />
        <Suspense fallback={null}>
          <PlazaWorld
            mode={mode}
            selectedId={selectedId}
            onSelect={onSelect}
            onReady={onReady}
            onHoldChange={onHoldChange}
          />
          {/* Dentro del Suspense y el último: precompila con la plaza ya montada. */}
          <SceneWarmup onDone={handleWarm} />
        </Suspense>
      </Canvas>
    </div>
  );
}
