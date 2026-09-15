"use client";

import { Environment, Lightformer } from "@react-three/drei";

/**
 * Entorno IBL de la escena — generado en GPU, sin red.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO (no borrar y volver a `<Environment preset="night" />`):
 *   El preset "night" de drei descarga `dikhololo_night_1k.hdr` (1,75 MB) desde
 *   `raw.githack.com`, un CDN de terceros que además responde con un 301 hacia
 *   raw.githubusercontent.com. Esa petición suspende el `<Suspense>` que envuelve
 *   a GameWorld, así que hasta que no termina no se monta el mundo, no se llama
 *   `onReady()` y el LoadingScreen se queda clavado en 85-95 %. En fibra eran
 *   ~2,5 s; en una conexión normal, o con githack lento, decenas de segundos.
 *
 *   Aquí el mapa de entorno se renderiza a una cubemap de 128 px con los
 *   Lightformer de abajo: 0 bytes de red, 0 suspensión, ~1 frame de coste.
 *
 * `frames={1}` → se renderiza una sola vez al montar. Los Lightformer son
 * estáticos, no hace falta rehacer la cubemap cada frame.
 *
 * Los materiales de PageCube y Character usan `envMapIntensity={2.5}` con
 * roughness muy baja, y el bezel de Basket es metalness 0.9 — el entorno SÍ se
 * ve en los reflejos. Si se tocan estas luces, verificar con
 * `pnpm --filter @actiondev/desktop screenshot`.
 */

/** Azul nocturno de fondo — equivalente al cielo del HDR original. */
const NIGHT_SKY = "#0b1022";

export function SceneEnvironment() {
  return (
    <Environment resolution={128} frames={1}>
      {/* Cielo: esfera invertida que rellena toda la cubemap de base. */}
      <mesh scale={100}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={NIGHT_SKY} side={1 /* THREE.BackSide */} />
      </mesh>

      {/* Key: la "luna". Alineada con el directionalLight de GameWorld ([10,15,8])
          para que el reflejo especular caiga donde cae la sombra. */}
      <Lightformer
        form="rect"
        intensity={6}
        color="#cfe0ff"
        position={[10, 15, 8]}
        scale={[12, 12, 1]}
        target={[0, 0, 0]}
      />

      {/* Fill frío por el lado opuesto — evita que las caras en sombra queden
          planas y negras, que es lo que aportaba el HDR. */}
      <Lightformer
        form="rect"
        intensity={1.2}
        color="#3a5c8f"
        position={[-14, 4, 6]}
        scale={[16, 16, 1]}
        target={[0, 0, 0]}
      />

      {/* Rebote inferior tenue: los cubos caen al suelo y sin esto el borde
          inferior pierde la lectura de volumen. */}
      <Lightformer
        form="rect"
        intensity={0.6}
        color="#1e2a44"
        position={[0, -12, 4]}
        scale={[20, 10, 1]}
        target={[0, 0, 0]}
      />

      {/* Acento lima del sistema de diseño, muy sutil, solo en los reflejos
          especulares de los cubos (roughness 0.05). */}
      <Lightformer
        form="circle"
        intensity={1.5}
        color="#c8ff00"
        position={[-4, 10, -10]}
        scale={[4, 4, 1]}
        target={[0, 0, 0]}
      />
    </Environment>
  );
}
