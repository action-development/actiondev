import { describe, it, expect } from "vitest";
import { computeCubeSpawnPositions } from "@/components/canvas/GameWorld";

describe("computeCubeSpawnPositions", () => {
  it("returns one position per cube", () => {
    const cubes = [{ size: 1 }, { size: 2 }, { size: 1.5 }];
    expect(computeCubeSpawnPositions(cubes)).toHaveLength(3);
    expect(computeCubeSpawnPositions([])).toHaveLength(0);
  });

  it("every position has z = 0", () => {
    const cubes = Array.from({ length: 5 }, () => ({ size: 1 }));
    for (const [, , z] of computeCubeSpawnPositions(cubes)) {
      expect(z).toBe(0);
    }
  });

  it("cube rests just above the floor with a small penetration margin", () => {
    const size = 1.4;
    const [[, y]] = computeCubeSpawnPositions([{ size }]);
    // floor top is world y=-6; center = -6 + size/2 + 0.1
    expect(y).toBeCloseTo(-6 + size / 2 + 0.1, 5);
  });

  it("different cubes get different x slots (no stacking at spawn)", () => {
    const cubes = [{ size: 1 }, { size: 1 }, { size: 1 }];
    const xs = computeCubeSpawnPositions(cubes).map(([x]) => x);
    expect(new Set(xs).size).toBe(xs.length);
  });

  it("larger cubes sit higher so their bottom stays at floor level", () => {
    const smallY = computeCubeSpawnPositions([{ size: 1 }])[0][1];
    const bigY = computeCubeSpawnPositions([{ size: 2 }])[0][1];
    expect(bigY).toBeGreaterThan(smallY);
  });

  it("is deterministic across calls", () => {
    const cubes = [{ size: 1.2 }, { size: 1.6 }];
    expect(computeCubeSpawnPositions(cubes)).toEqual(computeCubeSpawnPositions(cubes));
  });
});
