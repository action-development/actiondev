"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  UnicornScene,
  type UnicornStudioScene,
  type UnicornVariables,
} from "unicornstudio-react/next";
import type { AudioEnergy } from "@/hooks/use-audio-analyser";
import type { Tilt } from "@/hooks/use-device-tilt";

/**
 * Escena WebGL de Unicorn Studio con reactividad al audio.
 *
 * ── Cómo entra el sonido ───────────────────────────────────────────
 * `sceneRef` devuelve la instancia viva y expone `setVariable()`. La
 * energía se empuja desde un rAF propio, NO desde la prop `variables`:
 * esa prop pasa por estado de React y a 60 fps significaría 60 renders
 * por segundo de todo el árbol. El ref es el único camino sensato.
 *
 * ── Por qué se consulta el manifiesto ──────────────────────────────
 * `setVariable()` con un nombre que la escena no publicó se traga el
 * valor y suelta un warning por consola. Antes de empujar nada se lee
 * `getVariableManifest()` y se filtran los nombres que existen de
 * verdad. Sin esto, la consola se llena de ruido y no hay forma de
 * saber si el fallo es de nombre o de binding.
 *
 * ── Giroscopio en lugar de ratón ───────────────────────────────────
 * En escritorio la escena sigue al puntero por su cuenta. En móvil no
 * hay puntero y el SDK no ofrece forma pública de moverlo.
 *
 * Se probaron y se DESCARTARON con medición, no por intuición:
 *   1. Eventos de puntero sintéticos sobre `scene.element` → el SDK
 *      los ignora: su `scene.mouse` no se inmuta.
 *   2. Escribir `scene.mouse.pos/movePos/lastPos` a mano → la imagen
 *      no cambia (diferencia entre capturas 7.86 vs 7.32 de control:
 *      puro ruido de animación).
 *   3. `getMouse()` es de SOLO LECTURA; no existe `setMouse()`.
 *
 * Así que el movimiento va por el MISMO camino que el audio: variables
 * publicadas con la escena y empujadas con `setVariables()`. Es la vía
 * pública y documentada. La pieza central publica hoy un Vec2
 * «Position» CONECTADO (verificado leyendo el manifiesto en runtime),
 * y es por ahí por donde entran tanto la deriva autónoma como la
 * inclinación. El fondo no publica ninguna, así que no se mueve.
 *
 * ── Rendimiento en móvil ───────────────────────────────────────────
 * Esto es WebGL, no el canvas 2D de antes: cuesta bastante más. En
 * móvil se baja dpi, fps y escala de render. La prioridad de esta
 * versión sigue siendo el móvil.
 */

/** Nombres candidatos. El manifiesto decide cuáles existen. */
const AUDIO_BINDINGS: Record<keyof AudioEnergy, string[]> = {
  bass: ["bass", "audioBass", "low", "intensity"],
  mid: ["mid", "audioMid", "amount"],
  level: ["level", "audioLevel", "volume", "energy"],
};

/** Ídem para la inclinación del móvil. */
const TILT_BINDINGS: Record<"x" | "y", string[]> = {
  x: ["tiltX", "gyroX", "mouseX", "pointerX", "x"],
  y: ["tiltY", "gyroY", "mouseY", "pointerY", "y"],
};

/**
 * Unicorn trabaja en escala 0..100 (su panel Mousemove usa
 * `Position From X 50 Y 50`, o sea centro = 50). El analizador da 0..1
 * y la inclinación −1..1, así que hay que reescalar: enviarlo en crudo
 * movería la escena una centésima de lo esperado y parecería que no
 * funciona.
 *
 * Las variables de la escena deben crearse con rango 0–100.
 */
const AUDIO_SCALE = 100; //  0..1 → 0..100 (variables `number`)

/**
 * Los Vec2 de Unicorn trabajan en 0..1 con centro 0.5, NO en 0..100.
 * El panel enseña «50» pero el manifiesto devuelve `_x: 0.5`. Medido,
 * no supuesto: enviar 50 mandaría la forma cien veces fuera de plano.
 */
const VEC_CENTER = 0.5;
/**
 * Recorrido a cada lado del centro. 0.5 llenaría justo la caja 0..1;
 * usamos 1.1 A PROPÓSITO para desbordarla y que el gesto se note de
 * verdad. La escena acepta valores fuera de rango y los traduce en un
 * desplazamiento mucho más agresivo — que es justo lo que se busca.
 */
const VEC_SPAN = 1.1;

