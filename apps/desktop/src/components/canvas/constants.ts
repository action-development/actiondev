/**
 * Shared physics constants — single source of truth.
 *
 * These MUST match the values used in <Physics> and on RigidBody props.
 * Changing them here updates both the simulation and the AimLine prediction.
 */

/** Downward gravity magnitude. Matches Physics gravity={[0, -GRAVITY, 0]} */
export const GRAVITY = 20;

/** Fixed physics timestep in seconds. Matches Physics timeStep={1/60} */
export const PHYSICS_DT = 1 / 60;

/** PageCube linear velocity damping. Lower = cubes fly further on contact. */
export const CUBE_LINEAR_DAMPING = 0.02;

/** PageCube angular velocity damping. */
export const CUBE_ANGULAR_DAMPING = 0.6;

/** PageCube bounciness (0=inelastic, 1=perfect bounce). */
export const CUBE_RESTITUTION = 0.65;

/** Throw force range (impulse units, mass ≈ 1 so force ≈ velocity) */
export const MIN_FORCE = 5;
export const MAX_FORCE = 25;

/** Mouse distance range for force mapping (world units at Z=0) */
export const MIN_AIM_DIST = 2;
export const MAX_AIM_DIST = 15;

/**
 * Gap (world units) between the model's head top and the bottom of a held cube.
 * holdY = charPos.y + modelHeight + LARGEST_CUBE_HALF + HOLD_MARGIN
 * Increase if the cube visually clips the character's head; decrease to hold closer.
 */
export const HOLD_MARGIN = 0.5;

/**
 * World X boundary for horizontal wrap-around.
 * Character AND PageCube both use this value — it lives here to prevent drift.
 */
export const WRAP_X = 18.5;

/** Y position of the floor collider top surface (after removing the old -4 group offset). */
export const GROUND_Y = -6;

/** Character horizontal movement speed (world units / second). */
export const MOVE_SPEED = 6;

/** Jump vertical impulse (instant velocity added on jump). */
export const JUMP_IMPULSE = 8;

/**
 * Per-frame acceleration factor for velocity lerp toward target.
 * Range 0..1 — higher = more instant, lower = more slide. Tuned at 60fps.
 */
export const MOVE_ACCEL = 0.22;

/** Acceleration factor while airborne — character has less control mid-jump. */
export const AIR_CONTROL = 0.08;

/** Lerp speed for held cube position tracking (higher = tighter follow). */
export const HELD_LERP_SPEED = 18;

/** Raycast margin below capsule bottom to consider grounded. */
export const GROUND_RAY_MARGIN = 0.15;
