"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { QUAY_TOP_Y } from "./crane-logic";
import { LABEL_FONT, loadLabelFont } from "./container-textures";

/**
 * Señalética pintada en el suelo del muelle, estilo plataforma de aeropuerto:
 * pintura hueso gruesa y gastada, con calvas y el hormigón asomando.
 *
 * Dos capas, cada una un plano tumbado sobre la losa (y = QUAY_TOP_Y + 0.012):
 *
 * 1. ZONAS — dos rectángulos con línea discontinua que abarcan las TRES filas
 *    en profundidad (z de -4.6 a 9) y reparten el muelle en columnas: la de
 *    proyectos y la de atención al cliente. Su rótulo va en la franja de
 *    asfalto que queda delante de la fila delantera (z 4.2 … 8.2): a la altura
 *    de las filas el escorzo es tal que una letra mediría 7 px; ahí delante
 *    ya se lee. `port-containers.ts` reparte los contenedores por zona.
 * 2. "PUERTO DE VIGO" — pegado al borde inferior de pantalla (z 15 … 18), a
 *    la izquierda del mando, como el nombre pintado en la cabecera de pista.
 *
 * La cámara (y = -3, z = 28) ve el suelo muy escorzado, así que las letras
 * van MUY alargadas en z (cap de 3-4 unidades para 0.3-0.4 de ancho): vistas
 * desde la cámara recuperan una proporción normal, igual que en las pistas.
 *
 * Texturas de canvas, 0 assets de red; fuente = la misma Space Grotesk local
 * de los contenedores (`loadLabelFont`), fuera del `<Suspense>` del hero: hasta que
 * llega, los planos son transparentes.
 */

const PX = 112;
const PAINT = "240,232,214";
const LINE_W = 0.22;
const DASH = 0.9;
const GAP = 0.5;

interface Zone {
  x0: number;
  x1: number;
  label: string;
}

/** Columnas del muelle. Los x deben casar con el reparto de `port-containers.ts`. */
export const QUAY_ZONES: readonly Zone[] = [
  { x0: -13.0, x1: -4.6, label: "TRABAJOS REALIZADOS" },
  { x0: -4.2, x1: 4.3, label: "ATENCIÓN AL CLIENTE" },
];
const ZONE_Z0 = -4.6;
const ZONE_Z1 = 8.6;
// Medido sobre captura (viewport 16:10): a d ≈ 22 una unidad en z ocupa unos
// 22 px de alto y una en x unos 81 px de ancho. Letra de 0,39 de ancho → cap
// de 1,8 en z para proporción normal (≈ 40 × 32 px).
const ZONE_LABEL_Z0 = 4.4;
const ZONE_LABEL_Z1 = 6.2;
/** Margen izquierdo mayor: el borde de pantalla se come x < -12,3 a esa profundidad. */
const ZONE_LABEL_PAD_L = 1.0;
const ZONE_LABEL_PAD_R = 0.45;

/** Plano de zonas: cubre las dos columnas con un margen. */
const ZONES_X0 = -13.5;
const ZONES_X1 = 4.8;
const ZONES_Z0 = -5.0;
const ZONES_Z1 = 9.5;

