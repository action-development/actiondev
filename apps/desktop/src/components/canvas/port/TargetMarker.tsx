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
 * - **Balizas** (siempre): un pulso lima tenue sobre CADA contenedor navegable
 *   (`href` real), para que se vea de un vistazo cuáles se pueden pinchar sin
 *   tener que pasar el ratón por todos. Los de decorado ("#…") no la llevan.
 * - **Flecha** (señalar): la flecha de la bodega en pequeño, botando encima de
 *   un contenedor. La usa la demostración en reposo de GameWorld.
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
/** Balizas: respiración entre estos dos alfas, con desfase por contenedor. */
const BEACON_MIN = 0.4;
const BEACON_MAX = 0.95;
const BEACON_PAD = 0.1;
const BEACON_PERIOD = 2.2;
/** Máximo de balizas simultáneas (hay 11 contenedores; margen por si crecen). */
const BEACON_POOL = 16;

export interface TargetMarkerHandle {
  /**
   * @param hover contenedor bajo el puntero, o `null`.
   * @param point contenedor a señalar con la flecha, o `null`.
   * @param beacons contenedores navegables a marcar, o `null` para apagarlas
   *   (con carga colgando el click no elige contenedor).
   */
  update(hover: GrabCandidate | null, point: GrabCandidate | null, beacons: readonly GrabCandidate[] | null): void;
}

export const TargetMarker = forwardRef<TargetMarkerHandle, object>(function TargetMarker(_props, ref) {
  const shellRef = useRef<THREE.Mesh>(null);
  const arrowRef = useRef<THREE.Group>(null);
  const beaconRefs = useRef<(THREE.Mesh | null)[]>([]);

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
  // Un material por baliza: cada una respira con su propio alfa. Más tenue que
  // el halo de hover para que este último siga leyéndose como "el elegido".
  const beaconMats = useMemo(
    () =>
      Array.from({ length: BEACON_POOL }, () =>
        createHoloMaterial({ alpha: 0, scanAxis: [0, 1, 0], scanScale: 4, scanSpeed: 0.9, base: 0.2, fresnel: 1.8 }),
      ),
    [],
  );

  useEffect(
    () => () => {
      shellGeo.dispose();
      arrowGeo.dispose();
      shellMat.dispose();
      arrowMat.dispose();
      for (const m of beaconMats) m.dispose();
    },
    [shellGeo, arrowGeo, shellMat, arrowMat, beaconMats],
  );

  // Último objetivo conocido: al perder el hover la carcasa se apaga EN SU
  // SITIO en vez de desaparecer de golpe.
  const s = useRef({
    hover: null as GrabCandidate | null,
    point: null as GrabCandidate | null,
    beacons: null as readonly GrabCandidate[] | null,
    shellA: 0,
    arrowA: 0,
    beaconA: 0,
  });

  useImperativeHandle(ref, () => ({
    update(hover, point, beacons) {
      s.current.hover = hover;
      s.current.point = point;
      s.current.beacons = beacons;
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

    // Balizas: aparecen/desaparecen juntas (fundido global) y respiran cada una
    // a su ritmo. La del contenedor bajo el puntero se apaga: ya tiene el halo.
    st.beaconA += ((st.beacons ? 1 : 0) - st.beaconA) * a;
    const list = st.beacons;
    const pool = beaconRefs.current;
    for (let i = 0; i < BEACON_POOL; i++) {
      const mesh = pool[i];
      if (!mesh) continue;
      const b = list && i < list.length ? list[i] : null;
      const show = b !== null && st.beaconA > 0.01;
      mesh.visible = show;
      if (!show || !b) continue;
      mesh.position.set(b.x, b.y, b.z ?? 0);
      mesh.scale.set(b.halfW * 2 + BEACON_PAD * 2, b.halfH * 2 + BEACON_PAD * 2, 1.5 + BEACON_PAD * 2);
      const breath = 0.5 + 0.5 * Math.sin((t / BEACON_PERIOD) * Math.PI * 2 - i * 0.7);
      const hovered = st.hover !== null && st.hover.id === b.id;
      const mat = beaconMats[i];
      mat.uniforms.uAlpha.value = hovered ? 0 : (BEACON_MIN + (BEACON_MAX - BEACON_MIN) * breath) * st.beaconA;
      mat.uniforms.uTime.value = t;
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
      {beaconMats.map((mat, i) => (
        <mesh
          key={i}
          ref={(m) => {
            beaconRefs.current[i] = m;
          }}
          geometry={shellGeo}
          material={mat}
          visible={false}
          renderOrder={1}
        />
      ))}
      <mesh ref={shellRef} geometry={shellGeo} material={shellMat} visible={false} />
      <group ref={arrowRef} visible={false} scale={ARROW_SCALE}>
        <mesh geometry={arrowGeo} material={arrowMat} />
      </group>
    </>
  );
});
