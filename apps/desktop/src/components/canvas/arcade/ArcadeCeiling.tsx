"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { HALL } from "./arcade-config";
import type { ArcadePalette } from "./arcade-mode";
import { getGlowTexture } from "./arcade-textures";
import { getBeamTexture, getDeckTexture, getSkylightTexture } from "./hall-textures";

interface ArcadeCeilingProps {
  palette: ArcadePalette;
}

const LENGTH = HALL.entranceZ - HALL.endZ;
const MID_Z = (HALL.entranceZ + HALL.endZ) / 2;
const W = HALL.halfWidth;
const TOP = HALL.height;

/** Vigas: perfiles en I cruzando el pasillo. */
const BEAM = { step: 3.6, from: HALL.entranceZ - 1.8, depth: 0.3, flange: 0.2 } as const;
/** Conducto de ventilación, a la izquierda; bandeja de cables, a la derecha. */
const DUCT = { x: -1.3, y: TOP - 0.48, radius: 0.2, ring: 1.4, hanger: 2.8 } as const;
const TRAY = { x: 1.35, y: TOP - 0.36, width: 0.3 } as const;
/** Focos: colgados bajo cada viga, uno a cada lado del eje. */
const SPOT = { x: 0.62, drop: 0.42, spread: 0.75 } as const;

function beamZs(): number[] {
  const out: number[] = [];
  for (let z = BEAM.from; z > HALL.endZ + 0.5; z -= BEAM.step) out.push(z);
  return out;
}

/** Una pieza repetida en N sitios: una `InstancedMesh`. */
function Repeat({
  geometry,
  material,
  matrices,
  renderOrder,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrices: readonly THREE.Matrix4[];
  renderOrder?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);
  return <instancedMesh ref={ref} args={[geometry, material, matrices.length]} renderOrder={renderOrder} />;
}

/**
 * Haz de un foco. Con un `MeshBasicMaterial` el cono se veía como un cilindro
 * de plástico: el degradado solo iba de arriba abajo y la silueta quedaba
 * recortada. Aquí la opacidad cae además hacia los bordes según el ángulo con
 * la vista (fresnel invertido): donde la mirada atraviesa más "aire" del cono
 * es más denso, y en la silueta se desvanece a cero. La niebla lo apaga
 * (resta alfa, no suma color: sumar el color de la niebla en aditivo lo
 * encendería de lejos).
 */
function beamMaterial(color: string, opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...THREE.UniformsLib.fog,
      map: { value: getBeamTexture() },
      color: { value: new THREE.Color(color) },
      opacity: { value: opacity },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vUv = uv;
        vec4 local = vec4(position, 1.0);
        vec3 n = normal;
        #ifdef USE_INSTANCING
          local = instanceMatrix * local;
          n = mat3(instanceMatrix) * n;
        #endif
        vec4 mv = modelViewMatrix * local;
        vNormal = normalize(normalMatrix * n);
        vView = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform vec3 color;
      uniform float opacity;
      uniform float fogNear;
      uniform float fogFar;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float facing = abs(dot(normalize(vNormal), normalize(vView)));
        float fog = 1.0 - smoothstep(fogNear, fogFar, length(vView));
        float a = texture2D(map, vUv).r * facing * facing * opacity * fog;
        gl_FragColor = vec4(color, a);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: true,
    toneMapped: false,
  });
}

const at = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);

/**
 * Techo industrial visto, como el de una sala recreativa montada en una nave:
 * forjado de chapa grecada, vigas en I cruzando el pasillo, un conducto de
 * ventilación con sus abrazaderas y colgadores, una bandeja de cables, focos
 * colgados de las vigas con el haz visible en el aire y, de día, lucernarios
 * entre viga y viga.
 *
 * Lo repetido va instanciado. Los haces de luz son conos abiertos en aditivo:
 * no iluminan nada (las luces de verdad cuestan por píxel en todos los
 * materiales), solo se ven, y un charco en la moqueta completa el efecto.
 */
