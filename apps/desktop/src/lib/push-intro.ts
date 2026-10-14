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

/** Nombre solo en pantalla tras el último empujón. */
export const FINAL_HOLD = 0.5;
/** Del aviso a lo de debajo hasta que empieza a bajar el panel. */
export const EXIT_DELAY = 0.6;
/** Bajada del panel (y subida del rótulo, que así se queda quieto). */
export const EXIT_DURATION = 1.33;

/** Progreso final mínimo del original: la mascota sale del todo. */
const BASE_FINAL: Record<IntroTiming, number> = { pc: 1.28, mobile: 1.4 };
/** Tope de la pared: ya fuera de pantalla mientras la mascota acaba de salir. */
const WALL_MAX: Record<IntroTiming, number> = { pc: 1.12, mobile: 1.4 };
/** Lo que se alarga la mascota al aterrizar (`sx` máximo de `mascotPose`). */
const MAX_STRETCH_X = 1.12;

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
  /** Fin del empuje + `FINAL_HOLD`: se avisa a lo de debajo para que arranque. */
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
  const reveal = t + FINAL_HOLD;
  const exitStart = reveal + EXIT_DELAY;
  return { segments, gate, reveal, exitStart, end: exitStart + EXIT_DURATION, wallMax: WALL_MAX[timing] };
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
 * Empujones por ancho de pantalla. Con 10/3 los picos de esfuerzo caen en
 * p = 0,3 · 0,6 · 0,9 · 1,2: las dos pausas congelan a la mascota aplastada
 * contra la pared, como el ×1,08 del Lottie del original congela al muñeco
 * con la cabeza gacha.
 */
export const PUSHES_PER_WIDTH = 10 / 3;

/** Altura del bote, en radios. */
export const HOP_HEIGHT = 0.42;

/** Nace una gota de sudor en esta fase del ciclo y vive esta fracción de él. */
const DROP_BORN = 0.82;
const DROP_LIFE = 0.55;
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
  /** Temblor mientras espera, en radios. */
  x: number;
  /** Bote (hacia arriba), en radios. */
  hop: number;
  /** Escala del cuerpo: `sx` anclada en la pared, `sy` en el suelo. */
  sx: number;
  sy: number;
  /** Aplastamiento contra la pared, en radios. */
  flat: number;
  /** 1 = ojos abiertos; ~0,15 = rendija de esfuerzo. */
  eyeOpen: number;
  /** Giro de las rendijas (grados): «\ /» de apretar. */
  eyeTilt: number;
  shine: number;
  /** Rayitas de esfuerzo junto a la pared. */
  effort: number;
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

/**
 * Pose de la mascota para un progreso del empuje. Como el Lottie del
 * original, NO depende del tiempo: avanza con la distancia (cero patinaje y
 * quieta en las pausas). `stall` = segundos esperando en la pausa del 60 %
 * a que cargue lo de debajo: ahí aprieta, tiembla y suda. `wait` (0–1) es
 * cuánto se nota la espera; el componente lo apaga suave al soltarse, para
 * que el temblor no se corte de golpe.
 *
 * Ciclo (fase 0 = esfuerzo máximo): suelta y bota (0–0,58), aterriza
 * aplastándose (0,58–0,72) y se vuelve a pegar a la pared apretando (0,66–1).
 */
export function mascotPose(progress: number, stall = 0, wait = Math.min(1, stall / 0.3)): MascotPose {
  const phase = frac(progress * PUSHES_PER_WIDTH);

  const pulse = wait * 0.5 * (1 - Math.cos(stall * Math.PI * 2 * 1.6));
  const x = wait * 0.012 * Math.sin(stall * Math.PI * 2 * 17);

  const strain = Math.max(smooth(0.66, 1, phase), 1 - smooth(0, 0.14, phase)) * (1 - 0.12 * pulse);
  const air = (phase - 0.1) / 0.48;
  const airborne = air > 0 && air < 1;
  const hop = airborne ? 4 * air * (1 - air) : 0;
  const speed = airborne ? Math.abs(1 - 2 * air) : 0;
  const land = phase > 0.58 && phase < 0.72 ? Math.sin((Math.PI * (phase - 0.58)) / 0.14) : 0;

  return {
    x,
    hop,
    sx: 1 - 0.1 * strain + 0.12 * land - 0.04 * speed,
    sy: 1 + 0.06 * strain - 0.14 * land + 0.07 * speed,
    flat: 0.14 * strain,
    eyeOpen: Math.min(1 - 0.85 * smooth(0.3, 1, strain), 1 - 0.4 * land),
    eyeTilt: 20 * smooth(0.4, 1, strain),
    shine: 1 - smooth(0.2, 0.7, strain),
    effort: smooth(0.55, 1, strain),
    shadow: 1 - 0.45 * hop,
    drop: dropPose(progress * PUSHES_PER_WIDTH + stall / STALL_DROP_EVERY),
  };
}

/**
 * Gota de sudor. `clock` crece con el empuje (una gota por empujón) y, en
 * la espera, con el tiempo: es continuo, así que la gota en vuelo no salta
 * ni al quedarse esperando ni al soltarse.
 */
function dropPose(clock: number): DropPose {
  const age = frac(clock - DROP_BORN) / DROP_LIFE;
  const cycle = Math.floor(clock - DROP_BORN);
  if (age >= 1) return { x: 0, y: 0, rot: 0, scale: 0, opacity: 0 };

  // Sale de la nuca hacia atrás (lejos de la pared) con gravedad; una de
  // cada dos más alta para que no se repita.
  const high = (cycle & 1) === 0;
  const vx = high ? -0.62 : -0.85;
  const vy = high ? -1.25 : -0.95;
  const g = 1.1;
  const dx = vx;
  const dy = vy + 2 * g * age;
  // La punta va detrás, apuntando a la mascota (gota que sale despedida).
  const rot = (Math.atan2(-dy, -dx) * 180) / Math.PI + 90;
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

/**
 * Tres rayitas de presión sobre el hombro de la pared; crecen con el
 * esfuerzo. Ángulos elegidos para no pasar nunca de x = 0,9: más allá caerían
 * sobre la pared (tinta sobre tinta) o asomarían antes de que entre la bola.
 */
export function effortPath(effort: number): string {
  const f = (n: number) => n.toFixed(4);
  const inner = 1.16;
  const outer = inner + 0.06 + 0.16 * effort;
  return [-50, -66, -82]
    .map((deg) => {
      const a = (deg * Math.PI) / 180;
      const c = Math.cos(a);
      const s = Math.sin(a);
      return `M ${f(c * inner)} ${f(s * inner)} L ${f(c * outer)} ${f(s * outer)}`;
    })
    .join(" ");
}
