import { describe, expect, it } from "vitest"
import {
  HISTORY_PAGE_SIZE,
  hasMorePages,
  keysetCursor,
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
