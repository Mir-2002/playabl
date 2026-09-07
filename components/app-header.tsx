import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/app/auth/actions"
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
          <div className="flex items-center gap-4">
            <Link
              href="/friends"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-foreground text-sm font-medium hover:bg-[#FBBF24] transition-colors duration-200"
            >
              Friends
              {pendingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-2.5">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-foreground"
                  style={{ boxShadow: "2px 2px 0px 0px #1E293B" }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full border-2 border-foreground bg-primary flex items-center justify-center text-white text-xs font-bold"
                  style={{ boxShadow: "2px 2px 0px 0px #1E293B" }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-foreground">
                {displayName}
              </span>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-full border-2 border-foreground text-sm font-medium hover:bg-[#FBBF24] transition-colors duration-200"
              >
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  )
}
