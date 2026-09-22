"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DOLL, PLAZA_PALETTE, seededRandom, type DollSpec, type HairStyle } from "./plaza-config";
import { getFaceTexture } from "./face-texture";
import { getGlowTexture, getSpeechBubbleTexture } from "./plaza-textures";

/**
 * Muñeco de la plaza de reseñas ("Wii-plaza"): cabezón + cuerpo tipo bolo,
 * cara plana en decal, un único rasgo con volumen (la nariz). Ver el estudio de
 * estilo en `mii-plaza-research.md` — proporciones y técnica, nunca copia.
 *
 * Shading SUAVE (plástico mate, `MeshStandardMaterial`) y sin contorno: la
 * referencia no es cómic. El contorno solo aparece como highlight de hover /
 * selección, en color de acento.
 *
 * Esta pieza solo dibuja y anima al muñeco EN LOCAL. La posición/rotación en
 * el anillo (`spec.home`, `spec.facing`) las aplica el padre envolviendo este
 * componente en su propio `<group position rotation>`.
 */

export interface PlazaDollProps {
  spec: DollSpec;
  /** Estado de animación que decide el mundo (lo pasa el padre). */
  state?: "idle" | "walking" | "waving" | "focused" | "held" | "talking";
  /** true cuando el puntero está encima o es el seleccionado → highlight. */
  highlighted?: boolean;
}

/** Duración del pop-in de aparición. */
const POP_DURATION = 0.6;

/** Pantalones: gris/azul oscuro, siempre distintos de la camiseta. */
const PANTS_COLORS = ["#4A5263", "#3A4866", "#5B6472", "#2F3A52", "#55607A"] as const;
const SHOE_COLOR = "#34343C";

/** Plástico mate. Un toque de emisivo del propio color compensa el tinte azul
 * de la hemisférica de la sala, que apagaba la piel hacia oliva. */
const ROUGHNESS = 0.62;
const SELF_LIGHT = 0.16;

/** Cuánto se despega del suelo un muñeco agarrado: lo justo para que se lea
 * "en la mano" (unidades de mundo). El arrastre no tiene eje de altura. */
const HELD_LIFT = 0.32;
/** Brazos agarrado: casi verticales (rad desde colgando), agitándose alrededor. */
const HELD_ARM_BASE = -2.45;
const HELD_ARM_SWING = 0.55;
/** Velocidad del aleteo de brazos agarrado (rad/s). */
const HELD_FLAP = 14;

/** Altura local (desde la cintura) del bocadillo de "hablando", justo sobre
 * la cabeza — la punta de la cola (ver `getSpeechBubbleTexture`) debe casi
 * tocar el pelo. Con más margen que este, la cámara en vaivén de la plaza
 * (nunca de frente del todo) proyecta ese hueco vertical inclinado y la cola
 * parece apuntar a un lado en vez de a la cabeza — el mismo salto que hace
 * que las verticales "converjan" en una foto con la cámara inclinada. */
const BUBBLE_Y = DOLL.head.y + DOLL.head.radius * DOLL.head.scale[1] + 0.12;
/** Escala base del sprite del bocadillo (unidades de mundo). */
const BUBBLE_SCALE = 0.4;

/** Separación de los brazos respecto al torso (rad), colgando casi pegados. */
const ARM_SPLAY = 0.1;
/** Hombro algo metido en el torso: con `DOLL.arm.x` el remate de la manga
 * asomaba por encima del hombro como una hombrera. */
const ARM_X = 0.235;

/** Highlight de hover/selección: casco invertido (backfaces escaladas) en
 * color de acento. Hecho a mano en vez de `<Outlines>` de drei, que aquí no
 * llegaba a pintar; además así solo se conmuta `visible`, sin montar nada. */
const HULL_HEAD = 1.08;
const HULL_BODY = 1.06;
const HULL_LIMB = 1.2;

/** Silueta del torso (radio, y) desde el bajo de la camiseta hasta el hombro.
 * Algo más ancho arriba que abajo; el remate superior queda dentro de la
 * cabeza, así no hay cuello visible. y local, origen en la cintura. */
