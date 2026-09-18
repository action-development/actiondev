"use client";

import { useEffect, useMemo, useRef, type Ref } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Outlines } from "@react-three/drei";
import { OUTLINE, OUTLINE_THIN } from "./toon";
import { beaconLevel, patternAt } from "./beacon-patterns";

/**
 * Carro y spreader para el modo "painted": mismo lenguaje que la grúa dibujada
 * (acero verde oliva, remaches, luz de contraluz ya pintada en la textura y
 * contorno de tinta). Material básico, sin sombreado ni sombras: el volumen
 * va horneado en el canvas, como en el fondo.
 */

const INK = "#1a1410";
const STEEL = { base: "#7f8a34", light: "#9ba64a", shade: "#4d5621" };
const DARK_STEEL = { base: "#3b3a34", light: "#5a584e", shade: "#24231f" };
type Steel = typeof STEEL;

function steelPanel(w: number, h: number, c: Steel, rivets: boolean) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;

  ctx.fillStyle = c.base;
  ctx.fillRect(0, 0, w, h);
  // Luz de contraluz arriba, sombra propia abajo (el sol del fondo está detrás-arriba)
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, c.light);
  g.addColorStop(0.28, c.base);
  g.addColorStop(0.72, c.base);
  g.addColorStop(1, c.shade);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Juntas de chapa
  ctx.strokeStyle = "rgba(26,20,16,0.55)";
  ctx.lineWidth = 2;
  for (let x = w / 3; x < w - 1; x += w / 3) {
    ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x, h - 6); ctx.stroke();
  }

  if (rivets) {
    for (const y of [11, h - 11]) {
      for (let x = 12; x < w - 6; x += 16) {
        ctx.fillStyle = INK;
        ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c.light;
        ctx.beginPath(); ctx.arc(x - 0.8, y - 0.8, 1, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, w, h);

  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Chapa de la cabina del gruista. Como el `steelPanel` pero con la franja de
 * sombra del tercio bajo horneada, que es lo que le da volumen al cuerpo a
 * distancia de cámara (28 u). Se mapea sobre las TAPAS del `ExtrudeGeometry`,
 * cuyas UV vienen en unidades de mundo: el `repeat`/`offset` del material las
 * normaliza (ver `useCabinSkin`).
 */
function cabinPanelTexture() {
  const W = 256;
  const H = 144;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, STEEL.light);
  g.addColorStop(0.3, STEEL.base);
  g.addColorStop(0.66, STEEL.base);
  g.addColorStop(1, STEEL.shade);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Franja oscura del tercio bajo + su junta de tinta
  ctx.fillStyle = "rgba(36,30,14,0.3)";
  ctx.fillRect(0, H * 0.66, W, H * 0.34);
  ctx.strokeStyle = "rgba(26,20,16,0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, H * 0.66); ctx.lineTo(W, H * 0.66); ctx.stroke();

  // Juntas verticales de chapa
  ctx.strokeStyle = "rgba(26,20,16,0.5)";
  ctx.lineWidth = 2;
  for (let x = W / 4; x < W - 1; x += W / 4) {
    ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x, H - 8); ctx.stroke();
  }

  // Remaches arriba, abajo y a los lados de la junta baja
  for (const y of [13, H * 0.66 + 11, H - 13]) {
    for (let x = 14; x < W - 8; x += 18) {
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(x, y, 2.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = STEEL.light;
      ctx.beginPath(); ctx.arc(x - 0.9, y - 0.9, 1.1, 0, Math.PI * 2); ctx.fill();
    }
  }

  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, W, H);

  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function windowTexture() {
  const cv = document.createElement("canvas");
  cv.width = 128;
  cv.height = 64;
  const ctx = cv.getContext("2d")!;
  // Reflejo del atardecer en el cristal
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, "#6b4a86");
  g.addColorStop(0.55, "#e0786a");
  g.addColorStop(1, "#f5b25c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 64);
  ctx.fillStyle = "rgba(255,240,220,0.45)";
  ctx.beginPath();
  ctx.moveTo(20, 0); ctx.lineTo(44, 0); ctx.lineTo(18, 64); ctx.lineTo(-6, 64);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, 128, 64);
  ctx.beginPath(); ctx.moveTo(64, 0); ctx.lineTo(64, 64); ctx.stroke();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Banda de peligro tinta/amarillo del canto bajo de la cabina. */
function hazardTexture() {
  const W = 192;
  const H = 32;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#e8c23a";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 11;
  for (let x = -H; x < W + H; x += 24) {
    ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + H, 0); ctx.stroke();
  }
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 2.5); ctx.lineTo(W, 2.5);
  ctx.moveTo(0, H - 2.5); ctx.lineTo(W, H - 2.5);
  ctx.stroke();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  // La banda es mucho más alargada que el lienzo (1.35 × 0.1 en mundo): sin
  // repetir en x las rayas salen tumbadas en vez de a 45°. El paso (24 px) cabe
  // entero en los 192 del lienzo, así que la repetición no deja costura.
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.x = 2;
  return t;
}

