import * as THREE from "three";

/**
 * Texturas de contenedor "pintadas a mano" — mismo lenguaje que el fondo
 * generado: chapa ondulada con tinta, color de marca sobrio y puertas con
 * barras de cierre y el logo de Action grafiteado. Contenedores EN BUEN ESTADO: nada de óxido (decisión de
 * marca — tiene que transmitir profesionalidad, no abandono).
 *
 * Todo con canvas 2D en cliente (0 bytes de red). Aleatoriedad con semilla por
 * id: el mismo contenedor sale igual en cada visita.
 */

const INK = "#1a1410";
const PX_PER_UNIT = 128;
const FACE_H = 192;

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Color de marca sobrio: algo menos saturado para casar con el dibujo, sin envejecer. */
function weather(hex: string) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s * 0.85, Math.min(hsl.l, 0.55));
  return c;
}

function shade(c: THREE.Color, amount: number) {
  return c.clone().offsetHSL(0, 0, amount).getStyle();
}

function grime(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, h * 0.55, 0, h);
  g.addColorStop(0, "rgba(40,28,20,0)");
  g.addColorStop(1, "rgba(40,28,20,0.18)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function inkFrame(ctx: CanvasRenderingContext2D, w: number, h: number, base: THREE.Color) {
  // Carriles superior/inferior y postes de esquina
  ctx.fillStyle = shade(base, -0.16);
  ctx.fillRect(0, 0, w, 12);
  ctx.fillRect(0, h - 14, w, 14);
  ctx.fillRect(0, 0, 10, h);
  ctx.fillRect(w - 10, 0, 10, h);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 12); ctx.lineTo(w, 12);
  ctx.moveTo(0, h - 14); ctx.lineTo(w, h - 14);
  ctx.moveTo(10, 0); ctx.lineTo(10, h);
  ctx.moveTo(w - 10, 0); ctx.lineTo(w - 10, h);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, w, h);
}

