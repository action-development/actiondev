"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import { DOOR, HALL, NEON_ROOM, NEON_ROOM_HEIGHT, NEON_WALL_Z, neonRoomHalfWidth } from "./arcade-config";
import { getGlowTexture, getSignTexture, loadLogoTexture } from "./arcade-textures";

/** Estado de la salida que escribe `ArcadeWorld` y lee la puerta cada frame. */
export interface DoorExitState {
  /** Apertura de las hojas en la salida, 0-1 (ya con su curva). */
  open: number;
}

interface ArcadeDoorProps {
  /** Rótulo del dintel, ya traducido ("TRABAJEMOS JUNTOS"). */
  label: string;
  hovered: boolean;
  exit: RefObject<DoorExitState>;
  reduced: boolean;
  /** Click en la puerta, su rótulo o lo que se ve tras ella: se va andando hasta ella. */
  onDoor: () => void;
  onHover: (hovering: boolean) => void;
}

const NEON = "#c8ff00";
/** Lo mismo que `--background`: los huecos entre lamas son los de la persiana. */
const VOID = "#080808";
const LOGO_SRC = "/logos/logo.webp";
const LOGO_ASPECT = 1563 / 625;
const SIGN_ASPECT = 1024 / 160;

const LEAF_W = DOOR.width / 2 - 0.01;
/** Grosor nominal del tubo de neón del vano. */
const TUBE = 0.036;
/** Grosor mínimo en pantalla (px CSS) de todo lo lima fino. Por debajo de ~1 px
 * una línea brillante sobre negro aparece y desaparece con el balanceo de la
 * cámara: desde la entrada, a 25-30 m, eso se leía como un neón que palpitaba. */
const MIN_PX = 1.5;

/** Metros que ocupa un píxel CSS a distancia `d` de la cámara. */
function worldPerPixel(d: number, fovDeg: number, viewportHeight: number): number {
  return (2 * Math.max(d, 0.05) * Math.tan((fovDeg * Math.PI) / 360)) / viewportHeight;
}

/** Margen del halo del neón alrededor del vano (m). */
const HALO_MARGIN = 0.9;
const STILE = 0.07;
const KICK = 0.24;
/** Las hojas van al fondo del vano, enrasadas con la cara interior del muro. */
const HINGE_Z = HALL.endZ - DOOR.reveal + 0.03;
const ROOM_FRONT = HALL.endZ - DOOR.reveal;
/** Altura de los ojos: la sala de neón está centrada en ella. */
const EYE = NEON_ROOM_HEIGHT / 2;
/** Tope de instancias: líneas + 4 barras por arco + lamas, con holgura. */
const MAX_BARS = 64;

/**
 * La puerta del fondo y lo que hay detrás.
 *
 * - **Vano**: la pared (`ArcadeWalls`) lleva el hueco recortado; aquí van el
 *   forro de acero con su fondo (`DOOR.reveal`) y el tubo de neón que lo
 *   recorre por delante.
 * - **Hojas**: dos, de cristal con perfil de aluminio, zócalo y barra
 *   antipánico — una puerta de salida de verdad. Giran sobre las bisagras hacia
 *   DENTRO de la sala de neón (se empujan). Al apuntarlas se entreabren.
 * - **Sala de neón**: una caja oscura con líneas y arcos lima que fugan hacia
 *   una pared de lamas: la persiana del sitio (`ui/Blinds`) en 3D. La salida
 *   (`ArcadeWorld`) planta la cámara donde esa pared llena el viewport, así que
 *   el último frame ES la persiana cerrada y la de DOM entra sin costura.
 *
 * Todo lo lima es `MeshBasicMaterial` sin tone mapping ni niebla: el color
 * llega al píxel tal cual (#c8ff00, el mismo que `bg-accent`) y se lee desde la
 * entrada del pasillo aunque la niebla ya se haya comido las paredes.
 */
