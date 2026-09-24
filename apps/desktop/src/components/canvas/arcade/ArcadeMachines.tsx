"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { CABINET, screenCenter, type MachineSpec } from "./arcade-config";
import type { ArcadePalette } from "./arcade-mode";
import {
  coverFit,
  getAttractTexture,
  getBezelTexture,
  getGlassTexture,
  getGlowTexture,
  getGrilleTexture,
  getMarqueeAtlas,
  getPanelTexture,
  getScanlineTexture,
  getVignetteTexture,
  marqueeUv,
} from "./arcade-textures";
import { getContactShadowTexture } from "./hall-textures";
import { buildCabinetParts, crtGeometry, type Part, type PartMaterial } from "./cabinet-geometry";

interface ArcadeMachinesProps {
  machines: readonly MachineSpec[];
  palette: ArcadePalette;
  /** Máquina enfocada (se le enciende la pantalla y el marco lima). */
  focused: number | null;
  /** Máquina cuyo vídeo se reproduce. Va aparte de `focused` porque llega con
   * retardo: andando por el pasillo no se arranca un vídeo por cada máquina. */
  playing: number | null;
  onHover: (index: number | null) => void;
  onActivate: (index: number) => void;
}

const SCREEN_ASPECT = CABINET.screen.width / CABINET.screen.height;

function mat(position: [number, number, number], rotationX = 0): THREE.Matrix4 {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(...position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rotationX, 0, 0)),
    new THREE.Vector3(1, 1, 1),
  );
}

/** Matriz de mundo de una máquina. */
function machineMatrix(m: MachineSpec): THREE.Matrix4 {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(m.x, 0, m.z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, m.rotationY, 0)),
    new THREE.Vector3(1, 1, 1),
  );
}

/** Una pieza repetida en las N máquinas: una sola llamada de dibujo. */
function PartInstances({
  part,
  machines,
  material,
}: {
  part: Part;
  machines: readonly MachineSpec[];
  material: THREE.Material;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    machines.forEach((m, i) => {
      tmp.multiplyMatrices(machineMatrix(m), part.local);
      mesh.setMatrixAt(i, tmp);
      if (part.color) mesh.setColorAt(i, color.set(part.color(m)));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [machines, part]);

  return <instancedMesh ref={ref} args={[part.geometry, material, machines.length]} />;
}

// ─── Pantallas ───────────────────────────────────────────────────────────────

/** Capturas de los proyectos, cargadas una a una según llegan (fuera de Suspense). */
function useScreenImages(machines: readonly MachineSpec[]): Record<number, THREE.Texture> {
  const [images, setImages] = useState<Record<number, THREE.Texture>>({});

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    const loaded: THREE.Texture[] = [];
    // En orden de pasillo: primero las de la entrada, que son las que se ven.
    for (const m of machines) {
      if (!m.image) continue;
      loader.load(m.image, (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        const img = tex.image as HTMLImageElement;
        coverFit(tex, img.width / img.height, SCREEN_ASPECT);
        loaded.push(tex);
        setImages((prev) => ({ ...prev, [m.index]: tex }));
      });
    }
    return () => {
      cancelled = true;
      for (const tex of loaded) tex.dispose();
    };
  }, [machines]);

  return images;
}

/**
 * Vídeo de la máquina enfocada. Solo UNO a la vez: se crea al enfocar y se
 * destruye al irse, así que en el pasillo nunca hay más de un `.webm` bajando.
 * Con `prefers-reduced-motion` no se reproduce nada: la captura basta.
 */
function useScreenVideo(machine: MachineSpec | null): THREE.VideoTexture | null {
  const [texture, setTexture] = useState<{ src: string; tex: THREE.VideoTexture } | null>(null);
  const src = machine?.project.video ?? null;

  useEffect(() => {
    if (!src) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    video.src = src;
    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    const onReady = () => {
      if (cancelled) return;
      coverFit(tex, video.videoWidth / video.videoHeight, SCREEN_ASPECT);
      setTexture({ src, tex });
    };
    video.addEventListener("loadeddata", onReady, { once: true });
    void video.play().catch(() => {});
    return () => {
      cancelled = true;
      video.removeEventListener("loadeddata", onReady);
      video.pause();
      video.removeAttribute("src");
      video.load();
      tex.dispose();
      setTexture(null);
    };
  }, [src]);

  return texture && texture.src === src ? texture.tex : null;
}

const WHITE = new THREE.Color("#ffffff");

