"use server"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/database.types"

export type LeaderboardEntry = Pick<
  Tables<"profiles">,
  "id" | "username" | "avatar_url" | "total_points" | "created_at"
>

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, total_points, created_at")
    .order("total_points", { ascending: false })
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)

  return data ?? []
}
