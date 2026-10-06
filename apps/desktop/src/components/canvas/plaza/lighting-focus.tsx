"use client";

import { useMemo, type Ref } from "react";
import * as THREE from "three";
import type { PlazaMode } from "./plaza-mode";

/**
 * Relleno de foco: una luz suave desde la cámara que SOLO entra mientras hay
 * un muñeco enfocado (la ficha abierta).
 *
 * Por qué: de noche la cara del enfocado solo la tocan la luna (fría y alta),
 * el relleno ambiente y, si cae cerca, una farola. A 3,5 m y con el tone
 * mapping Neutral hundiendo los oscuros, las pieles se quedaban en un pardo
 * apagado y no se distinguían entre sí. Es el "relleno de retrato" de
 * cualquier cinemática: rellena las sombras de la cara sin crear una
 * dirección de luz nueva (sale del propio punto de vista, así que no proyecta
 * nada que se vea), y la luna y las farolas siguen siendo las fuentes creíbles.
 *
 * Foco (`spotLight`) y no puntual: el cono se ciñe al enfocado y cae con
 * penumbra completa, así que los vecinos del borde apenas lo notan y no hay
 * "flash" sobre el resto de la plaza. Sin sombra.
 *
 * Coste: la luz existe siempre en el modo que la usa, con `intensity` 0 fuera
 * del foco. Montarla y desmontarla (o `visible`) cambiaría el número de luces
 * de la escena, y three recompila entonces TODOS los programas de material:
 * un tirón de cientos de ms justo al hacer clic. A intensidad 0 cuesta una
 * luz más en el bucle del fragment shader, nada más.
 */

/** Intensidad máxima (cd) y color por modo; `null` = sin relleno (ni se monta). */
export const FOCUS_FILL: Record<PlazaMode, { color: string; intensity: number } | null> = {
  // De día la cara ya tiene sol, IBL y relleno de sobra: un relleno más se
  // leía como cara plana. Sin luz = cero coste.
  dia: null,
  // Blanco apenas cálido: neutro bastante para que el tono de cada piel se
  // distinga (la luna lo enfría todo), y del lado de las farolas para no
  // parecer un flash.
  noche: { color: "#ffeedd", intensity: 13 },
};

/** Cono (rad, medio ángulo) y alcance de la luz. El muñeco enfocado está a
 * ~3,7 de la cámara y mide ~1,3: el cono lo cubre de cabeza a pies dentro de
 * su parte más brillante; a partir de ahí la penumbra lo apaga. */
const CONE = { angle: 0.36, penumbra: 1, distance: 9, decay: 2 } as const;
/** Altura de la luz sobre la cámara: un pelo por encima del ojo, como un
 * relleno de rodaje, para que no aplane del todo los volúmenes. */
const LIFT = 0.3;

/**
 * Cuánto relleno toca según el progreso del foco, 0 → 1, derivado del radio
 * del muelle de la cámara: así el fundido de entrada y de salida va pegado al
 * propio travelling, sin un temporizador aparte ni saltos.
 */
export function focusFillAmount(radius: number, restRadius: number, focusRadius: number): number {
  const t = THREE.MathUtils.clamp((restRadius - radius) / (restRadius - focusRadius), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Coloca y gradúa la luz: desde la cámara, apuntando al pivote del muñeco. */
export function updateFocusFill(
  light: THREE.SpotLight | null,
  mode: PlazaMode,
  from: THREE.Vector3,
  pivot: THREE.Vector3,
  amount: number,
): void {
  const cfg = FOCUS_FILL[mode];
  if (!light || !cfg) return;
  light.intensity = cfg.intensity * amount;
  light.position.set(from.x, from.y + LIFT, from.z);
  light.target.position.copy(pivot);
}

/** La luz y su objetivo (el objetivo tiene que estar en la escena para que
 * three actualice su matriz). */
export function FocusFill({ mode, ref }: { mode: PlazaMode; ref?: Ref<THREE.SpotLight> }) {
  const target = useMemo(() => new THREE.Object3D(), []);
  const cfg = FOCUS_FILL[mode];
  if (!cfg) return null;
  return (
    <>
      <spotLight
        ref={ref}
        color={cfg.color}
        intensity={0}
        angle={CONE.angle}
        penumbra={CONE.penumbra}
        distance={CONE.distance}
        decay={CONE.decay}
        target={target}
      />
      <primitive object={target} />
    </>
  );
}
