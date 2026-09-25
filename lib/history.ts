// Pure helpers for the listening-history page. Kept free of Supabase/Next
// imports so they're unit-testable and reusable by both the RSC page and the
// "load more" server action.

import { TZDate } from "@date-fns/tz"
import { format, subDays } from "date-fns"

/** Rows fetched per history page (server-rendered first page + each "load more"). */
export const HISTORY_PAGE_SIZE = 50

/**
 * The keyset cursor for the next "load more" request: the `played_at` of the
 * last (oldest) row currently shown. The server action queries strictly older
 * than this (`played_at < cursor`), so it guarantees no overlap or gap against
 * the page that ended at this cursor. Null when there are no rows yet.
 */
export function keysetCursor<T extends { played_at: string }>(
  rows: T[],
): string | null {
  return rows.length ? rows[rows.length - 1]!.played_at : null
}

/**
 * Whether another page may exist. A full page (exactly `HISTORY_PAGE_SIZE` rows)
 * means there could be more; a short page is the end of the list.
 */
export function hasMorePages(pageLength: number): boolean {
  return pageLength === HISTORY_PAGE_SIZE
}

// ── Day grouping ───────────────────────────────────────────────────────────────

export type DayGroup<T> = { key: string; label: string; rows: T[] }

/**
 * Group rows (newest-first) by the user's local calendar day.
 *
 * Re-grouping the full loaded array each render means a day split across two
 * keyset pages automatically merges into one group.
 */
export function groupByLocalDay<T extends { played_at: string }>(
  rows: T[],
  timezone: string,
  today: string,
): DayGroup<T>[] {
  const groups: DayGroup<T>[] = []
  let current: DayGroup<T> | null = null
  for (const row of rows) {
    const key = format(new TZDate(new Date(row.played_at), timezone), "yyyy-MM-dd")
    if (!current || current.key !== key) {
      current = { key, label: dayLabel(key, today), rows: [] }
      groups.push(current)
    }
    current.rows.push(row)
  }
  return groups
}

function dayLabel(key: string, today: string): string {
  if (key === today) return "Today"
  const yesterday = format(subDays(new Date(today + "T00:00:00"), 1), "yyyy-MM-dd")
  if (key === yesterday) return "Yesterday"
  return format(new Date(key + "T00:00:00"), "d MMM yyyy")
}
