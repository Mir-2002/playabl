import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getLeaderboard } from "./actions"
import { LeaderboardClient } from "./_components/leaderboard-client"
import { Trophy } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Leaderboard — Playabl" }

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const initialData = await getLeaderboard()

  return (
    <div className="space-y-8">
      <div className="bg-white border-2 border-foreground rounded-2xl p-8 shadow-hard-lg flex items-center gap-6">
        <div
          className="w-[72px] h-[72px] rounded-full border-2 border-foreground flex-shrink-0 flex items-center justify-center"
          style={{ background: "#FBBF24", boxShadow: "4px 4px 0px 0px #1E293B" }}
        >
          <Trophy className="w-8 h-8 text-foreground" />
        </div>
        <div>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
            Global All-Time
          </p>
          <h1 className="font-heading font-extrabold text-3xl text-foreground mt-0.5">
            Leaderboard
          </h1>
        </div>
        <div className="ml-auto hidden sm:block w-12 h-12 rounded-full bg-[#34D399] border-2 border-foreground" />
      </div>

      <LeaderboardClient initialData={initialData} currentUserId={user.id} />
    </div>
  )
}
