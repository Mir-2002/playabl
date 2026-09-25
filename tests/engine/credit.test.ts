import { describe, expect, it } from "vitest"
import { credit, type ScrobbleRow } from "../../supabase/functions/_shared/credit"

const TZ_UTC    = "UTC"
const TZ_MANILA = "Asia/Manila"   // UTC+8, no DST
const TZ_NY     = "America/New_York"  // UTC-5 (EST) / -4 (EDT), observes DST

// ── helpers ───────────────────────────────────────────────────────────────────

function makeRow(id: string, played_at: string): ScrobbleRow {
  return { id, played_at }
}

function makeRows(count: number, baseIso: string, stepMs = 60_000): ScrobbleRow[] {
  const base = new Date(baseIso).getTime()
  return Array.from({ length: count }, (_, i) => ({
    id: `row-${i}`,
    played_at: new Date(base + i * stepMs).toISOString(),
  }))
}

const emptyCounts = new Map<string, number>()

// ── basic crediting ───────────────────────────────────────────────────────────

describe("credit — basic", () => {
  it("1 scrobble → 1 credited point", () => {
    const rows = [makeRow("a", "2026-09-06T10:00:00Z")]
    const result = credit(rows, emptyCounts, emptyCounts, 40, 400, TZ_UTC)
    expect(result.creditedIds).toEqual(["a"])
    expect(result.uncreditedIds).toEqual([])
    expect(result.totalCredited).toBe(1)
    expect(result.dayDeltas).toEqual([
      { activity_date: "2026-09-06", track_count: 1, points: 1 },
    ])
  })

  it("skips duplicate ids (defensive)", () => {
    const row = makeRow("dup", "2026-09-06T10:00:00Z")
    const result = credit([row, row], emptyCounts, emptyCounts, 40, 400, TZ_UTC)
    expect(result.creditedIds).toHaveLength(1)
    expect(result.totalCredited).toBe(1)
  })

  it("credits rows FIFO (by played_at ASC) even if passed out of order", () => {
    const rows = [
      makeRow("later", "2026-09-06T10:30:00Z"),
      makeRow("earlier", "2026-09-06T10:00:00Z"),
    ]
    const result = credit(rows, emptyCounts, emptyCounts, 40, 400, TZ_UTC)
    expect(result.creditedIds[0]).toBe("earlier")
    expect(result.creditedIds[1]).toBe("later")
  })
})

// ── hourly cap ────────────────────────────────────────────────────────────────

describe("credit — hourly cap", () => {
  it("40th row in the hour is credited; 41st is not", () => {
    // 41 rows, all within the same UTC hour
    const rows = makeRows(41, "2026-09-06T10:00:00Z", 60_000)
    const result = credit(rows, emptyCounts, emptyCounts, 40, 400, TZ_UTC)
    expect(result.creditedIds).toHaveLength(40)
    expect(result.uncreditedIds).toHaveLength(1)
    expect(result.uncreditedIds[0]).toBe("row-40")
  })

  it("existing hour count from DB counts toward the cap", () => {
    // 5 already credited this hour (from DB)
    const existingHour = new Map([["2026-09-06T10", 5]])
    const existingDay  = new Map([["2026-09-06", 5]])
    // Adding 36 more puts us at 41 — last one should be uncredited
    const rows = makeRows(36, "2026-09-06T10:01:00Z", 60_000)
    const result = credit(rows, existingHour, existingDay, 40, 400, TZ_UTC)
    expect(result.creditedIds).toHaveLength(35)
    expect(result.uncreditedIds).toHaveLength(1)
  })

  it("cap resets across hours — rows in a new hour are credited again", () => {
    // 41 in the 10:xx hour (40 credited, 1 not) + 1 in the 11:xx hour
    const rowsHour1 = makeRows(41, "2026-09-06T10:00:00Z", 60_000)
    const rowHour2  = makeRow("next-hour", "2026-09-06T11:00:00Z")
    const result = credit([...rowsHour1, rowHour2], emptyCounts, emptyCounts, 40, 400, TZ_UTC)
    expect(result.creditedIds).toContain("next-hour")
    expect(result.totalCredited).toBe(41)
  })
})

// ── daily cap ─────────────────────────────────────────────────────────────────

