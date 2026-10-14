/**
 * Intro «empuje»: línea de tiempo y pose de la mascota. Puro (sin DOM ni
 * React): lo pinta `components/intro/PushIntro.tsx` y lo prueban los tests.
 *
 * Réplica de la intro de huyml.co. Tiempos, curvas y medidas salen de su
 * código y están verificados al fotograma contra la grabación en
 * `docs/intro-empuje/ANALISIS.md`. Antes de cambiar un número, mirar allí:
 * la gracia está en ellos (las pausas que caen en el esfuerzo máximo, la
 * cuártica del último tramo, el aviso 0,6 s antes de que baje el panel).
 */

/** La intro ya se vio en esta sesión (declarada en /legal/cookies). */
export const INTRO_SESSION_KEY = "action-loaded";

/** Tiempos de móvil del original: por debajo de este ancho, tramos más largos. */
export const MOBILE_TIMING_MAX_WIDTH = 767;

export type IntroTiming = "pc" | "mobile";

/** GSAP `power2.inOut`. Ojo: en GSAP `powerN` es de grado N+1 → cúbica. */
export function power2InOut(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

/** GSAP `power3.in` → cuártica: arranca muy despacio y acelera al final. */
export function power3In(t: number): number {
  return t ** 4;
}

/**
 * Tras echar la pared, la mascota vuelve de un salto al punto final del logo
 * (s). No está en el original: es el «jeje, estoy aquí» de la marca.
 */
export const ARRIVAL = 0.55;
/** Logo solo en pantalla (ya con la mascota en su punto, guiñando). */
export const FINAL_HOLD = 0.5;
/** Del aviso a lo de debajo hasta que empieza a bajar el panel. */
export const EXIT_DELAY = 0.6;
/** Bajada del panel (y subida del rótulo, que así se queda quieto). */
export const EXIT_DURATION = 1.33;

/** Progreso final mínimo del original: la mascota sale del todo. */
const BASE_FINAL: Record<IntroTiming, number> = { pc: 1.28, mobile: 1.4 };
/** Tope de la pared: ya fuera de pantalla mientras la mascota acaba de salir. */
const WALL_MAX: Record<IntroTiming, number> = { pc: 1.12, mobile: 1.4 };
/** Lo que se ensancha la mascota al aterrizar (`sx` máximo de `mascotPose`). */
const MAX_STRETCH_X = 1.34;

interface Segment {
  from: number;
  to: number;
  start: number;
  end: number;
  ease: (t: number) => number;
}

export interface IntroPlan {
  segments: Segment[];
  /** Fin de la pausa del 60 %: si lo de debajo no está listo, el reloj se para aquí. */
  gate: number;
  /** Fin del empuje: la pared ya está fuera y la mascota vuelve al logo. */
  pushEnd: number;
  /** Fin del empuje + `ARRIVAL` + `FINAL_HOLD`: se avisa a lo de debajo para que arranque. */
  reveal: number;
  exitStart: number;
  end: number;
  wallMax: number;
}

/**
 * Tres empujones con dos pausas: 0 → 0,3 (0,65 s) · 0,16 s · 0,3 → 0,6
 * (0,72 s) · 0,2 s · 0,6 → final (1,46 s, cuártica). En móvil el primero y
 * el último duran 0,3 s más.
 */
export function buildPlan(timing: IntroTiming, final: number): IntroPlan {
  const extra = timing === "mobile" ? 0.3 : 0;
  const stops = [
    { to: 0.3, move: 0.65 + extra, hold: 0.16, ease: power2InOut },
    { to: 0.6, move: 0.72, hold: 0.2, ease: power2InOut },
    { to: final, move: 1.46 + extra, hold: 0, ease: power3In },
  ];
  const segments: Segment[] = [];
  let t = 0;
  let from = 0;
  let gate = 0;
  stops.forEach((s, i) => {
    segments.push({ from, to: s.to, start: t, end: t + s.move, ease: s.ease });
    t += s.move + s.hold;
    from = s.to;
    if (i === 1) gate = t;
  });
  const pushEnd = segments[segments.length - 1].end;
  const reveal = pushEnd + ARRIVAL + FINAL_HOLD;
  const exitStart = reveal + EXIT_DELAY;
  return {
    segments,
    gate,
    pushEnd,
    reveal,
    exitStart,
    end: exitStart + EXIT_DURATION,
    wallMax: WALL_MAX[timing],
  };
}

/** Progreso del empuje (borde de la pared / ancho de pantalla) en el segundo `t`. */
export function progressAt(plan: IntroPlan, t: number): number {
  let p = 0;
  for (const s of plan.segments) {
    if (t < s.start) break;
    p = t >= s.end ? s.to : s.from + (s.to - s.from) * s.ease((t - s.start) / (s.end - s.start));
  }
  return p;
}

/** Bajada del panel, de 0 (cubre) a 1 (fuera por abajo). */
export function exitAt(plan: IntroPlan, t: number): number {
  if (t <= plan.exitStart) return 0;
  return power2InOut(Math.min(1, (t - plan.exitStart) / EXIT_DURATION));
}

/**
 * Porcentaje de carga para lectores de pantalla, por tramos como el contador
 * (oculto) del original: 0–0,3 → 0–30 · 0,3–0,6 → 30–60 · 0,6–final → 60–100.
 */
export function displayPercent(progress: number, final: number): number {
  const p = Math.min(final, Math.max(0, progress));
  if (p <= 0.3) return (p / 0.3) * 30;
  if (p <= 0.6) return 30 + ((p - 0.3) / 0.3) * 30;
  return 60 + ((p - 0.6) / (final - 0.6)) * 40;
}

/**
 * Progreso final: el del original, salvo que la mascota sea más ancha en
 * proporción (pantallas estrechas) y no le diera para salir del todo.
 */
export function finalProgress(timing: IntroTiming, mascotDiameter: number, viewportWidth: number): number {
  const needed = 1 + (MAX_STRETCH_X * mascotDiameter) / Math.max(1, viewportWidth) + 0.01;
  return Math.max(BASE_FINAL[timing], needed);
}

// ── Mascota ─────────────────────────────────────────────────────────────

/**
 * Embestidas por ancho de pantalla en los tramos 2 y 3. Con 10/3 cada una
 * mueve la pared 0,3: las embestidas acaban en p = 0,3 · 0,6 · 0,9 · 1,2 y
 * las dos pausas del original congelan a la mascota estampada contra la
 * pared (como el ×1,08 del Lottie congela al muñeco con la cabeza gacha).
 */
export const PUSHES_PER_WIDTH = 10 / 3;
const STEP = 1 / PUSHES_PER_WIDTH;
/** El primer tramo es solo la carrerilla y el golpe: entra embistiendo. */
const FIRST_CYCLE_FROM = 0.62;

/** Altura del salto y retroceso tras el rebote, en radios. */
export const HOP_HEIGHT = 2.4;
export const BACK_DISTANCE = 3;

/**
 * Fases del ciclo (0 = estampada contra la pared, esfuerzo máximo):
 * suelta y coge impulso → rebota hacia atrás en parábola → aterriza
 * aplastándose → se agacha → carrerilla → se estampa y empuja la pared.
 */
const TAKEOFF = 0.1;
const LAND = 0.52;
const CHARGE = 0.62;
const SLAM = 0.8;

/** Nace una gota de sudor al empujar y vive esta fracción del ciclo. */
const DROP_BORN = 0.86;
const DROP_LIFE = 0.5;
/** Esperando a lo de debajo: una gota cada tanto (s). */
const STALL_DROP_EVERY = 0.7;

export interface DropPose {
  x: number;
  y: number;
  rot: number;
  scale: number;
  opacity: number;
}

export interface MascotPose {
  /** Centro de la bola respecto a su sitio pegada a la pared, en radios (negativo = lejos). */
  x: number;
  /** Altura sobre el suelo, en radios. */
  y: number;
  /** Giro (grados); en los mortales da la vuelta entera. */
  rot: number;
  /** Tamaño de toda la mascota (1 = empujando; menor = ya en el punto del logo). */
  scale: number;
  /** Escala del cuerpo, anclada en el suelo y en `anchor` (1 = cara de la pared, 0 = centro). */
  sx: number;
  sy: number;
  anchor: number;
  /** Aplastamiento contra la pared, en radios. */
  flat: number;
  /** 1 = ojos abiertos (algo más en el aire); ~0,12 = rendija de esfuerzo. */
  eyeOpen: number;
  /** Giro de las rendijas (grados): «\ /» de apretar o de ir a por ello. */
  eyeTilt: number;
  shine: number;
  /** Guiño del ojo derecho: 0 abierto, 1 cerrado. */
  wink: number;
  /** Vena de esfuerzo (💢) en la nuca mientras empuja; pasa de 1 al aparecer y late en la espera. */
  vein: number;
  /** Chispazo del golpe contra la pared (0–1). */
  impact: number;
  /** Líneas de velocidad en la carrerilla (0–1). */
  speed: number;
  /** Polvo del aterrizaje: edad 0–1 y dónde cayó, o `null`. */
  dust: { age: number; x: number } | null;
  /** Sacudida de pantalla tras el golpe, en radios. */
  shake: number;
  /** Sombra de contacto: 1 en el suelo, menor en el aire. */
  shadow: number;
  drop: DropPose;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const frac = (x: number) => x - Math.floor(x);
const easeOutCubic = (t: number) => 1 - (1 - clamp01(t)) ** 3;

/** Interpola claves `[fase, valor]` con suavizado entre cada par (la primera y la última valen lo mismo). */
function keyed(keys: ReadonlyArray<readonly [number, number]>, x: number): number {
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [x1, v1] = keys[i];
    if (x <= x1) {
      const [x0, v0] = keys[i - 1];
      return v0 + (v1 - v0) * smooth(x0, x1, x);
    }
  }
  return keys[keys.length - 1][1];
}

/**
 * Reloj de ciclos para un progreso. El primer tramo (0 → 0,3) solo recorre
 * la carrerilla y el golpe (0,62 → 1): así la mascota entra embistiendo en
 * vez de rebotar fuera de pantalla. Desde 0,3, un ciclo cada `STEP`.
 */
export function cycleAt(progress: number): number {
  if (progress < STEP) return FIRST_CYCLE_FROM + (progress / STEP) * (1 - FIRST_CYCLE_FROM);
  return 1 + (progress - STEP) * PUSHES_PER_WIDTH;
}

/**
 * Borde de la pared (en anchos de pantalla). Solo se mueve cuando la mascota
 * se estampa: de golpe y frenando (ease-out), quieta mientras rebota. En las
 * paradas del original (0,3 y 0,6) cae exactamente donde allí.
 */
export function wallAt(progress: number): number {
  const c = cycleAt(progress);
  const n = Math.floor(c);
  return (n + easeOutCubic((c - n - SLAM) / (1 - SLAM))) * STEP;
}

// Claves de la pose por fase del ciclo.
const SX: ReadonlyArray<readonly [number, number]> = [
  [0, 0.74],
  [0.05, 1.22],
  [TAKEOFF, 0.84],
  [0.31, 1],
  [0.5, 0.86],
  [LAND, 1.34],
  [0.58, 1.12],
  [CHARGE, 1.24],
  [0.71, 1.3],
  [SLAM, 1.22],
  [0.83, 0.72],
  [1, 0.74],
];
const SY: ReadonlyArray<readonly [number, number]> = [
  [0, 1.2],
  [0.05, 0.76],
  [TAKEOFF, 1.24],
  [0.31, 1],
  [0.5, 1.16],
  [LAND, 0.66],
  [0.58, 0.9],
  [CHARGE, 0.76],
  [0.71, 0.8],
  [SLAM, 0.84],
  [0.83, 1.22],
  [1, 1.2],
];
const FLAT: ReadonlyArray<readonly [number, number]> = [
  [0, 0.24],
  [0.06, 0],
  [SLAM, 0],
  [0.83, 0.27],
  [1, 0.24],
];
const ANCHOR: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [0.08, 0],
  [0.78, 0],
  [SLAM, 1],
  [1, 1],
];
const EYE_OPEN: ReadonlyArray<readonly [number, number]> = [
  [0, 0.12],
  [0.07, 1],
  [0.2, 1.18],
  [0.45, 1.18],
  [LAND, 0.45],
  [0.58, 0.9],
  [0.64, 0.62],
  [SLAM, 0.62],
  [0.83, 0.12],
  [1, 0.12],
];
const EYE_TILT: ReadonlyArray<readonly [number, number]> = [
  [0, 22],
  [0.06, 0],
  [0.58, 0],
  [0.64, 18],
  [SLAM, 18],
  [0.83, 22],
  [1, 22],
];
const SHINE: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.08, 1],
  [0.58, 1],
  [0.66, 0.6],
  [SLAM, 0.6],
  [0.82, 0],
  [1, 0],
];
const VEIN: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [0.05, 0],
  [0.82, 0],
  [0.85, 1.3],
  [0.89, 1],
  [1, 1],
];

