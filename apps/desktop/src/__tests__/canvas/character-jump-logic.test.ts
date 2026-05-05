import { describe, it, expect } from "vitest";
import { computeJumpDecision, type JumpDecisionInput } from "@/lib/character-math";

const DT = 1 / 60;
const COYOTE   = 0.15;
const BUFFER   = 0.12;

/** Helper: grounded baseline with all timers clean */
function mkInput(overrides: Partial<JumpDecisionInput> = {}): JumpDecisionInput {
  return {
    grounded:        true,
    coyoteTimer:     0,
    jumpBufferTimer: 0,
    jumpCooldown:    0,
    velY:            0,
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
describe("computeJumpDecision — normal jump", () => {
  it("fires when grounded and jump just pressed", () => {
    const r = computeJumpDecision(mkInput(), true, true, DT, COYOTE, BUFFER);
    expect(r.shouldJump).toBe(true);
  });

  it("does NOT fire when grounded but jump not pressed (no buffer)", () => {
    const r = computeJumpDecision(mkInput(), false, true, DT, COYOTE, BUFFER);
    expect(r.shouldJump).toBe(false);
  });

  it("does NOT fire when on cooldown", () => {
    const r = computeJumpDecision(mkInput({ jumpCooldown: 0.4 }), true, true, DT, COYOTE, BUFFER);
    expect(r.shouldJump).toBe(false);
  });

  it("sets cooldown to 0.4 after firing", () => {
    const r = computeJumpDecision(mkInput(), true, true, DT, COYOTE, BUFFER);
    expect(r.newJumpCooldown).toBeCloseTo(0.4, 5);
  });

  it("clears jumpBufferTimer after firing", () => {
    const r = computeJumpDecision(mkInput({ jumpBufferTimer: 0.08 }), false, true, DT, COYOTE, BUFFER);
    expect(r.shouldJump).toBe(true);
    expect(r.newJumpBufferTimer).toBe(0);
  });

  it("clears coyoteTimer after firing", () => {
    const r = computeJumpDecision(mkInput(), true, true, DT, COYOTE, BUFFER);
    expect(r.newCoyoteTimer).toBe(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe("computeJumpDecision — coyote time", () => {
  it("sets coyoteTimer when leaving the ground (wasGrounded=true, grounded=false)", () => {
    const r = computeJumpDecision(
      mkInput({ grounded: false, velY: -0.5 }),
      false,
      true,   // wasGrounded
      DT, COYOTE, BUFFER,
    );
    // Timer is set AFTER the decay step runs on the old value (0), so output = full window
    expect(r.newCoyoteTimer).toBeCloseTo(COYOTE, 5);
  });

  it("allows jump within coyote window just after leaving ground", () => {
    const r = computeJumpDecision(
      mkInput({ grounded: false, coyoteTimer: COYOTE * 0.5, velY: -0.5 }),
      true,   // jumpJustPressed
      false,
      DT, COYOTE, BUFFER,
    );
    expect(r.shouldJump).toBe(true);
  });

  it("does NOT allow coyote jump when velY is positive (upward momentum)", () => {
    const r = computeJumpDecision(
      mkInput({ grounded: false, coyoteTimer: COYOTE * 0.5, velY: 3.0 }),
      true,
      false,
      DT, COYOTE, BUFFER,
    );
    expect(r.shouldJump).toBe(false);
  });

  it("decays coyoteTimer each frame", () => {
    const r = computeJumpDecision(
      mkInput({ grounded: false, coyoteTimer: 0.1, velY: -1 }),
      false,
      false,
      DT, COYOTE, BUFFER,
    );
    expect(r.newCoyoteTimer).toBeCloseTo(0.1 - DT, 5);
  });

  it("does NOT allow coyote jump once timer reaches 0", () => {
    const r = computeJumpDecision(
      mkInput({ grounded: false, coyoteTimer: 0, velY: -2 }),
      true,
      false,
      DT, COYOTE, BUFFER,
    );
    expect(r.shouldJump).toBe(false);
  });

  it("clears coyoteTimer and sets cooldown after coyote jump fires", () => {
    const r = computeJumpDecision(
      mkInput({ grounded: false, coyoteTimer: COYOTE * 0.5, velY: -1 }),
      true,
      false,
      DT, COYOTE, BUFFER,
    );
    expect(r.shouldJump).toBe(true);
    expect(r.newCoyoteTimer).toBe(0);
    expect(r.newJumpCooldown).toBeCloseTo(0.4, 5);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe("computeJumpDecision — jump buffer", () => {
  it("stores buffer when jump pressed mid-air (no coyote)", () => {
    const r = computeJumpDecision(
      mkInput({ grounded: false, coyoteTimer: 0, velY: -3 }),
      true,
      false,
      DT, COYOTE, BUFFER,
    );
    expect(r.shouldJump).toBe(false);
    // Timer is set AFTER the decay step runs on the old value (0), so output = full window
    expect(r.newJumpBufferTimer).toBeCloseTo(BUFFER, 5);
  });

  it("fires buffered jump on landing while buffer is active", () => {
    // Buffer was set 2 frames ago, character just landed (grounded=true, wasGrounded=false)
    const r = computeJumpDecision(
      mkInput({ grounded: true, jumpBufferTimer: BUFFER * 0.7 }),
      false,   // NOT pressing jump this frame
      false,   // wasGrounded=false → just landed
      DT, COYOTE, BUFFER,
    );
    expect(r.shouldJump).toBe(true);
  });

  it("does NOT fire buffered jump if buffer expired before landing", () => {
    const r = computeJumpDecision(
      mkInput({ grounded: true, jumpBufferTimer: 0 }),
      false,
      false,
      DT, COYOTE, BUFFER,
    );
    expect(r.shouldJump).toBe(false);
  });

  it("decays jumpBufferTimer each frame", () => {
    const r = computeJumpDecision(
      mkInput({ grounded: false, coyoteTimer: 0, jumpBufferTimer: 0.08, velY: -3 }),
      false,
      false,
      DT, COYOTE, BUFFER,
    );
    expect(r.newJumpBufferTimer).toBeCloseTo(0.08 - DT, 5);
  });

  it("clears jumpBufferTimer after firing", () => {
    const r = computeJumpDecision(
      mkInput({ jumpBufferTimer: 0.08 }),
      false,
      false,
      DT, COYOTE, BUFFER,
    );
    expect(r.shouldJump).toBe(true);
    expect(r.newJumpBufferTimer).toBe(0);
  });
});