const PORT_TEXT = "PUERTO DE VIGO";
// El borde INFERIOR de pantalla cae en z ≈ 13 (medido): el rótulo va justo
// encima, a la izquierda del mando (que cubre x ∈ [-1.6, 1.6]). La P se sale
// un poco por la izquierda a propósito, como rótulo de pista fuera de plano.
const PORT_X0 = -10.5;
const PORT_X1 = -2.2;
const PORT_Z0 = 9.4;
const PORT_Z1 = 12.2;

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Rótulo que llena el hueco [x0,x1] × [y0,y1] del lienzo (px), estirado en vertical. */
function paintWord(ctx: CanvasRenderingContext2D, text: string, x0: number, x1: number, y0: number, y1: number) {
  const px = 200;
  ctx.font = `700 ${px}px "${LABEL_FONT}"`;
  const cap = ctx.measureText("H").actualBoundingBoxAscent || px * 0.7;
  const measured = ctx.measureText(text).width;
  const sx = (x1 - x0) / measured;
  const sy = (y1 - y0) / cap;
  ctx.save();
  ctx.translate(x0, y1);
  ctx.scale(sx, sy);
  ctx.fillStyle = `rgba(${PAINT},0.94)`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** Calvas, arañazos en la dirección de rodadura y amarilleo: pintura vieja. */
function wear(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const rand = seeded(seed);
  ctx.globalCompositeOperation = "destination-out";
  const n = Math.round((w * h) / 4200);
  for (let i = 0; i < n; i++) {
    const r = 2 + rand() * 9;
    ctx.globalAlpha = 0.2 + rand() * 0.4;
    ctx.beginPath();
    ctx.ellipse(rand() * w, rand() * h, r * (1 + rand()), r * 0.5, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < n / 10; i++) {
    ctx.globalAlpha = 0.2 + rand() * 0.4;
    ctx.fillRect(rand() * w, rand() * h, 40 + rand() * 260, 1 + rand() * 2);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-atop";
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "rgba(214,190,120,0.18)");
  g.addColorStop(0.5, "rgba(214,190,120,0)");
  g.addColorStop(1, "rgba(214,190,120,0.22)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
}

function paintZones(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  const X = (x: number) => (x - ZONES_X0) * PX;
  const Z = (z: number) => (z - ZONES_Z0) * PX;

  ctx.strokeStyle = `rgba(${PAINT},0.9)`;
  ctx.lineWidth = LINE_W * PX;
  ctx.lineCap = "butt";
  ctx.setLineDash([DASH * PX, GAP * PX]);
  for (const zone of QUAY_ZONES) {
    ctx.strokeRect(X(zone.x0), Z(ZONE_Z0), X(zone.x1) - X(zone.x0), Z(ZONE_Z1) - Z(ZONE_Z0));
  }
  ctx.setLineDash([]);

  for (const zone of QUAY_ZONES) {
    paintWord(ctx, zone.label, X(zone.x0 + ZONE_LABEL_PAD_L), X(zone.x1 - ZONE_LABEL_PAD_R), Z(ZONE_LABEL_Z0), Z(ZONE_LABEL_Z1));
  }
  wear(ctx, w, h, 4121);
}

function paintPort(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  paintWord(ctx, PORT_TEXT, w * 0.02, w * 0.98, h * 0.06, h * 0.94);
  wear(ctx, w, h, 19860);
}

function useFloorPaint(widthUnits: number, depthUnits: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const { texture, material } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(widthUnits * PX);
    canvas.height = Math.round(depthUnits * PX);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      visible: false,
    });
    return { texture, material };
  }, [widthUnits, depthUnits]);

  useEffect(() => {
    let alive = true;
    loadLabelFont().then((ok) => {
      if (!alive || !ok) return;
      const canvas = texture.image as HTMLCanvasElement;
      draw(canvas.getContext("2d")!, canvas.width, canvas.height);
      texture.needsUpdate = true;
      material.visible = true;
    });
    return () => {
      alive = false;
      texture.dispose();
      material.dispose();
    };
  }, [texture, material, draw]);

  return material;
}

function FloorPlane({ x0, x1, z0, z1, draw }: { x0: number; x1: number; z0: number; z1: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void }) {
  const material = useFloorPaint(x1 - x0, z1 - z0, draw);
  return (
    <mesh
      position={[(x0 + x1) / 2, QUAY_TOP_Y + 0.012, (z0 + z1) / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material}
      renderOrder={1}
    >
      <planeGeometry args={[x1 - x0, z1 - z0]} />
    </mesh>
  );
}

export function QuayLettering() {
  return (
    <>
      <FloorPlane x0={ZONES_X0} x1={ZONES_X1} z0={ZONES_Z0} z1={ZONES_Z1} draw={paintZones} />
      <FloorPlane x0={PORT_X0} x1={PORT_X1} z0={PORT_Z0} z1={PORT_Z1} draw={paintPort} />
    </>
  );
}