/**
 * Pose de la mascota para un progreso del empuje. Como el Lottie del
 * original, NO depende del tiempo: avanza con la distancia (cero patinaje y
 * quieta en las pausas). `stall` = segundos esperando en la pausa del 60 %
 * a que cargue lo de debajo: ahí aprieta, tiembla y suda. `wait` (0–1) es
 * cuánto se nota la espera; el componente lo apaga suave al soltarse.
 */
export function mascotPose(progress: number, stall = 0, wait = Math.min(1, stall / 0.3)): MascotPose {
  const c = cycleAt(progress);
  const n = Math.floor(c);
  const phase = c - n;
  // Con la pared ya fuera, el último salto es hacia delante (no vuelve a entrar).
  const dir = n * STEP >= 1 ? 1 : -1;
  const backflip = n % 2 === 1;

  let x = 0;
  let y = 0;
  let rot = 0;
  if (phase >= TAKEOFF && phase < LAND) {
    // Rebote: x lineal, y parabólica → parábola de verdad.
    const u = (phase - TAKEOFF) / (LAND - TAKEOFF);
    x = dir * BACK_DISTANCE * u;
    y = HOP_HEIGHT * 4 * u * (1 - u);
    rot = backflip ? dir * 360 * smooth(0.05, 0.95, u) : 30 * dir * Math.sin(Math.PI * u);
  } else if (phase >= LAND && phase < CHARGE) {
    x = dir * BACK_DISTANCE;
  } else if (phase >= CHARGE && phase < SLAM) {
    // Carrerilla acelerando, inclinada hacia la pared.
    const u = (phase - CHARGE) / (SLAM - CHARGE);
    x = dir * BACK_DISTANCE * (1 - u * u);
    rot = 14 * Math.sin(Math.PI * u);
  }

  const pulse = wait * 0.5 * (1 - Math.cos(stall * Math.PI * 2 * 1.6));
  const tremble = wait * 0.03 * Math.sin(stall * Math.PI * 2 * 17);

  const impact = phase >= SLAM && phase < SLAM + 0.12 ? Math.sin((Math.PI * (phase - SLAM)) / 0.12) : 0;
  const speed = phase >= 0.64 && phase < 0.81 ? Math.sin((Math.PI * (phase - 0.64)) / 0.17) : 0;
  const v = (phase - SLAM) / (1 - SLAM);
  const shake = phase >= SLAM ? 0.14 * Math.sin(Math.PI * 2 * 2.5 * v) * (1 - v) ** 2 : 0;

  return {
    x: x + tremble,
    y,
    rot,
    scale: 1,
    sx: keyed(SX, phase) * (1 + 0.05 * pulse),
    sy: keyed(SY, phase) * (1 - 0.03 * pulse),
    anchor: keyed(ANCHOR, phase),
    flat: keyed(FLAT, phase) * (1 - 0.2 * pulse),
    eyeOpen: keyed(EYE_OPEN, phase),
    eyeTilt: keyed(EYE_TILT, phase),
    shine: keyed(SHINE, phase),
    wink: 0,
    vein: keyed(VEIN, phase) * (1 + 0.22 * pulse),
    impact,
    speed,
    dust: phase >= LAND && phase < SLAM ? { age: (phase - LAND) / (SLAM - LAND), x: dir * BACK_DISTANCE } : null,
    shake,
    shadow: 1 - 0.65 * Math.min(1, y / HOP_HEIGHT),
    drop: dropPose(c + stall / STALL_DROP_EVERY),
  };
}

