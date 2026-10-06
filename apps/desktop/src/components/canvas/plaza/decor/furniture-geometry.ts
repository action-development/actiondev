import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { merge } from "./decor-kit";

/**
 * Geometría del mobiliario (farola, banco, papelera, jardinera): solo formas,
 * sin materiales ni colocación. `furniture.ts` las reparte en sacos.
 *
 * Criterios comunes:
 * - A ESCALA DE MUÑECO. El muñeco mide ~1 unidad con la cadera en ~0,33 y el
 *   torso en ~0,9: un banco con el asiento a 0,40 y el respaldo a 0,84 era un
 *   trono. Y los muñecos son gordos y redondos, así que las secciones finas
 *   con aristas vivas desentonaban: todo lleva bisel o radio y las secciones
 *   van ~30 % más gruesas.
 * - Revolución (`Lathe`) para lo torneado (fuste, aros, pie), `Extrude` con
 *   bisel para el hierro plano del banco, `Tube` para las volutas.
 * - AO HORNEADA en color de vértice (`shade`): pie, caras inferiores e
 *   interior de la papelera. Sin luz real de relleno, es lo que da contacto.
 */

/** Altura (centro) del vidrio de la farola. */
export const LAMP_LIGHT_Y = 2.6;
/** Semiancho del banco entre ejes de costados. */
export const BENCH_HALF_WIDTH = 0.56;

type P2 = [number, number];

const DEG45 = Math.PI / 4;
const smooth = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Revolución de un perfil [radio, y]. `flat` = caras planas (faroles de 4 lados). */
function lathe(profile: P2[], segments: number, flat = false): THREE.BufferGeometry {
  const g = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  );
  if (!flat) return g;
  const f = g.toNonIndexed();
  g.dispose();
  f.computeVertexNormals();
  return f;
}

/** Perfil cerrado de un aro de sección rectangular achaflanada. Va en sentido
 * antihorario en (r, y): la cara exterior sube, así que las normales de
 * `LatheGeometry` salen hacia fuera del sólido (la interior baja y mira al eje,
 * que es lo que se ve desde la boca). */
function ringProfile(rin: number, rout: number, y0: number, y1: number, c: number): P2[] {
  const pts: P2[] = [
    [rin + c, y0],
    [rout - c, y0],
    [rout, y0 + c],
    [rout, y1 - c],
    [rout - c, y1],
    [rin + c, y1],
    [rin, y1 - c],
    [rin, y0 + c],
  ];
  return [...pts, pts[0]];
}

/** Barra de sección cuadrada `w × d` entre dos puntos (montantes inclinados). */
function bar(a: THREE.Vector3, b: THREE.Vector3, w: number, d = w): THREE.BufferGeometry {
  const dir = new THREE.Vector3().subVectors(b, a);
  const g = new THREE.BoxGeometry(w, dir.length(), d);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()));
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  g.translate(mid.x, mid.y, mid.z);
  return g;
}

/** Caja con las cuatro aristas largas redondeadas. */
function rbox(w: number, h: number, d: number, r: number): THREE.BufferGeometry {
  const radius = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
  return new RoundedBoxGeometry(w, h, d, 2, radius);
}

/**
 * Pinta color de vértice (AO horneada o tinte): `fn` devuelve el factor de
 * luz de cada vértice (posición y normal en el espacio de la pieza). Si ya
 * había color, se multiplica.
 */
function shade(
  g: THREE.BufferGeometry,
  fn: (p: THREE.Vector3, n: THREE.Vector3) => number,
  tint: [number, number, number] = [1, 1, 1],
): THREE.BufferGeometry {
  const pos = g.getAttribute("position");
  const nor = g.getAttribute("normal");
  const prev = g.getAttribute("color");
  const out = new Float32Array(pos.count * 3);
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    if (nor) n.fromBufferAttribute(nor, i);
    const k = fn(p, n);
    for (let c = 0; c < 3; c++) out[i * 3 + c] = k * tint[c] * (prev ? prev.getComponent(i, c) : 1);
  }
  g.setAttribute("color", new THREE.BufferAttribute(out, 3));
  return g;
}

