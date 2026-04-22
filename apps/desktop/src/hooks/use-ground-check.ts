"use client";

import { useCallback, useRef, type MutableRefObject } from "react";
import { useRapier, type RapierRigidBody } from "@react-three/rapier";
import { GROUND_RAY_MARGIN } from "@/components/canvas/constants";

/**
 * Ground detection by casting a ray straight down from the capsule center.
 *
 * More robust than `|vel.y| < threshold` — won't falsely report grounded at
 * a jump apex, while squeezing against a wall, or mid-air on light contact.
 *
 * Call `check()` inside your useFrame (ideally every frame or every 2 frames).
 * Read `isGroundedRef.current` whenever you need the current grounded state.
 */
export function useGroundCheck(
  rbRef: MutableRefObject<RapierRigidBody | null>,
  capsuleHalfHeight: number,
  capsuleRadius: number,
  /** Offset from the RigidBody origin to the capsule center (Y). */
  capsuleCenterOffsetY: number
) {
  const { world, rapier } = useRapier();
  const isGroundedRef = useRef(false);

  // Ray originates at the capsule center and goes down past its base by GROUND_RAY_MARGIN.
  const maxDist = capsuleHalfHeight + capsuleRadius + GROUND_RAY_MARGIN;

  const check = useCallback(() => {
    const rb = rbRef.current;
    if (!rb) return;
    const pos = rb.translation();
    const ray = new rapier.Ray(
      { x: pos.x, y: pos.y + capsuleCenterOffsetY, z: pos.z },
      { x: 0, y: -1, z: 0 }
    );
    // castRay signature: (ray, maxToi, solid, filterFlags?, filterGroups?, filterExcludeCollider?, filterExcludeRigidBody?)
    const hit = world.castRay(ray, maxDist, true, undefined, undefined, undefined, rb);
    isGroundedRef.current = hit !== null;
  }, [world, rapier, maxDist, capsuleCenterOffsetY, rbRef]);

  return { isGroundedRef, check };
}