// ── Vuelta al logo ──────────────────────────────────────────────────────

/**
 * La mascota en el punto mide esto veces el punto que sustituye: a su
 * tamaño (~2 % del ancho del logo) el guiño no se vería.
 */
export const DOT_GROW = 1.9;

/** Coordenadas de `MascotPose` (radios desde el sitio de reposo, y hacia arriba). */
export interface ArrivalGeometry {
  /** Centro al empezar (fuera de pantalla, por la derecha). */
  from: { x: number; y: number };
  /** Centro ya en el punto del logo, a tamaño `scale`. */
  to: { x: number; y: number };
  scale: number;
  /** Lo que sube la parábola sobre la recta de salida a llegada. */
  lift: number;
}

const HIDDEN_DROP: DropPose = { x: 0, y: 0, rot: 0, scale: 0, opacity: 0 };
const LANDING_SX: ReadonlyArray<readonly [number, number]> = [
  [0, 1.42],
  [0.08, 0.88],
  [0.16, 1.06],
  [0.26, 1],
];
const LANDING_SY: ReadonlyArray<readonly [number, number]> = [
  [0, 0.6],
  [0.08, 1.14],
  [0.16, 0.95],
  [0.26, 1],
];
const WINK: ReadonlyArray<readonly [number, number]> = [
  [0.12, 0],
  [0.2, 1],
  [0.85, 1],
  [0.95, 0],
];
const TILT: ReadonlyArray<readonly [number, number]> = [
  [0.08, 0],
  [0.26, -14],
];
/** Risita: dos saltitos con el ojo guiñado (s desde el aterrizaje, alto en radios del punto). */
const GIGGLES = [0.32, 0.54];
const GIGGLE_LENGTH = 0.18;
const GIGGLE_HEIGHT = 0.3;