/** AO de las piezas de hierro: oscurece el pie y las caras que miran al suelo. */
function ironAO(footFade: number, floor = 0.55) {
  return (p: THREE.Vector3, n: THREE.Vector3) => {
    const foot = THREE.MathUtils.lerp(floor, 1, smooth(0, footFade, p.y));
    const down = n.y < -0.4 ? 0.7 : 1;
    return foot * down;
  };
}

/* ───────────────────────────── FAROLA ───────────────────────────── */

/**
 * Farola fernandina: basa moldurada, fuste en UN solo `Lathe` (toro de arranque,
 * escocia, éntasis, collarín y capitel), cuatro volutas bajo el farol, armazón
 * con montantes en las ESQUINAS del vidrio (antes iban en el centro de cada
 * cara, y tapaban el vidrio), capucha cóncava facetada y remate.
 */
export function buildLampMetal(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  const shaft: P2[] = [
    [0, 0],
    [0.28, 0],
    [0.28, 0.05],
    [0.26, 0.075],
    [0.26, 0.12],
    [0.2, 0.14],
    [0.2, 0.26],
    [0.225, 0.285],
    [0.225, 0.31],
    [0.17, 0.335],
    [0.13, 0.4],
    [0.112, 0.46],
    // Collarín de arranque.
    [0.138, 0.475],
    [0.144, 0.52],
    [0.138, 0.565],
    [0.112, 0.585],
    // Fuste con éntasis: se ensancha un poco por el tercio inferior.
    [0.116, 0.9],
    [0.106, 1.4],
    [0.094, 1.9],
    [0.09, 2.0],
    // Collarín de remate y capitel (escocia hacia el farol).
    [0.126, 2.03],
    [0.13, 2.08],
    [0.124, 2.12],
    [0.092, 2.145],
    [0.1, 2.19],
    [0.15, 2.255],
    [0.205, 2.3],
    [0.215, 2.325],
    [0, 2.325],
  ];
  parts.push(lathe(shaft, 16));

  // Volutas: una por cara, justo bajo el vidrio. Curva en el plano (eje, y).
  const curl = new THREE.CatmullRomCurve3(
    [
      [0.13, 2.18],
      [0.23, 2.13],
      [0.325, 2.15],
      [0.36, 2.215],
      [0.33, 2.275],
      [0.275, 2.265],
      [0.275, 2.22],
    ].map(([d, y]) => new THREE.Vector3(d, y, 0)),
  );
  for (let k = 0; k < 4; k++) {
    const t = new THREE.TubeGeometry(curl, 18, 0.017, 6, false);
    t.rotateY((k * Math.PI) / 2);
    parts.push(t);
  }

  // Armazón del farol (de ancho creciente: la capucha vuela sobre el vidrio).
  const GLASS = { y0: 2.375, y1: 2.855, rBot: 0.19, rTop: 0.27 };
  const lower = new THREE.CylinderGeometry(0.255, 0.24, 0.05, 4);
  lower.rotateY(DEG45);
  lower.translate(0, 2.35, 0);
  parts.push(lower);
  const upper = new THREE.CylinderGeometry(0.325, 0.3, 0.05, 4);
  upper.rotateY(DEG45);
  upper.translate(0, 2.88, 0);
  parts.push(upper);
  // Cuatro montantes en las esquinas (diagonales), siguiendo la inclinación
  // del vidrio y asomando medio montante por fuera de él.
  const post = 0.034;
  for (let k = 0; k < 4; k++) {
    const a = DEG45 + (k * Math.PI) / 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const rb = GLASS.rBot + post * 0.4;
    const rt = GLASS.rTop + post * 0.4;
    parts.push(
      bar(new THREE.Vector3(c * rb, GLASS.y0 - 0.01, s * rb), new THREE.Vector3(c * rt, GLASS.y1 + 0.01, s * rt), post),
    );
  }

  // Capucha cóncava de cuatro caras (flat) + moldura y remate torneado.
  const hood = lathe(
    [
      [0.3, 2.905],
      [0.262, 2.955],
      [0.2, 3.02],
      [0.135, 3.095],
      [0.082, 3.17],
      [0.05, 3.235],
    ],
    4,
    true,
  );
  hood.rotateY(DEG45);
  parts.push(hood);
  parts.push(
    lathe(
      [
        [0, 3.225],
        [0.07, 3.23],
        [0.058, 3.26],
        [0.075, 3.3],
        [0.07, 3.34],
        [0.04, 3.37],
        [0.012, 3.44],
        [0, 3.46],
      ],
      10,
    ),
  );

  // AO: pie oscuro + caras inferiores (bajo la capucha y el armazón).
  return shade(merge(parts, "lampMetal"), ironAO(0.45));
}