/**
 * Las recreativas del pasillo.
 *
 * Todo lo que se repite va instanciado (una llamada de dibujo por pieza, no por
 * máquina) y las 32 marquesinas son UNA malla fusionada que recorta un atlas.
 * Lo único que va por máquina es la pantalla, porque cada una lleva su propia
 * textura (demo → captura → vídeo).
 */
export function ArcadeMachines({ machines, palette, focused, playing, onHover, onActivate }: ArcadeMachinesProps) {
  const parts = useMemo(() => buildCabinetParts(), []);

  const materials = useMemo<Record<PartMaterial, THREE.Material>>(
    () => ({
      body: new THREE.MeshStandardMaterial({ color: palette.cabinet, roughness: 0.8, metalness: 0 }),
      // Laterales de melamina: algo de brillo para que el canto del bisel coja luz.
      panel: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.45, metalness: 0 }),
      molding: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.3, metalness: 0 }),
      // Vinilo: a dos caras porque el del lado derecho es el izquierdo en espejo.
      decal: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.5, metalness: 0, side: THREE.DoubleSide }),
      metal: new THREE.MeshStandardMaterial({ color: "#3a3b42", roughness: 0.35, metalness: 0.45 }),
      black: new THREE.MeshStandardMaterial({ color: "#0c0c0f", roughness: 0.6, metalness: 0.1 }),
      chrome: new THREE.MeshStandardMaterial({ color: "#c9ccd4", roughness: 0.18, metalness: 0.7 }),
      // Botones de plástico: brillantes, con el color por instancia.
      cap: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.22, metalness: 0 }),
      trim: new THREE.MeshStandardMaterial({ color: "#aeb2ba", roughness: 0.28, metalness: 0.6 }),
      grille: new THREE.MeshStandardMaterial({ map: getGrilleTexture(), roughness: 0.9, metalness: 0 }),
      // Serigrafía del panel: impresa, así que recibe luz como el resto del mueble.
      panelArt: new THREE.MeshStandardMaterial({ map: getPanelTexture(), roughness: 0.35, metalness: 0 }),
      // Luz propia: no dependen de la iluminación de la sala.
      lamp: new THREE.MeshBasicMaterial({ color: "#ff6a2a", toneMapped: false }),
      start: new THREE.MeshBasicMaterial({ color: "#f4ffd6", toneMapped: false }),
      // Bisel retroiluminado por el tubo: el arte brilla aunque la sala esté a oscuras.
      bezel: new THREE.MeshBasicMaterial({ map: getBezelTexture(), color: "#b8b8b8", toneMapped: false }),
    }),
    [palette.cabinet],
  );

  useEffect(
    () => () => {
      for (const m of Object.values(materials)) m.dispose();
    },
    [materials],
  );
  useEffect(
    () => () => {
      for (const p of parts) p.geometry.dispose();
    },
    [parts],
  );

  // Marquesinas: una malla fusionada, cada plano con las UV de su celda.
  const marquee = useMemo(() => {
    const planes = machines.map((m) => {
      const g = new THREE.PlaneGeometry(CABINET.marquee.width, CABINET.marquee.height);
      const [u0, v0, u1, v1] = marqueeUv(m.index, machines.length);
      const uv = g.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, uv.getX(i) === 0 ? u0 : u1, uv.getY(i) === 0 ? v0 : v1);
      }
      g.applyMatrix4(
        new THREE.Matrix4().multiplyMatrices(machineMatrix(m), mat([0, CABINET.marquee.y, CABINET.marquee.z], CABINET.marquee.tilt)),
      );
      return g;
    });
    const merged = mergeGeometries(planes);
    for (const g of planes) g.dispose();
    return {
      geometry: merged,
      material: new THREE.MeshBasicMaterial({ map: getMarqueeAtlas(machines), toneMapped: false }),
    };
  }, [machines]);
  useEffect(
    () => () => {
      marquee.geometry.dispose();
      marquee.material.dispose();
    },
    [marquee],
  );

  // Pantallas.
  const screenGeometry = useMemo(() => crtGeometry(), []);
  const screenMaterials = useMemo(
    () =>
      machines.map(
        (m) => new THREE.MeshBasicMaterial({ map: getAttractTexture(m), toneMapped: false }),
      ),
    [machines],
  );
  useEffect(
    () => () => {
      screenGeometry.dispose();
      for (const s of screenMaterials) s.dispose();
    },
    [screenGeometry, screenMaterials],
  );

  const images = useScreenImages(machines);
  const video = useScreenVideo(playing === null ? null : machines[playing] ?? null);

  // Mapa y brillo de cada pantalla: vídeo > captura > demo. La enfocada sube a
  // blanco puro; el resto se queda en su gris de demo.
  useEffect(() => {
    const idle = new THREE.Color(palette.screenIdle);
    screenMaterials.forEach((material, i) => {
      const map = (i === playing && video) || images[i] || getAttractTexture(machines[i]);
      if (material.map !== map) {
        material.map = map;
        material.needsUpdate = true;
      }
      material.color.copy(i === focused ? WHITE : idle);
    });
  }, [screenMaterials, images, video, playing, focused, palette.screenIdle, machines]);

  const screenMatrices = useMemo(
    () =>
      machines.map((m) =>
        new THREE.Matrix4().multiplyMatrices(
          machineMatrix(m),
          mat([0, CABINET.screen.y, CABINET.screen.z], CABINET.screen.tilt),
        ),
      ),
    [machines],
  );

  // Capas del tubo, apiladas sobre la imagen: líneas de barrido, viñeteado
  // (esquinas redondeadas y bordes en sombra) y el reflejo del cristal.
  const overlays = useMemo(
    () => [
      {
        offset: 0.0012,
        material: new THREE.MeshBasicMaterial({
          map: getScanlineTexture(),
          transparent: true,
          depthWrite: false,
          toneMapped: false,
        }),
      },
      {
        offset: 0.0024,
        material: new THREE.MeshBasicMaterial({
          map: getVignetteTexture(),
          transparent: true,
          depthWrite: false,
          toneMapped: false,
        }),
      },
      {
        offset: 0.0036,
        material: new THREE.MeshBasicMaterial({
          map: getGlassTexture(),
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          toneMapped: false,
        }),
      },
    ],
    [],
  );
  useEffect(
    () => () => {
      for (const o of overlays) o.material.dispose();
    },
    [overlays],
  );

  // Resplandor de cada pantalla sobre la moqueta (aditivo, del color de la máquina).
  const glowRef = useRef<THREE.InstancedMesh>(null);
  const glowGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), []);
  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: getGlowTexture(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        opacity: palette.screenGlow,
      }),
    [palette.screenGlow],
  );
  useEffect(
    () => () => {
      glowGeometry.dispose();
      glowMaterial.dispose();
    },
    [glowGeometry, glowMaterial],
  );
  useLayoutEffect(() => {
    const mesh = glowRef.current;
    if (!mesh) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    machines.forEach((m, i) => {
      // Delante de la máquina, sobre el pasillo.
      tmp.compose(
        new THREE.Vector3(m.x - m.side * (CABINET.depth / 2 + 0.45), 0.005, m.z),
        new THREE.Quaternion(),
        new THREE.Vector3(1.5, 1, 1.2),
      );
      mesh.setMatrixAt(i, tmp);
      mesh.setColorAt(i, color.set(m.sideColor));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [machines]);

  // Zona de click: una caja invisible por máquina, instanciada. `instanceId`
  // dice qué máquina es sin tener que mapear mallas.
  const hitGeometry = useMemo(
    () => new THREE.BoxGeometry(CABINET.width, 2.2, CABINET.depth).translate(0, 1.1, 0),
    [],
  );
  const hitMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
    [],
  );
  useEffect(
    () => () => {
      hitGeometry.dispose();
      hitMaterial.dispose();
    },
    [hitGeometry, hitMaterial],
  );
  const hitRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = hitRef.current;
    if (!mesh) return;
    machines.forEach((m, i) => mesh.setMatrixAt(i, machineMatrix(m)));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [machines]);

  return (
    <group>
      {parts.map((part, i) => (
        <PartInstances key={i} part={part} machines={machines} material={materials[part.material]} />
      ))}

      <mesh geometry={marquee.geometry} material={marquee.material} />

      {machines.map((m, i) => (
        <mesh
          key={m.project.id}
          geometry={screenGeometry}
          material={screenMaterials[i]}
          matrix={screenMatrices[i]}
          matrixAutoUpdate={false}
        />
      ))}

      {overlays.map((o) => (
        <ScreenLayer
          key={o.offset}
          geometry={screenGeometry}
          material={o.material}
          matrices={screenMatrices}
          offset={o.offset}
        />
      ))}
      <instancedMesh ref={glowRef} args={[glowGeometry, glowMaterial, machines.length]} />
      <ContactShadows machines={machines} />

      <instancedMesh
        ref={hitRef}
        args={[hitGeometry, hitMaterial, machines.length]}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) onHover(e.instanceId);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) onActivate(e.instanceId);
        }}
      />

      <FocusFrame machine={focused === null ? null : machines[focused] ?? null} />
      <FocusLight machine={focused === null ? null : machines[focused] ?? null} />
    </group>
  );
}

