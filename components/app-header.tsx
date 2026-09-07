import { createClient } from "@/lib/supabase/server"
import { UserMenu } from "@/components/user-menu"
import Link from "next/link"

export async function AppHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: { username: string | null; avatar_url: string | null } | null = null
  let pendingCount = 0
  if (user) {
    const [profileResult, pendingResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single(),
      supabase
        .from("friend_requests")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("status", "pending"),
    ])
    profile = profileResult.data
    pendingCount = pendingResult.count ?? 0
  }

  const displayName = profile?.username ?? user?.email ?? "Listener"

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-foreground shadow-hard">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/home"
          className="font-heading font-bold text-xl text-foreground hover:text-primary transition-colors"
        >
          Playabl
        </Link>

        {user && (
          <UserMenu
            userId={user.id}
            displayName={displayName}
            avatarUrl={profile?.avatar_url ?? null}
            pendingCount={pendingCount}
          />
        )}
      </div>
    </header>
  )
}
