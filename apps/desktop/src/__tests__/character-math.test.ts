import { describe, it, expect } from "vitest";
import {
  computeNextVelocity,
  computeWrapX,
  pickAnimState,
} from "@/lib/character-math";

describe("computeNextVelocity", () => {
  it("leaves velocity unchanged when already at target", () => {
    expect(computeNextVelocity(6, 6, 1 / 60, 0.22)).toBeCloseTo(6, 6);
  });

  it("interpolates toward target when accelerating from rest", () => {
    const v = computeNextVelocity(6, 0, 1 / 60, 0.22);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(6);
  });

  it("decelerates toward zero when input is released", () => {
    const v = computeNextVelocity(0, 6, 1 / 60, 0.22);
    expect(v).toBeLessThan(6);
    expect(v).toBeGreaterThan(0);
  });

  it("is frame-rate independent over the same total time", () => {
    // Simulate 1/60 twice vs 1/30 once — end velocity should be close
    const onceLong = computeNextVelocity(6, 0, 1 / 30, 0.22);
    const twiceShort = computeNextVelocity(
      6,
      computeNextVelocity(6, 0, 1 / 60, 0.22),
      1 / 60,
      0.22
    );
    expect(Math.abs(onceLong - twiceShort)).toBeLessThan(0.05);
  });

  it("applies less acceleration when airborne (lower accel factor)", () => {
    const grounded = computeNextVelocity(6, 0, 1 / 60, 0.22);
    const airborne = computeNextVelocity(6, 0, 1 / 60, 0.08);
    expect(airborne).toBeLessThan(grounded);
  });
});

describe("computeWrapX", () => {
  const WRAP = 18.5;

  it("returns null while inside bounds", () => {
    expect(computeWrapX(0, WRAP)).toBeNull();
    expect(computeWrapX(WRAP, WRAP)).toBeNull();
    expect(computeWrapX(-WRAP, WRAP)).toBeNull();
  });

  it("teleports only after crossing the hysteresis margin", () => {
    // Just past WRAP but within hysteresis — do not wrap yet
    expect(computeWrapX(WRAP + 0.2, WRAP, 0.5)).toBeNull();
    // Beyond hysteresis — wrap
    expect(computeWrapX(WRAP + 0.6, WRAP, 0.5)).toBe(-WRAP);
  });

  it("wraps negative-side the same way", () => {
    expect(computeWrapX(-WRAP - 0.2, WRAP, 0.5)).toBeNull();
    expect(computeWrapX(-WRAP - 0.6, WRAP, 0.5)).toBe(WRAP);
  });
});

describe("pickAnimState", () => {
  it("triggers jump when justJumped regardless of other state", () => {
    expect(
      pickAnimState({
        isGrounded: true,
        moveX: 0,
        vy: 0,
        holding: false,
        facingCamera: false,
        justJumped: true,
      })
    ).toBe("jump");
  });

  it("returns fall when airborne and falling fast", () => {
    expect(
      pickAnimState({ isGrounded: false, moveX: 0, vy: -5, holding: false, facingCamera: false })
    ).toBe("fall");
  });

  it("returns walk when grounded and moving", () => {
    expect(
      pickAnimState({ isGrounded: true, moveX: 1, vy: 0, holding: false, facingCamera: false })
    ).toBe("walk");
  });

  it("returns wave when grounded, still, and holding a cube", () => {
    expect(
      pickAnimState({ isGrounded: true, moveX: 0, vy: 0, holding: true, facingCamera: false })
    ).toBe("wave");
  });

  it("returns wave when grounded, still, and facing the camera", () => {
    expect(
      pickAnimState({ isGrounded: true, moveX: 0, vy: 0, holding: false, facingCamera: true })
    ).toBe("wave");
  });

  it("returns idle when grounded and nothing is happening", () => {
    expect(
      pickAnimState({ isGrounded: true, moveX: 0, vy: 0, holding: false, facingCamera: false })
    ).toBe("idle");
  });
});
