"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import type { Material, Object3D, ShaderMaterial, Texture, WebGLRenderer } from "three";

/**
 * Si la compilación no acaba en este plazo, se arranca igual: lo que falte se
 * compila en el primer frame, bloqueando como antes. Por debajo de los 12 s de
 * escotilla de `SceneCurtain`, para que el telón no se abra sobre un lienzo vacío.
 */
const WARMUP_TIMEOUT_MS = 10_000;

interface SceneWarmupProps {
  /** Shaders listos (o plazo agotado): la escena ya puede arrancar su bucle. */
  onDone: () => void;
}

/**
 * Precompila los shaders de la escena ANTES del primer frame y sin bloquear el
 * hilo principal.
 *
 * Sin esto, el primer `gl.render` compilaba todos los programas de golpe y en
 * síncrono: en la primera visita (caché de shaders del sistema vacía) eran
 * 2,4 s de hilo bloqueado en /projects, 1 s en /resenas y 3,4 s en /contact
 * (auditoría de cargas 2026-10, en un M4). `gl.compile` los lanza todos y, con
 * `KHR_parallel_shader_compile`, no espera a que acaben: compila el proceso de
 * GPU y aquí se sondea cada programa sin bloquear. El hilo principal, libre,
 * aprovecha para subir a la GPU las texturas ya pintadas (las `CanvasTexture`
 * de la escena), que si no también caían en ese primer frame.
 *
 * Sondeo propio y NO `gl.compileAsync`: el de three lee `currentProgram` de
 * cada material sin comprobarlo, y si uno se desecha mientras se compila (en
 * la recreativa, una pantalla cambia de material al llegar su captura) lanza
 * un TypeError dentro de su `setTimeout` y la promesa no resuelve nunca: el
 * telón esperaba al plazo de 10 s. Aquí un material desechado deja de contar.
 *
 * Contrato con la escena: su `<Canvas>` arranca con `frameloop="never"` y pasa a
 * `"always"` en `onDone`. Mientras se compila no se pinta ni corre ningún
 * `useFrame`, así que la entrada de cámara y el `onReady` del mundo (que abre
 * el telón) empiezan después, como antes empezaban tras el frame bloqueado. Va
 * el ÚLTIMO dentro del Canvas (y dentro del `<Suspense>`, si lo hay): su efecto
 * corre después de los de la escena, con todo montado y con lo que la escena
 * configure en efectos (entorno PMREM, niebla…) ya puesto — forma parte de la
 * clave de cada shader, y si cambia después hay que recompilar. Lo que llegue
 * más tarde (capturas, vídeo) se compila cuando llegue, como siempre.
 */
export function SceneWarmup({ onDone }: SceneWarmupProps) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let settled = false;
    let timer = 0;
    let poll = 0;
    const stop = () => {
      settled = true;
      window.clearTimeout(timer);
      window.clearTimeout(poll);
    };
    const finish = () => {
      if (settled) return;
      stop();
      onDoneRef.current();
    };
    timer = window.setTimeout(finish, WARMUP_TIMEOUT_MS);

    let pending: Set<Material>;
    try {
      pending = gl.compile(scene, camera);
      uploadReadyTextures(gl, scene);
    } catch {
      // Contexto perdido a mitad, o lo que sea: mejor arrancar y compilar en
      // el primer frame que dejar la escena parada detrás del telón.
      finish();
      return stop;
    }

    // Sin la extensión, `isReady()` dice que sí a todo y se arranca ya: el
    // primer frame esperará a la compilación, como antes.
    const check = () => {
      for (const material of pending) {
        const program = gl.properties.has(material)
          ? (gl.properties.get(material) as { currentProgram?: { isReady(): boolean } }).currentProgram
          : undefined;
        if (!program || program.isReady()) pending.delete(material);
      }
      if (pending.size === 0) finish();
      else poll = window.setTimeout(check, 10);
    };
    check();

    return stop;
  }, [gl, scene, camera]);

  return null;
}

/**
 * Sube a la GPU las texturas de los materiales que ya tienen píxeles. Lo que
 * aún se está descargando (versión 0, imagen sin decodificar) y lo que se
 * actualiza solo (vídeo, render targets) se queda para cuando toque.
 */
function uploadReadyTextures(gl: WebGLRenderer, scene: Object3D): void {
  const textures = new Set<Texture>();
  const collect = (material: Material) => {
    for (const value of Object.values(material)) {
      if ((value as Texture | null)?.isTexture) textures.add(value as Texture);
    }
    const uniforms = (material as ShaderMaterial).uniforms;
    if (!uniforms) return;
    for (const uniform of Object.values(uniforms)) {
      if ((uniform?.value as Texture | null)?.isTexture) textures.add(uniform.value as Texture);
    }
  };

  scene.traverse((object) => {
    const material = (object as { material?: Material | Material[] }).material;
    if (Array.isArray(material)) material.forEach(collect);
    else if (material) collect(material);
  });

  for (const texture of textures) {
    if (texture.version === 0 || texture.isRenderTargetTexture) continue;
    if ((texture as { isVideoTexture?: boolean }).isVideoTexture) continue;
    const image = texture.image as { complete?: boolean } | null;
    if (!image || image.complete === false) continue;
    gl.initTexture(texture);
  }
}
