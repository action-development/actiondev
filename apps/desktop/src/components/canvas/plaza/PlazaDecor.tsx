"use client";

import { useEffect, useMemo } from "react";
import type { PlazaMode } from "./plaza-mode";
import { prefersReducedMotion } from "./plaza-motion";
import { contactSurfaces, type DecorCtx, type SurfaceDef } from "./decor/decor-kit";
import { buildDecorSacks } from "./decor/decor-build";
import { furnitureSurfaces } from "./decor/furniture";
import { vegetationSurfaces } from "./decor/vegetation";
import { PlazaFountain } from "./decor/PlazaFountain";

/**
 * Orquestador del mobiliario de la plaza: farolas, bancos, papeleras, setos,
 * arbolado, palmeras y fuente.
 *
 * Todo geometría primitiva — cero assets remotos, misma regla dura que el
 * resto de `plaza/`. Layout fijo y determinista (`buildDecor`): en anillos
 * regulares y mirando al centro, no esparcido como los muñecos.
 *
 * TODO EL MOBILIARIO ESTÁTICO SE FUSIONA EN UNA GEOMETRÍA POR MATERIAL (un
 * "saco"), ya colocado en coordenadas de mundo (`decor/decor-build.ts`). Montado
 * pieza a pieza eran ~145 draw calls (una farola sola son cinco) sobre los ~280
 * que ya cuestan los muñecos; fusionado son doce. Se puede porque es ESTÁTICO:
 * no se anima, no se selecciona y no cambia en toda la vida de la página. Lo
 * que tenga que moverse (la fuente) sale del merge y vive como componente
 * propio (`decor/PlazaFountain.tsx`).
 *
 * LOS SACOS NO SE DECLARAN AQUÍ. Cada módulo (`furniture.ts`, `vegetation.ts`,
 * `decor-kit.ts` para la sombra de contacto) pone piezas en sus sacos con
 * `put` y declara la superficie (material + banderas de render) en su factoría.
 * Este archivo solo concatena las tablas y las monta: añadir o quitar un saco
 * no toca ni el JSX ni este orquestador.
 *
 * Lo único que no es malla fusionada son los sprites de las superficies
 * `kind: "sprites"` (halos de las farolas): billboards, no se pueden fusionar.
 *
 * Sin interactividad: no lleva handlers de puntero, así que el "suelo
 * invisible" de `PlazaWorld` (cierra la ficha al hacer click fuera de un
 * muñeco) sigue recibiendo el evento por detrás sin `stopPropagation`.
 */

/** Tabla de superficies: la concatenación de las de cada módulo. */
function buildSurfaces(ctx: DecorCtx): SurfaceDef[] {
  return [...furnitureSurfaces(ctx), ...vegetationSurfaces(ctx), ...contactSurfaces(ctx)];
}

/** Geometrías fusionadas + materiales del mobiliario: uno solo para toda la
 * plaza, construido una vez por modo. */
function useDecor(mode: PlazaMode, frozen: boolean) {
  const decor = useMemo(() => {
    const ctx: DecorCtx = { mode, frozen };
    const { sacks, anchors } = buildDecorSacks(ctx);
    const surfaces = buildSurfaces(ctx);
    if (process.env.NODE_ENV !== "production") {
      const painted = new Set(surfaces.flatMap((s) => (s.kind === "mesh" ? [s.sack] : [])));
      for (const name of Object.keys(sacks)) {
        if (!painted.has(name)) console.error(`[PlazaDecor] el saco "${name}" tiene geometría pero ninguna superficie lo pinta.`);
      }
    }
    return { sacks, anchors, surfaces };
  }, [mode, frozen]);

  useEffect(() => {
    return () => {
      Object.values(decor.sacks).forEach((g) => g.dispose());
      decor.surfaces.forEach((s) => {
        s.material.dispose();
        if (s.kind === "mesh") s.customDepthMaterial?.dispose();
      });
    };
  }, [decor]);

  return decor;
}

export function PlazaDecor({ mode, still = false }: { mode: PlazaMode; still?: boolean }) {
  // Una vez: el modo y `?quieto` no cambian en caliente; si el visitante
  // cambia la preferencia con la página abierta, se respeta en la próxima carga.
  const frozen = useMemo(() => still || prefersReducedMotion(), [still]);
  const { sacks, anchors, surfaces } = useDecor(mode, frozen);

  return (
    <group>
      {surfaces.map((s, i) => {
        if (s.enabled === false) return null;
        if (s.kind === "sprites") {
          return (anchors[s.anchor] ?? []).map((pos, j) => (
            <sprite key={`${i}-${j}`} material={s.material} position={pos} scale={s.scale} />
          ));
        }
        const geometry = sacks[s.sack];
        if (!geometry) return null;
        return (
          <mesh
            key={i}
            geometry={geometry}
            material={s.material}
            castShadow={s.castShadow}
            receiveShadow={s.receiveShadow}
            renderOrder={s.renderOrder}
            {...(s.customDepthMaterial ? { customDepthMaterial: s.customDepthMaterial } : {})}
          />
        );
      })}

      <PlazaFountain mode={mode} frozen={frozen} />
    </group>
  );
}