/**
 * Pose de la vuelta: `t` = segundos desde el fin del empuje. Salta desde la
 * derecha en parábola dando una voltereta y encogiendo, cae en el hueco del
 * punto final aplastándose, y guiña dando dos saltitos: «jeje, soy yo».
 */
export function arrivalPose(t: number, geo: ArrivalGeometry): MascotPose {
  const u = clamp01(t / ARRIVAL);
  const grow = smooth(0, 1, u);
  const scale = 1 + (geo.scale - 1) * grow;
  const s = t - ARRIVAL;

  let y = geo.from.y + (geo.to.y - geo.from.y) * u + geo.lift * 4 * u * (1 - u);
  let sx = 1 + 0.12 * Math.sin(Math.PI * u);
  let sy = 1 / sx;
  let rot = -360 * smooth(0.08, 0.92, u);
  let wink = 0;
  if (s >= 0) {
    sx = keyed(LANDING_SX, s);
    sy = keyed(LANDING_SY, s);
    rot = keyed(TILT, s);
    wink = keyed(WINK, s);
    for (const g of GIGGLES) {
      const v = (s - g) / GIGGLE_LENGTH;
      if (v > 0 && v < 1) y += GIGGLE_HEIGHT * geo.scale * 4 * v * (1 - v);
    }
  }

  return {
    x: geo.from.x + (geo.to.x - geo.from.x) * u,
    y,
    rot,
    scale,
    sx,
    sy,
    anchor: 0,
    flat: 0,
    eyeOpen: 1,
    eyeTilt: 0,
    shine: 1,
    wink,
    vein: 0,
    impact: 0,
    speed: 0,
    dust: null,
    shake: 0,
    shadow: 0,
    drop: HIDDEN_DROP,
  };
}

