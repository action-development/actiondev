import { describe, it, expect } from "vitest";
import { computeTrajectory } from "@/components/canvas/AimLine";
import { GRAVITY, PHYSICS_DT } from "@/components/canvas/constants";

describe("computeTrajectory", () => {
  it("returns the requested number of dots", () => {
    expect(computeTrajectory(0, 0, 5, 5, 14)).toHaveLength(14);
    expect(computeTrajectory(0, 0, 5, 5, 8)).toHaveLength(8);
  });

  it("first dot is exactly at the origin", () => {
    const points = computeTrajectory(3, 7, 5, 5, 5);
    expect(points[0].x).toBe(3);
    expect(points[0].y).toBe(7);
  });

  it("trajectory curves downward under gravity", () => {
    // Fire straight up — arc must peak and then descend
    const points = computeTrajectory(0, 0, 0, 20, 14);
    const ys = points.map((p) => p.y);
    const peak = Math.max(...ys);
    const peakIndex = ys.indexOf(peak);
    // Must peak somewhere in the middle, not at first or last dot
    expect(peakIndex).toBeGreaterThan(0);
    expect(peakIndex).toBeLessThan(ys.length - 1);
    // After the peak, trajectory must be descending
    expect(ys[ys.length - 1]).toBeLessThan(peak);
  });

  it("higher force produces a longer horizontal range", () => {
    const lowForce  = computeTrajectory(0, 0, 5,  0, 14);
    const highForce = computeTrajectory(0, 0, 20, 0, 14);
    const lastLow   = lowForce[lowForce.length - 1].x;
    const lastHigh  = highForce[highForce.length - 1].x;
    expect(lastHigh).toBeGreaterThan(lastLow);
  });

  it("uses GRAVITY and PHYSICS_DT from constants (simulation matches manual step)", () => {
    // Manually simulate one dot (stepsPerDot=1, so no sub-stepping beyond 1st point)
    const vx0 = 10, vy0 = 10;
    const dampFactor = 1 / (1 + 0.05 * PHYSICS_DT); // CUBE_LINEAR_DAMPING = 0.05
    const vy1 = (vy0 - GRAVITY * PHYSICS_DT) * dampFactor;
    const vx1 = vx0 * dampFactor;
    const x1  = 0 + vx1 * PHYSICS_DT;
    const y1  = 0 + vy1 * PHYSICS_DT;

    const points = computeTrajectory(0, 0, vx0, vy0, 2, 1);
    expect(points[1].x).toBeCloseTo(x1, 10);
    expect(points[1].y).toBeCloseTo(y1, 10);
  });
});