const WAIST_Y = 0.3;
const SHIRT_PROFILE: ReadonlyArray<readonly [number, number]> = [
  [0.0, 0.0],
  [0.18, 0.0],
  [0.181, 0.02],
  [0.186, 0.12],
  [0.197, 0.22],
  [0.2, 0.28],
  [0.19, 0.34],
  [0.16, 0.39],
  [0.1, 0.425],
  [0.0, 0.44],
];
/** Cadera en color pantalón, asomando bajo la camiseta y tapando el arranque
 * de las piernas. */
const PANTS_PROFILE: ReadonlyArray<readonly [number, number]> = [
  [0.0, -0.14],
  [0.08, -0.137],
  [0.135, -0.12],
  [0.158, -0.08],
  [0.164, -0.02],
  [0.164, 0.03],
  [0.0, 0.03],
];

function toPoints(profile: ReadonlyArray<readonly [number, number]>): THREE.Vector2[] {
  return profile.map(([x, y]) => new THREE.Vector2(x, y));
}

/**
 * Elastic-out a mano (easings.net) — evita traer GSAP dentro de un `useFrame`.
 */
function elasticOut(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c4 = (2 * Math.PI) / 3;
  return 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

/**
 * Geometrías idénticas para todos los muñecos (solo dependen de `DOLL`):
 * singletons de módulo en vez de una copia por muñeco. No se liberan —
 * pesan poco y el Canvas se remonta tras perder contexto (three las resube).
 */
let sharedGeos: ReturnType<typeof buildGeos> | null = null;

function buildGeos() {
  return {
    head: new THREE.SphereGeometry(DOLL.head.radius, 64, 48),
    nose: new THREE.SphereGeometry(DOLL.nose.radius, 24, 16),
    shirt: new THREE.LatheGeometry(toPoints(SHIRT_PROFILE), 48),
    pants: new THREE.LatheGeometry(toPoints(PANTS_PROFILE), 48),
    arm: new THREE.CapsuleGeometry(DOLL.arm.radius, DOLL.arm.length, 8, 20),
    hand: new THREE.SphereGeometry(DOLL.hand.radius * 0.85, 24, 16),
    leg: new THREE.CapsuleGeometry(DOLL.leg.radius, DOLL.leg.length, 8, 20),
    foot: new THREE.SphereGeometry(DOLL.foot.radius, 24, 16),
    shadow: new THREE.CircleGeometry(DOLL.shadowRadius * 1.45, 32),
  };
}

function getGeos() {
  sharedGeos ??= buildGeos();
  return sharedGeos;
}

function makeMat(color: THREE.ColorRepresentation, map?: THREE.Texture): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ color, map: map ?? null, roughness: ROUGHNESS, metalness: 0 });
  // Con `map`, el color base es blanco y el tono viene del lienzo; el emisivo
  // usa el mismo mapa para que cara y resto de piel suban igual.
  mat.emissive.set(color);
  if (map) mat.emissiveMap = map;
  mat.emissiveIntensity = SELF_LIGHT;
  return mat;
}

/** Pelo: primitivas suaves por estilo, hijas del grupo de la cabeza. El
 * casquete va inclinado hacia atrás para despejar la frente (si no, tapa las
 * cejas) y bajar por la nuca. */
