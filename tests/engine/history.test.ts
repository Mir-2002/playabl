import { describe, expect, it } from "vitest"
import {
  HISTORY_PAGE_SIZE,
  hasMorePages,
  keysetCursor,
  groupByLocalDay,
} from "../../lib/history"

describe("keysetCursor", () => {
  const rows = [
    { played_at: "2026-09-08T10:05:00.000Z" },
    { played_at: "2026-09-08T10:04:00.000Z" },
    { played_at: "2026-09-08T10:03:00.000Z" },
  ]

  it("returns the oldest loaded row's played_at as the next cursor", () => {
    expect(keysetCursor(rows)).toBe("2026-09-08T10:03:00.000Z")
  })

  it("returns null when there are no rows yet", () => {
    expect(keysetCursor([])).toBeNull()
  })
})

describe("hasMorePages", () => {
  it("signals more when a full page came back", () => {
    expect(hasMorePages(HISTORY_PAGE_SIZE)).toBe(true)
  })

  it("signals the end when a short (or empty) page came back", () => {
    expect(hasMorePages(HISTORY_PAGE_SIZE - 1)).toBe(false)
    expect(hasMorePages(0)).toBe(false)
  })
})

// ── groupByLocalDay ───────────────────────────────────────────────────────────

describe("groupByLocalDay", () => {
  const today = "2026-09-16"

  it("groups contiguous same-day rows into one group", () => {
    const rows = [
      { played_at: "2026-09-16T08:00:00.000Z" },
      { played_at: "2026-09-16T07:00:00.000Z" },
      { played_at: "2026-09-16T06:00:00.000Z" },
    ]
    const groups = groupByLocalDay(rows, "UTC", today)
    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe("Today")
    expect(groups[0].rows).toHaveLength(3)
  })

  it("produces separate groups for different days", () => {
    const rows = [
      { played_at: "2026-09-16T10:00:00.000Z" },
      { played_at: "2026-09-15T22:00:00.000Z" },
      { played_at: "2026-09-14T15:00:00.000Z" },
    ]
    const groups = groupByLocalDay(rows, "UTC", today)
    expect(groups).toHaveLength(3)
    expect(groups[0].label).toBe("Today")
    expect(groups[1].label).toBe("Yesterday")
    expect(groups[2].label).toBe("14 Sep 2026")
  })

  it("buckets a near-midnight play into the correct local day for a non-UTC timezone", () => {
    // 2026-09-07T15:00:00Z = 2026-09-07T23:00:00+08:00 → still Sep 7 in Manila
    // 2026-09-07T17:00:00Z = 2026-09-08T01:00:00+08:00 → Sep 8 in Manila
    const rows = [
      { played_at: "2026-09-07T17:00:00.000Z" },  // Sep 8 Manila
      { played_at: "2026-09-07T15:00:00.000Z" },  // Sep 7 Manila
    ]
    const groups = groupByLocalDay(rows, "Asia/Manila", "2026-09-08")
    expect(groups).toHaveLength(2)
    expect(groups[0].key).toBe("2026-09-08")
    expect(groups[1].key).toBe("2026-09-07")
  })

  it("merges a day split across two loaded pages when re-grouped over the full array", () => {
    // First page ends with a row from Sep 15, second page starts with another Sep 15 row.
    const page1 = [
      { played_at: "2026-09-16T08:00:00.000Z" },
      { played_at: "2026-09-15T20:00:00.000Z" },
    ]
    const page2 = [
      { played_at: "2026-09-15T10:00:00.000Z" },
      { played_at: "2026-09-14T18:00:00.000Z" },
    ]
    const allRows = [...page1, ...page2]
    const groups = groupByLocalDay(allRows, "UTC", today)
    const sep15 = groups.find((g) => g.key === "2026-09-15")
    expect(sep15?.rows).toHaveLength(2)  // both Sep 15 rows merged into one group
  })

  it("returns an empty array for an empty input", () => {
    expect(groupByLocalDay([], "UTC", today)).toEqual([])
  })
})
