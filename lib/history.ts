// Pure helpers for the listening-history page. Kept free of Supabase/Next
// imports so they're unit-testable and reusable by both the RSC page and the
// "load more" server action.

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