/** Rejilla del equipo de clima del techo: lamas horizontales sobre chapa oscura. */
function grilleTexture() {
  const S = 64;
  const cv = document.createElement("canvas");
  cv.width = S;
  cv.height = S;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = DARK_STEEL.base;
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = DARK_STEEL.light;
  ctx.fillRect(0, 0, S, 5);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  for (let y = 12; y < S - 6; y += 8) {
    ctx.beginPath(); ctx.moveTo(6, y); ctx.lineTo(S - 6, y); ctx.stroke();
  }
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Cara de rueda: llanta con aro de tinta, radios, buje y tornillos. Se dibuja
 * en un canvas CUADRADO porque las tapas del `CylinderGeometry` mapean el
 * círculo inscrito — así el dibujo cae centrado en la rueda sin deformarse.
 */
function wheelTexture() {
  const S = 96;
  const c = S / 2;
  const cv = document.createElement("canvas");
  cv.width = S;
  cv.height = S;
  const ctx = cv.getContext("2d")!;

  ctx.fillStyle = DARK_STEEL.base;
  ctx.beginPath(); ctx.arc(c, c, c - 1, 0, Math.PI * 2); ctx.fill();
  // Llanta: aro de tinta fuera y reflejo claro dentro
  ctx.strokeStyle = INK;
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(c, c, c - 4.5, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = DARK_STEEL.light;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(c, c, c - 12, 0, Math.PI * 2); ctx.stroke();
  // Radios
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * 11, c + Math.sin(a) * 11);
    ctx.lineTo(c + Math.cos(a) * (c - 13), c + Math.sin(a) * (c - 13));
    ctx.stroke();
  }
  // Buje y tornillos
  ctx.fillStyle = DARK_STEEL.light;
  ctx.beginPath(); ctx.arc(c, c, 13, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(c, c, 13, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = INK;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    ctx.beginPath(); ctx.arc(c + Math.cos(a) * 8, c + Math.sin(a) * 8, 1.9, 0, Math.PI * 2); ctx.fill();
  }

  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Piel compartida por las ruedas (pórtico y carro): una textura, dos materiales. */
function useWheelSkin() {
  const skin = useMemo(() => {
    const map = wheelTexture();
    return {
      map,
      face: new THREE.MeshBasicMaterial({ map, toneMapped: false }),
      tread: new THREE.MeshBasicMaterial({ color: DARK_STEEL.shade, toneMapped: false }),
    };
  }, []);

  useEffect(() => () => {
    skin.map.dispose();
    skin.face.dispose();
    skin.tread.dispose();
  }, [skin]);

  return skin;
}

/**
 * Chapa del logotipo de la casa de maquinaria.
 *
 * Se carga A MANO con `TextureLoader` dentro de un efecto, NUNCA con
 * `useTexture`/`useLoader`: esos suspenden el `<Suspense>` que envuelve a
 * `GameWorld` y retrasarían el `onReady` (la pantalla de carga se quedaría
 * clavada). Hasta que llega el webp el material va invisible — sin mapa sería
 * un rectángulo blanco sobre la casa.
 */
function useLogoSkin() {
  const mat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.5, toneMapped: false });
    m.visible = false;
    return m;
  }, []);

  useEffect(() => {
    let alive = true;
    let map: THREE.Texture | null = null;
    new THREE.TextureLoader().load("/logos/logo.webp", (t) => {
      if (!alive) { t.dispose(); return; }
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      map = t;
      mat.map = t;
      mat.visible = true;
      mat.needsUpdate = true;
    });
    return () => {
      alive = false;
      mat.map = null;
      map?.dispose();
    };
  }, [mat]);

  useEffect(() => () => mat.dispose(), [mat]);

  return mat;
}

function usePaintedSkins() {
  const skins = useMemo(() => {
    const make = (map: THREE.Texture) => new THREE.MeshBasicMaterial({ map, toneMapped: false });
    const maps = [
      steelPanel(256, 80, STEEL, true),
      steelPanel(128, 112, STEEL, true),
      steelPanel(256, 40, DARK_STEEL, true),
      windowTexture(),
      hazardTexture(),
      grilleTexture(),
      steelPanel(256, 96, STEEL, true),
    ];
    return {
      frame: make(maps[0]),
      cabin: make(maps[1]),
      spreader: make(maps[2]),
      glass: make(maps[3]),
      hazard: make(maps[4]),
      grille: make(maps[5]),
      /** Casa de maquinaria: MISMA chapa oliva (`STEEL`) que el carro, la pluma
       *  y la cabina — solo cambia la proporción del lienzo para que los
       *  remaches caigan bien en una caja de 2.6 × 1.1. El logo negro va
       *  directamente encima, sin panel más claro ni marco. */
      house: make(maps[6]),
      ink: new THREE.MeshBasicMaterial({ color: INK }),
      lock: new THREE.MeshBasicMaterial({ color: "#c9b43a", toneMapped: false }),
      // Disco de polea: acero claro con contorno propio, se lee a 10 px.
      sheave: new THREE.MeshBasicMaterial({ color: DARK_STEEL.light, toneMapped: false }),
      // Placa de marca en el costado de la cabina.
      lime: new THREE.MeshBasicMaterial({ color: "#c8ff00", toneMapped: false }),
      // Lente de los focos de la cabina.
      lens: new THREE.MeshBasicMaterial({ color: "#ffd76a", toneMapped: false }),
      /** Silueta del asiento: va DELANTE del cristal y semitransparente, porque
       *  el "cristal" es un plano opaco y nada puesto detrás se vería. */
      interior: new THREE.MeshBasicMaterial({ color: "#1c1814", transparent: true, opacity: 0.8, toneMapped: false }),
      /** Penumbra de la cabina: oscurece la hoja central por detrás de la silueta. */
      interiorDim: new THREE.MeshBasicMaterial({ color: "#241f1a", transparent: true, opacity: 0.42, toneMapped: false }),
      maps,
    };
  }, []);

  useEffect(() => () => {
    skins.maps.forEach((m) => m.dispose());
    [
      skins.frame, skins.cabin, skins.spreader, skins.glass, skins.hazard, skins.grille, skins.house,
      skins.ink, skins.lock, skins.sheave, skins.lime, skins.lens, skins.interior, skins.interiorDim,
    ].forEach((m) => m.dispose());
  }, [skins]);

  return skins;
}

/**
 * Cabina del gruista: más larga que alta, con el chaflán acristalado SOLO en la
 * mitad de abajo de la cara que mira a la ría (+x) — es por ahí por donde el
 * operador mira la carga, entre los pies.
 */
const CABIN_W = 1.85;
const CABIN_H = 0.8;
const CABIN_D = 1.1;
/** Z del centro de la cabina: por delante de la pluma, hacia cámara. */
const CABIN_Z = 0.28;
const CABIN_ROOF_H = 0.07;
/** Ancho del ventanal corrido de la cara de cámara (3 hojas). */
const GLASS_W = CABIN_W - 0.3;
/** Alto del ventanal: 55 % del cuerpo — es lo que hace que la cabina se lea. */
const GLASS_H = CABIN_H * 0.55;
/** Centro en y del ventanal: pegado a la mitad alta del cuerpo. */
const GLASS_Y = 0.12;
/** Grosor de la carpintería de tinta (marco y montantes). */
const MULLION = 0.04;
/** Alto de la cabina con su techo (desde el centro): lo que necesita el carro para colgarla. */
export const PAINTED_CABIN_TOP = CABIN_H / 2 + CABIN_ROOF_H;
/** Vértices del chaflán acristalado, de arriba (media altura) a abajo. */
const CHAMFER_TOP: [number, number] = [CABIN_W / 2, 0];
const CHAMFER_BOTTOM: [number, number] = [CABIN_W / 2 - 0.5, -CABIN_H / 2];

