"use server"

import { createClient } from "@/lib/supabase/server"
import { todayInTimezone } from "@/lib/user-time"
import { computeStreaks } from "@/lib/streaks"

export type StreakCalendarData = {
  qualifyingDays: string[]
  signupDay: string
  currentStreak: number
  longestStreak: number
  today: string
}

export async function getStreakCalendarData(
  userId: string,
): Promise<StreakCalendarData> {
  const supabase = await createClient()
  const [{ data: activity }, { data: profile }] = await Promise.all([
    supabase
      .from("daily_activity")
      .select("activity_date")
      .eq("user_id", userId)
      .gte("track_count", 1),
    supabase
      .from("profiles")
      .select("timezone, created_at")
      .eq("id", userId)
      .single(),
  ])

  const timezone     = profile?.timezone ?? "UTC"
  const today        = todayInTimezone(timezone)
  const signupDay    = profile?.created_at?.slice(0, 10) ?? today

  const qualifyingDays = (activity ?? [])
    .map((r) => r.activity_date as string)
    .filter((d) => d >= signupDay)
    .sort()

  const { currentStreak, longestStreak } = computeStreaks(qualifyingDays, today)

  return { qualifyingDays, signupDay, currentStreak, longestStreak, today }
}