/** Prisma del vidrio (sin tapas: las cubre el armazón), de ancho creciente. */
export function buildLampGlass(): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(0.27, 0.19, 0.48, 4, 1, true);
  g.rotateY(DEG45);
  g.translate(0, LAMP_LIGHT_Y - 0.005, 0);
  return g;
}

/** Vidrio ENCENDIDO: la envoltura se aclara hacia el centro (donde está el
 * núcleo) y se apaga hacia los marcos. Color de vértice sobre MeshBasic. */
export function buildLampGlassLit(): THREE.BufferGeometry {
  return shade(buildLampGlass(), (p) => {
    const t = Math.abs((p.y - (LAMP_LIGHT_Y - 0.005)) / 0.24);
    return 0.5 + 0.5 * (1 - Math.pow(t, 1.6));
  });
}

/** Núcleo incandescente del farol: lo único que satura a blanco. */
export function buildLampCore(): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(0.1, 14, 10);
  g.scale(1, 1.75, 1);
  g.translate(0, LAMP_LIGHT_Y, 0);
  return g;
}

/* ───────────────────────────── BANCO ───────────────────────────── */

/** Medidas del banco (mira a +Z; el respaldo queda en -Z). Asiento a 0,345,
 * fondo ~0,38 y respaldo a 0,68: a escala del muñeco (cadera ~0,33). */
const BENCH = {
  seatSlatZ: [0.14, 0.04, -0.06, -0.16],
  seatSlatDepth: 0.08,
  seatY: 0.3275, // centro del listón: apoya en el larguero (0,31) y sube 0,035
  /** Inclinación del respaldo (rad): sigue la pata trasera. */
  tilt: 0.124,
  backSlatY: [0.455, 0.55, 0.645],
  backSlatHeight: 0.085,
  /** Pata trasera: centro z en y=0 y pendiente en z por unidad de y. */
  legZ0: -0.22,
  legSlope: -0.125,
} as const;

/** Veta: coordenadas de textura en METROS del listón (la veta corre en U) más
 * un desplazamiento por listón, para que no se repita el mismo dibujo. */
function woodUV(g: THREE.BufferGeometry, seed: number): void {
  const pos = g.getAttribute("position");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) * 0.7 + seed * 0.37;
    uv[i * 2 + 1] = (pos.getY(i) + pos.getZ(i)) * 4 + seed * 0.61;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

/** Tinte por listón: ±7 % de luz y un punto de matiz cálido/frío. */
function slatTint(i: number): [number, number, number] {
  const k = Math.sin(i * 12.9898) * 43758.5453;
  const r = k - Math.floor(k);
  const v = 0.93 + r * 0.14;
  return [v * (1 + (r - 0.5) * 0.06), v, v * (1 - (r - 0.5) * 0.08)];
}

/** Banco: listones de asiento y respaldo (madera con veta y tinte propio). */
export function buildBenchWood(): THREE.BufferGeometry {
  const w = BENCH_HALF_WIDTH * 2 - 0.02;
  const parts: THREE.BufferGeometry[] = [];
  let n = 0;
  const slat = (g: THREE.BufferGeometry, seed: number) => {
    woodUV(g, seed);
    // Sombra bajo el listón: la cara inferior apenas recibe luz.
    shade(g, (_p, nn) => (nn.y < -0.4 ? 0.62 : 1), slatTint(seed));
    return g;
  };
  for (const z of BENCH.seatSlatZ) {
    const g = slat(rbox(w, 0.035, BENCH.seatSlatDepth, 0.012), n++);
    g.translate(0, BENCH.seatY, z);
    parts.push(g);
  }
  for (const y of BENCH.backSlatY) {
    // Apoyado en la cara delantera de la pata trasera (que ya va inclinada).
    const z = BENCH.legZ0 + BENCH.legSlope * y + 0.03 + 0.0175;
    const g = slat(rbox(w, BENCH.backSlatHeight, 0.035, 0.012), n++);
    g.rotateX(-BENCH.tilt);
    g.translate(0, y, z);
    parts.push(g);
  }
  return merge(parts, "benchWood");
}

