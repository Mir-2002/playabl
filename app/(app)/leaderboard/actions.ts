import { unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/database.types"

export type LeaderboardEntry = Pick<
  Tables<"profiles">,
  "id" | "username" | "avatar_url" | "total_points" | "created_at"
>

// unstable_cache shares one DB result across all concurrent viewers.
// revalidate: 30 means at most one fresh query every 30 s regardless of
// how many tabs or users are polling, collapsing N×/min to ~2/min total.
export const getLeaderboard = unstable_cache(
  async (): Promise<LeaderboardEntry[]> => {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, total_points, created_at")
      .order("total_points", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(100)

    if (error) throw new Error(error.message)

    return data ?? []
  },
  ["leaderboard"],
  { revalidate: 30 },
)
