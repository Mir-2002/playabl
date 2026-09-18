import { describe, expect, it } from "vitest"
import { safeTimezone } from "../../supabase/functions/_shared/timezone"
import { credit } from "../../supabase/functions/_shared/credit"

describe("safeTimezone", () => {
  it("returns valid IANA zones unchanged", () => {
    expect(safeTimezone("UTC")).toBe("UTC")
    expect(safeTimezone("America/New_York")).toBe("America/New_York")
    expect(safeTimezone("Asia/Manila")).toBe("Asia/Manila")
  })

  it("falls back to UTC for garbage, empty, and nullish values", () => {
    expect(safeTimezone("Not/AZone")).toBe("UTC")
    expect(safeTimezone("Mars/Olympus_Mons")).toBe("UTC")
    expect(safeTimezone("")).toBe("UTC")
    expect(safeTimezone(null)).toBe("UTC")
    expect(safeTimezone(undefined)).toBe("UTC")
  })
})

describe("credit() with an invalid timezone", () => {
  it("does not throw and buckets as UTC instead of wedging the engine", () => {
    const rows = [{ id: "r1", played_at: "2024-09-06T10:00:00.000Z" }]

    let result!: ReturnType<typeof credit>
    expect(() => {
      result = credit(rows, new Map(), new Map(), 40, 400, "Not/AZone")
    }).not.toThrow()

    // Credited, and bucketed to the UTC calendar day (fallback zone).
    expect(result.creditedIds).toEqual(["r1"])
    expect(result.dayDeltas).toEqual([
      { activity_date: "2024-09-06", track_count: 1, points: 1 },
    ])
  })
})