/**
 * Cabina del gruista, la forma real de una STS: cuelga del carro (los brazos
 * los pone `PaintedTrolley`), techo plano con visera y barandilla, cuerpo de
 * chapa de una sola pieza extruida —para que `<Outlines>` dibuje UNA silueta
 * limpia— y, en la mitad baja de la cara que mira al spreader, la cristalera
 * inclinada por la que el operador mira hacia abajo.
 */
function Cabin({ x, y, skins }: { x: number; y: number; skins: ReturnType<typeof usePaintedSkins> }) {
  const body = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-CABIN_W / 2, CABIN_H / 2);
    shape.lineTo(CABIN_W / 2, CABIN_H / 2);
    shape.lineTo(CHAMFER_TOP[0], CHAMFER_TOP[1]);
    shape.lineTo(CHAMFER_BOTTOM[0], CHAMFER_BOTTOM[1]);
    shape.lineTo(-CABIN_W / 2, -CABIN_H / 2);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: CABIN_D, bevelEnabled: false });
    g.translate(0, 0, -CABIN_D / 2);
    return g;
  }, []);
  useEffect(() => () => body.dispose(), [body]);

  /*
   * `ExtrudeGeometry` deja DOS grupos: el 0 son las tapas (cara de cámara y
   * trasera) y el 1 las paredes laterales. Aprovechamos eso para darle a la
   * cara de cámara la chapa remachada y a los costados un plano más oscuro.
   *
   * Las UV de las tapas vienen en UNIDADES DE MUNDO (u = x, v = y), así que el
   * `repeat`/`offset` de la textura las normaliza al bounding box de la forma:
   * u = x / CABIN_W + 0.5, v = y / CABIN_H + 0.5. Sin esto los remaches salen
   * a escala aleatoria.
   */
  const bodyMat = useMemo(() => {
    const map = cabinPanelTexture();
    map.repeat.set(1 / CABIN_W, 1 / CABIN_H);
    map.offset.set(0.5, 0.5);
    map.needsUpdate = true;
    const cap = new THREE.MeshBasicMaterial({ map, toneMapped: false });
    const wall = new THREE.MeshBasicMaterial({ color: STEEL.shade, toneMapped: false });
    return { map, cap, wall, list: [cap, wall] };
  }, []);
  useEffect(() => () => {
    bodyMat.map.dispose();
    bodyMat.cap.dispose();
    bodyMat.wall.dispose();
  }, [bodyMat]);

  const dx = CHAMFER_BOTTOM[0] - CHAMFER_TOP[0];
  const dy = CHAMFER_BOTTOM[1] - CHAMFER_TOP[1];
  const chamferLen = Math.hypot(dx, dy);
  const chamferAngle = Math.atan2(dy, dx);
  const chamferMid: [number, number] = [(CHAMFER_TOP[0] + CHAMFER_BOTTOM[0]) / 2, (CHAMFER_TOP[1] + CHAMFER_BOTTOM[1]) / 2];

  return (
    <group position={[x, y, CABIN_Z]}>
      {/* Cuerpo con chaflán: chapa remachada en las tapas, costados más oscuros */}
      <mesh geometry={body} material={bodyMat.list}>
        <Outlines thickness={OUTLINE} color={INK} />
      </mesh>

      {/* Ventanal corrido de la cara de cámara */}
      <mesh position={[0, GLASS_Y, CABIN_D / 2 + 0.012]} material={skins.glass}>
        <planeGeometry args={[GLASS_W, GLASS_H]} />
      </mesh>
      {/* Penumbra de la hoja central: el interior de la cabina no es cristal a secas */}
      <mesh position={[0, GLASS_Y, CABIN_D / 2 + 0.016]} material={skins.interiorDim}>
        <planeGeometry args={[GLASS_W / 3 - MULLION, GLASS_H - MULLION]} />
      </mesh>
      {/* Silueta del gruista sentado, vista a través del cristal (ver `interior`) */}
      <mesh position={[0.04, GLASS_Y - 0.08, CABIN_D / 2 + 0.02]} material={skins.interior}>
        <planeGeometry args={[0.3, 0.28]} />
      </mesh>
      <mesh position={[0.04, GLASS_Y + 0.12, CABIN_D / 2 + 0.02]} material={skins.interior}>
        <planeGeometry args={[0.16, 0.13]} />
      </mesh>
      {/* Carpintería del ventanal: marco + 2 montantes = 3 hojas */}
      {[GLASS_Y + GLASS_H / 2, GLASS_Y - GLASS_H / 2].map((my) => (
        <mesh key={`h${my}`} position={[0, my, CABIN_D / 2 + 0.026]} material={skins.ink}>
          <boxGeometry args={[GLASS_W + MULLION, MULLION, 0.016]} />
        </mesh>
      ))}
      {[-GLASS_W / 2, -GLASS_W / 6, GLASS_W / 6, GLASS_W / 2].map((mx) => (
        <mesh key={`v${mx}`} position={[mx, GLASS_Y, CABIN_D / 2 + 0.026]} material={skins.ink}>
          <boxGeometry args={[MULLION, GLASS_H + MULLION, 0.016]} />
        </mesh>
      ))}
      {/*
        Cristalera inclinada hacia el spreader. El grupo gira para alinearse con
        el chaflán; dentro, el plano se tumba con -PI/2 para que la normal salga
        hacia FUERA (con +PI/2 mira al interior de la cabina y no se ve nada) y
        se separa un pelo en +y local, que es la dirección de salida.
      */}
      <group position={[chamferMid[0], chamferMid[1], 0]} rotation={[0, 0, chamferAngle]}>
        <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]} material={skins.glass}>
          <planeGeometry args={[chamferLen - 0.06, CABIN_D - 0.16]} />
        </mesh>
        {/* Montante: parte la cristalera inclinada en 2 hojas */}
        <mesh position={[0, 0.024, 0]} material={skins.ink}>
          <boxGeometry args={[MULLION, 0.022, CABIN_D - 0.16]} />
        </mesh>
        {/* Marco de tinta de la cristalera inclinada (los 4 cantos) */}
        {[-1, 1].map((sz) => (
          <mesh key={`cz${sz}`} position={[0, 0.024, sz * (CABIN_D - 0.16) / 2]} material={skins.ink}>
            <boxGeometry args={[chamferLen, 0.022, MULLION]} />
          </mesh>
        ))}
        {[-1, 1].map((sx) => (
          <mesh key={`cx${sx}`} position={[sx * (chamferLen - 0.06) / 2, 0.024, 0]} material={skins.ink}>
            <boxGeometry args={[MULLION, 0.022, CABIN_D - 0.16]} />
          </mesh>
        ))}
        {/* Limpiaparabrisas: brazo inclinado sobre el cristal + su pivote.
            El giro es sobre el eje Y LOCAL, que es la normal del cristal, así
            que la escobilla se queda tumbada en el plano en vez de despegarse. */}
        <mesh position={[0.14, 0.028, 0.06]} rotation={[0, 0.62, 0]} material={skins.ink}>
          <boxGeometry args={[0.022, 0.018, 0.5]} />
        </mesh>
        <mesh position={[0.14, 0.032, -0.28]} material={skins.ink}>
          <boxGeometry args={[0.05, 0.04, 0.05]} />
        </mesh>
      </group>
      {/* Suelo de cristal: el gruista ve la carga entre los pies */}
      <mesh position={[0.25, -CABIN_H / 2 - 0.008, 0]} rotation={[Math.PI / 2, 0, 0]} material={skins.glass}>
        <planeGeometry args={[0.66, CABIN_D - 0.3]} />
      </mesh>

      {/* Techo plano con visera, equipo de clima y barandilla */}
      <mesh position={[0, CABIN_H / 2 + CABIN_ROOF_H / 2, 0]} material={skins.spreader}>
        <boxGeometry args={[CABIN_W + 0.16, CABIN_ROOF_H, CABIN_D + 0.16]} />
        <Outlines thickness={OUTLINE} color={INK} />
      </mesh>
      {/* Canto del techo: una sola línea de tinta. Los nervios que había aquí
          no se leían a 28 u y ensuciaban la silueta. */}
      <mesh position={[0, CABIN_H / 2 + 0.004, CABIN_D / 2 + 0.08]} material={skins.ink}>
        <boxGeometry args={[CABIN_W + 0.16, 0.026, 0.026]} />
      </mesh>

      {/* Equipo de clima con rejilla */}
      <mesh position={[-0.52, CABIN_H / 2 + CABIN_ROOF_H + 0.09, -0.15]} material={skins.grille}>
        <boxGeometry args={[0.38, 0.18, 0.38]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>

      {/* Antena */}
      <mesh position={[0.72, CABIN_H / 2 + CABIN_ROOF_H + 0.17, -0.3]} material={skins.ink}>
        <cylinderGeometry args={[0.012, 0.016, 0.34, 6]} />
      </mesh>
      <mesh position={[0.72, CABIN_H / 2 + CABIN_ROOF_H + 0.35, -0.3]} material={skins.ink}>
        <sphereGeometry args={[0.032, 8, 6]} />
      </mesh>

      {/* Barandilla del techo: pasamanos + 5 pies */}
      <mesh position={[0, CABIN_H / 2 + CABIN_ROOF_H + 0.2, CABIN_D / 2 + 0.06]} material={skins.ink}>
        <boxGeometry args={[CABIN_W + 0.1, 0.05, 0.05]} />
      </mesh>
      {[-1, -0.5, 0, 0.5, 1].map((sx) => (
        <mesh key={sx} position={[sx * (CABIN_W / 2), CABIN_H / 2 + CABIN_ROOF_H + 0.1, CABIN_D / 2 + 0.06]} material={skins.ink}>
          <boxGeometry args={[0.048, 0.2, 0.048]} />
        </mesh>
      ))}

      {/* Puerta con manilla en el costado de tierra (-x) */}
      <mesh position={[-CABIN_W / 2 - 0.01, -0.07, -0.05]} material={skins.cabin}>
        <boxGeometry args={[0.02, 0.62, 0.42]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>
      <mesh position={[-CABIN_W / 2 - 0.03, -0.07, 0.1]} material={skins.ink}>
        <boxGeometry args={[0.03, 0.05, 0.12]} />
      </mesh>

      {/* Escala de acceso al techo, en el mismo costado */}
      {[-0.1, 0.1].map((dz) => (
        <mesh key={`stile${dz}`} position={[-CABIN_W / 2 - 0.025, 0.3, -0.4 + dz]} material={skins.ink}>
          <boxGeometry args={[0.04, 0.46, 0.04]} />
        </mesh>
      ))}
      {[0.14, 0.28, 0.42].map((ry) => (
        <mesh key={`rung${ry}`} position={[-CABIN_W / 2 - 0.025, ry, -0.4]} material={skins.ink}>
          <boxGeometry args={[0.036, 0.032, 0.2]} />
        </mesh>
      ))}

      {/* Placa de marca (lima) en el costado */}
      <mesh position={[-CABIN_W / 2 - 0.012, 0.18, 0.33]} material={skins.lime}>
        <boxGeometry args={[0.014, 0.12, 0.3]} />
      </mesh>

      {/* Banda de peligro en el canto bajo de la cara de cámara. Va descentrada
          porque el chaflán se come la esquina de +x a esa altura. */}
      <mesh position={[-0.25, -CABIN_H / 2 + 0.05, CABIN_D / 2 + 0.01]} material={skins.hazard}>
        <boxGeometry args={[1.35, 0.1, 0.018]} />
      </mesh>

      {/* Dos focos bajo el suelo apuntando a la carga, con su lente */}
      {[-0.5, 0.12].map((fx) => (
        <group key={`flood${fx}`} position={[fx, -CABIN_H / 2 - 0.07, CABIN_D / 2 - 0.22]}>
          <mesh material={skins.ink}>
            <boxGeometry args={[0.16, 0.12, 0.16]} />
          </mesh>
          <mesh position={[0, -0.065, 0]} material={skins.lens}>
            <cylinderGeometry args={[0.052, 0.052, 0.016, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Alto del carro: una plataforma baja, casi a ras del ala de la pluma. */
export const PAINTED_TROLLEY_H = 0.3;
const TROLLEY_L = 3.4;
/** Casa de maquinaria del izaje: es el cartel de la grúa, lleva el logo. */
const HOUSE_W = 2.6;
const HOUSE_H = 1.1;
const HOUSE_D = 1.0;
/** Logo en la cara de cámara de la casa: 1563×625 → aspecto 2.5. */
const LOGO_W = 2.1;
const LOGO_H = LOGO_W / 2.5;
/** Separación en x de los dos brazos que cuelgan la cabina. */
const ARM_X = 0.7;

/** Radio de las ruedas del carro — `Crane.update()` lo necesita para el giro. */
export const TROLLEY_WHEEL_R = 0.12;
/** Dos parejas por costado, a ras del ala superior de la pluma. */
const TROLLEY_WHEEL_XS = [-1.05, -0.5, 0.5, 1.05];

/**
 * Ruedas del carro: discos finos EMBUTIDOS en las caras de proa y popa de la
 * plataforma, apoyados en el ala superior de la pluma (`boomTopY`). Quedan
 * dentro del canto de la plataforma a propósito: si asomaran por arriba
 * parecerían pegotes, y la gracia es verlas girar al ras del ala.
 *
 * Cada rueda es un GRUPO cuyo `rotation.z` escribe `Crane.update()`; el disco
 * ya lleva el giro de eje horneado en la geometría, así que el Euler del grupo
 * no se mezcla con nada.
 */
function TrolleyWheels({ boomTopY, faceZs, wheelsRef }: {
  boomTopY: number; faceZs: number[]; wheelsRef?: Ref<THREE.Group>;
}) {
  const skin = useWheelSkin();
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(TROLLEY_WHEEL_R, TROLLEY_WHEEL_R, 0.05, 14);
    g.rotateX(Math.PI / 2); // eje en Z: rueda a lo largo de x
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);

  const y = boomTopY + TROLLEY_WHEEL_R;

  return (
    <group ref={wheelsRef}>
      {faceZs.flatMap((z) =>
        TROLLEY_WHEEL_XS.map((x) => (
          <group key={`${z}:${x}`} position={[x, y, z]}>
            <mesh geometry={geo} material={skin.face} />
          </group>
        )),
      )}
    </group>
  );
}

/**
 * Carro + cabina, de perfil como una STS de verdad:
 *
 * - El carro es una plataforma LARGA Y BAJA que se apoya ENCIMA de la pluma
 *   (`boomTopY`), con la casa de maquinaria arriba. Las ruedas van por dentro
 *   del cajón de la pluma: si asoman por arriba parece un juguete apilado.
 * - La plataforma vuela un poco hacia cámara respecto de la pluma para poder
 *   colgar la cabina por delante del alma.
 * - Entre la pluma y la cabina no hay NADA salvo los dos brazos, que pasan por
 *   la cara de cámara del cajón (z ~ 0) y por eso se ven al lado de la viga.
 *
 * Coordenadas locales al grupo del carro (que solo se mueve en x).
 */
export function PaintedTrolley({ boomTopY, boomZ, boomDepth, cabinY, wheelsRef }: {
  boomTopY: number; boomZ: number; boomDepth: number; cabinY: number; wheelsRef?: Ref<THREE.Group>;
}) {
  const s = usePaintedSkins();
  const logo = useLogoSkin();

  const platY = boomTopY + PAINTED_TROLLEY_H / 2;
  const platTop = boomTopY + PAINTED_TROLLEY_H;
  const platD = boomDepth + 0.25;
  const platZ = boomZ + 0.125;
  // Los brazos van del bajo de la plataforma al techo de la cabina.
  const armTop = boomTopY;
  const armBottom = cabinY + PAINTED_CABIN_TOP;
  const armH = armTop - armBottom;

  return (
    <group>
      {/* Plataforma del carro, apoyada en el ala superior de la pluma */}
      <mesh position={[0, platY, platZ]} material={s.frame}>
        <boxGeometry args={[TROLLEY_L, PAINTED_TROLLEY_H, platD]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>
      {/* Casa de maquinaria del izaje: es el soporte del logo, por eso ocupa
          casi toda la plataforma. Chapa oliva estándar, la misma del resto de
          la grúa — nada de tono propio. */}
      <mesh position={[0, platTop + HOUSE_H / 2, boomZ]} material={s.house}>
        <boxGeometry args={[HOUSE_W, HOUSE_H, HOUSE_D]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>
      {/* Logotipo en la cara de cámara de la casa. Sin contorno: es una calca. */}
      <mesh position={[0, platTop + 0.6, boomZ + HOUSE_D / 2 + 0.01]} material={logo}>
        <planeGeometry args={[LOGO_W, LOGO_H]} />
      </mesh>
      {/* Barandilla de la pasarela, en la cara de cámara. Baja a propósito: más
          alta se cruzaría por delante del logo desde la cámara. */}
      <mesh position={[0, platTop + 0.09, platZ + platD / 2]} material={s.ink}>
        <boxGeometry args={[TROLLEY_L - 0.2, 0.03, 0.03]} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * (TROLLEY_L / 2 - 0.12), platTop + 0.05, platZ + platD / 2]} material={s.ink}>
          <boxGeometry args={[0.03, 0.1, 0.03]} />
        </mesh>
      ))}

      {/* Brazos de la cabina, pegados al costado de cámara de la pluma */}
      {[-ARM_X, ARM_X].map((bx) => (
        <mesh key={bx} position={[bx, armBottom + armH / 2, 0]} material={s.spreader}>
          <boxGeometry args={[0.12, armH, 0.12]} />
          <Outlines thickness={OUTLINE_THIN} color={INK} />
        </mesh>
      ))}

      <TrolleyWheels
        boomTopY={boomTopY}
        faceZs={[platZ + platD / 2 + 0.006, platZ - platD / 2 - 0.006]}
        wheelsRef={wheelsRef}
      />

      <Cabin x={0} y={cabinY} skins={s} />
    </group>
  );
}

/**
 * Cuerpo visual del spreader (dentro del RigidBody cinemático): viga fina,
 * headblock arriba donde aterrizan los 4 cables (con sus poleas a la vista),
 * twistlocks en las cuatro esquinas y flippers abiertos en las puntas.
 */
export function PaintedSpreader({ halfW, halfH, headblockH, ropeDx }: {
  halfW: number; halfH: number; headblockH: number; ropeDx: number;
}) {
  const s = usePaintedSkins();
  const blockY = halfH + headblockH / 2;

  return (
    <group>
      {/* Viga */}
      <mesh material={s.spreader}>
        <boxGeometry args={[halfW * 2, halfH * 2, 1.5]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>

      {/* Headblock: un poco más ancho que la separación de los cables */}
      <mesh position={[0, blockY, 0]} material={s.spreader}>
        <boxGeometry args={[ropeDx * 2 + 0.16, headblockH, 1.3]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>
      {/* Poleas en la cara de cámara */}
      {[-ropeDx, ropeDx].map((x) => (
        <mesh key={x} position={[x, blockY, 0.68]} rotation={[Math.PI / 2, 0, 0]} material={s.sheave}>
          <cylinderGeometry args={[0.12, 0.12, 0.06, 14]} />
          <Outlines thickness={OUTLINE_THIN} color={INK} />
        </mesh>
      ))}

      {/* Twistlocks: los cuatro, delante y detrás */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (halfW - 0.18), -halfH - 0.09, sz * 0.5]} material={s.lock}>
            <boxGeometry args={[0.24, 0.18, 0.24]} />
            <Outlines thickness={OUTLINE_THIN} color={INK} />
          </mesh>
        )),
      )}

      {/* Flippers: las palas que guían el contenedor, abiertas hacia fuera */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`f${sx}${sz}`}
            position={[sx * (halfW + 0.05), -halfH - 0.17, sz * 0.58]}
            rotation={[0, 0, sx * 0.3]}
            material={s.spreader}
          >
            <boxGeometry args={[0.08, 0.46, 0.3]} />
            <Outlines thickness={OUTLINE_THIN} color={INK} />
          </mesh>
        )),
      )}
    </group>
  );
}


