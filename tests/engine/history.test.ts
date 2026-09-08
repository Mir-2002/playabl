import { describe, expect, it } from "vitest";
import {
  HISTORY_PAGE_SIZE,
  hasMorePages,
  keysetCursor,
  pointsForDuration,
} from "../../lib/history";

describe("pointsForDuration", () => {
  it("credits 1 point per second, rounded", () => {
    expect(pointsForDuration(180_000)).toBe(180); // 3 min track
    expect(pointsForDuration(0)).toBe(0);
  });

  it("rounds to the nearest whole second", () => {
    expect(pointsForDuration(1_499)).toBe(1); // 1.499s → 1
    expect(pointsForDuration(1_500)).toBe(2); // 1.5s → 2
    expect(pointsForDuration(200_040)).toBe(200); // Blinding Lights
  });
});

describe("keysetCursor", () => {
  // Rows are rendered newest-first, so the last row is the oldest shown — the
  // next page is queried strictly older than this cursor (played_at < cursor),
  // which is what guarantees no overlap or gap against the loaded rows.
  const rows = [
    { played_at: "2026-09-08T10:05:00.000Z" },
    { played_at: "2026-09-08T10:04:00.000Z" },
    { played_at: "2026-09-08T10:03:00.000Z" },
  ];

  it("returns the oldest loaded row's played_at as the next cursor", () => {
    expect(keysetCursor(rows)).toBe("2026-09-08T10:03:00.000Z");
  });

  it("returns null when there are no rows yet", () => {
    expect(keysetCursor([])).toBeNull();
  });
});

describe("hasMorePages", () => {
  it("signals more when a full page came back", () => {
    expect(hasMorePages(HISTORY_PAGE_SIZE)).toBe(true);
  });

  it("signals the end when a short (or empty) page came back", () => {
    expect(hasMorePages(HISTORY_PAGE_SIZE - 1)).toBe(false);
    expect(hasMorePages(0)).toBe(false);
  });
});
