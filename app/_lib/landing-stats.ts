import { unstable_cache } from "next/cache"
import { createPublicClient } from "@/lib/supabase/public"

export interface LandingStats {
  listeners: number
  totalPoints: number
  daysTracked: number
}

// One 5-min shared cache entry for the whole "by the numbers" band; concurrent
// visitors collapse to ~1 query / 5 min. Throws on any error — the caller
// (app/page.tsx) catches and omits the section so the landing page never 500s.
export const getLandingStats = unstable_cache(
  async (): Promise<LandingStats> => {
    // Cookieless anon client: `unstable_cache` forbids reading cookies/headers.
    // Both tables are public-read RLS, so the anon key sees everything it needs.
    const supabase = createPublicClient()

    const [users, points, days] = await Promise.all([
      // 1. Listeners — exact head-only count, no rows transferred.
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      // 2. Total points — pull the ints, sum in JS (spec decision 10).
      supabase.from("profiles").select("total_points"),
      // 3. Days tracked — count qualifying active days across all users.
      supabase
        .from("daily_activity")
        .select("user_id", { count: "exact", head: true })
        .gte("track_count", 1),
    ])

    if (users.error) throw new Error(users.error.message)
    if (points.error) throw new Error(points.error.message)
    if (days.error) throw new Error(days.error.message)

    const totalPoints =
      points.data?.reduce((sum, p) => sum + (p.total_points ?? 0), 0) ?? 0

    return {
      listeners: users.count ?? 0,
      totalPoints,
      daysTracked: days.count ?? 0,
    }
  },
  ["landing-stats"],
  { revalidate: 300 },
)