/* ------------------------------------------------------------------ */
/* Estructura de la grúa (pórtico, pluma, A-frame) con acabado pintado */
/* ------------------------------------------------------------------ */

/**
 * Perfil de viga remachada. `vertical` dibuja el patrón girado para miembros
 * que corren en y (patas); la textura se repite a lo largo del miembro, así
 * que los remaches no se estiran.
 */
function girderTexture(vertical: boolean) {
  const L = 256;
  const T = 64;
  const cv = document.createElement("canvas");
  cv.width = vertical ? T : L;
  cv.height = vertical ? L : T;
  const ctx = cv.getContext("2d")!;
  if (vertical) {
    ctx.translate(T, 0);
    ctx.rotate(Math.PI / 2);
  }

  const g = ctx.createLinearGradient(0, 0, 0, T);
  g.addColorStop(0, STEEL.light);
  g.addColorStop(0.3, STEEL.base);
  g.addColorStop(0.75, STEEL.base);
  g.addColorStop(1, STEEL.shade);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, L, T);

  // Alas superior e inferior de la viga
  ctx.fillStyle = STEEL.shade;
  ctx.fillRect(0, T - 12, L, 12);
  ctx.fillStyle = STEEL.light;
  ctx.fillRect(0, 0, L, 6);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 7); ctx.lineTo(L, 7);
  ctx.moveTo(0, T - 12); ctx.lineTo(L, T - 12);
  ctx.stroke();

  // Cartelas de unión y remaches
  ctx.strokeStyle = "rgba(26,20,16,0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(L / 2, 8); ctx.lineTo(L / 2, T - 12); ctx.stroke();
  for (const y of [15, T - 19]) {
    for (let x = 8; x < L; x += 14) {
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = STEEL.light;
      ctx.beginPath(); ctx.arc(x - 0.7, y - 0.7, 0.9, 0, Math.PI * 2); ctx.fill();
    }
  }
  for (const x of [L / 2 - 8, L / 2 + 8]) {
    for (let y = 22; y < T - 22; y += 8) {
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

export interface CraneLayout {
  legXs: number[];
  legZ: number;
  boomY: number;
  boomLeft: number;
  boomRight: number;
  apex: [number, number];
  quayTopY: number;
  beacons: number[];
}

type Resources = { textures: THREE.Texture[]; materials: THREE.Material[] };

/** Material de viga con la textura repetida según largo/canto del miembro. */
function girder(res: Resources, base: THREE.Texture, length: number, depth: number, vertical: boolean) {
  const t = base.clone();
  const reps = Math.max(1, length / (depth * 4));
  if (vertical) t.repeat.set(1, reps);
  else t.repeat.set(reps, 1);
  t.needsUpdate = true;
  const m = new THREE.MeshBasicMaterial({ map: t, toneMapped: false });
  res.textures.push(t);
  res.materials.push(m);
  return m;
}

function Bar({ from, to, z, thickness, material }: {
  from: [number, number]; to: [number, number]; z: number; thickness: number; material: THREE.Material;
}) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  return (
    <mesh
      position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, z]}
      rotation={[0, 0, -Math.atan2(dx, dy)]}
      material={material}
    >
      <boxGeometry args={[thickness, len, thickness]} />
      <Outlines thickness={OUTLINE_THIN} color={INK} />
    </mesh>
  );
}

