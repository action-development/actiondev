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
export const CUBE_LINEAR_DAMPING = 0.05;

/** PageCube angular velocity damping. */
export const CUBE_ANGULAR_DAMPING = 1;

/** Throw force range (impulse units, mass ≈ 1 so force ≈ velocity) */
export const MIN_FORCE = 5;
export const MAX_FORCE = 25;

/** Mouse distance range for force mapping (world units at Z=0) */
export const MIN_AIM_DIST = 2;
export const MAX_AIM_DIST = 15;

/** Y offset of held cube above character base — must clear capsule top + cube half-height */
export const HOLD_OFFSET_Y = 2.9;