/**
 * Gota de sudor. `clock` crece con el empuje (una gota por embestida) y, en
 * la espera, con el tiempo: es continuo, así que la gota en vuelo no salta
 * ni al quedarse esperando ni al soltarse.
 */
function dropPose(clock: number): DropPose {
  const age = frac(clock - DROP_BORN) / DROP_LIFE;
  const cycle = Math.floor(clock - DROP_BORN);
  if (age >= 1) return HIDDEN_DROP;

  // Sale de la nuca hacia atrás (lejos de la pared) con gravedad; una de
  // cada dos más alta para que no se repita.
  const high = (cycle & 1) === 0;
  const vx = high ? -0.9 : -1.2;
  const vy = high ? -1.6 : -1.2;
  const g = 1.5;
  const dy = vy + 2 * g * age;
  // La punta va detrás, apuntando a la mascota (gota que sale despedida).
  const rot = (Math.atan2(-dy, -vx) * 180) / Math.PI + 90;
  return {
    x: -0.55 + vx * age,
    y: -0.78 + vy * age + g * age * age,
    rot,
    scale: 0.6 + 0.4 * smooth(0, 0.15, age),
    opacity: smooth(0, 0.06, age) * (1 - smooth(0.65, 1, age)),
  };
}

/**
 * Silueta del cuerpo: círculo de radio `r` con el lado de la pared cortado
 * en vertical `flat` radios. Se pinta con trazo del mismo color y unión
 * redonda (redondea las esquinas del corte) y se desplaza `flat` hacia la
 * pared, así la cara plana queda pegada a ella.
 */
