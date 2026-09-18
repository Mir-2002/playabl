import { format } from "date-fns"
import { TZDate } from "@date-fns/tz"
import { safeTimezone } from "./timezone.ts"

export type ScrobbleRow = { id: string; played_at: string }

export type DayDelta = { activity_date: string; track_count: number; points: number }

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

    const tzDate      = new TZDate(new Date(row.played_at), tz)
    const dayKey      = format(tzDate, "yyyy-MM-dd")
    const hourKey     = format(tzDate, "yyyy-MM-dd'T'HH")
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