function finish(canvas: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* ---------------------------------------------------------------------------
 * Rotulación de naviera
 * -------------------------------------------------------------------------*/

export const LABEL_FONT = "PortStencil";
const LABEL_FONT_URL = "/fonts/SpaceGrotesk-Bold-subset.ttf";
/** Tinta negra de la rotulación. */
const LABEL_INK = "rgba(26,20,16,0.92)";
/** Alternativa clara: mismo hueso que el código BIC, para bases muy oscuras. */
const LABEL_BONE = "rgba(240,232,214,0.92)";
/** Altura de mayúscula respecto a la cara del costado. */
const LABEL_CAP = 0.78;
/** Margen lateral libre a cada lado. */
const LABEL_MARGIN = 0.08;
const LABEL_SX_MIN = 0.55;
const LABEL_SX_MAX = 1.35;

let labelFontPromise: Promise<boolean> | null = null;

/**
 * Fuente local de la rotulación (subset Latin-1 de Space Grotesk Bold,
 * ~15 KB, misma tipografía que el resto del sitio). Se registra UNA vez por
 * sesión con la FontFace API y se comparte entre contenedores: es un fichero
 * de `public/`, vive fuera del `<Suspense>` del hero y nunca retrasa la
 * pantalla de carga. Hasta que resuelve, el costado se pinta SIN letras y se
 * repinta al llegar.
 */
export function loadLabelFont() {
  if (labelFontPromise) return labelFontPromise;
  if (typeof document === "undefined" || typeof FontFace === "undefined") {
    labelFontPromise = Promise.resolve(false);
    return labelFontPromise;
  }
  const face = new FontFace(LABEL_FONT, `url(${LABEL_FONT_URL})`, { weight: "700" });
  labelFontPromise = face
    .load()
    .then((loaded) => {
      document.fonts.add(loaded);
      return true;
    })
    .catch(() => false);
  return labelFontPromise;
}

/** Luminancia relativa (WCAG) del color ya envejecido. */
function luminance(c: THREE.Color) {
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

/**
 * Rótulo pintado sobre la chapa, al estilo de las navieras (MAERSK, EVERGREEN):
 * mayúsculas gordas a TODA la altura del costado, escaladas EN HORIZONTAL para
 * que la palabra llene el largo del contenedor menos los márgenes.
 *
 * Regla de tamaño:
 *  1. cuerpo tal que la altura de mayúscula sea el 78 % de la cara (medida real
 *     con `actualBoundingBoxAscent`, no estimada);
 *  2. `sx = disponible / medido`, recortado a [0.55, 1.35];
 *  3. si al recortar la palabra queda MÁS ESTRECHA que el hueco, se centra;
 *  4. si aun con 0.55 se sale, se reduce el cuerpo hasta que entre.
 *
 * Color: tinta negra SIEMPRE, salvo que la luminancia relativa de la base
 * envejecida sea < 0,12 — ahí el negro no leería y se pinta en hueso
 * (rgba(240,232,214)), el mismo del código BIC.
 */
function paintLabel(ctx: CanvasRenderingContext2D, w: number, h: number, base: THREE.Color, label: string) {
  const text = label.toUpperCase();
  const available = w * (1 - LABEL_MARGIN * 2);
  if (available <= 0 || !text) return;

  const setFont = (px: number) => { ctx.font = `700 ${px}px "${LABEL_FONT}", sans-serif`; };
  const capOf = (px: number) => {
    const m = ctx.measureText("H");
    return m.actualBoundingBoxAscent || px * 0.7;
  };

  const targetCap = h * LABEL_CAP;
  // Dos pasadas: la primera estima el cuerpo, la segunda lo corrige con la
  // altura de mayúscula REAL de la fuente ya cargada.
  let px = targetCap / 0.7;
  setFont(px);
  px = (px * targetCap) / capOf(px);
  setFont(px);

  let measured = ctx.measureText(text).width;
  let sx = available / measured;
  if (sx > LABEL_SX_MAX) sx = LABEL_SX_MAX;
  if (sx < LABEL_SX_MIN) {
    // Ni con el estrechado máximo entra: se baja el cuerpo, no se aprieta más.
    px *= available / (LABEL_SX_MIN * measured);
    setFont(px);
    measured = ctx.measureText(text).width;
    sx = Math.min(LABEL_SX_MAX, available / measured);
  }

  const cap = capOf(px);
  const baseline = h / 2 + cap / 2;
  const top = baseline - cap;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = luminance(base) < 0.12 ? LABEL_BONE : LABEL_INK;
  ctx.translate(w / 2, baseline);
  ctx.scale(sx, 1);
  ctx.fillText(text, 0, 0);
  ctx.restore();

  // Puentes de plantilla: dos franjas finas del color de la chapa que cortan
  // las letras, como en la pintura con estarcido.
  ctx.fillStyle = base.getStyle();
  for (const f of [0.3, 0.62]) ctx.fillRect(0, Math.round(top + cap * f), w, 2);
}

/**
 * Costado largo: nervios verticales entintados. Con `label` pinta además la
 * rotulación de naviera; el rótulo va DEBAJO de nervios y suciedad (los nervios
 * se bajan de opacidad para que las letras asomen) para que parezca pintura
 * sobre la chapa y no una pegatina.
 */
function drawSide(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  base: THREE.Color,
  seed: string,
  label: string | undefined,
  fontReady: boolean,
) {
  const rand = rng(seed);

  ctx.globalAlpha = 1;
  ctx.fillStyle = base.getStyle();
  ctx.fillRect(0, 0, w, h);

  if (label && fontReady) paintLabel(ctx, w, h, base, label);

  // Con rótulo, los nervios pasan por ENCIMA a media opacidad: desgastan las
  // letras y siguen leyéndose los dos.
  ctx.globalAlpha = label && fontReady ? 0.55 : 1;
  const rib = 30;
  for (let x = 14; x < w - 14; x += rib) {
    ctx.fillStyle = shade(base, 0.07);
    ctx.fillRect(x, 12, 11, h - 26);
    ctx.fillStyle = shade(base, -0.12);
    ctx.fillRect(x + 11, 12, 6, h - 26);
    ctx.fillStyle = "rgba(26,20,16,0.55)";
    ctx.fillRect(x + 17, 12, 1.5, h - 26);
  }
  ctx.globalAlpha = 1;

  grime(ctx, w, h);

  // Marcas de estarcido (código BIC): pequeño y arriba a la derecha, pegado al
  // carril, para no pelearse con la rotulación.
  ctx.fillStyle = "rgba(240,232,214,0.5)";
  ctx.font = "bold 9px monospace";
  const code = `ACTU ${String(Math.floor(rand() * 900000 + 100000))} ${Math.floor(rand() * 9)}`;
  ctx.fillText(code, w - 16 - ctx.measureText(code).width, 24);

  inkFrame(ctx, w, h, base);
}

/**
 * Costado. Se pinta ya sin letras (síncrono) y se repinta cuando la fuente
 * local está registrada; `cancel` evita tocar una textura ya liberada — mismo
 * patrón que `doorTexture` con la máscara del logo.
 */
function sideTexture(base: THREE.Color, lengthUnits: number, seed: string, label?: string) {
  const w = Math.round(lengthUnits * PX_PER_UNIT);
  const h = FACE_H;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  drawSide(ctx, w, h, base, seed, label, false);
  const texture = finish(c);

  if (!label) return { texture, cancel: () => {} };

  let alive = true;
  loadLabelFont().then((ok) => {
    if (!alive || !ok) return;
    drawSide(ctx, w, h, base, seed, label, true);
    texture.needsUpdate = true;
  });

  return { texture, cancel: () => { alive = false; } };
}

const LOGO_URL = "/logos/action_globe.webp";
const LOGO_INK = "#0e0c0a";

let logoMaskPromise: Promise<HTMLCanvasElement | null> | null = null;

/**
 * Logo (globo "a.") como máscara negra recortada: la imagen viene sobre fondo
 * blanco, así que la luminancia pasa a alfa y se recorta al bounding box del
 * trazo. Se carga UNA vez por sesión y se comparte entre contenedores. Local
 * y fuera del `<Suspense>` del hero: nunca retrasa la pantalla de carga.
 */
function loadLogoMask() {
  if (logoMaskPromise) return logoMaskPromise;
  logoMaskPromise = new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const size = 256;
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      const im = ctx.getImageData(0, 0, size, size);
      const d = im.data;
      let minX = size, minY = size, maxX = 0, maxY = 0;
      for (let i = 0; i < d.length; i += 4) {
        const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
        const a = Math.round(d[i + 3] * (1 - lum));
        d[i] = 14; d[i + 1] = 12; d[i + 2] = 10; d[i + 3] = a;
        if (a > 40) {
          const x = (i / 4) % size, y = Math.floor(i / 4 / size);
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
      if (maxX <= minX || maxY <= minY) return resolve(null);
      ctx.putImageData(im, 0, 0);
      const out = document.createElement("canvas");
      out.width = maxX - minX + 1;
      out.height = maxY - minY + 1;
      out.getContext("2d")!.drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
      resolve(out);
    };
    img.onerror = () => resolve(null);
    img.src = LOGO_URL;
  });
  return logoMaskPromise;
}

/**
 * Logo grafiteado en el testero: plantilla con overspray, un par de goteos y
 * la chapa asomando por la pintura. Va DEBAJO de las barras de cierre para que
 * parezca pintado sobre la puerta y no pegado encima.
 */
function graffiti(ctx: CanvasRenderingContext2D, s: number, base: THREE.Color, mask: HTMLCanvasElement, rand: () => number) {
  const w = s * 0.56;
  const h = (w * mask.height) / mask.width;
  const cx = s / 2 + (rand() - 0.5) * 6;
  const cy = s * 0.5 + (rand() - 0.5) * 6;
  const rot = (rand() - 0.5) * 0.09;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  // Overspray: la misma máscara desplazada y muy tenue alrededor del trazo
  ctx.globalAlpha = 0.07;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = 2.5 + rand() * 1.5;
    ctx.drawImage(mask, -w / 2 + Math.cos(a) * r, -h / 2 + Math.sin(a) * r, w * 1.02, h * 1.02);
  }
  ctx.globalAlpha = 0.05;
  ctx.drawImage(mask, -w / 2 - 4, -h / 2 - 4, w + 8, h + 8);

  // Trazo principal
  ctx.globalAlpha = 0.9;
  ctx.drawImage(mask, -w / 2, -h / 2, w, h);

  // Goteos desde el borde inferior del trazo
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = LOGO_INK;
  ctx.lineCap = "round";
  const drips = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < drips; i++) {
    const x = -w * 0.42 + rand() * w * 0.84;
    const y0 = h * (0.15 + rand() * 0.35);
    const len = 6 + rand() * 16;
    ctx.lineWidth = 1.5 + rand() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x + (rand() - 0.5) * 2, y0 + len);
    ctx.stroke();
  }

  // Chapa asomando: nervios y desgaste del propio testero atraviesan la pintura
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = shade(base, 0.12);
  for (let i = 0; i < 4; i++) {
    const x = -w / 2 + rand() * w;
    ctx.fillRect(x, -h / 2 - 4, 1 + rand() * 2, h + 8);
  }
  ctx.restore();
}