export function bodyPath(flat: number, r = 0.985): string {
  const f = (n: number) => n.toFixed(4);
  if (flat < 0.002) return `M ${f(r)} 0 A ${f(r)} ${f(r)} 0 1 0 ${f(-r)} 0 A ${f(r)} ${f(r)} 0 1 0 ${f(r)} 0 Z`;
  const x = r - flat;
  const h = Math.sqrt(r * r - x * x);
  return `M ${f(x)} ${f(-h)} A ${f(r)} ${f(r)} 0 1 0 ${f(x)} ${f(h)} Z`;
}

const f4 = (n: number) => n.toFixed(4);
const ray = (cx: number, cy: number, deg: number, from: number, to: number) => {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return `M ${f4(cx + c * from)} ${f4(cy + s * from)} L ${f4(cx + c * to)} ${f4(cy + s * to)}`;
};

/** Centro de la vena de esfuerzo: en la nuca, lejos de los ojos y de la pared. */
export const VEIN_AT = { x: -0.5, y: -0.56 } as const;

/**
 * Vena de esfuerzo de tebeo (💢): cuatro codos con la esquina hacia el
 * centro, sobre el propio cuerpo (tinta sobre lima). Escala con `vein`, así
 * que salta con rebote al apretar y late mientras espera.
 */
export function veinPath(vein: number): string {
  if (vein <= 0.01) return "";
  const k = 0.17 * vein;
  const g = 0.3 * k;
  const { x, y } = VEIN_AT;
  return [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]
    .map(
      ([sx, sy]) =>
        `M ${f4(x + sx * k)} ${f4(y + sy * g)} Q ${f4(x + sx * g)} ${f4(y + sy * g)} ${f4(x + sx * g)} ${f4(y + sy * k)}`,
    )
    .join(" ");
}

/** Chispazo del golpe: rayos lima desde el punto de contacto hacia la pared (se ven sobre la tinta). */
export function impactPath(impact: number): string {
  if (impact <= 0) return "";
  const from = 0.25 + 0.35 * impact;
  const to = from + 0.25 + 0.55 * impact;
  return [-62, -28, 0, 28, 62].map((deg) => ray(1, 0, deg, from, to)).join(" ");
}

/** Líneas de velocidad detrás de la bola en la carrerilla. */
export function speedPath(speed: number, x: number): string {
  if (speed <= 0) return "";
  const start = x - 1.25;
  return [
    [-0.45, 1.3],
    [0.05, 1.8],
    [0.5, 1.1],
  ]
    .map(([yy, len]) => `M ${f4(start)} ${f4(yy)} L ${f4(start - len * speed)} ${f4(yy)}`)
    .join(" ");
}