/** Placa de hierro extruida desde un contorno en (z, y) del banco, con bisel.
 * Se gira para que la extrusión corra a lo largo de X y se centra en `x`. */
function plate(points: P2[], x: number, thick: number): THREE.BufferGeometry {
  const bevel = 0.008;
  const shape = new THREE.Shape(points.map(([z, y]) => new THREE.Vector2(z, y)));
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: thick - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
    curveSegments: 6,
  });
  // Extrusión centrada y girada: x_forma → z_banco, z_forma → -x_banco.
  g.translate(0, 0, -(thick - 2 * bevel) / 2);
  g.rotateY(-Math.PI / 2);
  g.translate(x, 0, 0);
  return g;
}

/**
 * Banco: costados de hierro fundido (patas, larguero, brazo y patín, todo
 * extruido con bisel), travesaños entre costados y remates en bola.
 *
 * Las patas ahora ARRANCAN en el patín y los listones apoyan en el larguero:
 * antes flotaban 5 cm por encima de las patas y el "travesaño" del comentario
 * no existía.
 */
export function buildBenchMetal(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const T = 0.05;
  const backTopZ = BENCH.legZ0 + BENCH.legSlope * 0.68;
  for (const x of [-BENCH_HALF_WIDTH, BENCH_HALF_WIDTH]) {
    // Patín.
    parts.push(
      plate(
        [
          [-0.31, 0],
          [0.255, 0],
          [0.255, 0.032],
          [-0.31, 0.032],
        ],
        x,
        0.08,
      ),
    );
    // Pata delantera: sube hasta el brazo y se estrecha.
    parts.push(
      plate(
        [
          [0.15, 0.02],
          [0.225, 0.02],
          [0.195, 0.5],
          [0.15, 0.5],
        ],
        x,
        T,
      ),
    );
    // Pata trasera inclinada: sostiene el respaldo.
    parts.push(
      plate(
        [
          [BENCH.legZ0 - 0.03, 0.02],
          [BENCH.legZ0 + 0.03, 0.02],
          [backTopZ + 0.03, 0.68],
          [backTopZ - 0.03, 0.68],
        ],
        x,
        T,
      ),
    );
    // Larguero del asiento.
    parts.push(
      plate(
        [
          [-0.235, 0.255],
          [0.195, 0.255],
          [0.195, 0.31],
          [-0.235, 0.31],
        ],
        x,
        0.045,
      ),
    );
    // Brazo.
    parts.push(
      plate(
        [
          [-0.31, 0.465],
          [0.225, 0.465],
          [0.225, 0.515],
          [-0.31, 0.515],
        ],
        x,
        0.048,
      ),
    );
    // Remate delantero del brazo y bola de la pata trasera.
    const knob = new THREE.SphereGeometry(0.052, 12, 10);
    knob.scale(0.9, 0.9, 1.2);
    knob.translate(x, 0.49, 0.235);
    parts.push(knob);
    const ball = new THREE.SphereGeometry(0.042, 10, 8);
    ball.translate(x, 0.7, backTopZ);
    parts.push(ball);
  }
  // Travesaños: uno bajo el asiento y otro entre las patas traseras.
  const rod = (y: number, z: number) => {
    const g = new THREE.CylinderGeometry(0.018, 0.018, BENCH_HALF_WIDTH * 2, 8);
    g.rotateZ(Math.PI / 2);
    g.translate(0, y, z);
    return g;
  };
  parts.push(rod(0.235, 0.02));
  parts.push(rod(0.22, BENCH.legZ0 + BENCH.legSlope * 0.22));
  return shade(merge(parts, "benchMetal"), ironAO(0.18, 0.6));
}

