import { notFound } from "next/navigation"
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
import type { Metadata } from "next"

interface Props {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params
  const profile = await fetchPublicProfile(userId)
  const name = profile?.username ?? "Listener"
  return { title: `${name} — Playabl` }
}

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params

  const supabase = await createClient()
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser()

  const [profile, streaks, heatmapData, friendship] = await Promise.all([
    fetchPublicProfile(userId),
    fetchPublicStreakStats(userId),
    fetchPublicHeatmapData(userId),
    fetchFriendshipStatus(userId, viewer?.id),
  ])

  if (!profile) notFound()

  const displayName = profile.username ?? "Listener"
  const isOwner = viewer?.id === userId
  const today = todayInTimezone(profile?.timezone ?? "UTC")

  return (
    <div className="min-h-screen bg-background bg-dots">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Profile card */}
        <div className="bg-white border-2 border-foreground rounded-2xl p-8 shadow-hard-lg flex items-center gap-6">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              width={72}
              height={72}
              className="rounded-full border-2 border-foreground flex-shrink-0"
              style={{ boxShadow: "4px 4px 0px 0px #1E293B" }}
            />
          ) : (
            <div
              className="w-[72px] h-[72px] rounded-full border-2 border-foreground bg-primary flex-shrink-0 flex items-center justify-center text-white text-2xl font-bold"
              style={{ boxShadow: "4px 4px 0px 0px #1E293B" }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
              Playabl Profile
            </p>
            <h1 className="font-heading font-extrabold text-3xl text-foreground mt-0.5 truncate">
              {displayName}
            </h1>
          </div>

          <div className="flex-shrink-0">
            <FriendButton
              profileUserId={userId}
              viewerId={viewer?.id ?? null}
              isOwner={isOwner}
              status={friendship.status}
              requestId={friendship.requestId}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white border-2 border-foreground rounded-2xl p-6 shadow-hard-violet">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Total Points
                </p>
                <p className="font-heading font-extrabold text-5xl text-foreground mt-2">
                  {profile.total_points > 0
                    ? profile.total_points.toLocaleString()
                    : "0"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-foreground bg-primary flex items-center justify-center flex-shrink-0">
                <Music className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {profile.total_points > 0
                ? "Accumulated listening time"
                : "No listening activity yet"}
            </p>
          </div>

          <div className="bg-white border-2 border-foreground rounded-2xl p-6 shadow-hard-pink">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Current Streak
                </p>
                <p className="font-heading font-extrabold text-5xl text-foreground mt-2">
                  {streaks.currentStreak > 0
                    ? `${streaks.currentStreak} day${streaks.currentStreak === 1 ? "" : "s"}`
                    : "—"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-foreground bg-[#F472B6] flex items-center justify-center flex-shrink-0">
                <Flame className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {streaks.currentStreak > 0
                ? `Longest: ${streaks.longestStreak} day${streaks.longestStreak === 1 ? "" : "s"}`
                : "Listen daily to build a streak"}
            </p>
          </div>
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