/* --- Tren de rodadura del pórtico -----------------------------------------
 *
 * La grúa viaja EN Z sobre los carriles que `Quay.tsx` pinta bajo cada pata
 * (x = legX ± 0.3), cuya cabeza está a `quayTopY + 0.02`. De abajo arriba:
 * ruedas con pestaña → cabezal de bogie → balancín → viga de testa → pata.
 * Las cotas están escritas como incrementos sobre `quayTopY` para que encajen
 * sin huecos aunque se mueva el muelle.
 */
/** Cabeza del carril pintado, medida desde la losa del muelle. */
const RAIL_TOP_DY = 0.02;
/** Radio de rodadura — `Crane.update()` lo necesita para el giro. */
export const GANTRY_WHEEL_R = 0.16;
const GANTRY_FLANGE_R = 0.21;
/** Ancho de la banda de rodadura: cabalga las dos tiras del carril (±0.3). */
const GANTRY_TREAD_W = 0.58;
const GANTRY_FLANGE_X = 0.33;
/** Dos bogies por pata, uno a cada lado del eje de la pata. */
const GANTRY_BOGIE_ZS = [-0.72, 0.72];
/** Cuatro ruedas en fila POR bogie, a lo largo de z (dirección de marcha). */
const GANTRY_WHEEL_DZS = [-0.51, -0.17, 0.17, 0.51];
const GANTRY_WHEEL_DY = RAIL_TOP_DY + GANTRY_WHEEL_R;
const GANTRY_BOGIE_DY = 0.43;
const GANTRY_EQ_DY = 0.67;
const GANTRY_SILL_DY = 0.97;
/** Alto total del tren de rodadura: ahí arranca el pie de la pata. */
const GANTRY_FOOT_H = 1.16;

