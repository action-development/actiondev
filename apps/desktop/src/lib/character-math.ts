/**
 * Pure helpers for character control — no Three.js or Rapier imports so they
 * can be unit-tested in isolation with vitest + renderHook patterns.
 */

/**
 * Compute next lateral velocity given input, current velocity and delta-time.
 * Uses frame-rate independent exponential lerp so feel stays constant at 30/60/144fps.
 *
 * @param targetVx  Desired velocity (moveX * MOVE_SPEED)
 * @param currentVx Current body linear X velocity
 * @param delta     Seconds since last frame
 * @param accel     Lerp factor at 60fps — typically MOVE_ACCEL (grounded) or AIR_CONTROL (airborne)
 */
export function computeNextVelocity(
  targetVx: number,
  currentVx: number,
  delta: number,
  accel: number
): number {
  const t = 1 - Math.pow(1 - accel, delta * 60);
  return currentVx + (targetVx - currentVx) * t;
}

/**
 * Wrap-around with hysteresis — avoids tunneling when crossing the boundary
 * with high velocity by checking past WRAP_X + margin before teleporting.
 *
 * Returns the new X or null if no wrap is needed.
 */
export function computeWrapX(
  x: number,
  wrapX: number,
  hysteresis = 0.5
): number | null {
  if (x > wrapX + hysteresis) return -wrapX;
  if (x < -wrapX - hysteresis) return wrapX;
  return null;
}

export type AnimState = "idle" | "walk" | "jump" | "fall" | "wave";

export interface AnimInput {
  isGrounded: boolean;
  moveX: number;
  vy: number;
  holding: boolean;
  facingCamera: boolean;
  justJumped?: boolean;
}

/**
 * Decide the current animation state from physics + input.
 * Priority: jump-trigger > falling > walk/wave/idle.
 */
export function pickAnimState(input: AnimInput): AnimState {
  if (input.justJumped) return "jump";
  if (!input.isGrounded && input.vy < -1) return "fall";
  if (input.isGrounded) {
    if (input.moveX !== 0) return "walk";
    if (input.holding || input.facingCamera) return "wave";
    return "idle";
  }
  // Airborne but not falling fast (jump arc peak) — keep current via caller logic
  return "jump";
}
