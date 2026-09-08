"use server"

import { createClient } from "@/lib/supabase/server"
import { toManilaDay, todayInManila } from "@/lib/manila-time"
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
  const [{ data: events }, { data: profile }] = await Promise.all([
    supabase
      .from("listening_events")
      .select("played_at")
      .eq("user_id", userId),
    supabase
      .from("profiles")
      .select("created_at")
      .eq("id", userId)
      .single(),
  ])

  const today = todayInManila()
  const signupDay = profile?.created_at ? toManilaDay(profile.created_at) : today

  const qualifyingDays = [
    ...new Set((events ?? []).map((e) => toManilaDay(e.played_at))),
  ]
    .filter((d) => d >= signupDay)
    .sort()

  const { currentStreak, longestStreak } = computeStreaks(qualifyingDays, today)

  return { qualifyingDays, signupDay, currentStreak, longestStreak, today }
}
