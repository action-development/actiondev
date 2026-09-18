"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createHoloMaterial } from "./holo-material";
import { SPREADER_HALF_W, SPREADER_HALF_H } from "./Crane";
import type { GrabCandidate } from "./crane-logic";

/**
 * Guía holográfica del gancho — la "cortina de luz" que proyecta el spreader.
 *
 * El problema que resuelve: con TRES filas en profundidad y el péndulo vivo, a
 * esta cámara casi ortogonal no hay forma de saber sobre qué contenedor va a
 * caer el spreader. La grúa lo sabe (`findGrabTarget`), así que lo dibuja: cuatro
 * hilos verticales desde sus esquinas hasta la cota de aterrizaje y una huella
 * tumbada en esa superficie. Si hay presa, la huella SALTA al contenedor y
 * sube de brillo — ahí está la lectura "vas a enganchar ESE".
 *
 * Mismo lenguaje que la flecha de la bodega (`holo-material.ts`): es la misma
 * voz de la máquina hablándole al jugador, no un HUD aparte.
 *
 * Es puramente VISUAL y va FUERA de `<Physics>`: no colisiona con nada. Como
 * todo en el hero, no tiene estado de React — GameWorld le escribe una vez por
 * frame con `update()` y aquí solo se mutan posiciones, escalas y uniforms.
 */

/** Semiancho de la cortina: un pelo por dentro del spreader para que se lea como suya. */
const CURTAIN_HALF_W = SPREADER_HALF_W * 0.85;
/** Semifondo de la cortina (los cuatro hilos van a ±0.6 en z). */
const CURTAIN_HALF_D = 0.6;
/** Grosor de cada hilo. Fino a propósito: tiene que AYUDAR, no tapar. */
const LINE_W = 0.035;
/** Fondo de la huella (los contenedores miden 1.5 de fondo). */
const FOOTPRINT_DEPTH = 1.5;
/** La huella se despega un pelo de la superficie para no pelearse con el z-buffer. */
const FOOTPRINT_LIFT = 0.02;

const LINE_ALPHA = 0.35;
const FOOT_ALPHA = 0.25;
/** Con presa la huella sube de brillo: es el "lock on". */
const FOOT_ALPHA_LOCKED = 0.5;
/** Suavizado del salto de la huella al cambiar de objetivo (1/s). */
const SNAP = 14;

const LINE_X = [-CURTAIN_HALF_W, CURTAIN_HALF_W, -CURTAIN_HALF_W, CURTAIN_HALF_W];
const LINE_Z = [-CURTAIN_HALF_D, -CURTAIN_HALF_D, CURTAIN_HALF_D, CURTAIN_HALF_D];

export interface HookGuideHandle {
  /**
   * Una llamada por frame desde el bucle de GameWorld.
   *
   * @param hookX   x del spreader (carro + péndulo), en MUNDO.
   * @param hookY   y del CENTRO del spreader.
   * @param hookZ   profundidad del pórtico (fila).
   * @param target  contenedor que se engancharía al bajar, o `null`.
   * @param groundY cota del suelo bajo `hookX` (muelle, bodega o agua).
   * @param visible `false` la esconde sin desmontarla.
   */
  update(
    hookX: number,
    hookY: number,
    hookZ: number,
    target: GrabCandidate | null,
    groundY: number,
    visible: boolean,
  ): void;
}

