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

// ─── Jump decision (coyote time + input buffering) ────────────────────────────

export interface JumpDecisionInput {
  grounded: boolean;
  coyoteTimer: number;       // seconds remaining (≥0)
  jumpBufferTimer: number;   // seconds remaining (≥0)
  jumpCooldown: number;      // seconds remaining (≥0)
  velY: number;              // current vertical velocity
}

export interface JumpDecisionOutput {
  shouldJump: boolean;
  newCoyoteTimer: number;
  newJumpBufferTimer: number;
  newJumpCooldown: number;
}

/**
 * Compute jump decision for this frame, advancing all timers.
 *
 * Coyote time: allows jumping up to `coyoteTime` seconds after walking off a ledge.
 * Jump buffer: queues a jump pressed up to `jumpBufferTime` seconds before landing
 *              so it fires on the next grounded frame.
 *
 * @param input             Current physics + timer state
 * @param jumpJustPressed   True only on the frame Space transitions down→up
 * @param wasGrounded       Grounded state from the PREVIOUS frame (before this frame's check)
 * @param dt                Frame delta in seconds
 * @param coyoteTime        Grace window in seconds (use COYOTE_TIME constant)
 * @param jumpBufferTime    Buffer window in seconds (use JUMP_BUFFER_TIME constant)
 */
export function computeJumpDecision(
  input: JumpDecisionInput,
  jumpJustPressed: boolean,
  wasGrounded: boolean,
  dt: number,
  coyoteTime: number,
  jumpBufferTime: number,
): JumpDecisionOutput {
  let { coyoteTimer, jumpBufferTimer, jumpCooldown } = input;
  const { grounded, velY } = input;

  // Decay timers first so they read 0 on the exact expiry frame
  coyoteTimer     = Math.max(0, coyoteTimer     - dt);
  jumpBufferTimer = Math.max(0, jumpBufferTimer - dt);

  // Reset coyote window on the frame we leave the ground
  if (wasGrounded && !grounded) coyoteTimer = coyoteTime;

  // Buffer incoming jump press so it can fire on landing
  if (jumpJustPressed) jumpBufferTimer = jumpBufferTime;

  // canJump: on ground OR within coyote window (but NOT while still moving upward from a previous jump)
  const canJump = (grounded || (coyoteTimer > 0 && velY <= 0.2)) && jumpCooldown <= 0;

  // Fire: buffered (or current-frame) press meets canJump condition
  const shouldJump = canJump && jumpBufferTimer > 0;

  if (shouldJump) {
    coyoteTimer     = 0;
    jumpBufferTimer = 0;
    jumpCooldown    = 0.4;
  }

  return { shouldJump, newCoyoteTimer: coyoteTimer, newJumpBufferTimer: jumpBufferTimer, newJumpCooldown: jumpCooldown };
}

// ─── Animation state ──────────────────────────────────────────────────────────

type AnimState = "idle" | "walk" | "jump" | "fall" | "wave";

interface AnimInput {
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
