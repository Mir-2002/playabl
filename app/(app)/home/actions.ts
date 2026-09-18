"use server"

import { createClient } from "@/lib/supabase/server"
import { computeStreaks } from "@/lib/streaks"
import { todayInTimezone } from "@/lib/user-time"
import { subDays } from "date-fns"
import { env } from "@/lib/env"
import { safeTimezone } from "@/supabase/functions/_shared/timezone"
import { throwOnDbError } from "@/lib/supabase/errors"
import { parseNowPlaying } from "../../../supabase/functions/_shared/lastfm"
import type { NowPlaying } from "../../../supabase/functions/_shared/lastfm"

export type StreakStats = {
  currentStreak: number
  longestStreak: number
}

export async function getStreakStats(userId: string): Promise<StreakStats> {
  const supabase = await createClient()
  const [{ data: activity, error: activityError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase
        .from("daily_activity")
        .select("activity_date")
        .eq("user_id", userId)
        .gte("track_count", 1),
      supabase.from("profiles").select("timezone, created_at").eq("id", userId).single(),
    ])

  // Distinguish a real DB error from "no activity": a failed read must not
  // render as a zero streak. A missing profile row is tolerated via the
  // UTC/today fallbacks below.
  throwOnDbError(activityError)
  throwOnDbError(profileError, { allowNoRow: true })

  const timezone      = profile?.timezone ?? "UTC"
  const today         = todayInTimezone(timezone)
  const signupDay     = profile?.created_at?.slice(0, 10) ?? today
  const qualifyingDays = (activity ?? [])
    .map((r) => r.activity_date as string)
    .filter((d) => d >= signupDay)
    .sort()

  return computeStreaks(qualifyingDays, today)
}

export type HeatmapDay = {
  date:  string
  count: number
}

export async function getHeatmapData(userId: string): Promise<HeatmapDay[]> {
  const supabase  = await createClient()
  const oneYearAgo = subDays(new Date(), 371).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from("daily_activity")
    .select("activity_date, track_count")
    .eq("user_id", userId)
    .gte("activity_date", oneYearAgo)

  // A transient read error must surface (caught by the section boundary), not
  // masquerade as an empty heatmap.
  throwOnDbError(error)

  return (data ?? []).map((r) => ({
    date:  r.activity_date as string,
    count: r.track_count,
  }))
}

export async function setTimezone(tz: string): Promise<void> {
  // Reject bogus IANA strings at the boundary so a browser quirk / spoofed
  // value can never wedge the crediting engine or 500 a render.
  if (safeTimezone(tz) !== tz) return
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from("profiles").update({ timezone: tz }).eq("id", user.id)
}

export async function getNowPlaying(): Promise<NowPlaying | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles").select("username").eq("id", user.id).single()
  const username = profile?.username
  if (!username) return null

  try {
    const url = new URL("https://ws.audioscrobbler.com/2.0/")
    url.searchParams.set("method", "user.getRecentTracks")
    url.searchParams.set("user", username)
    url.searchParams.set("api_key", env.LASTFM_API_KEY)
    url.searchParams.set("format", "json")
    url.searchParams.set("limit", "1")
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    return parseNowPlaying(await res.json())
  } catch {
    return null
  }
}
