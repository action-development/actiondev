"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { BOOTH } from "./street-config";
import { atlasPlane, boxBetween, merge, roundedBox } from "./street-geometry";
import {
  KEYPAD_LABELS,
  getBoothSignTexture,
  getBrushedSteelTexture,
  getKeypadTexture,
  getLcdTexture,
  getTreadPlateTexture,
} from "./street-textures";

interface PhoneBoothProps {
  /** Se incrementa en cada uso: dispara la animación de descolgar. */
  activation: number;
  lightsOn: boolean;
  signLabel: string;
  /** Las dos líneas de la pantalla del teléfono. */
  lcd: [string, string];
}

/** Descolgar: sube, sale hacia la calle, aguanta y vuelve a la horquilla. */
const LIFT = { seconds: 1.9, rise: 0.2, out: 0.26, side: 0.08, tilt: 0.85 } as const;

/** Teléfono: centro de la carcasa y cara frontal (coordenadas de la cabina). */
const PHONE = { y: 1.32, w: 0.36, h: 0.62, d: 0.14 } as const;
const PHONE_Z = -BOOTH.d / 2 + 0.035 + PHONE.d / 2;
const PHONE_FRONT = PHONE_Z + PHONE.d / 2;
/** Teclado 3 × 4: tamaño de tecla y paso. */
const KEY = { w: 0.05, h: 0.042, px: 0.062, py: 0.054, x: -0.03, y: 1.37 } as const;
/** Auricular colgado: su centro en la horquilla, en el costado izquierdo. */
const HANDSET_REST = new THREE.Vector3(-PHONE.w / 2 - 0.04, 1.34, PHONE_Z + 0.02);
/** Salida del cable blindado, bajo la carcasa. */
const CORD_ANCHOR = new THREE.Vector3(-PHONE.w / 2 + 0.03, PHONE.y - PHONE.h / 2 + 0.02, PHONE_Z + 0.04);

/** Cable blindado entre la carcasa y el pie del auricular, con su comba. */
function cordGeometry(end: THREE.Vector3): THREE.TubeGeometry {
  const mid = CORD_ANCHOR.clone().lerp(end, 0.5);
  mid.y = Math.min(CORD_ANCHOR.y, end.y) - 0.14 + Math.max(0, end.y - CORD_ANCHOR.y) * 0.3;
  const curve = new THREE.CatmullRomCurve3([CORD_ANCHOR.clone(), mid, end.clone()]);
  return new THREE.TubeGeometry(curve, 36, 0.009, 6, false);
}

/**
 * Cabina de acera y su teléfono de monedas, a nivel de producto:
 * - perfilería de aluminio de cantos redondeados, techo con vuelo y caja de
 *   luz «TELÉFONO» con pictograma (encendida de noche), tira de luz interior;
 * - zócalo de acero cepillado, vidrio con junquillo y suelo de chapa lagrimada;
 * - teléfono: carcasa de grafito, frontal de acero, pantalla LCD lima, teclado
 *   de 12 teclas en relieve con su número, ranuras de moneda y tarjeta,
 *   cajetín de devolución, repisa, horquilla cromada, auricular con cápsulas y
 *   cable blindado que sigue al auricular al descolgarlo.
 *
 * Es el canal WhatsApp: usarla descuelga el auricular mientras se abre la
 * conversación en otra pestaña.
 */