export const HookGuide = forwardRef<HookGuideHandle, object>(function HookGuide(_props, ref) {
  const rootRef = useRef<THREE.Group>(null);
  const linesRef = useRef<(THREE.Mesh | null)[]>([]);
  const footRef = useRef<THREE.Mesh>(null);

  // Caja y plano UNITARIOS: todo el movimiento es escala y posición, nunca se
  // reconstruye geometría (eso reasignaría buffers 60 veces por segundo).
  const lineGeo = useMemo(() => new THREE.BoxGeometry(LINE_W, 1, LINE_W), []);
  const footGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1);
    g.rotateX(-Math.PI / 2); // tumbado sobre el suelo
    return g;
  }, []);

  // Barrido que BAJA por los hilos (eje y) y que corre en profundidad en la
  // huella (eje z): en un plano horizontal un barrido en y haría parpadear la
  // figura entera de golpe, que es exactamente lo que no se quiere.
  const lineMat = useMemo(
    () => createHoloMaterial({ alpha: LINE_ALPHA, scanAxis: [0, 1, 0], scanScale: 2.2, scanSpeed: -2.4 }),
    [],
  );
  const footMat = useMemo(
    () =>
      createHoloMaterial({
        alpha: FOOT_ALPHA,
        scanAxis: [0, 0, 1],
        scanScale: 3.5,
        scanSpeed: 1.1,
        // Casi plano: de canto, el fresnel de un plano horizontal es 1 en toda
        // su superficie y la huella se volvía un rectángulo macizo.
        base: 0.95,
        fresnel: 0.12,
      }),
    [],
  );

  useEffect(
    () => () => {
      lineGeo.dispose();
      footGeo.dispose();
      lineMat.dispose();
      footMat.dispose();
    },
    [lineGeo, footGeo, lineMat, footMat],
  );

  // Estado interpolado de la huella: sin esto, cruzar de un contenedor a otro
  // la teletransporta y el ojo pierde de vista qué está señalando.
  const foot = useRef({ x: 0, z: 0, y: 0, w: SPREADER_HALF_W * 2, alpha: FOOT_ALPHA, init: false });

  useImperativeHandle(ref, () => ({
    update(hookX, hookY, hookZ, target, groundY, visible) {
      const root = rootRef.current;
      if (!root) return;
      root.visible = visible;
      if (!visible) return;

      // Cota de aterrizaje: el techo de la presa o, sin presa, el suelo de esa x.
      const landingY = target ? target.y + target.halfH : groundY;
      const top = hookY - SPREADER_HALF_H;
      // Longitud mínima: con el spreader ya posado, cuatro hilos de 0 se ven
      // como cuatro puntos sucios. Mejor que desaparezcan.
      const len = Math.max(top - landingY, 0);

      for (let i = 0; i < LINE_X.length; i++) {
        const m = linesRef.current[i];
        if (!m) continue;
        m.visible = len > 0.05;
        m.position.set(hookX + LINE_X[i], landingY + len / 2, hookZ + LINE_Z[i]);
        m.scale.y = len;
      }

      const f = foot.current;
      f.x = target ? target.x : hookX;
      f.z = target ? target.z ?? hookZ : hookZ;
      f.y = landingY + FOOTPRINT_LIFT;
      f.w = target ? target.halfW * 2 : SPREADER_HALF_W * 2;
      f.alpha = target ? FOOT_ALPHA_LOCKED : FOOT_ALPHA;
    },
  }), []);

  useFrame((state, delta) => {
    const root = rootRef.current;
    if (!root || !root.visible) return;
    const t = state.clock.elapsedTime;
    lineMat.uniforms.uTime.value = t;
    footMat.uniforms.uTime.value = t;

    const m = footRef.current;
    if (!m) return;
    const f = foot.current;
    // Persecución exponencial e independiente del framerate.
    const a = f.init ? 1 - Math.exp(-SNAP * Math.min(delta, 1 / 30)) : 1;
    f.init = true;
    m.position.x += (f.x - m.position.x) * a;
    m.position.y += (f.y - m.position.y) * a;
    m.position.z += (f.z - m.position.z) * a;
    m.scale.x += (f.w - m.scale.x) * a;
    footMat.uniforms.uAlpha.value += (f.alpha - footMat.uniforms.uAlpha.value) * a;
  });

  return (
    <group ref={rootRef} visible={false}>
      {LINE_X.map((_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            linesRef.current[i] = m;
          }}
          geometry={lineGeo}
          material={lineMat}
        />
      ))}
      <mesh ref={footRef} geometry={footGeo} material={footMat} scale={[SPREADER_HALF_W * 2, 1, FOOTPRINT_DEPTH]} />
    </group>
  );
});