/**
 * Conjunto de rodadura de las dos patas. Las ruedas cuelgan de UN SOLO grupo
 * (`wheelsRef`) para que `Crane.update()` pueda girarlas todas recorriendo sus
 * hijos, sin reservas ni búsquedas por nombre. Cada rueda es un grupo cuyo
 * `rotation.x` se escribe desde fuera; el eje va horneado en la geometría.
 */
function PaintedGantryBogies({ legXs, legZ, quayTopY, steel, wheelsRef }: {
  legXs: number[]; legZ: number; quayTopY: number; steel: THREE.Material; wheelsRef?: Ref<THREE.Group>;
}) {
  const skin = useWheelSkin();
  const geo = useMemo(() => {
    const tread = new THREE.CylinderGeometry(GANTRY_WHEEL_R, GANTRY_WHEEL_R, GANTRY_TREAD_W, 14);
    tread.rotateZ(Math.PI / 2); // eje en X: rueda a lo largo de z
    const flange = new THREE.CylinderGeometry(GANTRY_FLANGE_R, GANTRY_FLANGE_R, 0.045, 16);
    flange.rotateZ(Math.PI / 2);
    return { tread, flange };
  }, []);
  useEffect(() => () => { geo.tread.dispose(); geo.flange.dispose(); }, [geo]);

  return (
    <group>
      {legXs.map((x) => (
        <group key={x}>
          {/* Viga de testa: recoge el pie de la pata */}
          <mesh position={[x, quayTopY + GANTRY_SILL_DY, legZ]} material={steel}>
            <boxGeometry args={[1, 0.38, 2.1]} />
            <Outlines thickness={OUTLINE_THIN} color={INK} />
          </mesh>
          {/* Balancín: reparte la carga entre los dos bogies */}
          <mesh position={[x, quayTopY + GANTRY_EQ_DY, legZ]} material={steel}>
            <boxGeometry args={[0.5, 0.22, 1.75]} />
            <Outlines thickness={OUTLINE_THIN} color={INK} />
          </mesh>
          {/* Cabezales de bogie */}
          {GANTRY_BOGIE_ZS.map((bz) => (
            <mesh key={bz} position={[x, quayTopY + GANTRY_BOGIE_DY, legZ + bz]} material={steel}>
              <boxGeometry args={[0.6, 0.26, 1.36]} />
              <Outlines thickness={OUTLINE_THIN} color={INK} />
            </mesh>
          ))}
        </group>
      ))}

      <group ref={wheelsRef}>
        {legXs.flatMap((x) =>
          GANTRY_BOGIE_ZS.flatMap((bz) =>
            GANTRY_WHEEL_DZS.map((dz) => (
              <group key={`${x}:${bz}:${dz}`} position={[x, quayTopY + GANTRY_WHEEL_DY, legZ + bz + dz]}>
                <mesh geometry={geo.tread} material={skin.tread} />
                {/* Pestañas: discos algo mayores que asoman por fuera del
                    cabezal y llevan el dibujo de llanta, radios y buje. */}
                <mesh geometry={geo.flange} material={skin.face} position-x={GANTRY_FLANGE_X} />
                <mesh geometry={geo.flange} material={skin.face} position-x={-GANTRY_FLANGE_X} />
              </group>
            )),
          ),
        )}
      </group>
    </group>
  );
}

