import type { PostgrestError } from "@supabase/supabase-js"

/** PostgREST code for a `.single()` that matched no rows — a genuine
 *  "not found", not a query failure. */
export const PGRST_NO_ROW = "PGRST116"

/**
 * Throw on a real DB error so a transient failure can't masquerade as
 * empty/absent data (a false zero streak, empty heatmap, or 404'd profile).
 *
 * With `allowNoRow`, a `.single()` that found nothing (PGRST116) is tolerated
 * so the caller can fall back to its own default; any other error still throws.
 */
export function throwOnDbError(
  error: PostgrestError | null,
  { allowNoRow = false }: { allowNoRow?: boolean } = {},
): void {
  if (error && !(allowNoRow && error.code === PGRST_NO_ROW)) {
    throw new Error(error.message)
  }
}
