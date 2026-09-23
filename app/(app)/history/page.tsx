import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Music } from "lucide-react"
import { getHistoryPage } from "@/app/(app)/history/actions"
import { HistoryList } from "@/app/(app)/history/_components/history-list"
import { todayInTimezone } from "@/lib/user-time"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [rows, { data: profile }] = await Promise.all([
    getHistoryPage(user.id),
    supabase.from("profiles").select("timezone").eq("id", user.id).single(),
  ])

  const timezone = profile?.timezone ?? "UTC"
  const today    = todayInTimezone(timezone)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listening history"
        subtitle="Every play, and the points it earned."
        icon={<Music className="w-5 h-5 text-white" />}
        iconBg="bg-primary"
        backHref="/home"
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<Music className="w-6 h-6 text-foreground" />}
          title="No tracks yet"
          body="Start scrobbling on Last.fm — your plays will show up here."
          accentColor="#FBBF24"
        />
      ) : (
        <HistoryList initialRows={rows} timezone={timezone} today={today} />
      )}
    </div>
  )
}