/**
 * Deriva autónoma para pantallas táctiles.
 *
 * En escritorio la escena sigue al puntero ella sola. En un móvil no
 * hay puntero, así que sin esto la forma se queda CONGELADA: el
 * giroscopio existe, pero en iOS depende de un permiso que puede no
 * concederse nunca, y confiar la vida de la pieza a un diálogo del
 * sistema es confiarla a que el usuario diga que sí.
 *
 * Es una Lissajous: dos senos con frecuencias inconmensurables
 * (0.31 y 0.23 Hz — su razón es irracional a efectos prácticos), así
 * que el recorrido no se cierra nunca y no se percibe el bucle. Con
 * frecuencias múltiplos entre sí la figura se repetiría cada pocos
 * segundos y el ojo lo pilla enseguida.
 *
 * La amplitud (0.45 sobre el rango −1..1) deja sitio para que la
 * inclinación SUME por encima sin saturar el eje: quien conceda el
 * permiso mueve la forma a partir de donde la deriva la haya dejado,
 * en vez de pelearse con ella.
 */
const DRIFT_SPAN = 0.45;
const DRIFT_HZ = { x: 0.31, y: 0.23 };
/** Desfase entre ejes. Sin él ambos senos cruzan el centro a la vez y
 *  el recorrido degenera en una diagonal recta, no en una órbita. */
const DRIFT_PHASE = 1.7;

const clamp1 = (v: number) => Math.min(Math.max(v, -1), 1);

/** El tipo se declara a mano: si se infiere del valor inicial, TS fija
 *  `fps: 60` como literal y rechaza el perfil móvil. */
type Quality = { dpi: number; fps: 15 | 24 | 30 | 60 | 120; scale: number };

const QUALITY: Record<"mobile" | "desktop", Quality> = {
  mobile: { dpi: 1, fps: 30, scale: 0.75 },
  desktop: { dpi: 1.5, fps: 60, scale: 1 },
};

/**
 * Perfil «sin recortes» para la pieza protagonista del hero.
 *
 * `dpi` se toma del `devicePixelRatio` real, con SUELO en el perfil de
 * escritorio (1.5) y TOPE en 2. El tope no es conservadurismo: en un
 * iPhone con DPR 3 el framebuffer pasa de 4 a 9 megapíxeles por frame
 * para una ganancia que el ojo ya no distingue en una forma orgánica
 * sin bordes duros. El suelo evita el efecto contrario — en un monitor
 * de DPR 1, tomar el DPR a pelo habría BAJADO la calidad de 1.5 a 1.
 *
 * `scale: 1` significa render a resolución nativa del contenedor: es lo
 * que quita el aspecto blando que daba el 0.75 del perfil móvil.
 */
const dprCapped = () =>
  Math.min(Math.max(window.devicePixelRatio || 1, QUALITY.desktop.dpi), 2);