/* ───────────────────────────── PAPELERA ───────────────────────────── */

/**
 * Papelera de duelas: 14 listones PLANOS girados (cada uno es una cara tangente
 * al cesto, con su conicidad), aros torneados de perfil CERRADO (el abierto
 * desaparecía visto desde arriba), forro interior oscuro y pie torneado.
 */
export function buildBin(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const Y0 = 0.225;
  const Y1 = 0.585;
  const R0 = 0.168;
  const R1 = 0.212;
  const H = Y1 - Y0;

  // Pie torneado, con el fondo del cesto incluido.
  parts.push(
    lathe(
      [
        [0, 0],
        [0.19, 0],
        [0.19, 0.035],
        [0.14, 0.06],
        [0.075, 0.1],
        [0.07, 0.15],
        [0.105, 0.185],
        [0.172, 0.205],
        [0.172, 0.228],
        [0, 0.228],
      ],
      18,
    ),
  );

  // Duelas: caja plana, inclinada por la conicidad y llevada a su radio medio.
  const SLATS = 14;
  const taper = Math.atan((R1 - R0) / H);
  const rMid = (R0 + R1) / 2;
  for (let i = 0; i < SLATS; i++) {
    const g = new THREE.BoxGeometry(0.06, H + 0.02, 0.024);
    g.rotateX(taper);
    g.translate(0, (Y0 + Y1) / 2, rMid);
    g.rotateY((i / SLATS) * Math.PI * 2);
    parts.push(g);
  }

  // Aros: boca ancha, uno medio y otro de base (sobresalen de las duelas).
  parts.push(lathe(ringProfile(R1 - 0.03, R1 + 0.032, Y1 - 0.045, Y1 + 0.012, 0.012), 22));
  parts.push(lathe(ringProfile(rMid - 0.026, rMid + 0.02, 0.385, 0.415, 0.008), 22));
  parts.push(lathe(ringProfile(R0 - 0.026, R0 + 0.022, Y0 - 0.01, Y0 + 0.032, 0.01), 22));

  const body = merge(parts, "binMetal");
  shade(body, ironAO(0.2, 0.6));

  // Forro: troncocónico oscuro tras las duelas; su tapa, un poco por debajo de
  // la boca, se lee como el hueco de la papelera.
  const liner = new THREE.CylinderGeometry(R1 - 0.018, R0 - 0.014, 0.3, 18);
  liner.translate(0, 0.39, 0);
  shade(liner, () => 0.16);
  return merge([body, liner], "bin");
}

/* ───────────────────────────── JARDINERA ───────────────────────────── */

/** Jardinera de piedra: zócalo, cuerpo con paños rehundidos y cornisa, todo con
 * bisel. Los escalones la separan de una caja gris y los paños dan sombra. */
export function buildPlanter(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const add = (g: THREE.BufferGeometry, y: number) => {
    g.translate(0, y, 0);
    parts.push(g);
  };
  add(rbox(0.98, 0.07, 0.66, 0.02), 0.035);
  add(rbox(0.9, 0.26, 0.58, 0.028), 0.2);
  add(rbox(1.02, 0.09, 0.7, 0.026), 0.375);
  // Paños en los frentes largos y en las testas, ligeramente en relieve.
  for (const s of [-1, 1]) {
    const f = rbox(0.62, 0.15, 0.03, 0.012);
    f.translate(0, 0.2, s * 0.295);
    parts.push(f);
    const e = rbox(0.03, 0.15, 0.34, 0.012);
    e.translate(s * 0.455, 0.2, 0);
    parts.push(e);
  }
  // Zócalo y bajos más oscuros (suciedad/humedad), cornisa y paños limpios.
  return shade(merge(parts, "planter"), (p, n) => {
    const dirt = THREE.MathUtils.lerp(0.72, 1, smooth(0, 0.16, p.y));
    return dirt * (n.y < -0.4 ? 0.7 : 1);
  });
}
