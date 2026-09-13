import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Music, ArrowLeft } from "lucide-react"
import { getHistoryPage } from "@/app/(app)/history/actions"
import { HistoryList } from "@/app/(app)/history/_components/history-list"

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const rows = await getHistoryPage(user.id)

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-foreground bg-primary flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-foreground">
              Listening history
            </h1>
            <p className="text-sm text-muted-foreground">
              Every play, and the points it earned.
            </p>
          </div>
        </div>
      </div>

      {rows.length === 0 ? <EmptyState /> : <HistoryList initialRows={rows} />}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-white border-2 border-foreground rounded-2xl shadow-hard px-6 py-12 text-center">
      <div className="w-14 h-14 rounded-full border-2 border-foreground bg-[#FBBF24] flex items-center justify-center mx-auto mb-4">
        <Music className="w-6 h-6 text-foreground" />
      </div>
      <p className="font-heading font-bold text-lg text-foreground">
        No tracks yet
      </p>
      <p className="text-muted-foreground text-sm mt-1">
        Start scrobbling on Last.fm — your plays will show up here.
      </p>
    </div>
  )
}