export function UnicornBlob({
  projectId,
  className,
  energyRef,
  tiltRef,
  qualityScale = 1,
  maxQuality = false,
}: {
  projectId: string;
  className?: string;
  energyRef?: RefObject<AudioEnergy>;
  /** Inclinación viva. La provee el Hero, que es quien pide el permiso. */
  tiltRef?: RefObject<Tilt>;
  /**
   * Multiplicador de calidad. El hero monta DOS escenas WebGL a la vez;
   * la de fondo va a 0.6 para que el coste no se dispare en móvil.
   */
  qualityScale?: number;
  /**
   * Ignora el perfil por viewport y renderiza a resolución nativa
   * (DPR real topado en 2, 60 fps, escala 1) también en móvil. Solo
   * para la pieza central del hero: activarlo en las dos escenas a la
   * vez dispararía el coste sin que se note en la de fondo, que va
   * desenfocada por detrás de todo.
   */
  maxQuality?: boolean;
}) {
  const sceneRef = useRef<UnicornStudioScene | null>(null);
  const [quality, setQuality] = useState<Quality>(QUALITY.desktop);

  useEffect(() => {
    if (maxQuality) {
      setQuality({ dpi: dprCapped(), fps: 60, scale: 1 });
      return;
    }
    const base = window.innerWidth < 768 ? QUALITY.mobile : QUALITY.desktop;
    setQuality({
      ...base,
      dpi: base.dpi * qualityScale,
      scale: Math.max(0.25, Math.min(1, base.scale * qualityScale)),
    });
  }, [qualityScale, maxQuality]);

  // Un único rAF para audio e inclinación: dos bucles harían el doble
  // de trabajo por frame sin ninguna ventaja.
  useEffect(() => {
    let frame = 0;
    /** keyof AudioEnergy → nombre real en la escena. Se rellena al cargar. */
    let bound: Array<[keyof AudioEnergy, string]> = [];
    let tiltBound: Array<["x" | "y", string]> = [];
    /** Nombre del Vec2 conectado, si lo hay. Tiene prioridad. */
    let tiltVec: string | null = null;
    let resolved = false;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /** Solo en táctil: en escritorio el SDK ya mueve la escena con el
     *  ratón, y empujar `Position` a la vez sería pelearse con él. */
    const useTilt = coarse && !reduced;

    const resolveBindings = (scene: UnicornStudioScene) => {
      const manifest = scene.getVariableManifest?.() ?? [];
      const names = new Set(manifest.map((v) => v.name));

      // Preferimos un Vec2 que YA esté conectado a una propiedad de la
      // escena. Una variable sin bindings se puede escribir, pero no
      // mueve nada: es el fallo más habitual al configurar la escena.
      const boundVec = manifest.find(
        (v) => v.type?.toLowerCase() === "vec2" && (v.bindingCount ?? 0) > 0,
      );
      if (boundVec) tiltVec = boundVec.name;

      bound = (Object.keys(AUDIO_BINDINGS) as Array<keyof AudioEnergy>)
        .map((key) => {
          const hit = AUDIO_BINDINGS[key].find((n) => names.has(n));
          return hit ? ([key, hit] as [keyof AudioEnergy, string]) : null;
        })
        .filter((x): x is [keyof AudioEnergy, string] => x !== null);

      tiltBound = (["x", "y"] as const)
        .map((axis) => {
          const hit = TILT_BINDINGS[axis].find((n) => names.has(n));
          return hit ? ([axis, hit] as ["x" | "y", string]) : null;
        })
        .filter((x): x is ["x" | "y", string] => x !== null);

      if (process.env.NODE_ENV !== "production") {
        (window as unknown as { __scene?: unknown }).__scene = scene;
        console.info(
          "[UnicornBlob] variables publicadas por la escena:",
          manifest.map((v) => `${v.name} (${v.type})`),
        );
        console.info(
          bound.length
            ? `[UnicornBlob] audio enganchado a: ${bound.map(([k, n]) => `${k}→${n}`).join(", ")}`
            : "[UnicornBlob] la escena no publica variables de audio — el blob NO reaccionará a la música.",
        );
        if (useTilt) {
          console.info(
            tiltVec
              ? `[UnicornBlob] giroscopio → Vec2 «${tiltVec}» (conectado)`
              : tiltBound.length
                ? `[UnicornBlob] giroscopio enganchado a: ${tiltBound.map(([k, n]) => `${k}→${n}`).join(", ")}`
                : "[UnicornBlob] la escena no publica variables de inclinación.",
          );
        }
        // Aviso explícito: existe pero no está conectada = no hace nada.
        const huerfanas = manifest
          .filter((v) => (v.bindingCount ?? 0) === 0)
          .map((v) => v.name);
        if (huerfanas.length) {
          console.warn(
            `[UnicornBlob] variables SIN binding (se pueden escribir pero no mueven nada): ${huerfanas.join(", ")}`,
          );
        }
      }
      resolved = true;
    };

    const tick = () => {
      const scene = sceneRef.current;
      if (scene) {
        if (!resolved) resolveBindings(scene);
        const values: UnicornVariables = {};
        if (bound.length && energyRef?.current) {
          for (const [key, name] of bound) {
            values[name] = energyRef.current[key] * AUDIO_SCALE;
          }
        }
        if (useTilt) {
          // La deriva va SIEMPRE; la inclinación se suma encima si el
          // sensor está disponible (Android sin permiso, iOS con él).
          const now = performance.now() / 1000;
          const t = tiltRef?.current ?? { x: 0, y: 0 };
          const nx = clamp1(Math.sin(now * DRIFT_HZ.x) * DRIFT_SPAN + t.x);
          const ny = clamp1(
            Math.sin(now * DRIFT_HZ.y + DRIFT_PHASE) * DRIFT_SPAN + t.y,
          );
          if (tiltVec) {
            const vx = VEC_CENTER + nx * VEC_SPAN;
            const vy = VEC_CENTER + ny * VEC_SPAN;
            // El snippet que genera Unicorn usa `_x`/`_y`, pero los tipos
            // del paquete declaran `x`/`y`. Se envían LAS DOS: cuesta nada
            // y evita depender de cuál lee realmente el SDK.
            values[tiltVec] = { type: "Vec2", x: vx, y: vy, _x: vx, _y: vy } as never;
          } else if (tiltBound.length) {
            const pair = { x: nx, y: ny };
            for (const [axis, name] of tiltBound) {
              values[name] = VEC_CENTER + pair[axis] * VEC_SPAN;
            }
          }
        }
        if (Object.keys(values).length) {
          scene.setVariables?.(values);
          if (process.env.NODE_ENV !== "production") {
            (window as unknown as { __sent?: unknown }).__sent = values;
          }
        }
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [energyRef, tiltRef]);

  return (
    <div className={className}>
      <UnicornScene
        projectId={projectId}
        width="100%"
        height="100%"
        scale={quality.scale}
        dpi={quality.dpi}
        fps={quality.fps}
        lazyLoad={false}
        sceneRef={sceneRef}
        altText="Forma orgánica animada"
        ariaLabel="Forma orgánica animada que reacciona a la música"
        placeholderClassName="h-full w-full"
      />
    </div>
  );
}