function drawDoor(ctx: CanvasRenderingContext2D, base: THREE.Color, seed: string, mask: HTMLCanvasElement | null) {
  const s = FACE_H;
  const rand = rng(`${seed}:door`);

  ctx.globalAlpha = 1;
  ctx.fillStyle = shade(base, -0.04);
  ctx.fillRect(0, 0, s, s);

  if (mask) graffiti(ctx, s, base, mask, rand);

  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(s / 2, 12); ctx.lineTo(s / 2, s - 14);
  ctx.stroke();

  for (const x of [s * 0.2, s * 0.38, s * 0.62, s * 0.8]) {
    ctx.fillStyle = shade(base, -0.28);
    ctx.fillRect(x - 3, 16, 6, s - 32);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 3, 16, 6, s - 32);
    // Manilla
    ctx.fillStyle = "#3a332c";
    ctx.fillRect(x - 7, s * 0.55, 14, 7);
  }
  for (const y of [s * 0.18, s * 0.5, s * 0.82]) {
    ctx.fillStyle = INK;
    ctx.fillRect(12, y - 4, 8, 8);
    ctx.fillRect(s - 20, y - 4, 8, 8);
  }

  grime(ctx, s, s);
  inkFrame(ctx, s, s, base);
}

/**
 * Testero con puertas: dos hojas, cuatro barras de cierre, bisagras y el logo
 * grafiteado. Se pinta ya sin logo (síncrono) y se repinta cuando llega la
 * máscara; `cancel` evita tocar una textura ya liberada.
 */