function Hair({ style, material }: { style: HairStyle; material: THREE.Material }) {
  const r = DOLL.head.radius;
  const s = DOLL.head.scale;

  if (style === "bald") return null;

  const cap = (
    <mesh rotation={[-0.3, 0, 0]} scale={[s[0] * 1.06, s[1] * 1.06, s[2] * 1.06]}>
      <sphereGeometry args={[r, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.44]} />
      <primitive object={material} attach="material" />
    </mesh>
  );

  if (style === "short") return cap;

  if (style === "bob") {
    // Melena: casquete + concha trasera abierta por delante (±50°) que baja
    // hasta la mandíbula a los lados.
    const gap = 0.9;
    return (
      <group>
        {cap}
        <mesh scale={[s[0] * 1.08, s[1] * 1.06, s[2] * 1.08]}>
          <sphereGeometry
            args={[r, 48, 24, Math.PI / 2 + gap, Math.PI * 2 - gap * 2, 0.15, Math.PI * 0.55]}
          />
          <primitive object={material} attach="material" />
        </mesh>
      </group>
    );
  }

  if (style === "bun") {
    return (
      <group>
        {cap}
        <mesh position={[0, r * 0.95, -r * 0.45]}>
          <sphereGeometry args={[r * 0.3, 32, 20]} />
          <primitive object={material} attach="material" />
        </mesh>
      </group>
    );
  }

  if (style === "ponytail") {
    return (
      <group>
        {cap}
        <mesh position={[0, r * 0.15, -r * 0.98]} rotation={[0.35, 0, 0]}>
          <capsuleGeometry args={[r * 0.17, r * 0.75, 8, 20]} />
          <primitive object={material} attach="material" />
        </mesh>
      </group>
    );
  }

  // spiky: casquete + mechones cónicos redondeados hacia arriba/atrás.
  const spikes = Array.from({ length: 7 }, (_, i) => {
    const angle = (i / 7) * Math.PI * 2;
    const x = Math.cos(angle) * r * 0.45;
    const z = Math.sin(angle) * r * 0.45 - r * 0.1;
    return (
      <mesh key={i} position={[x, r * 0.88, z]} rotation={[Math.sin(angle) * 0.55, 0, -Math.cos(angle) * 0.55]}>
        <coneGeometry args={[r * 0.17, r * 0.42, 16]} />
        <primitive object={material} attach="material" />
      </mesh>
    );
  });

  return (
    <group>
      {cap}
      {spikes}
    </group>
  );
}

/** Brazo o pierna: cápsula colgando desde el pivote (hombro/cadera) + esfera
 * en la punta (mano/pie). El pivote es el origen del grupo para que el swing
 * gire desde arriba, como una articulación real. */
function Limb({
  pivot,
  length,
  segGeometry,
  endGeometry,
  segMaterial,
  endMaterial,
  hullMaterial,
  endScale = [1, 1, 1],
  endOffset = [0, 0, 0],
  highlighted,
  groupRef,
}: {
  pivot: [number, number, number];
  length: number;
  segGeometry: THREE.BufferGeometry;
  endGeometry: THREE.BufferGeometry;
  segMaterial: THREE.Material;
  endMaterial: THREE.Material;
  hullMaterial: THREE.Material;
  endScale?: [number, number, number];
  endOffset?: [number, number, number];
  highlighted: boolean;
  groupRef: React.RefObject<THREE.Group | null>;
}) {
  const [ox, oy, oz] = endOffset;
  const [sx, sy, sz] = endScale;
  const endPos: [number, number, number] = [ox, -length + oy, oz];
  return (
    <group ref={groupRef} position={pivot}>
      <mesh position={[0, -length / 2, 0]} geometry={segGeometry} material={segMaterial} />
      <mesh
        position={[0, -length / 2, 0]}
        scale={[HULL_LIMB, 1.06, HULL_LIMB]}
        geometry={segGeometry}
        material={hullMaterial}
        visible={highlighted}
      />
      <mesh position={endPos} scale={endScale} geometry={endGeometry} material={endMaterial} />
      <mesh
        position={endPos}
        scale={[sx * 1.12, sy * 1.12, sz * 1.12]}
        geometry={endGeometry}
        material={hullMaterial}
        visible={highlighted}
      />
    </group>
  );
}

