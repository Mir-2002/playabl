"use server"

import { createClient } from "@/lib/supabase/server"
import { computeStreaks } from "@/lib/streaks"
import { TZDate } from "@date-fns/tz"
import { format, subDays } from "date-fns"

const MANILA = "Asia/Manila"

function toManilaDay(isoString: string): string {
  return format(new TZDate(new Date(isoString), MANILA), "yyyy-MM-dd")
}

export function todayInManila(): string {
  return format(new TZDate(new Date(), MANILA), "yyyy-MM-dd")
}

export type StreakStats = {
  currentStreak: number
  longestStreak: number
}

export async function getStreakStats(userId: string): Promise<StreakStats> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("listening_events")
    .select("played_at")
    .eq("user_id", userId)

  const uniqueDays = [
    ...new Set((data ?? []).map((e) => toManilaDay(e.played_at))),
  ].sort()

  return computeStreaks(uniqueDays, todayInManila())
}

export type HeatmapDay = {
  date: string
  totalMs: number
}

export async function getHeatmapData(userId: string): Promise<HeatmapDay[]> {
  const supabase = await createClient()
  const oneYearAgo = subDays(new TZDate(new Date(), MANILA), 365).toISOString()

  const { data } = await supabase
    .from("listening_events")
    .select("played_at, duration_ms")
    .eq("user_id", userId)
    .gte("played_at", oneYearAgo)

  const totals = new Map<string, number>()
  for (const event of data ?? []) {
    const day = toManilaDay(event.played_at)
    totals.set(day, (totals.get(day) ?? 0) + event.duration_ms)
  }

  return Array.from(totals.entries()).map(([date, totalMs]) => ({ date, totalMs }))
}