describe("credit — daily cap", () => {
  it("400th row in the day is credited; 401st is not", () => {
    // spread across 10 hours so hourly cap (40/hr) is never hit
    const rows: ScrobbleRow[] = []
    for (let h = 0; h < 10; h++) {
      for (let m = 0; m < 40; m++) {
        const iso = `2026-09-06T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`
        rows.push(makeRow(`r-${h}-${m}`, iso))
      }
    }
    // rows.length === 400; add one more in a new hour
    rows.push(makeRow("over-daily", "2026-09-06T11:00:00Z"))
    expect(rows).toHaveLength(401)

    const result = credit(rows, emptyCounts, emptyCounts, 40, 400, TZ_UTC)
    expect(result.creditedIds).toHaveLength(400)
    expect(result.uncreditedIds).toContain("over-daily")
  })
})

// ── dayDeltas aggregation ─────────────────────────────────────────────────────

describe("credit — dayDeltas", () => {
  it("aggregates credited rows into per-day deltas", () => {
    const rows = [
      makeRow("d1a", "2026-09-06T10:00:00Z"),
      makeRow("d1b", "2026-09-06T11:00:00Z"),
      makeRow("d2a", "2026-09-07T09:00:00Z"),
    ]
    const { dayDeltas } = credit(rows, emptyCounts, emptyCounts, 40, 400, TZ_UTC)
    expect(dayDeltas).toHaveLength(2)

    const day1 = dayDeltas.find((d) => d.activity_date === "2026-09-06")!
    const day2 = dayDeltas.find((d) => d.activity_date === "2026-09-07")!
    expect(day1.track_count).toBe(2)
    expect(day1.points).toBe(2)
    expect(day2.track_count).toBe(1)
    expect(day2.points).toBe(1)
  })

  it("uncredited rows are excluded from dayDeltas", () => {
    // 41 rows in same hour — 40 credited, 1 not
    const rows = makeRows(41, "2026-09-06T10:00:00Z", 60_000)
    const { dayDeltas } = credit(rows, emptyCounts, emptyCounts, 40, 400, TZ_UTC)
    expect(dayDeltas[0].track_count).toBe(40)
    expect(dayDeltas[0].points).toBe(40)
  })
})

// ── timezone bucketing ────────────────────────────────────────────────────────

describe("credit — per-user timezone", () => {
  it("23:59 UTC is next calendar day in Asia/Manila (UTC+8)", () => {
    // 2026-09-06T23:59:00Z = 2026-09-07T07:59:00+08:00 → local day: 2026-09-07
    const rows = [makeRow("late-utc", "2026-09-06T23:59:00Z")]
    const { dayDeltas } = credit(rows, emptyCounts, emptyCounts, 40, 400, TZ_MANILA)
    expect(dayDeltas[0].activity_date).toBe("2026-09-07")
  })

  it("00:01 UTC is still previous calendar day in Manila", () => {
    // 2026-09-06T00:01:00Z = 2026-09-06T08:01:00+08:00 → local day: 2026-09-06
    const rows = [makeRow("early-utc", "2026-09-06T00:01:00Z")]
    const { dayDeltas } = credit(rows, emptyCounts, emptyCounts, 40, 400, TZ_MANILA)
    expect(dayDeltas[0].activity_date).toBe("2026-09-06")
  })

  it("hourly cap is applied within the user's local hour", () => {
    // 2026-09-06T00:30:00Z to ...T01:10:00Z = all Manila local hour 08:xx
    // (UTC+8 means 00:xx–00:59 UTC → 08:xx Manila, 01:00 UTC → 09:00 Manila)
    // Put 40 rows in Manila 08:xx, 1 row in Manila 09:xx — all should be credited
    const hour8Rows = makeRows(40, "2026-09-06T00:00:00Z", 60_000)  // Manila 08:00–08:39
    const hour9Row  = makeRow("manila-9", "2026-09-06T01:00:00Z")    // Manila 09:00
    const result = credit([...hour8Rows, hour9Row], emptyCounts, emptyCounts, 40, 400, TZ_MANILA)
    expect(result.totalCredited).toBe(41)
  })

  it("DST spring-forward: rows in the skipped hour still credit correctly", () => {
    // America/New_York 2026-03-08: clocks spring forward 02:00 → 03:00.
    // 2026-03-08T07:00:00Z = 02:00 EST (clock skips to 03:00 EDT).
    // Rows at 07:xx UTC land in the "missing" local hour; @date-fns/tz handles
    // DST by mapping them to 03:xx EDT instead — they should still be credited.
    const rows = makeRows(5, "2026-03-08T07:00:00Z", 60_000)
    const result = credit(rows, emptyCounts, emptyCounts, 40, 400, TZ_NY)
    expect(result.creditedIds).toHaveLength(5)
    expect(result.uncreditedIds).toHaveLength(0)
  })
})