/**
 * Halo del tubo de neón: un marco difuminado con el HUECO del vano vacío. Un
 * halo radial aditivo encima del vano sumaba lima sobre las lamas de dentro y
 * las saturaba a amarillo. El plano mide el vano + `HALO_MARGIN` por cada lado,
 * así que el hueco del canvas cae exactamente sobre él.
 */
let haloTexture: THREE.CanvasTexture | null = null;
function getHaloTexture(): THREE.CanvasTexture {
  if (haloTexture) return haloTexture;
  const w = 512;
  const planeW = DOOR.width + HALO_MARGIN * 2;
  const planeH = DOOR.height + HALO_MARGIN * 2;
  const h = Math.round((w * planeH) / planeW);
  const px = w / planeW;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const x = HALO_MARGIN * px;
    const y = HALO_MARGIN * px;
    const rw = DOOR.width * px;
    const rh = DOOR.height * px;
    ctx.strokeStyle = "#fff";
    ctx.shadowColor = "#fff";
    ctx.lineWidth = 10;
    for (const blur of [90, 45, 18]) {
      ctx.shadowBlur = blur;
      ctx.strokeRect(x, y, rw, rh);
    }
    ctx.clearRect(x, y, rw, rh);
  }
  haloTexture = new THREE.CanvasTexture(canvas);
  return haloTexture;
}

