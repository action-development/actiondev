import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameState } from "@/hooks/use-game-state";

describe("useGameState", () => {
  it("initialises with empty sets and zero power", () => {
    const { result } = renderHook(() => useGameState());
    expect(result.current.thrownIds.current.size).toBe(0);
    expect(result.current.gatedIds.current.size).toBe(0);
    expect(result.current.powerRef.current).toBe(0);
    expect(result.current.chargingRef.current).toBe(false);
    expect(result.current.holdingRef.current).toBe(false);
  });

  it("reset clears thrownIds, gatedIds and power state", () => {
    const { result } = renderHook(() => useGameState());
    act(() => {
      result.current.thrownIds.current.add("cube-1");
      result.current.gatedIds.current.add("cube-2");
      result.current.setPower(0.8, true);
      result.current.setHolding(true);
      result.current.reset();
    });
    expect(result.current.thrownIds.current.size).toBe(0);
    expect(result.current.gatedIds.current.size).toBe(0);
    expect(result.current.powerRef.current).toBe(0);
    expect(result.current.chargingRef.current).toBe(false);
    expect(result.current.holdingRef.current).toBe(false);
  });

  it("setPower updates refs and fires onPowerUpdate subscriber", () => {
    const { result } = renderHook(() => useGameState());
    const subscriber = vi.fn();
    act(() => { result.current.onPowerUpdate.current = subscriber; });

    act(() => { result.current.setPower(0.6, true); });

    expect(result.current.powerRef.current).toBe(0.6);
    expect(result.current.chargingRef.current).toBe(true);
    expect(subscriber).toHaveBeenCalledOnce();
    expect(subscriber).toHaveBeenCalledWith(0.6, true);
  });

  it("setHolding updates ref and fires onHoldingUpdate subscriber", () => {
    const { result } = renderHook(() => useGameState());
    const subscriber = vi.fn();
    act(() => { result.current.onHoldingUpdate.current = subscriber; });

    act(() => { result.current.setHolding(true); });

    expect(result.current.holdingRef.current).toBe(true);
    expect(subscriber).toHaveBeenCalledOnce();
    expect(subscriber).toHaveBeenCalledWith(true);
  });

  it("notifyThrow fires onThrow subscriber", () => {
    const { result } = renderHook(() => useGameState());
    const subscriber = vi.fn();
    act(() => { result.current.onThrow.current = subscriber; });

    act(() => { result.current.notifyThrow(); });

    expect(subscriber).toHaveBeenCalledOnce();
  });

  it("calling setters with no subscriber registered does not throw", () => {
    const { result } = renderHook(() => useGameState());
    expect(() => {
      act(() => {
        result.current.setPower(1, true);
        result.current.setHolding(true);
        result.current.notifyThrow();
      });
    }).not.toThrow();
  });
});
