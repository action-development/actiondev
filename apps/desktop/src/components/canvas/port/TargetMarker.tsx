"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createHoloMaterial, holoArrowShape } from "./holo-material";
import type { GrabCandidate } from "./crane-logic";

/**
 * Señales holográficas SOBRE los contenedores del muelle — la otra mitad de la
 * guía del gancho (`HookGuide.tsx`), pero para el ratón:
 *
 * - **Halo** (hover): una carcasa lima alrededor del contenedor que hay bajo el
 *   puntero. Junto con la etiqueta DOM (`overlays/HeroHud.tsx`) responde a
 *   "¿qué es esto y qué pasa si lo pincho?" ANTES de pincharlo.
 * - **Flecha** (señalar): la flecha de la bodega en pequeño, botando encima de
 *   un contenedor. La usan el primer paso del tutorial ("haz clic en uno") y la
 *   demostración en reposo de GameWorld.
 *
 * Visual puro, fuera de `<Physics>`, sin estado de React: GameWorld llama a
 * `update()` una vez por frame.
 */

/** Holgura de la carcasa alrededor del contenedor (a cada lado). */
const SHELL_PAD = 0.09;
const SHELL_ALPHA = 0.55;
/** Escala de la flecha respecto a la de la bodega (2,6 de alto → ~1,1). */
const ARROW_SCALE = 0.42;
/** Hueco entre el techo del contenedor y la punta de la flecha. */
const ARROW_GAP = 0.35;
const ARROW_DEPTH = 0.3;
const FADE = 12;

export interface TargetMarkerHandle {
  /**
   * @param hover contenedor bajo el puntero, o `null`.
   * @param point contenedor a señalar con la flecha, o `null`.
   */
  update(hover: GrabCandidate | null, point: GrabCandidate | null): void;
}

export const TargetMarker = forwardRef<TargetMarkerHandle, object>(function TargetMarker(_props, ref) {
  const shellRef = useRef<THREE.Mesh>(null);
  const arrowRef = useRef<THREE.Group>(null);

  const shellGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const arrowGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(holoArrowShape(), { depth: ARROW_DEPTH, bevelEnabled: false });
    g.translate(0, 0, -ARROW_DEPTH / 2);
    return g;
  }, []);
  // Carcasa casi hueca (fresnel alto, base baja): de frente tiñe el contenedor
  // sin taparle el rótulo; los cantos son los que brillan.
  const shellMat = useMemo(
    () => createHoloMaterial({ alpha: 0, scanAxis: [0, 1, 0], scanScale: 6, scanSpeed: 1.4, base: 0.1, fresnel: 0.9 }),
    [],
  );
  const arrowMat = useMemo(() => createHoloMaterial({ alpha: 0 }), []);

  useEffect(
    () => () => {
      shellGeo.dispose();
      arrowGeo.dispose();
      shellMat.dispose();
      arrowMat.dispose();
    },
    [shellGeo, arrowGeo, shellMat, arrowMat],
  );

  // Último objetivo conocido: al perder el hover la carcasa se apaga EN SU
  // SITIO en vez de desaparecer de golpe.
  const s = useRef({ hover: null as GrabCandidate | null, point: null as GrabCandidate | null, shellA: 0, arrowA: 0 });

  useImperativeHandle(ref, () => ({
    update(hover, point) {
      s.current.hover = hover;
      s.current.point = point;
    },
  }), []);

  useFrame((state, delta) => {
    const st = s.current;
    const t = state.clock.elapsedTime;
    const a = 1 - Math.exp(-FADE * Math.min(delta, 1 / 30));

    const shell = shellRef.current;
    if (shell) {
      st.shellA += ((st.hover ? SHELL_ALPHA : 0) - st.shellA) * a;
      shell.visible = st.shellA > 0.01;
      const h = st.hover;
      if (h) {
        shell.position.set(h.x, h.y, h.z ?? 0);
        shell.scale.set(h.halfW * 2 + SHELL_PAD * 2, h.halfH * 2 + SHELL_PAD * 2, 1.5 + SHELL_PAD * 2);
      }
      shellMat.uniforms.uAlpha.value = st.shellA;
      shellMat.uniforms.uTime.value = t;
    }

    const arrow = arrowRef.current;
    if (arrow) {
      st.arrowA += ((st.point ? 1 : 0) - st.arrowA) * a;
      arrow.visible = st.arrowA > 0.01;
      const p = st.point;
      if (p) {
        // Mismo bote seco que la flecha de la bodega: se leen como la misma señal.
        const bounce = Math.abs(Math.sin(t * 2.2));
        arrow.position.set(p.x, p.y + p.halfH + ARROW_GAP + bounce * 0.3, p.z ?? 0);
        arrow.rotation.y = Math.sin(t * 0.9) * 0.18;
      }
      arrowMat.uniforms.uAlpha.value = st.arrowA;
      arrowMat.uniforms.uTime.value = t;
    }
  });

  return (
    <>
      <mesh ref={shellRef} geometry={shellGeo} material={shellMat} visible={false} />
      <group ref={arrowRef} visible={false} scale={ARROW_SCALE}>
        <mesh geometry={arrowGeo} material={arrowMat} />
      </group>
    </>
  );
});
