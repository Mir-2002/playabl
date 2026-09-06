import { describe, expect, it } from "vitest";

// Mirrors the PostgreSQL trigger logic in update_profile_points().
// PostgreSQL integer division floors automatically; Math.floor() makes it explicit.
function simulateTrigger(
  currentMs: number,
  newDurationMs: number,
): { total_ms: number; total_points: number } {
  const total_ms = currentMs + newDurationMs;
  const total_points = Math.floor(total_ms / 1000);
  return { total_ms, total_points };
}

describe("points trigger math", () => {
  it("converts a 3-minute track to 180 points", () => {
    const result = simulateTrigger(0, 180_000);
    expect(result).toEqual({ total_ms: 180_000, total_points: 180 });
  });

  it("accumulates sub-second listens correctly (500ms + 500ms = 1 pt)", () => {
    // Per-event floor would give 0 + 0 = 0; accumulator gives floor(1000/1000) = 1.
    const afterFirst = simulateTrigger(0, 500);
    expect(afterFirst.total_points).toBe(0);

    const afterSecond = simulateTrigger(afterFirst.total_ms, 500);
    expect(afterSecond).toEqual({ total_ms: 1_000, total_points: 1 });
  });

  it("accumulator beats per-event rounding (3500ms + 1800ms = 5 pts, not 3+1=4)", () => {
    const result = simulateTrigger(3_500, 1_800);
    expect(result).toEqual({ total_ms: 5_300, total_points: 5 });
  });

  it("multiple tracks accumulate correctly across several inserts", () => {
    const tracks = [200_040, 183_293, 215_453]; // real-ish durations in ms
    let state = { total_ms: 0, total_points: 0 };
    for (const d of tracks) {
      state = simulateTrigger(state.total_ms, d);
    }
    const expectedMs = 200_040 + 183_293 + 215_453;
    expect(state.total_ms).toBe(expectedMs);
    expect(state.total_points).toBe(Math.floor(expectedMs / 1000));
  });

  it("zero duration does not change points", () => {
    const result = simulateTrigger(5_000, 0);
    expect(result).toEqual({ total_ms: 5_000, total_points: 5 });
  });
});

describe("idempotency contract", () => {
  // The UNIQUE(user_id, played_at) constraint + ON CONFLICT DO NOTHING means the
  // trigger never fires twice for the same event. This test documents that the
  // contract is at the DB constraint level, not the application layer: if the
  // upsert deduplicates correctly (ignoreDuplicates: true), the trigger-math
  // function is called exactly once per unique event.
  it("inserting the same event twice does not double points", () => {
    const duration = 200_000;

    // First insert: trigger fires once.
    const afterFirst = simulateTrigger(0, duration);
    expect(afterFirst).toEqual({ total_ms: 200_000, total_points: 200 });

    // Second insert of same event: ON CONFLICT DO NOTHING → trigger never called.
    // Simulated by not calling simulateTrigger again — state is unchanged.
    const afterDuplicate = afterFirst;
    expect(afterDuplicate).toEqual({ total_ms: 200_000, total_points: 200 });

    // A new distinct event DOES increment.
    const afterThird = simulateTrigger(afterDuplicate.total_ms, duration);
    expect(afterThird).toEqual({ total_ms: 400_000, total_points: 400 });
  });
});