export function PlazaDoll({ spec, state = "idle", highlighted = false }: PlazaDollProps) {
  const faceOpen = useMemo(() => getFaceTexture(spec.face, spec.skin), [spec.face, spec.skin]);
  const faceClosed = useMemo(() => getFaceTexture(spec.face, spec.skin, true), [spec.face, spec.skin]);

  // Pantalón determinista por id (la ficha no lo trae): mismo muñeco siempre.
  const pants = useMemo(() => {
    const rnd = seededRandom(`${spec.id}:pants`);
    return PANTS_COLORS[Math.floor(rnd() * PANTS_COLORS.length)];
  }, [spec.id]);

  // Materiales por muñeco, compartidos entre sus mallas (instancia única por
  // tono en vez de uno por mesh).
  const mats = useMemo(() => {
    const noseColor = new THREE.Color(spec.skin).multiplyScalar(0.86);
    return {
      // Cabeza: blanco × mapa (el mapa ya lleva la piel de fondo).
      head: makeMat("#ffffff", faceOpen),
      skin: makeMat(spec.skin),
      nose: makeMat(noseColor),
      shirt: makeMat(spec.shirt),
      pants: makeMat(pants),
      shoe: makeMat(SHOE_COLOR),
      hair: makeMat(spec.hairColor),
      // Sombra de contacto con BORDE DIFUSO: el disco plano de antes se leía
      // como un agujero recortado en cuanto el pavimento dejó de ser casi
      // negro. Es la textura radial del mobiliario teñida de negro — misma
      // caída, mismo lenguaje.
      shadow: new THREE.MeshBasicMaterial({
        map: getGlowTexture(),
        color: PLAZA_PALETTE.shadow,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
      }),
      hull: new THREE.MeshBasicMaterial({ color: PLAZA_PALETTE.accent, side: THREE.BackSide }),
      bubble: new THREE.SpriteMaterial({
        map: getSpeechBubbleTexture(),
        transparent: true,
        opacity: 0,
        depthTest: false,
        toneMapped: false,
      }),
    };
  }, [spec.skin, spec.shirt, spec.hairColor, pants, faceOpen]);

  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  const geos = getGeos();

  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);
  const legLRef = useRef<THREE.Group>(null);
  const legRRef = useRef<THREE.Group>(null);

  // Progreso propio del pop-in (cada muñeco arranca en 0 al montar).
  const popT = useRef(0);
  // Parpadeo: se intercambia el `map` de la cabeza por la variante de ojos
  // cerrados (ambas cacheadas) — sin repintar ni crear nada por frame.
  const blink = useRef({ next: 1.5 + (spec.phase % 3), t: 0, active: false });
  const hoverLift = useRef(0);
  // 0 = en el suelo, 1 = agarrado. Suavizado para que coger y soltar no den
  // saltos: mezcla la pose de agarrado sobre la que toque por estado.
  const heldAmt = useRef(0);
  const shadowRef = useRef<THREE.Mesh>(null);
  // 0 = sin bocadillo, 1 = charlando. Suavizado igual que `heldAmt`, para que
  // el icono aparezca/desaparezca con un fundido en vez de un salto.
  const talkAmt = useRef(0);
  const bubbleRef = useRef<THREE.Sprite>(null);

  useFrame((frameState, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const clock = frameState.clock.elapsedTime;
    const t = clock + spec.phase;

    // --- Pop-in: escala 0 -> overshoot -> 1, multiplicado por spec.scale.
    popT.current = Math.min(popT.current + dt, POP_DURATION);
    const pop = elasticOut(popT.current / POP_DURATION);
    if (rootRef.current) rootRef.current.scale.setScalar(Math.max(pop, 0) * spec.scale);

    // --- Parpadeo.
    const b = blink.current;
    b.t += dt;
    if (!b.active && b.t >= b.next) {
      b.active = true;
      b.t = 0;
    } else if (b.active && b.t >= 0.12) {
      b.active = false;
      b.t = 0;
      b.next = 2.5 + ((spec.phase * 7 + clock) % 4);
    }
    const map = b.active ? faceClosed : faceOpen;
    if (mats.head.map !== map) {
      mats.head.map = map;
      mats.head.emissiveMap = map;
    }

    // --- Lift por highlight, con lerp.
    const targetLift = highlighted ? 0.05 : 0;
    hoverLift.current = THREE.MathUtils.lerp(hoverLift.current, targetLift, 1 - Math.pow(0.001, dt));

    let bodyY = hoverLift.current;
    let armLAngle = Math.sin(t * 1.6) * 0.04;
    let armRAngle = -Math.sin(t * 1.6) * 0.04;
    let legLAngle = 0;
    let legRAngle = 0;
    let headTiltX = 0;
    let headTiltZ = Math.sin(t * 0.7) * 0.03;

    if (state === "walking") {
      const freq = 5.5;
      bodyY += Math.abs(Math.sin(t * freq)) * 0.03;
      armLAngle = Math.sin(t * freq) * 0.55;
      armRAngle = -Math.sin(t * freq) * 0.55;
      legLAngle = -Math.sin(t * freq) * 0.5;
      legRAngle = Math.sin(t * freq) * 0.5;
      headTiltZ *= 0.4;
    } else if (state === "waving") {
      armRAngle = -Math.PI * 0.62 + Math.sin(t * 6) * 0.22;
      armLAngle = Math.sin(t * 1.6) * 0.04;
    } else if (state === "focused") {
      headTiltX = THREE.MathUtils.lerp(0, -0.1, Math.min(1, popT.current));
      headTiltZ *= 0.2;
      armLAngle = 0;
      armRAngle = 0;
      legLAngle = 0;
      legRAngle = 0;
    }

    // --- Agarrado: brazos en alto agitándose con desfase, piernas colgando y
    // balanceo del cuerpo. Se mezcla por `heldAmt` sobre la pose de arriba.
    heldAmt.current = THREE.MathUtils.lerp(
      heldAmt.current,
      state === "held" ? 1 : 0,
      1 - Math.pow(0.0005, dt),
    );
    const h = heldAmt.current;
    let armSplay = ARM_SPLAY;
    let swayZ = 0;
    if (h > 0.001) {
      const flap = clock * HELD_FLAP + spec.phase;
      armLAngle = THREE.MathUtils.lerp(armLAngle, HELD_ARM_BASE + Math.sin(flap) * HELD_ARM_SWING, h);
      armRAngle = THREE.MathUtils.lerp(armRAngle, HELD_ARM_BASE + Math.sin(flap + 2.4) * HELD_ARM_SWING, h);
      // Brazos en V y abriéndose/cerrándose al ritmo del aleteo.
      armSplay += h * (0.45 + Math.sin(flap * 0.5) * 0.2);
      legLAngle = THREE.MathUtils.lerp(legLAngle, Math.sin(flap * 0.7) * 0.4, h);
      legRAngle = THREE.MathUtils.lerp(legRAngle, -Math.sin(flap * 0.7) * 0.4, h);
      headTiltX = THREE.MathUtils.lerp(headTiltX, 0, h);
      headTiltZ += Math.sin(flap * 0.5) * 0.1 * h;
      bodyY += h * HELD_LIFT;
      swayZ = Math.sin(clock * 5 + spec.phase) * 0.08 * h;
    }
    if (shadowRef.current) {
      // La sombra se queda en el suelo: al levantarlo para llevarlo en la mano,
      // se encoge y se aclara.
      const air = h * HELD_LIFT;
      shadowRef.current.scale.setScalar(1 / (1 + air * 0.5));
      mats.shadow.opacity = 0.62 / (1 + air * 0.9);
    }

    // --- Bocadillo de "hablando": fundido de opacidad/escala + rebote suave.
    talkAmt.current = THREE.MathUtils.lerp(talkAmt.current, state === "talking" ? 1 : 0, 1 - Math.pow(0.001, dt));
    const talk = talkAmt.current;
    if (bubbleRef.current) {
      bubbleRef.current.visible = talk > 0.01;
      bubbleRef.current.position.y = BUBBLE_Y + Math.sin(t * 3) * 0.04 * talk;
      bubbleRef.current.scale.setScalar(BUBBLE_SCALE * (0.7 + 0.3 * talk));
    }
    mats.bubble.opacity = talk;

    // Respiración idle: escala Y del torso desde la cintura.
    if (torsoRef.current) {
      torsoRef.current.scale.y = state === "walking" ? 1 : 1 + Math.sin(t * 1.1) * 0.015;
    }

    if (bodyRef.current) {
      bodyRef.current.position.y = bodyY;
      bodyRef.current.rotation.z = swayZ;
    }
    if (headRef.current) headRef.current.rotation.set(headTiltX, 0, headTiltZ);
    if (armLRef.current) armLRef.current.rotation.set(armLAngle, 0, -armSplay);
    if (armRRef.current) armRRef.current.rotation.set(armRAngle, 0, armSplay);
    if (legLRef.current) legLRef.current.rotation.x = legLAngle;
    if (legRRef.current) legRRef.current.rotation.x = legRAngle;
  });

  /**
   * El muñeco PROYECTA sombra, pero no la recibe.
   *
   * Se marca recorriendo `bodyRef` en vez de poner `castShadow` en cada una
   * de las ~20 mallas (cabeza, nariz, pelo, torso, cuatro extremidades con
   * tres piezas cada una): así no se olvida ninguna al tocar el muñeco. Se
   * queda fuera lo que cuelga de `rootRef` pero no del cuerpo — el disco de
   * sombra de contacto, que proyectaría su propia silueta sobre el suelo — y
   * el bocadillo, que es un `Sprite` y no un `Mesh`. Las cáscaras de resalte
   * (`visible={highlighted}`) tampoco molestan: three no mete en el shadow
   * map lo que está invisible.
   *
   * Sin `receiveShadow`: un muñeco de 1 unidad con la cabeza redonda recoge
   * sobre todo su propia sombra, y el acné que eso saca en la nuca cuesta más
   * de lo que aporta.
   */
  useEffect(() => {
    bodyRef.current?.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) object.castShadow = true;
    });
  }, []);

  const head = DOLL.head;
  const leg = DOLL.leg;
  const footScale: [number, number, number] = [0.95, 0.6, 1.35];
  const footOffset: [number, number, number] = [0, 0.04, 0.03];

  return (
    <group ref={rootRef} scale={0}>
      <group ref={bodyRef}>
        {/* --- Cabeza (cara como `map` de la propia esfera) + nariz + pelo --- */}
        <group ref={headRef} position={[0, head.y, 0]}>
          <mesh scale={head.scale} geometry={geos.head} material={mats.head} />
          <mesh
            scale={[head.scale[0] * HULL_HEAD, head.scale[1] * HULL_HEAD, head.scale[2] * HULL_HEAD]}
            geometry={geos.head}
            material={mats.hull}
            visible={highlighted}
          />
          {/* Nariz: único rasgo con volumen, algo más oscura que la piel para
              que se lea de frente sin necesidad de contorno. */}
          <mesh
            position={[0, DOLL.nose.y - head.y, DOLL.nose.z]}
            scale={[1, 0.8, 0.85]}
            geometry={geos.nose}
            material={mats.nose}
          />
          <Hair style={spec.hair} material={mats.hair} />
        </group>

        {/* --- Torso: camiseta + cadera de pantalón --- */}
        <group ref={torsoRef} position={[0, WAIST_Y, 0]}>
          <mesh geometry={geos.shirt} material={mats.shirt} />
          <mesh geometry={geos.pants} material={mats.pants} />
          <mesh scale={[HULL_BODY, 1.02, HULL_BODY]} geometry={geos.shirt} material={mats.hull} visible={highlighted} />
          <mesh scale={[HULL_BODY, 1.04, HULL_BODY]} geometry={geos.pants} material={mats.hull} visible={highlighted} />
        </group>

        {/* --- Brazos (manga) + manos (piel) --- */}
        {([-1, 1] as const).map((side) => (
          <Limb
            key={`arm${side}`}
            pivot={[side * ARM_X, DOLL.arm.y, 0]}
            length={DOLL.arm.length}
            segGeometry={geos.arm}
            endGeometry={geos.hand}
            segMaterial={mats.shirt}
            endMaterial={mats.skin}
            hullMaterial={mats.hull}
            highlighted={highlighted}
            groupRef={side < 0 ? armLRef : armRRef}
          />
        ))}

        {/* --- Piernas (pantalón) + zapatos --- */}
        {([-1, 1] as const).map((side) => (
          <Limb
            key={`leg${side}`}
            pivot={[side * leg.x, leg.y, 0]}
            length={leg.length}
            segGeometry={geos.leg}
            endGeometry={geos.foot}
            segMaterial={mats.pants}
            endMaterial={mats.shoe}
            hullMaterial={mats.hull}
            endScale={footScale}
            endOffset={footOffset}
            highlighted={highlighted}
            groupRef={side < 0 ? legLRef : legRRef}
          />
        ))}

        {/* --- Bocadillo de "hablando": sprite (billboard automático), oculto
            salvo mientras `state === "talking"`. --- */}
        <sprite ref={bubbleRef} position={[0, BUBBLE_Y, 0]} scale={BUBBLE_SCALE} material={mats.bubble} visible={false} />
      </group>

      {/* --- Sombra de contacto: disco plano, nunca shadow map real. --- */}
      <mesh ref={shadowRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={geos.shadow} material={mats.shadow} />
    </group>
  );
}