export function ArcadeCeiling({ palette }: ArcadeCeilingProps) {
  const beams = useMemo(() => beamZs(), []);

  const deck = useMemo(() => {
    const t = getDeckTexture().clone();
    t.repeat.set(1, LENGTH / 0.2);
    t.needsUpdate = true;
    return t;
  }, []);
  useEffect(() => () => deck.dispose(), [deck]);

  const steel = useMemo(
    () => new THREE.MeshStandardMaterial({ color: palette.steel, roughness: 0.45, metalness: 0.55 }),
    [palette.steel],
  );
  // Chapa galvanizada del conducto: algo más clara y brillante que las vigas.
  const galvanized = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.steel).lerp(new THREE.Color("#ffffff"), 0.18),
        roughness: 0.35,
        metalness: 0.65,
      }),
    [palette.steel],
  );
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: "#101014", roughness: 0.55 }), []);
  useEffect(
    () => () => {
      steel.dispose();
      galvanized.dispose();
      dark.dispose();
    },
    [steel, galvanized, dark],
  );

  // ── Geometrías compartidas ──
  const geo = useMemo(
    () => ({
      web: new THREE.BoxGeometry(W * 2, BEAM.depth, 0.018),
      flange: new THREE.BoxGeometry(W * 2, 0.02, BEAM.flange),
      duct: new THREE.CylinderGeometry(DUCT.radius, DUCT.radius, LENGTH, 24, 1, true).rotateX(Math.PI / 2),
      ring: new THREE.CylinderGeometry(DUCT.radius + 0.012, DUCT.radius + 0.012, 0.045, 24).rotateX(Math.PI / 2),
      vent: new THREE.BoxGeometry(0.26, 0.05, 0.36),
      rod: new THREE.CylinderGeometry(0.008, 0.008, 1, 6),
      trayBase: new THREE.BoxGeometry(TRAY.width, 0.012, LENGTH),
      trayLip: new THREE.BoxGeometry(0.012, 0.06, LENGTH),
      cable: new THREE.CylinderGeometry(0.016, 0.016, LENGTH, 8).rotateX(Math.PI / 2),
      can: new THREE.CylinderGeometry(0.085, 0.1, 0.16, 20),
      lens: new THREE.CircleGeometry(0.075, 20).rotateX(Math.PI / 2),
      cone: new THREE.CylinderGeometry(0.07, SPOT.spread, 1, 28, 1, true),
      pool: new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    }),
    [],
  );
  useEffect(
    () => () => {
      for (const g of Object.values(geo)) g.dispose();
    },
    [geo],
  );

  // ── Posiciones ──
  const layout = useMemo(() => {
    const web: THREE.Matrix4[] = [];
    const flange: THREE.Matrix4[] = [];
    for (const z of beams) {
      web.push(at(0, TOP - BEAM.depth / 2, z));
      flange.push(at(0, TOP - BEAM.depth, z), at(0, TOP - 0.01, z));
    }

    const rings: THREE.Matrix4[] = [];
    for (let z = HALL.entranceZ - 0.7; z > HALL.endZ; z -= DUCT.ring) rings.push(at(DUCT.x, DUCT.y, z));
    const vents: THREE.Matrix4[] = [];
    for (let z = HALL.entranceZ - 2.1; z > HALL.endZ + 1; z -= DUCT.ring * 3) {
      vents.push(at(DUCT.x, DUCT.y - DUCT.radius - 0.02, z));
    }

    // Colgadores: del conducto y de la bandeja al forjado. Varillas de 1 m escaladas en Y.
    const rods: THREE.Matrix4[] = [];
    const rod = (x: number, yBottom: number, z: number) => {
      const h = TOP - yBottom;
      rods.push(
        new THREE.Matrix4().compose(
          new THREE.Vector3(x, yBottom + h / 2, z),
          new THREE.Quaternion(),
          new THREE.Vector3(1, h, 1),
        ),
      );
    };
    for (let z = HALL.entranceZ - 1.4; z > HALL.endZ; z -= DUCT.hanger) {
      rod(DUCT.x - DUCT.radius - 0.02, DUCT.y, z);
      rod(DUCT.x + DUCT.radius + 0.02, DUCT.y, z);
      rod(TRAY.x - TRAY.width / 2, TRAY.y, z + 0.9);
      rod(TRAY.x + TRAY.width / 2, TRAY.y, z + 0.9);
    }

    // Focos bajo cada viga.
    const cans: THREE.Matrix4[] = [];
    const lenses: THREE.Matrix4[] = [];
    const cones: THREE.Matrix4[] = [];
    const pools: THREE.Matrix4[] = [];
    const canY = TOP - BEAM.depth - SPOT.drop;
    for (const z of beams) {
      for (const x of [-SPOT.x, SPOT.x]) {
        rod(x, canY + 0.08, z);
        cans.push(at(x, canY, z));
        lenses.push(at(x, canY - 0.081, z));
        const h = canY - 0.08;
        cones.push(
          new THREE.Matrix4().compose(
            new THREE.Vector3(x, h / 2, z),
            new THREE.Quaternion(),
            new THREE.Vector3(1, h, 1),
          ),
        );
        pools.push(
          new THREE.Matrix4().compose(
            new THREE.Vector3(x, 0.007, z),
            new THREE.Quaternion(),
            new THREE.Vector3(SPOT.spread * 2.4, 1, SPOT.spread * 2.4),
          ),
        );
      }
    }

    // Lucernarios: entre viga y viga, en el eje.
    const skylights: number[] = [];
    for (let i = 0; i < beams.length - 1; i++) skylights.push((beams[i] + beams[i + 1]) / 2);

    return { web, flange, rings, vents, rods, cans, lenses, cones, pools, skylights };
  }, [beams]);

  const light = useMemo(
    () => ({
      lens: new THREE.MeshBasicMaterial({ color: palette.lens, toneMapped: false }),
      cone: beamMaterial(palette.lens, palette.beam),
      pool: new THREE.MeshBasicMaterial({
        map: getGlowTexture(),
        color: palette.lens,
        transparent: true,
        opacity: palette.beam * 2.2,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    }),
    [palette.lens, palette.beam],
  );
  useEffect(
    () => () => {
      for (const m of Object.values(light)) m.dispose();
    },
    [light],
  );

  return (
    <group>
      {/* Forjado */}
      <mesh position={[0, TOP, MID_Z]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[W * 2, LENGTH]} />
        <meshStandardMaterial map={deck} color={palette.ceiling} roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Vigas en I */}
      <Repeat geometry={geo.web} material={steel} matrices={layout.web} />
      <Repeat geometry={geo.flange} material={steel} matrices={layout.flange} />

      {/* Conducto: tubo, abrazaderas, difusores */}
      <mesh geometry={geo.duct} material={galvanized} position={[DUCT.x, DUCT.y, MID_Z]} />
      <Repeat geometry={geo.ring} material={galvanized} matrices={layout.rings} />
      <Repeat geometry={geo.vent} material={dark} matrices={layout.vents} />
      <Repeat geometry={geo.rod} material={steel} matrices={layout.rods} />

      {/* Bandeja de cables */}
      <mesh geometry={geo.trayBase} material={steel} position={[TRAY.x, TRAY.y, MID_Z]} />
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          geometry={geo.trayLip}
          material={steel}
          position={[TRAY.x + s * (TRAY.width / 2), TRAY.y + 0.03, MID_Z]}
        />
      ))}
      {[-0.08, -0.03, 0.03, 0.08].map((dx, i) => (
        <mesh
          key={dx}
          geometry={geo.cable}
          position={[TRAY.x + dx, TRAY.y + 0.022 + (i % 2) * 0.01, MID_Z]}
        >
          <meshStandardMaterial color={["#1a1a1f", "#2b2b33", "#8a2a22", "#1a1a1f"][i]} roughness={0.7} />
        </mesh>
      ))}

      {/* Focos: lata, cristal, haz y charco en la moqueta */}
      <Repeat geometry={geo.can} material={dark} matrices={layout.cans} />
      <Repeat geometry={geo.lens} material={light.lens} matrices={layout.lenses} />
      <Repeat geometry={geo.cone} material={light.cone} matrices={layout.cones} renderOrder={2} />
      <Repeat geometry={geo.pool} material={light.pool} matrices={layout.pools} renderOrder={2} />

      {/* Lucernarios */}
      {layout.skylights.map((z) => (
        <group key={z} position={[0, TOP - 0.004, z]}>
          <mesh rotation-x={Math.PI / 2}>
            <planeGeometry args={[1.1, 1.9]} />
            <meshBasicMaterial map={getSkylightTexture()} color={palette.skylight} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