export function PaintedCraneStructure({ layout, wheelsRef }: { layout: CraneLayout; wheelsRef?: Ref<THREE.Group> }) {
  const { legXs, legZ, boomY, boomLeft, boomRight, apex, quayTopY, beacons } = layout;
  const boomLen = boomRight - boomLeft;
  // La pata ya no llega al muelle: muere en la viga de testa del tren de rodadura.
  const legFootY = quayTopY + GANTRY_FOOT_H;
  const legH = boomY - legFootY;
  const beamW = legXs[1] - legXs[0];

  // `layout` es una constante de módulo: los materiales se crean una vez.
  const mats = useMemo(() => {
    const armLen = (x: number) => Math.hypot(layout.apex[0] - x, layout.apex[1] - layout.boomY);
    const legH = layout.boomY - (layout.quayTopY + GANTRY_FOOT_H);
    const beamW = layout.legXs[1] - layout.legXs[0];
    const boomLen = layout.boomRight - layout.boomLeft;
    const res: Resources = { textures: [], materials: [] };
    const h = girderTexture(false);
    const v = girderTexture(true);
    res.textures.push(h, v);
    const house = steelPanel(256, 112, { base: "#b9b2a0", light: "#d8d1bd", shade: "#817a69" }, true);
    const bogie = steelPanel(128, 40, DARK_STEEL, true);
    res.textures.push(house, bogie);
    const basic = (map: THREE.Texture) => {
      const m = new THREE.MeshBasicMaterial({ map, toneMapped: false });
      res.materials.push(m);
      return m;
    };
    const flat = (color: string) => {
      const m = new THREE.MeshBasicMaterial({ color, toneMapped: false });
      res.materials.push(m);
      return m;
    };
    return {
      res,
      leg: girder(res, v, legH, 0.8, true),
      beam: girder(res, h, beamW, 0.55, false),
      boom: girder(res, h, boomLen, 0.75, false),
      armL: girder(res, v, armLen(layout.legXs[0]), 0.34, true),
      armR: girder(res, v, armLen(layout.legXs[1]), 0.34, true),
      stay: flat(STEEL.shade),
      head: girder(res, h, 1.6, 0.6, false),
      house: basic(house),
      bogie: basic(bogie),
      lampRing: flat(INK),
    };
  }, [layout]);

  useEffect(() => () => {
    mats.res.textures.forEach((t) => t.dispose());
    mats.res.materials.forEach((m) => m.dispose());
  }, [mats]);

  return (
    <group>
      {legXs.map((x) => (
        <group key={x}>
          <mesh position={[x, (legFootY + boomY) / 2, legZ]} material={mats.leg}>
            <boxGeometry args={[0.8, legH, 0.8]} />
            <Outlines thickness={OUTLINE_THIN} color={INK} />
          </mesh>
          {/* Cabezal que une la pata con la pluma: mismo canto que la viga
              (0.75) para no asomar por encima — por ahí pasa el carro. */}
          <mesh position={[x, boomY, (legZ - 0.6) / 2]} material={mats.head}>
            <boxGeometry args={[0.9, 0.75, Math.abs(legZ) + 0.6]} />
            <Outlines thickness={OUTLINE_THIN} color={INK} />
          </mesh>
        </group>
      ))}

      <PaintedGantryBogies
        legXs={legXs}
        legZ={legZ}
        quayTopY={quayTopY}
        steel={mats.bogie}
        wheelsRef={wheelsRef}
      />

      <mesh position={[(legXs[0] + legXs[1]) / 2, 0.8, legZ]} material={mats.beam}>
        <boxGeometry args={[beamW, 0.55, 0.55]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>

      {/* Pluma */}
      <mesh position={[(boomLeft + boomRight) / 2, boomY, -0.6]} material={mats.boom}>
        <boxGeometry args={[boomLen, 0.75, 1]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>

      {/*
        A-frame y tirantes en z = -1.35, DETRÁS de la pluma (que llega a z = -1.1):
        el carro va ahora encima de la viga y con los tirantes a z = -0.6 los
        atravesaba al acercarse a la punta (allí el tirante baja hasta y = 4.9).
        Desde la cámara (z = 28) el desplazamiento es inapreciable y el arranque
        de los brazos queda oculto tras la viga, como si salieran de ella.
      */}
      <Bar from={[legXs[0], boomY]} to={apex} z={-1.35} thickness={0.34} material={mats.armL} />
      <Bar from={[legXs[1], boomY]} to={apex} z={-1.35} thickness={0.34} material={mats.armR} />
      <Bar from={apex} to={[boomRight - 0.5, boomY + 0.3]} z={-1.35} thickness={0.12} material={mats.stay} />
      <Bar from={apex} to={[boomLeft + 0.5, boomY + 0.3]} z={-1.35} thickness={0.12} material={mats.stay} />
      <mesh position={[apex[0], apex[1], -1.35]} material={mats.head}>
        <boxGeometry args={[0.8, 0.6, 0.6]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>

      {/* Sala de máquinas: en el lado tierra de la viga, detrás del carril del
          carro — si no, el carro se le metía dentro en su tope izquierdo. */}
      <mesh position={[boomLeft + 2.2, boomY + 1.2, -1.8]} material={mats.house}>
        <boxGeometry args={[3.4, 1.5, 1.4]} />
        <Outlines thickness={OUTLINE_THIN} color={INK} />
      </mesh>

      <Beacons xs={beacons} y={boomY - 0.5} ring={mats.lampRing} />
    </group>
  );
}

// Apagada = bombilla verde oscura, encendida = verde claro. Sin halo: cambio sutil.
const LAMP_OFF = new THREE.Color("#4d6a2a");
const LAMP_ON = new THREE.Color("#b6f06a");

/** Balizas con secuencias (una a una, juntas, alternas…) — ver `beacon-patterns.ts`. Solo cambia la bombilla, sin halo. */
function Beacons({ xs, y, ring }: { xs: number[]; y: number; ring: THREE.Material }) {
  const bulbs = useMemo(
    () => xs.map(() => new THREE.MeshBasicMaterial({ color: LAMP_OFF.clone(), toneMapped: false })),
    [xs],
  );
  useEffect(() => () => bulbs.forEach((m) => m.dispose()), [bulbs]);

  const last = useRef(-1);
  useFrame((state) => {
    const { pattern, local } = patternAt(state.clock.elapsedTime);
    // Los patrones van a saltos de ~0.1 s: no hace falta recalcular a 60 Hz.
    const tick = Math.floor(state.clock.elapsedTime * 30);
    if (tick === last.current) return;
    last.current = tick;
    for (let i = 0; i < xs.length; i++) {
      const k = beaconLevel(pattern, local, i, xs.length);
      bulbs[i].color.copy(LAMP_OFF).lerp(LAMP_ON, k);
    }
  });

  return (
    <>
      {xs.map((x, i) => (
        // z = -0.85: pegadas al bajo de la viga y por detrás de la cabina del
        // gruista, que ahora pasa justo por ahí.
        <group key={x} position={[x, y, -0.85]}>
          <mesh material={ring}>
            <sphereGeometry args={[0.2, 12, 8]} />
          </mesh>
          <mesh position={[0, -0.02, 0.1]} material={bulbs[i]}>
            <sphereGeometry args={[0.15, 12, 8]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

export const PAINTED_CABLE_COLOR = INK;
