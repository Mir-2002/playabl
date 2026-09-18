import { format } from "date-fns"
import { TZDate } from "@date-fns/tz"
import { safeTimezone } from "./timezone.ts"

export type ScrobbleRow = { id: string; played_at: string }

export type DayDelta = { activity_date: string; track_count: number; points: number }

/**
 * Local-day key ("yyyy-MM-dd") for a scrobble in the user's IANA timezone.
 * The single definition of day bucketing — used by both credit() and the day
 * count reconstruction so they can never drift.
 */
export function localDayKey(playedAt: string, timezone: string): string {
  return format(new TZDate(new Date(playedAt), safeTimezone(timezone)), "yyyy-MM-dd")
}

/**
 * Local-hour key ("yyyy-MM-dd'T'HH") for a scrobble in the user's IANA timezone.
 */
export function localHourKey(playedAt: string, timezone: string): string {
  return format(new TZDate(new Date(playedAt), safeTimezone(timezone)), "yyyy-MM-dd'T'HH")
}

/**
 * Build the pre-existing per-local-hour credited counts from credited
 * listening_events rows. The hourly cap (40) is always < the 100-row retention
 * window, so a recent hour's credited rows are guaranteed to still be present —
 * this count stays accurate despite the prune.
 */
export function buildHourCounts(
  rows: { played_at: string }[],
  timezone: string,
): Map<string, number> {
  const tz     = safeTimezone(timezone)
  const counts = new Map<string, number>()
  for (const row of rows) {
    const key = localHourKey(row.played_at, tz)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

/**
 * Build the pre-existing per-local-day credited counts from daily_activity
 * rows. daily_activity.track_count is the durable, never-pruned per-local-day
 * credited count (its activity_date is already bucketed in the same tz format
 * localDayKey produces), so the daily cap survives the 100-row prune of
 * listening_events — the fix for the daily-cap bypass (audit F3).
 */
export function buildDayCounts(
  rows: { activity_date: string; track_count: number }[],
): Map<string, number> {
  // daily_activity is UNIQUE (user_id, activity_date) and the caller scopes to
  // one user, so there is exactly one row per day — a straight assignment.
  const counts = new Map<string, number>()
  for (const row of rows) {
    counts.set(row.activity_date, row.track_count)
  }
  return counts
}

export type CreditResult = {
  creditedIds: string[]
  uncreditedIds: string[]
  dayDeltas: DayDelta[]
  totalCredited: number
}

/**
 * Pure two-tier anti-cheat cap function.
 *
 * Processes newRows in FIFO order (by played_at ASC). For each scrobble,
 * buckets it into the user's local hour and local day using the supplied
 * IANA timezone, then credits it only if both the hourly and daily caps
 * have not been reached. Over-cap scrobbles go to uncreditedIds.
 *
 * existingHourCounts / existingDayCounts hold the pre-existing credited
 * counts for each bucket (fetched from the DB before this call). Keys:
 *   - hourKey:  "yyyy-MM-dd'T'HH" in the user's timezone
 *   - dayKey:   "yyyy-MM-dd"       in the user's timezone
 *
 * No DB calls inside this function — all state is passed in.
 */
export function credit(
  newRows: ScrobbleRow[],
  existingHourCounts: Map<string, number>,
  existingDayCounts: Map<string, number>,
  hourlyCap: number,
  dailyCap: number,
  timezone: string,
): CreditResult {
  const tz         = safeTimezone(timezone)
  const hourCounts = new Map(existingHourCounts)
  const dayCounts  = new Map(existingDayCounts)
  const seenIds    = new Set<string>()

  const creditedIds:   string[]              = []
  const uncreditedIds: string[]              = []
  const dayDeltaMap:   Map<string, DayDelta> = new Map()

  const sorted = [...newRows].sort(
    (a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime(),
  )

  for (const row of sorted) {
    if (seenIds.has(row.id)) continue
    seenIds.add(row.id)

    const dayKey      = localDayKey(row.played_at, tz)
    const hourKey     = localHourKey(row.played_at, tz)
    const hourCount   = hourCounts.get(hourKey) ?? 0
    const dayCount    = dayCounts.get(dayKey) ?? 0

    if (hourCount < hourlyCap && dayCount < dailyCap) {
      creditedIds.push(row.id)
      hourCounts.set(hourKey, hourCount + 1)
      dayCounts.set(dayKey, dayCount + 1)

      const existing = dayDeltaMap.get(dayKey)
      if (existing) {
        existing.track_count++
        existing.points++
      } else {
        dayDeltaMap.set(dayKey, { activity_date: dayKey, track_count: 1, points: 1 })
      }
    } else {
      uncreditedIds.push(row.id)
    }
  }

  return {
    creditedIds,
    uncreditedIds,
    dayDeltas: Array.from(dayDeltaMap.values()),
    totalCredited: creditedIds.length,
  }
}