/**
 * Marco lima alrededor de la pantalla enfocada: el "cursor" del pasillo. Una
 * sola pieza que se muda de máquina, no un marco por máquina.
 */
function FocusFrame({ machine }: { machine: MachineSpec | null }) {
  const geometry = useMemo(() => {
    // Sobre el filete impreso del bisel, que ya rodea el tubo con holgura.
    const w = CABINET.screen.width + 0.05;
    const h = CABINET.screen.height + 0.05;
    const t = 0.012;
    const bars = [
      new THREE.BoxGeometry(w + t, t, t).translate(0, h / 2, 0),
      new THREE.BoxGeometry(w + t, t, t).translate(0, -h / 2, 0),
      new THREE.BoxGeometry(t, h, t).translate(w / 2, 0, 0),
      new THREE.BoxGeometry(t, h, t).translate(-w / 2, 0, 0),
    ];
    const merged = mergeGeometries(bars);
    for (const b of bars) b.dispose();
    return merged;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const matrix = useMemo(() => {
    if (!machine) return null;
    return new THREE.Matrix4().multiplyMatrices(
      machineMatrix(machine),
      mat([0, CABINET.screen.y, CABINET.screen.z], CABINET.screen.tilt),
    );
  }, [machine]);

  if (!matrix) return null;
  return (
    <mesh geometry={geometry} matrix={matrix} matrixAutoUpdate={false}>
      <meshBasicMaterial color="#c8ff00" toneMapped={false} />
    </mesh>
  );
}

/**
 * Una capa del tubo repetida en todas las pantallas: misma geometría curva,
 * desplazada `offset` sobre la normal para no pelearse en el z-buffer.
 */
function ScreenLayer({
  geometry,
  material,
  matrices,
  offset,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrices: readonly THREE.Matrix4[];
  offset: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const lift = new THREE.Matrix4().makeTranslation(0, 0, offset);
    const tmp = new THREE.Matrix4();
    matrices.forEach((sm, i) => mesh.setMatrixAt(i, tmp.multiplyMatrices(sm, lift)));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices, offset]);
  return <instancedMesh ref={ref} args={[geometry, material, matrices.length]} renderOrder={1} />;
}

/**
 * La luz del tubo enfocado sobre su propio panel de mandos y la moqueta de
 * delante. Una sola luz que se muda de máquina: con 32 el shader de todos los
 * materiales se recompilaría y el coste por píxel se dispararía. Siempre
 * montada (intensidad 0 sin foco) para que el número de luces no cambie.
 */
function FocusLight({ machine }: { machine: MachineSpec | null }) {
  const position = useMemo<[number, number, number]>(() => {
    if (!machine) return [0, -10, 0];
    const sc = screenCenter(machine);
    // Delante del tubo, hacia el pasillo, y un poco por debajo: ilumina el panel.
    return [sc.x - machine.side * 0.38, sc.y - 0.12, sc.z];
  }, [machine]);
  return (
    <pointLight
      position={position}
      // El color de la máquina lavado hacia blanco: a pleno color (el lima de
      // noche) teñía el mueble entero de neón.
      color={machine ? `#${new THREE.Color(machine.sideColor).lerp(WHITE, 0.65).getHexString()}` : "#ffffff"}
      intensity={machine ? 0.6 : 0}
      distance={2.4}
      decay={2}
    />
  );
}

/**
 * Sombra de contacto bajo cada mueble: una mancha difuminada algo mayor que la
 * planta. Es lo que asienta la máquina en la moqueta — sin ella, con solo luz
 * de relleno, los muebles parecen flotar.
 */
function ContactShadows({ machines }: { machines: readonly MachineSpec[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: getContactShadowTexture(),
        color: "#000000",
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      }),
    [],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    // La textura deja un margen difuminado de ~25 % por lado: se escala para
    // que el núcleo oscuro coincida con la planta del mueble.
    const local = new THREE.Matrix4().compose(
      new THREE.Vector3(0, 0.004, 0),
      new THREE.Quaternion(),
      new THREE.Vector3(CABINET.width * 1.75, 1, CABINET.depth * 1.75),
    );
    const tmp = new THREE.Matrix4();
    machines.forEach((m, i) => mesh.setMatrixAt(i, tmp.multiplyMatrices(machineMatrix(m), local)));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [machines]);
  return <instancedMesh ref={ref} args={[geometry, material, machines.length]} renderOrder={1} />;
}
