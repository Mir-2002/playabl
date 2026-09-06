import { format, parseISO, subDays, differenceInCalendarDays } from "date-fns"

export function computeStreaks(
  activeDays: string[],
  today: string,
): { currentStreak: number; longestStreak: number } {
  if (activeDays.length === 0) return { currentStreak: 0, longestStreak: 0 }

  const daySet = new Set(activeDays)
  const sorted = [...daySet].sort()

  // Longest streak: walk sorted unique days, count consecutive runs.
  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    const gap = differenceInCalendarDays(parseISO(sorted[i]), parseISO(sorted[i - 1]))
    if (gap === 1) {
      run++
      if (run > longest) longest = run
    } else {
      run = 1
    }
  }

  // Current streak: seed from today, or yesterday, then walk back.
  const yesterday = format(subDays(parseISO(today), 1), "yyyy-MM-dd")
  const seed = daySet.has(today) ? today : daySet.has(yesterday) ? yesterday : null

  let currentStreak = 0
  if (seed) {
    currentStreak = 1
    let lookback = parseISO(seed)
    while (true) {
      lookback = subDays(lookback, 1)
      if (daySet.has(format(lookback, "yyyy-MM-dd"))) {
        currentStreak++
      } else {
        break
      }
    }
  }

  return { currentStreak, longestStreak: Math.max(longest, currentStreak) }
}
