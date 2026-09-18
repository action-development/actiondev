/**
 * Caza de gaviotas — lógica pura del easter egg del hero.
 *
 * Un click sobre una gaviota la abate en vez de bajar el gancho. Aquí vive
 * lo testeable: el hit-test rayo/esfera con tolerancia angular y la caída.
 * El render (bala, plumas, fogonazo) está en `GullHunt.tsx`; la gaviota
 * abatida se anima en `Seagulls.tsx`.
 */

export interface GullTarget {
  id: number;
  /** Centro del ave en coordenadas de mundo — lo actualiza cada gaviota por frame. */
  x: number;
  y: number;
  z: number;
  /** Radio del cuerpo (ya con la escala de vuelo). */
  radius: number;
  /** Sólo se puede abatir una vez hasta que reaparece. */
  alive: boolean;
  /** Lo dispara la bala al impactar. */
  shoot: () => void;
}

/**
 * Tolerancia ANGULAR del disparo (radianes ≈ 1,4°): las gaviotas lejanas son
 * unos pocos píxeles y con el radio real sería imposible acertarles. A 60 u
 * de distancia esto equivale a ~1,5 u de radio efectivo.
 */
export const AIM_SLACK = 0.025;

/**
 * Gaviota más cercana al rayo (origen + dirección unitaria). Devuelve `null`
 * si ninguna viva queda dentro de su radio (o de la tolerancia angular).
 */
export function pickGullTarget(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  targets: Iterable<GullTarget>,
  slack = AIM_SLACK,
): GullTarget | null {
  let best: GullTarget | null = null;
  let bestT = Infinity;
  for (const g of targets) {
    if (!g.alive) continue;
    const vx = g.x - ox, vy = g.y - oy, vz = g.z - oz;
    // Proyección sobre el rayo: lo que hay detrás de la cámara no cuenta.
    const t = vx * dx + vy * dy + vz * dz;
    if (t <= 0) continue;
    const cx = ox + dx * t - g.x;
    const cy = oy + dy * t - g.y;
    const cz = oz + dz * t - g.z;
    const miss2 = cx * cx + cy * cy + cz * cz;
    const reach = Math.max(g.radius, t * slack);
    if (miss2 <= reach * reach && t < bestT) {
      bestT = t;
      best = g;
    }
  }
  return best;
}

/** Gravedad de la caída (u/s²): más floja que la del juego, es un pájaro. */
export const FALL_GRAVITY = 16;
/** Empujón inicial hacia arriba: el impacto la levanta un pelín antes de caer. */
export const FALL_KICK = 2.4;
/** Empieza a desvanecerse a este tiempo (s) y ha desaparecido en `FADE_END`. */
export const FADE_START = 0.55;
export const FADE_END = 1.35;
/** Segundos que tarda en volver a la escena tras desvanecerse. */
export const RESPAWN_MIN = 7;

/** Altura relativa al punto del impacto tras `t` segundos de caída. */
export function fallOffset(t: number): number {
  return FALL_KICK * t - 0.5 * FALL_GRAVITY * t * t;
}

/** Opacidad de la gaviota abatida: 1 hasta `FADE_START`, 0 en `FADE_END`. */
export function fadeAt(t: number): number {
  if (t <= FADE_START) return 1;
  if (t >= FADE_END) return 0;
  const k = (t - FADE_START) / (FADE_END - FADE_START);
  return 1 - k * k;
}

/** Velocidad de la bala: vuelo de ~0,3 s sea cual sea la distancia, nunca lenta. */
export function bulletSpeed(distance: number): number {
  return Math.max(80, distance / 0.3);
}
