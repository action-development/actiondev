/**
 * Caza de gaviotas — modo "ronda" (lógica pura).
 *
 * La primera baja arranca una cuenta atrás de `ROUND_SECONDS`. Mientras corre,
 * el cielo se llena: aparecen las gaviotas EXTRA (`Seagulls.tsx`) y las de
 * siempre reaparecen casi al instante. `GullTally` es el dueño del reloj y
 * publica el estado en `GameState.gullRush`; las aves sólo lo leen.
 */

/** Estado compartido de la ronda: lo escribe `GullTally`, lo leen las gaviotas. */
export interface GullRush {
  active: boolean;
}

/** Duración de la ronda desde la primera baja. */
export const ROUND_SECONDS = 30;

/** Pausa (s) antes de que una gaviota abatida vuelva a entrar durante la ronda. */
export const RUSH_RESPAWN_BASE = 2;

/** Reaparición durante la ronda: casi inmediata, con un poco de variación por ave. */
export function rushRespawn(seed: number): number {
  return RUSH_RESPAWN_BASE + (seed % 4) * 0.3;
}

/**
 * Retraso (s desde que arranca la ronda) con el que entra cada gaviota extra,
 * escalonado por ave para que el cielo se llene poco a poco y no de golpe.
 */
export function rushStagger(seed: number): number {
  return 0.4 + (seed % 8) * 0.6;
}

/** Segundos que quedan, redondeados hacia arriba y sin bajar de 0. */
export function secondsLeft(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

/** ¿La ronda que acaba de terminar supera el récord guardado? */
export function isNewRecord(kills: number, record: number): boolean {
  return kills > 0 && kills > record;
}

/**
 * Racha: bajas seguidas con menos de `STREAK_WINDOW_MS` entre una y la
 * siguiente. Si pasa más tiempo sin matar, se pierde. Cada `STREAK_STEP` bajas
 * de racha sube el multiplicador (×2 a las 5, ×3 a las 10…) y cada baja vale
 * tantos puntos como el multiplicador vigente.
 */
export const STREAK_WINDOW_MS = 1500;
export const STREAK_STEP = 5;

export interface Streak {
  count: number;
  /** Instante (ms) de la última baja de la racha. */
  lastAt: number;
}

export const NO_STREAK: Streak = { count: 0, lastAt: 0 };

/** Multiplicador para una racha de `count` bajas: 1 hasta 4, 2 en 5-9, 3 en 10-14… */
export function multiplierFor(count: number): number {
  return 1 + Math.floor(count / STREAK_STEP);
}

/** ¿La racha sigue viva en `now`? (hay racha y la última baja fue hace ≤ ventana) */
export function streakAlive(streak: Streak, now: number): boolean {
  return streak.count > 0 && now - streak.lastAt <= STREAK_WINDOW_MS;
}

/**
 * Registra una baja en `now`. Si la racha se había perdido, empieza otra en 1.
 * `mult` es el multiplicador con el que puntúa ESTA baja (ya subido si la baja
 * cruza un múltiplo de `STREAK_STEP`) y `levelUp` avisa de que acaba de subir.
 */
export function registerStreakKill(
  streak: Streak,
  now: number,
): { streak: Streak; mult: number; levelUp: boolean } {
  const count = streakAlive(streak, now) ? streak.count + 1 : 1;
  return {
    streak: { count, lastAt: now },
    mult: multiplierFor(count),
    levelUp: count % STREAK_STEP === 0,
  };
}

