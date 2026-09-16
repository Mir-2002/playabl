import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Music, Flame, Trophy, Activity } from "lucide-react"
import { getLeaderboard } from "@/app/(app)/leaderboard/actions"
import { LeaderboardClient } from "@/app/(app)/leaderboard/_components/leaderboard-client"
import { getStreakStats, getHeatmapData } from "@/app/(app)/home/actions"
import { ActivityHeatmap } from "@/components/activity-heatmap"
import { todayInTimezone } from "@/lib/user-time"
import { PointsDisplay } from "@/app/(app)/home/_components/points-display"
import { TimezoneSync } from "@/app/(app)/home/_components/timezone-sync"
import { NowPlaying } from "@/app/(app)/home/_components/now-playing"
import { StatCard } from "@/components/ui/stat-card"
import { SkeletonHeatmap, SkeletonRow } from "@/components/ui/skeleton"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [{ data: profile }, streaks] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, avatar_url, total_points, timezone")
      .eq("id", user.id)
      .single(),
    getStreakStats(user.id),
  ])

  const displayName = profile?.username ?? "Listener"
  const timezone    = profile?.timezone ?? "UTC"
  const today       = todayInTimezone(timezone)

  return (
    <div className="space-y-8">
      <TimezoneSync profileTimezone={timezone} />

      {/* Welcome */}
      <div className="bg-white border-2 border-foreground rounded-2xl p-8 shadow-hard-lg flex items-center gap-6 animate-pop-in">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={displayName}
            width={72}
            height={72}
            className="rounded-full border-2 border-foreground flex-shrink-0 hover-wiggle"
            style={{ boxShadow: "4px 4px 0px 0px #1E293B" }}
          />
        ) : (
          <div
            className="w-[72px] h-[72px] rounded-full border-2 border-foreground bg-primary flex-shrink-0 flex items-center justify-center text-white text-2xl font-bold hover-wiggle"
            style={{ boxShadow: "4px 4px 0px 0px #1E293B" }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
            Welcome back
          </p>
          <h1 className="font-heading font-extrabold text-3xl text-foreground mt-0.5">
            {displayName}
          </h1>
        </div>
        <NowPlaying />
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 gap-10 mt-6">
        <Link
          href="/history"
          aria-label="View listening history"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 rounded-2xl"
        >
          <StatCard
            icon={<Music className="w-5 h-5 text-white" />}
            label="Total Points"
            value={
              <PointsDisplay
                currentUserId={user.id}
                initialPoints={profile?.total_points ?? 0}
              />
            }
            note={
              profile?.total_points
                ? "View your listening history"
                : "Start listening to earn points"
            }
            accent="violet"
            index={0}
          />
        </Link>
        <Link
          href="/streak"
          aria-label="View streak calendar"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 rounded-2xl"
        >
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
        </Link>
      </div>

      {/* Activity heatmap — granular Suspense */}
      <div className="bg-white border-2 border-foreground rounded-2xl p-6 shadow-hard">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full border-2 border-foreground bg-[#34D399] flex items-center justify-center">
            <Activity className="w-5 h-5 text-foreground" />
          </div>
          <h2 className="font-heading font-bold text-xl">Activity</h2>
        </div>
        <Suspense fallback={<SkeletonHeatmap />}>
          <HeatmapSection userId={user.id} today={today} />
        </Suspense>
      </div>

      {/* Leaderboard — granular Suspense */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-foreground bg-[#FBBF24] flex items-center justify-center">
            <Trophy className="w-5 h-5 text-foreground" />
          </div>
          <h2 className="font-heading font-bold text-xl">Leaderboard</h2>
        </div>
        <Suspense
          fallback={
            <div className="bg-white border-2 border-foreground/10 rounded-2xl overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} className="border-b border-foreground/5 last:border-0 px-6" />
              ))}
            </div>
          }
        >
          <LeaderboardSection currentUserId={user.id} />
        </Suspense>
      </div>
    </div>
  )
}

async function HeatmapSection({ userId, today }: { userId: string; today: string }) {
  const heatmapData = await getHeatmapData(userId)
  return (
    <div className="animate-in fade-in duration-[--dur-slow]">
      <ActivityHeatmap data={heatmapData} today={today} />
    </div>
  )
}

async function LeaderboardSection({ currentUserId }: { currentUserId: string }) {
  const initialLeaderboard = await getLeaderboard()
  return (
    <div className="animate-in fade-in duration-[--dur-slow]">
      <LeaderboardClient initialData={initialLeaderboard} currentUserId={currentUserId} />
    </div>
  )
}
