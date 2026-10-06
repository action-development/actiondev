import * as THREE from "three";
import { registerPlazaDisposer } from "../plaza-textures";

/**
 * Texturas propias del mobiliario (singletons, liberadas con
 * `registerPlazaDisposer`): veta de la madera del banco, reflejo de cielo del
 * vidrio de la farola de día y halo de dos lóbulos de la farola de noche.
 *
 * Las tres son `CanvasTexture` pequeñas: 0 assets de red. En servidor (sin
 * `document`) devuelven una textura blanca de 1 px — el mobiliario se construye
 * en un `useMemo` que también corre en SSR, y ahí no se pinta nada.
 */

function blank(): THREE.Texture {
  const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
}

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.Texture {
  if (typeof document === "undefined") return blank();
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return blank();
  draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** PRNG mínimo y determinista: la veta es la misma en cada carga. */
function lcg(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

let woodTexture: THREE.Texture | null = null;

/**
 * Veta de madera en TONOS DE GRIS casi blancos: el color base y el tinte por
 * listón los ponen `material.color` y el color de vértice, así que la textura
 * solo aporta el dibujo. Las vetas corren a lo largo de U y envuelven
 * (cada onda da un número entero de periodos), de modo que la costura
 * horizontal no se ve aunque el listón mida más que la tesela.
 */
export function getWoodTexture(): THREE.Texture {
  if (woodTexture) return woodTexture;
  woodTexture = canvasTexture(256, 128, (ctx) => {
    const rnd = lcg(1337);
    ctx.fillStyle = "#e9e9e9";
    ctx.fillRect(0, 0, 256, 128);
    // Bandas anchas de tono (anillos de crecimiento vistos de canto).
    for (let i = 0; i < 9; i++) {
      const y = rnd() * 128;
      const h = 6 + rnd() * 16;
      ctx.fillStyle = `rgba(0,0,0,${0.03 + rnd() * 0.05})`;
      ctx.fillRect(0, y, 256, h);
      ctx.fillRect(0, y - 128, 256, h);
    }
    // Vetas finas ondulantes.
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 38; i++) {
      const y = rnd() * 128;
      const amp = 0.8 + rnd() * 2.4;
      const periods = 1 + Math.floor(rnd() * 3);
      const phase = rnd() * Math.PI * 2;
      ctx.strokeStyle = `rgba(60,40,20,${0.1 + rnd() * 0.22})`;
      ctx.beginPath();
      for (let x = 0; x <= 256; x += 8) {
        const yy = y + Math.sin((x / 256) * Math.PI * 2 * periods + phase) * amp;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    // Un par de nudos.
    for (let i = 0; i < 2; i++) {
      const x = 30 + rnd() * 190;
      const y = 20 + rnd() * 88;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
      g.addColorStop(0, "rgba(50,30,12,0.5)");
      g.addColorStop(1, "rgba(50,30,12,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  woodTexture.wrapS = THREE.RepeatWrapping;
  woodTexture.wrapT = THREE.RepeatWrapping;
  registerPlazaDisposer(() => {
    woodTexture?.dispose();
    woodTexture = null;
  });
  return woodTexture;
}

let glassSkyTexture: THREE.Texture | null = null;

/**
 * Vidrio de la farola APAGADA: falso reflejo de cielo. Vidrio oscuro verdoso
 * abajo, cielo claro arriba y una franja diagonal brillante — lo que le da a un
 * cristal "profundidad" sin env map. Opaco a propósito: un vidrio transparente
 * de día es un grupo más que ordenar entre transparentes (el halo, el charco)
 * y deja ver el interior vacío, que se leía como una caja lechosa.
 */
export function getGlassSkyTexture(): THREE.Texture {
  if (glassSkyTexture) return glassSkyTexture;
  glassSkyTexture = canvasTexture(64, 128, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, "#9fb9c6");
    g.addColorStop(0.42, "#5f7a80");
    g.addColorStop(1, "#1d2b2c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 128);
    // Franja diagonal de reflejo.
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(26, 0);
    ctx.lineTo(8, 128);
    ctx.lineTo(0, 128);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(34, 0, 5, 128);
  });
  glassSkyTexture.wrapS = THREE.RepeatWrapping;
  // Una vuelta completa por CARA del prisma (la U del cilindro da la vuelta a
  // las cuatro caras de una vez).
  glassSkyTexture.repeat.set(4, 1);
  registerPlazaDisposer(() => {
    glassSkyTexture?.dispose();
    glassSkyTexture = null;
  });
  return glassSkyTexture;
}

let lampHaloTexture: THREE.Texture | null = null;

/**
 * Halo de la farola encendida, DOS lóbulos en un solo sprite: un corazón
 * pequeño y casi blanco (la bombilla deslumbrando) y un velo ancho y suave
 * (la luz dispersa en el aire). Un único degradado radial plano se leía como
 * una mancha; el codo entre lóbulos es lo que parece resplandor.
 */
export function getLampHaloTexture(): THREE.Texture {
  if (lampHaloTexture) return lampHaloTexture;
  lampHaloTexture = canvasTexture(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.07, "rgba(255,255,255,0.85)");
    g.addColorStop(0.16, "rgba(255,255,255,0.38)");
    g.addColorStop(0.3, "rgba(255,255,255,0.2)");
    g.addColorStop(0.55, "rgba(255,255,255,0.075)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
  registerPlazaDisposer(() => {
    lampHaloTexture?.dispose();
    lampHaloTexture = null;
  });
  return lampHaloTexture;
}
