import { notFound, permanentRedirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppHeader } from "@/components/app-header"
import { ActivityHeatmap } from "@/components/activity-heatmap"
import { FriendButton } from "./_components/friend-button"
import {
  fetchPublicProfile,
  fetchPublicStreakStats,
  fetchPublicHeatmapData,
  fetchFriendshipStatus,
} from "./actions"
import { todayInTimezone } from "@/lib/user-time"
import { Flame, Music, Activity } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const profile = await fetchPublicProfile(username)
  const name = profile?.username ?? "Listener"
  return { title: `${name} — Playabl` }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params

  const supabase = await createClient()
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser()

  const profile = await fetchPublicProfile(username)

  if (!profile) notFound()

  // Redirect to canonical casing (e.g. /u/rj → /u/RJ)
  if (profile.username !== username) permanentRedirect(`/u/${profile.username}`)

  const [streaks, heatmapData, friendship] = await Promise.all([
    fetchPublicStreakStats(profile.id),
    fetchPublicHeatmapData(profile.id),
    fetchFriendshipStatus(profile.id, viewer?.id),
  ])

  const displayName = profile.username
  const isOwner = viewer?.id === profile.id
  const today = todayInTimezone(profile?.timezone ?? "UTC")

  return (
    <div className="min-h-screen bg-background bg-dots">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* Profile card — responsive header with no overlap at 390px */}
        <div className="bg-white border-2 border-foreground rounded-2xl p-6 sm:p-8 shadow-hard-lg animate-pop-in">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                width={72}
                height={72}
                className="rounded-full border-2 border-foreground flex-shrink-0 self-start sm:self-auto"
                style={{ boxShadow: "4px 4px 0px 0px #1E293B" }}
              />
            ) : (
              <div
                className="w-[72px] h-[72px] rounded-full border-2 border-foreground bg-primary flex-shrink-0 flex items-center justify-center text-white text-2xl font-bold self-start sm:self-auto"
                style={{ boxShadow: "4px 4px 0px 0px #1E293B" }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
                Playabl Profile
              </p>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-foreground mt-0.5 truncate">
                {displayName}
              </h1>
            </div>

            <div className="flex-shrink-0 self-start sm:self-auto">
              <FriendButton
                profileUserId={profile.id}
                username={profile.username}
                viewerId={viewer?.id ?? null}
                isOwner={isOwner}
                status={friendship.status}
                requestId={friendship.requestId}
              />
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid sm:grid-cols-2 gap-10 mt-2">
          <StatCard
            icon={<Music className="w-5 h-5 text-white" />}
            label="Total Points"
            value={profile.total_points > 0 ? profile.total_points.toLocaleString() : "0"}
            note={
              profile.total_points > 0
                ? "Credited scrobbles"
                : "No listening activity yet"
            }
            accent="violet"
            index={0}
          />
          <StatCard
            icon={<Flame className="w-5 h-5 text-white" />}
            label="Current Streak"
            value={
              streaks.currentStreak > 0
                ? `${streaks.currentStreak} day${streaks.currentStreak === 1 ? "" : "s"}`
                : "—"
            }
            note={
              streaks.currentStreak > 0
                ? `Longest: ${streaks.longestStreak} day${streaks.longestStreak === 1 ? "" : "s"}`
                : "Listen daily to build a streak"
            }
            accent="pink"
            index={1}
          />
        </div>

        {/* Activity heatmap */}
        <div className="bg-white border-2 border-foreground rounded-2xl p-6 shadow-hard">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full border-2 border-foreground bg-[#34D399] flex items-center justify-center">
              <Activity className="w-5 h-5 text-foreground" />
            </div>
            <h2 className="font-heading font-bold text-xl">Activity</h2>
          </div>
          <ActivityHeatmap data={heatmapData} today={today} />
        </div>
      </main>
    </div>
  )
}
