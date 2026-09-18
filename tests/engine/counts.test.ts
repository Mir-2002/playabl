import { describe, expect, it } from "vitest"
import {
  buildDayCounts,
  buildHourCounts,
  credit,
  localDayKey,
  localHourKey,
  type ScrobbleRow,
} from "../../supabase/functions/_shared/credit"

const TZ_UTC    = "UTC"
const TZ_MANILA = "Asia/Manila" // UTC+8, no DST

// ── buildDayCounts — the durable per-day source (audit F3 fix) ─────────────────

describe("buildDayCounts", () => {
  it("reads track_count durably, past the 100-row retention window", () => {
    // daily_activity keeps a permanent per-local-day credited count, so a day
    // with 400 credited plays reports 400 even though listening_events would
    // only retain the newest 100 rows.
    const counts = buildDayCounts([{ activity_date: "2026-09-18", track_count: 400 }])
    expect(counts.get("2026-09-18")).toBe(400)
  })

  it("keys each activity_date to its track_count", () => {
    // daily_activity is UNIQUE (user_id, activity_date): one row per day.
    const counts = buildDayCounts([
      { activity_date: "2026-09-18", track_count: 10 },
      { activity_date: "2026-09-19", track_count: 3 },
    ])
    expect(counts.get("2026-09-18")).toBe(10)
    expect(counts.get("2026-09-19")).toBe(3)
  })

  it("is empty for no rows (first scrobble of the day → count 0)", () => {
    const counts = buildDayCounts([])
    expect(counts.get("2026-09-18")).toBeUndefined()
  })
})

// ── F3 lock: a day already at the durable cap admits no more credits ───────────

describe("credit — daily cap enforced from the durable count (F3)", () => {
  it("credits 0 when daily_activity already reports the day at the cap", () => {
    const dailyCap = 400
    // The durable per-day count says the user is already at 400 credited today —
    // this is what the pruned listening_events reconstruction could NOT see
    // (it maxed out at ~100), letting over-cap scrobbles get re-credited.
    const existingDayCounts = buildDayCounts([
      { activity_date: "2026-09-18", track_count: dailyCap },
    ])

    const pending: ScrobbleRow[] = Array.from({ length: 10 }, (_, i) => ({
      id: `p-${i}`,
      played_at: new Date(Date.parse("2026-09-18T12:00:00Z") + i * 60_000).toISOString(),
    }))

    const result = credit(pending, new Map(), existingDayCounts, 40, dailyCap, TZ_UTC)

    expect(result.creditedIds).toEqual([])
    expect(result.uncreditedIds).toHaveLength(10)
    expect(result.totalCredited).toBe(0)
    expect(result.dayDeltas).toEqual([])
  })

  it("still credits up to the remaining daily headroom", () => {
    const dailyCap = 400
    const existingDayCounts = buildDayCounts([
      { activity_date: "2026-09-18", track_count: 398 },
    ])
    // Spread across distinct hours so the hourly cap (40) never binds first.
    const pending: ScrobbleRow[] = Array.from({ length: 5 }, (_, i) => ({
      id: `p-${i}`,
      played_at: new Date(Date.parse("2026-09-18T00:00:00Z") + i * 3_600_000).toISOString(),
    }))

    const result = credit(pending, new Map(), existingDayCounts, 40, dailyCap, TZ_UTC)

    // 398 + 2 = 400; the remaining 3 exceed the cap.
    expect(result.creditedIds).toHaveLength(2)
    expect(result.uncreditedIds).toHaveLength(3)
  })
})

// ── buildHourCounts — hour bucketing from credited listening_events ────────────

describe("buildHourCounts", () => {
  it("buckets two rows in the same local hour to 2 (UTC)", () => {
    const counts = buildHourCounts(
      [{ played_at: "2026-09-18T10:15:00Z" }, { played_at: "2026-09-18T10:45:00Z" }],
      TZ_UTC,
    )
    expect(counts.get("2026-09-18T10")).toBe(2)
  })

  it("buckets by the user's local hour, not UTC (Manila, UTC+8)", () => {
    // 18:30Z and 19:30Z are both 02:xx and 03:xx next local day in Manila... but
    // 18:30Z → 02:30 (2026-09-19) and 19:30Z → 03:30 (2026-09-19): distinct hours.
    const counts = buildHourCounts(
      [{ played_at: "2026-09-18T18:30:00Z" }, { played_at: "2026-09-18T19:30:00Z" }],
      TZ_MANILA,
    )
    expect(counts.get("2026-09-19T02")).toBe(1)
    expect(counts.get("2026-09-19T03")).toBe(1)
  })

  it("groups same-local-hour rows across a UTC hour that maps to one Manila hour", () => {
    // 18:00Z and 18:59Z both fall in Manila local hour 02 (2026-09-19).
    const counts = buildHourCounts(
      [{ played_at: "2026-09-18T18:00:00Z" }, { played_at: "2026-09-18T18:59:00Z" }],
      TZ_MANILA,
    )
    expect(counts.get("2026-09-19T02")).toBe(2)
  })
})

// ── key helpers agree with credit()'s internal bucketing ───────────────────────

describe("localDayKey / localHourKey", () => {
  it("day/hour keys reflect the user's timezone", () => {
    // 2026-09-18T18:30:00Z → 2026-09-19 02:30 in Manila.
    expect(localDayKey("2026-09-18T18:30:00Z", TZ_MANILA)).toBe("2026-09-19")
    expect(localHourKey("2026-09-18T18:30:00Z", TZ_MANILA)).toBe("2026-09-19T02")
    expect(localDayKey("2026-09-18T18:30:00Z", TZ_UTC)).toBe("2026-09-18")
    expect(localHourKey("2026-09-18T18:30:00Z", TZ_UTC)).toBe("2026-09-18T18")
  })
})