function doorTexture(base: THREE.Color, seed: string) {
  const c = document.createElement("canvas");
  c.width = FACE_H;
  c.height = FACE_H;
  const ctx = c.getContext("2d")!;
  drawDoor(ctx, base, seed, null);
  const texture = finish(c);

  let alive = true;
  loadLogoMask().then((mask) => {
    if (!alive || !mask) return;
    drawDoor(ctx, base, seed, mask);
    texture.needsUpdate = true;
  });

  return { texture, cancel: () => { alive = false; } };
}

function roofTexture(base: THREE.Color) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = shade(base, 0.04);
  ctx.fillRect(0, 0, 128, 64);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 128, 64);
  return finish(c);
}

/**
 * Materiales en el orden de caras de BoxGeometry: +x, -x, +y, -y, +z, -z.
 *
 * La cámara mira al costado +z: ahí va el costado CON rotulación. El -z lleva
 * el mismo costado sin letras (nervios + código BIC), que es lo que se ve al
 * volcar el contenedor. El rótulo depende del idioma, así que `label` forma
 * parte de la identidad de estos materiales: al cambiarlo hay que recrearlos.
 *
 * El llamador es dueño de los recursos: llamar a `dispose()` al desmontar.
 */
export function createContainerMaterials(
  id: string,
  color: string,
  lengthUnits: number,
  gradientMap: THREE.Texture,
  label?: string,
) {
  const base = weather(color);
  const { texture: front, cancel: cancelFront } = sideTexture(base, lengthUnits, id, label);
  const { texture: back } = sideTexture(base, lengthUnits, id);
  const { texture: door, cancel: cancelDoor } = doorTexture(base, id);
  const roof = roofTexture(base);

  const make = (map: THREE.Texture) =>
    new THREE.MeshToonMaterial({ color: "#ffffff", map, gradientMap });

  const doorMat = make(door);
  const frontMat = make(front);
  const backMat = make(back);
  const roofMat = make(roof);
  const materials = [doorMat, doorMat, roofMat, roofMat, frontMat, backMat];

  return {
    materials,
    dispose() {
      cancelFront();
      cancelDoor();
      for (const t of [front, back, door, roof]) t.dispose();
      for (const m of [doorMat, frontMat, backMat, roofMat]) m.dispose();
    },
  };
}