export function ArcadeDoor({ label, hovered, exit, reduced, onDoor, onHover }: ArcadeDoorProps) {
  const sign = useMemo(() => getSignTexture(label.toUpperCase(), NEON), [label]);

  const [logo, setLogo] = useState<THREE.Texture | null>(null);
  useEffect(
    () => () => {
      haloTexture?.dispose();
      haloTexture = null;
    },
    [],
  );
  useEffect(() => {
    let cancelled = false;
    loadLogoTexture(LOGO_SRC, NEON)
      .then((tex) => {
        if (!cancelled) setLogo(tex);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const pool = useRef<THREE.MeshBasicMaterial>(null);
  const halo = useRef<THREE.MeshBasicMaterial>(null);
  const angle = useRef(0);
  const tube = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ camera, size }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);

    // Tubo: nunca más fino que `MIN_PX` en pantalla (cubo unidad escalado).
    const fov = (camera as THREE.PerspectiveCamera).fov;
    const thick = Math.max(TUBE, MIN_PX * worldPerPixel(camera.position.z - HALL.endZ, fov, size.height));
    tube.current.forEach((m, i) => {
      if (!m) return;
      if (i < 2) m.scale.set(thick, DOOR.height + thick, TUBE);
      else m.scale.set(DOOR.width + thick * 2, thick, TUBE);
      m.position.x = i === 0 ? -(DOOR.width / 2 + thick / 2) : i === 1 ? DOOR.width / 2 + thick / 2 : 0;
      m.position.y = i < 2 ? DOOR.height / 2 : DOOR.height + thick / 2;
    });

    if (exit.current.open > 0) {
      // En la salida manda la curva de `ArcadeWorld`; nunca se vuelve a cerrar.
      angle.current = Math.max(angle.current, exit.current.open * DOOR.openAngle);
    } else {
      const target = hovered ? DOOR.ajarAngle : 0;
      angle.current = reduced
        ? target
        : THREE.MathUtils.lerp(angle.current, target, 1 - Math.exp(-8 * dt));
    }
    if (left.current) left.current.rotation.y = angle.current;
    if (right.current) right.current.rotation.y = -angle.current;

    // La luz de dentro se derrama por la moqueta a medida que se abre.
    const light = angle.current / DOOR.openAngle;
    if (pool.current) pool.current.opacity = 0.22 + 0.55 * light;
    if (halo.current) halo.current.opacity = 0.35 + 0.3 * light;
  });

  const handlers = {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onDoor();
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onHover(true);
    },
    onPointerOut: () => onHover(false),
  };

  const hw = DOOR.width / 2;
  const f = DOOR.frame;
  const r = DOOR.reveal;

  return (
    <group>
      <group {...handlers}>
        {/* Forro del vano: jambas y cabecero con todo el fondo del muro */}
        {[
          { p: [-(hw + f / 2), DOOR.height / 2, -r / 2], s: [f, DOOR.height + f * 2, r] },
          { p: [hw + f / 2, DOOR.height / 2, -r / 2], s: [f, DOOR.height + f * 2, r] },
          { p: [0, DOOR.height + f / 2, -r / 2], s: [DOOR.width + f * 2, f, r] },
        ].map((b, i) => (
          <mesh key={i} position={[b.p[0], b.p[1], HALL.endZ + b.p[2]]}>
            <boxGeometry args={b.s as [number, number, number]} />
            <meshStandardMaterial color="#16161b" roughness={0.35} metalness={0.7} fog={false} />
          </mesh>
        ))}
        {/* Umbral del vano */}
        <mesh position={[0, 0.004, HALL.endZ - r / 2]}>
          <boxGeometry args={[DOOR.width, 0.008, r]} />
          <meshStandardMaterial color="#b9bcc4" roughness={0.25} metalness={0.8} fog={false} />
        </mesh>

        {/* Tubo de neón por el canto delantero del vano (medidas en useFrame) */}
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            ref={(m) => {
              tube.current[i] = m;
            }}
            position={[0, 0, HALL.endZ + 0.02]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={NEON} toneMapped={false} fog={false} />
          </mesh>
        ))}

        {/* Hojas, con el pivote en la bisagra */}
        <group ref={left} position={[-hw, 0, HINGE_Z]}>
          <DoorLeaf side={-1} />
        </group>
        <group ref={right} position={[hw, 0, HINGE_Z]}>
          <DoorLeaf side={1} />
        </group>

        <NeonRoom />

        {/* Rótulo y logo sobre el dintel */}
        <mesh position={[0, DOOR.signY, HALL.endZ + 0.02]}>
          <planeGeometry args={[DOOR.signHeight * SIGN_ASPECT, DOOR.signHeight]} />
          <meshBasicMaterial map={sign} transparent depthWrite={false} toneMapped={false} fog={false} />
        </mesh>
        {logo && (
          <mesh position={[0, DOOR.logoY, HALL.endZ + 0.02]}>
            <planeGeometry args={[DOOR.logoHeight * LOGO_ASPECT, DOOR.logoHeight]} />
            <meshBasicMaterial map={logo} transparent depthWrite={false} toneMapped={false} fog={false} />
          </mesh>
        )}
      </group>

      {/* Halo del neón sobre la pared */}
      <mesh position={[0, DOOR.height / 2, HALL.endZ + 0.012]}>
        <planeGeometry args={[DOOR.width + HALO_MARGIN * 2, DOOR.height + HALO_MARGIN * 2]} />
        <meshBasicMaterial
          ref={halo}
          map={getHaloTexture()}
          color={NEON}
          transparent
          opacity={0.35}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-8}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          fog={false}
        />
      </mesh>
      {/* Charco de luz de la puerta sobre la moqueta */}
      <mesh position={[0, 0.006, HALL.endZ + 1.2]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[3.4, 2.6]} />
        <meshBasicMaterial
          ref={pool}
          map={getGlowTexture()}
          color={NEON}
          transparent
          opacity={0.22}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-8}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          fog={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Una hoja: perfil de aluminio, cristal tintado, zócalo de acero y barra
 * antipánico por el lado del pasillo. En local la bisagra es el origen y la
 * hoja se extiende hacia el centro de la puerta (`-side` en X).
 */
function DoorLeaf({ side }: { side: -1 | 1 }) {
  const dir = -side;
  const cx = (dir * LEAF_W) / 2;
  const glassH = DOOR.height - STILE - KICK;
  const barW = LEAF_W - 0.22;

  return (
    <group>
      {/* Largueros (bisagra y cierre), travesaño y zócalo */}
      {[
        { p: [dir * (STILE / 2), DOOR.height / 2], s: [STILE, DOOR.height] },
        { p: [dir * (LEAF_W - STILE / 2), DOOR.height / 2], s: [STILE, DOOR.height] },
        { p: [cx, DOOR.height - STILE / 2], s: [LEAF_W, STILE] },
      ].map((b, i) => (
        <mesh key={i} position={[b.p[0], b.p[1], 0]}>
          <boxGeometry args={[b.s[0], b.s[1], 0.05]} />
          <meshStandardMaterial color="#1c1d22" roughness={0.3} metalness={0.75} fog={false} />
        </mesh>
      ))}
      <mesh position={[cx, KICK / 2, 0]}>
        <boxGeometry args={[LEAF_W, KICK, 0.052]} />
        <meshStandardMaterial color="#9aa0a8" roughness={0.28} metalness={0.85} fog={false} />
      </mesh>

      {/* Cristal: deja ver la sala de neón */}
      <mesh position={[cx, KICK + glassH / 2, 0]}>
        <planeGeometry args={[LEAF_W - STILE * 2, glassH]} />
        <meshStandardMaterial
          color="#b8c79a"
          transparent
          opacity={0.2}
          roughness={0.05}
          metalness={0.2}
          depthWrite={false}
          side={THREE.DoubleSide}
          fog={false}
        />
      </mesh>

      {/* Barra antipánico: cajas en los extremos y barra entre ellas */}
      <group position={[0, 1.02, 0.06]}>
        {[0.1, LEAF_W - 0.1].map((x) => (
          <mesh key={x} position={[dir * x, 0, -0.012]}>
            <boxGeometry args={[0.07, 0.09, 0.06]} />
            <meshStandardMaterial color="#2a2b31" roughness={0.4} metalness={0.6} fog={false} />
          </mesh>
        ))}
        <mesh position={[cx, 0, 0.004]}>
          <boxGeometry args={[barW, 0.04, 0.04]} />
          <meshStandardMaterial color="#c9ccd2" roughness={0.2} metalness={0.9} fog={false} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * La sala de neón. Una sola `InstancedMesh` para todas las barras lima (líneas
 * de fuga, arcos y lamas): una llamada de dibujo. La geometría depende del
 * viewport — el semiancho para que las paredes no asomen en el encuadre final
 * y el hueco entre lamas, que son `NEON_ROOM.gapPx` píxeles de pantalla como
 * los de la persiana DOM — así que las matrices se recalculan al redimensionar.
 */
interface Bar {
  p: [number, number, number];
  /** Medidas nominales. */
  s: [number, number, number];
  /** Ejes finos: nunca bajan de `MIN_PX` en pantalla. */
  thin: [boolean, boolean, boolean];
  /** Mide el mínimo en la pared de lamas (líneas a lo largo de la sala) en vez de en su propio z. */
  far: boolean;
  dim: number;
}

function NeonRoom() {
  const size = useThree((s) => s.size);
  const aspect = size.width / size.height;
  const halfW = neonRoomHalfWidth(aspect);
  const H = NEON_ROOM_HEIGHT;
  const depth = ROOM_FRONT - NEON_WALL_Z;
  const midZ = (ROOM_FRONT + NEON_WALL_Z) / 2;

  const bars = useMemo(() => {
    const out: Bar[] = [];
    const t = 0.03;
    // Líneas de fuga: suelo, techo y paredes, a lo largo de toda la sala. Su
    // grosor mínimo se mide en el extremo lejano (la pared de lamas).
    for (const x of [-0.75, 0.75]) {
      out.push({ p: [x, 0.002, midZ], s: [t, 0.004, depth], thin: [true, false, false], far: true, dim: 0.55 });
      out.push({ p: [x, H - 0.002, midZ], s: [t, 0.004, depth], thin: [true, false, false], far: true, dim: 0.4 });
    }
    for (const side of [-1, 1]) {
      for (const y of [0.45, EYE, H - 0.45]) {
        out.push({
          p: [side * (halfW - 0.002), y, midZ],
          s: [0.004, t, depth],
          thin: [false, true, false],
          far: true,
          dim: 0.5,
        });
      }
    }
    // Arcos: marcos completos que se cruzan al entrar.
    for (let z = ROOM_FRONT - 1.1; z > NEON_WALL_Z + 0.6; z -= 1.1) {
      out.push({ p: [-(halfW - 0.01), H / 2, z], s: [0.02, H, t], thin: [true, false, true], far: false, dim: 0.85 });
      out.push({ p: [halfW - 0.01, H / 2, z], s: [0.02, H, t], thin: [true, false, true], far: false, dim: 0.85 });
      out.push({ p: [0, H - 0.01, z], s: [halfW * 2, 0.02, t], thin: [false, true, true], far: false, dim: 0.85 });
      out.push({ p: [0, 0.004, z], s: [halfW * 2, 0.008, t], thin: [false, false, true], far: false, dim: 0.6 });
    }
    return out;
  }, [halfW, H, depth, midZ]);

  const ref = useRef<THREE.InstancedMesh>(null);
  const count = bars.length + NEON_ROOM.slats;

  // Colores: solo cambian con la lista de barras.
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const neon = new THREE.Color(NEON);
    const dark = new THREE.Color(VOID);
    const c = new THREE.Color();
    bars.forEach((b, i) => mesh.setColorAt(i, c.copy(dark).lerp(neon, b.dim)));
    for (let i = 0; i < NEON_ROOM.slats; i++) mesh.setColorAt(bars.length + i, neon);
    mesh.count = count;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [bars, count]);

  // Medidas: dependen de la distancia a la cámara, así que van cada frame
  // (46 matrices, nada). Las lamas llevan SIEMPRE un hueco de `gapPx` píxeles
  // en pantalla: desde lejos no se deshace en una trama que parpadea, y en el
  // encuadre final (distancia de llenado + `CAMERA_FOV`) sale exactamente el de
  // la persiana DOM.
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const scl = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const fov = (camera as THREE.PerspectiveCamera).fov;
    const camZ = camera.position.z;
    const wallPx = worldPerPixel(camZ - NEON_WALL_Z, fov, size.height);

    bars.forEach((b, i) => {
      const px = b.far ? wallPx : worldPerPixel(camZ - b.p[2], fov, size.height);
      const min = MIN_PX * px;
      scl.set(
        b.thin[0] ? Math.max(b.s[0], min) : b.s[0],
        b.thin[1] ? Math.max(b.s[1], min) : b.s[1],
        b.thin[2] ? Math.max(b.s[2], min) : b.s[2],
      );
      mesh.setMatrixAt(i, m.compose(pos.set(...b.p), q, scl));
    });

    const pitch = H / NEON_ROOM.slats;
    const slat = pitch - NEON_ROOM.gapPx * wallPx;
    for (let i = 0; i < NEON_ROOM.slats; i++) {
      const top = H - i * pitch;
      pos.set(0, top - slat / 2, NEON_WALL_Z + 0.004);
      scl.set(halfW * 2, slat, 0.004);
      mesh.setMatrixAt(bars.length + i, m.compose(pos, q, scl));
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Caja: suelo, techo, paredes y fondo, del negro del sitio */}
      <mesh position={[0, 0, midZ]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[halfW * 2, depth]} />
        <meshBasicMaterial color={VOID} toneMapped={false} fog={false} />
      </mesh>
      <mesh position={[0, H, midZ]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[halfW * 2, depth]} />
        <meshBasicMaterial color={VOID} toneMapped={false} fog={false} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * halfW, H / 2, midZ]} rotation-y={-s * (Math.PI / 2)}>
          <planeGeometry args={[depth, H]} />
          <meshBasicMaterial color={VOID} toneMapped={false} fog={false} />
        </mesh>
      ))}
      <mesh position={[0, H / 2, NEON_WALL_Z]}>
        <planeGeometry args={[halfW * 2, H]} />
        <meshBasicMaterial color={VOID} toneMapped={false} fog={false} />
      </mesh>

      <instancedMesh ref={ref} args={[undefined, undefined, MAX_BARS]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        {/* Las barras van a milímetros de su pared: el offset las gana siempre
            en profundidad, sin mover un píxel en pantalla. */}
        <meshBasicMaterial toneMapped={false} fog={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-4} />
      </instancedMesh>
    </group>
  );
}

