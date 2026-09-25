"use server"

import { createClient } from "@/lib/supabase/server"
import { HISTORY_PAGE_SIZE } from "@/lib/history"

export type HistoryRow = {
  track_id:   string | null
  track_name: string
  artist:     string
  album:      string | null
  image_url:  string | null
  credited:   boolean
  played_at:  string
}

const SELECT = "track_id, track_name, artist, album, image_url, credited, played_at"

/** First page of the current user's plays, newest first. */
export async function getHistoryPage(userId: string): Promise<HistoryRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("listening_events")
    .select(SELECT)
    .eq("user_id", userId)
    .order("played_at", { ascending: false })
    .limit(HISTORY_PAGE_SIZE)

  if (error) throw new Error(error.message)
  return (data ?? []) as HistoryRow[]
}

/**
 * Keyset "load more": the next page of plays strictly older than `cursor`.
 */
export async function getMoreHistory(cursor: string): Promise<HistoryRow[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("listening_events")
    .select(SELECT)
    .eq("user_id", user.id)
    .lt("played_at", cursor)
    .order("played_at", { ascending: false })
    .limit(HISTORY_PAGE_SIZE)

  if (error) throw new Error(error.message)
  return (data ?? []) as HistoryRow[]
}
