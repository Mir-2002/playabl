import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getLeaderboard } from "./actions"
import { LeaderboardClient } from "./_components/leaderboard-client"
import { Trophy } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
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
      <PageHeader
        title="Leaderboard"
        subtitle="Global All-Time"
        icon={<Trophy className="w-5 h-5 text-foreground" />}
        iconBg="bg-[#FBBF24]"
      />

      <LeaderboardClient initialData={initialData} currentUserId={user.id} />
    </div>
  )
}