export function PhoneBooth({ activation, lightsOn, signLabel, lcd }: PhoneBoothProps) {
  const { w, d, h } = BOOTH;
  const tex = useMemo(
    () => ({
      sign: getBoothSignTexture(signLabel),
      steel: getBrushedSteelTexture(),
      tread: getTreadPlateTexture(),
      keypad: getKeypadTexture(),
      lcd: getLcdTexture(lcd[0], lcd[1]),
    }),
    [signLabel, lcd]
  );

  const geo = useMemo(() => {
    const post = 0.07;
    const kickTop = 0.5;
    const glassTop = h - 0.06;

    // Aluminio: montantes, techo, caja de luz, junquillos del vidrio.
    const alu: THREE.BufferGeometry[] = [];
    for (const [x, z] of [
      [-w / 2, -d / 2],
      [w / 2, -d / 2],
      [-w / 2, d / 2],
      [w / 2, d / 2],
    ]) {
      alu.push(roundedBox(post, h, post, 0.022, [x, h / 2, z]));
    }
    alu.push(roundedBox(w + 0.2, 0.09, d + 0.2, 0.03, [0, h + 0.045, 0]));
    alu.push(roundedBox(w + 0.04, 0.3, 0.15, 0.025, [0, h + 0.09 + 0.15, 0]));
    // Travesaño que remata el zócalo en las tres caras cerradas.
    alu.push(boxBetween(-w / 2, w / 2, kickTop, kickTop + 0.03, -d / 2 - 0.015, -d / 2 + 0.015));
    for (const s of [-1, 1]) alu.push(boxBetween(s * w / 2 - 0.015, s * w / 2 + 0.015, kickTop, kickTop + 0.03, -d / 2, d / 2));

    // Juntas de goma alrededor de cada vidrio.
    const gasket: THREE.BufferGeometry[] = [
      boxBetween(-w / 2, w / 2, glassTop - 0.02, glassTop, -d / 2 - 0.012, -d / 2 + 0.012),
    ];
    for (const s of [-1, 1]) gasket.push(boxBetween(s * w / 2 - 0.012, s * w / 2 + 0.012, glassTop - 0.02, glassTop, -d / 2, d / 2));

    const kick = merge([
      boxBetween(-w / 2 + post / 2, w / 2 - post / 2, 0.07, kickTop, -d / 2 - 0.01, -d / 2 + 0.01),
      boxBetween(-w / 2 - 0.01, -w / 2 + 0.01, 0.07, kickTop, -d / 2 + post / 2, d / 2 - post / 2),
      boxBetween(w / 2 - 0.01, w / 2 + 0.01, 0.07, kickTop, -d / 2 + post / 2, d / 2 - post / 2),
    ]);

    const glassH = glassTop - 0.02 - (kickTop + 0.03);
    const glassY = kickTop + 0.03 + glassH / 2;
    const glass = merge([
      new THREE.PlaneGeometry(w - post, glassH).translate(0, glassY, -d / 2),
      new THREE.PlaneGeometry(d - post, glassH).rotateY(Math.PI / 2).translate(-w / 2, glassY, 0),
      new THREE.PlaneGeometry(d - post, glassH).rotateY(-Math.PI / 2).translate(w / 2, glassY, 0),
    ]);

    // Teléfono: carcasa de grafito + frontal de acero + repisa.
    const body = merge([
      roundedBox(PHONE.w, PHONE.h, PHONE.d, 0.03, [0, PHONE.y, PHONE_Z]),
      // Capuchón superior que protege el frontal de la lluvia.
      roundedBox(PHONE.w + 0.02, 0.05, PHONE.d + 0.05, 0.02, [0, PHONE.y + PHONE.h / 2 + 0.02, PHONE_Z + 0.02]),
    ]);
    const face = merge([
      roundedBox(PHONE.w - 0.05, PHONE.h - 0.07, 0.012, 0.01, [0, PHONE.y - 0.01, PHONE_FRONT + 0.006]),
      roundedBox(0.44, 0.022, 0.2, 0.008, [0, 0.98, -d / 2 + 0.11]),
    ]);

    // Teclado: cuerpos en relieve y, encima, su número desde el atlas.
    const keyBodies: THREE.BufferGeometry[] = [];
    const keyTops: THREE.BufferGeometry[] = [];
    const zKey = PHONE_FRONT + 0.012;
    KEYPAD_LABELS.forEach((_, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = KEY.x + (col - 1) * KEY.px;
      const y = KEY.y - row * KEY.py;
      keyBodies.push(roundedBox(KEY.w, KEY.h, 0.016, 0.007, [x, y, zKey + 0.008]));
      const u0 = col / 3;
      const v1 = 1 - row / 4;
      keyTops.push(atlasPlane(KEY.w - 0.008, KEY.h - 0.008, u0, v1 - 0.25, u0 + 1 / 3, v1).translate(x, y, zKey + 0.0165));
    });

    // Ranuras (moneda, tarjeta), cajetín de devolución y marco de pantalla.
    const dark = merge([
      boxBetween(0.107, 0.117, 1.33, 1.39, PHONE_FRONT + 0.008, PHONE_FRONT + 0.014),
      boxBetween(0.08, 0.145, 1.245, 1.253, PHONE_FRONT + 0.008, PHONE_FRONT + 0.014),
      boxBetween(-0.06, 0.06, 1.07, 1.12, PHONE_FRONT + 0.004, PHONE_FRONT + 0.016),
      boxBetween(-0.125, 0.125, 1.465, 1.555, PHONE_FRONT + 0.012, PHONE_FRONT + 0.015),
    ]);
    const chrome = merge([
      // Labio del cajetín y horquilla.
      boxBetween(-0.07, 0.07, 1.06, 1.07, PHONE_FRONT, PHONE_FRONT + 0.03),
      roundedBox(0.03, 0.05, 0.07, 0.008, [-PHONE.w / 2 - 0.012, 1.47, PHONE_Z + 0.02]),
      // Pasacables del cable blindado.
      new THREE.CylinderGeometry(0.018, 0.018, 0.03, 12).translate(CORD_ANCHOR.x, CORD_ANCHOR.y + 0.005, CORD_ANCHOR.z),
    ]);
    const lcdGeo = new THREE.PlaneGeometry(0.235, 0.075).translate(0, 1.51, PHONE_FRONT + 0.0155);

    // Suelo y tira de luz interior.
    const base = roundedBox(w + 0.08, 0.07, d + 0.08, 0.02, [0, 0.035, 0]);
    const tread = new THREE.PlaneGeometry(w - 0.02, d - 0.02).rotateX(-Math.PI / 2).translate(0, 0.0715, 0);
    const strip = new THREE.PlaneGeometry(w - 0.12, 0.07).rotateX(Math.PI / 2).translate(0, h - 0.002, -0.05);
    const signFaces = merge([
      new THREE.PlaneGeometry(w - 0.02, 0.24).translate(0, h + 0.24, 0.0765),
      new THREE.PlaneGeometry(w - 0.02, 0.24).rotateY(Math.PI).translate(0, h + 0.24, -0.0765),
    ]);

    // Auricular (en su propio grupo, que es el que se anima): mango y cápsulas.
    const handset = merge([
      roundedBox(0.046, 0.17, 0.04, 0.016),
      roundedBox(0.07, 0.065, 0.062, 0.026, [0, 0.105, 0.012]),
      roundedBox(0.07, 0.065, 0.062, 0.026, [0, -0.105, 0.012]),
    ]);

    return {
      alu: merge(alu),
      gasket: merge(gasket),
      kick,
      glass,
      body,
      face,
      keyBodies: merge(keyBodies),
      keyTops: merge(keyTops),
      dark,
      chrome,
      lcdGeo,
      base,
      tread,
      strip,
      signFaces,
      handset,
    };
  }, [w, d, h]);

  const cordRef = useRef<THREE.Mesh>(null);
  const handsetRef = useRef<THREE.Group>(null);
  const cordGeo = useRef<THREE.TubeGeometry | null>(null);
  const lastK = useRef(-1);
  const startedAt = useRef<number | null>(null);
  const clock = useRef(0);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose());
      cordGeo.current?.dispose();
    },
    [geo]
  );

  useEffect(() => {
    if (activation > 0) startedAt.current = clock.current;
  }, [activation]);

  useFrame((state) => {
    clock.current = state.clock.elapsedTime;
    const g = handsetRef.current;
    const cord = cordRef.current;
    if (!g || !cord) return;
    let k = 0;
    if (startedAt.current !== null) {
      const p = (clock.current - startedAt.current) / LIFT.seconds;
      if (p >= 1) startedAt.current = null;
      else {
        // Sube rápido, aguanta en la oreja y baja al final (suavizado).
        const up = Math.min(1, p * 4.5);
        const down = Math.min(1, (1 - p) * 4);
        k = up * up * (3 - 2 * up) * down * down * (3 - 2 * down);
      }
    }
    if (Math.abs(k - lastK.current) < 1e-3) return;
    lastK.current = k;

    g.position.set(
      HANDSET_REST.x + k * LIFT.side,
      HANDSET_REST.y + k * LIFT.rise,
      HANDSET_REST.z + k * LIFT.out
    );
    g.rotation.set(-k * 0.35, 0, k * LIFT.tilt);
    g.updateMatrix();

    // El cable sale del pie del auricular: se rehace solo mientras se mueve.
    tmp.set(0, -0.14, 0.012).applyMatrix4(g.matrix);
    cordGeo.current?.dispose();
    cordGeo.current = cordGeometry(tmp);
    cord.geometry = cordGeo.current;
  });

  const steelMat = <meshStandardMaterial map={tex.steel} roughness={0.3} metalness={0.9} />;

  return (
    <group>
      <mesh geometry={geo.base} castShadow receiveShadow>
        <meshStandardMaterial color="#8b9095" roughness={0.45} metalness={0.7} />
      </mesh>
      <mesh geometry={geo.tread} receiveShadow>
        <meshStandardMaterial map={tex.tread} roughness={0.4} metalness={0.8} />
      </mesh>

      <mesh geometry={geo.alu} castShadow receiveShadow>
        <meshStandardMaterial color="#cfd3d7" roughness={0.26} metalness={0.88} />
      </mesh>
      <mesh geometry={geo.gasket}>
        <meshStandardMaterial color="#141517" roughness={0.7} />
      </mesh>
      <mesh geometry={geo.kick} castShadow receiveShadow>
        {steelMat}
      </mesh>
      <mesh geometry={geo.glass}>
        <meshStandardMaterial
          color="#e2f0f4"
          transparent
          opacity={0.13}
          roughness={0.02}
          metalness={0.2}
          envMapIntensity={1.8}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Caja de luz: encendida de noche, con la misma textura como emisión. */}
      <mesh geometry={geo.signFaces}>
        <meshStandardMaterial
          map={tex.sign}
          emissive="#ffffff"
          emissiveMap={tex.sign}
          emissiveIntensity={lightsOn ? 1.1 : 0.08}
          roughness={0.35}
        />
      </mesh>
      <mesh geometry={geo.strip}>
        <meshBasicMaterial color={lightsOn ? "#fff3dc" : "#9ea2a6"} toneMapped={!lightsOn} />
      </mesh>

      {/* Teléfono */}
      <mesh geometry={geo.body} castShadow receiveShadow>
        <meshStandardMaterial color="#26292d" roughness={0.42} metalness={0.35} />
      </mesh>
      <mesh geometry={geo.face} castShadow receiveShadow>
        {steelMat}
      </mesh>
      <mesh geometry={geo.keyBodies} castShadow>
        <meshStandardMaterial color="#d6dadd" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh geometry={geo.keyTops}>
        <meshStandardMaterial map={tex.keypad} roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh geometry={geo.dark}>
        <meshStandardMaterial color="#0c0d0f" roughness={0.6} />
      </mesh>
      <mesh geometry={geo.chrome} castShadow>
        <meshStandardMaterial color="#eceef0" roughness={0.1} metalness={1} />
      </mesh>
      <mesh geometry={geo.lcdGeo}>
        <meshBasicMaterial map={tex.lcd} toneMapped={false} />
      </mesh>

      <group ref={handsetRef} position={HANDSET_REST}>
        <mesh geometry={geo.handset} castShadow>
          <meshStandardMaterial color="#1c1e21" roughness={0.38} metalness={0.2} />
        </mesh>
      </group>
      <mesh ref={cordRef} castShadow>
        <meshStandardMaterial color="#c3c7cb" roughness={0.22} metalness={0.95} />
      </mesh>
    </group>
  );
}
