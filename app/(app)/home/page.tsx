import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Music, Flame, Trophy, Activity } from "lucide-react"
import { getLeaderboard } from "@/app/(app)/leaderboard/actions"
import { LeaderboardClient } from "@/app/(app)/leaderboard/_components/leaderboard-client"
import { getStreakStats, getHeatmapData } from "@/app/(app)/home/actions"
import { ActivityHeatmap } from "@/components/activity-heatmap"
import { todayInManila } from "@/lib/manila-time"
import { PointsDisplay } from "@/app/(app)/home/_components/points-display"
import { NowPlaying } from "@/app/(app)/home/_components/now-playing"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [{ data: profile }, initialLeaderboard, streaks, heatmapData] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username, avatar_url, total_points")
        .eq("id", user.id)
        .single(),
      getLeaderboard(),
      getStreakStats(user.id),
      getHeatmapData(user.id),
    ])

  const displayName = profile?.username ?? "Listener"
  const today = todayInManila()

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-white border-2 border-foreground rounded-2xl p-8 shadow-hard-lg flex items-center gap-6">
        {profile?.avatar_url ? (
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
      <div className="grid sm:grid-cols-2 gap-6">
        <Link
          href="/history"
          aria-label="View listening history"
          className="block rounded-2xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
        >
          <StatCard
            icon={<Music className="w-5 h-5 text-white" />}
            iconBg="bg-primary"
            label="Total Points"
            value={
              <PointsDisplay
                currentUserId={user.id}
                initialData={initialLeaderboard}
                initialPoints={profile?.total_points ?? 0}
              />
            }
            note={
              profile?.total_points
                ? "View your listening history"
                : "Start listening to earn points"
            }
            shadowClass="shadow-hard-violet"
          />
        </Link>
        <StatCard
          icon={<Flame className="w-5 h-5 text-white" />}
          iconBg="bg-[#F472B6]"
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
          shadowClass="shadow-hard-pink"
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

      {/* Leaderboard */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-foreground bg-[#FBBF24] flex items-center justify-center">
            <Trophy className="w-5 h-5 text-foreground" />
          </div>
          <h2 className="font-heading font-bold text-xl">Leaderboard</h2>
        </div>
        <LeaderboardClient initialData={initialLeaderboard} currentUserId={user.id} />
      </div>
    </div>
  )
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
  note,
  shadowClass,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: React.ReactNode
  note: string
  shadowClass: string
}) {
  return (
    <div
      className={`bg-white border-2 border-foreground rounded-2xl p-6 ${shadowClass}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="font-heading font-extrabold text-5xl text-foreground mt-2">
            {value}
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-full border-2 border-foreground ${iconBg} flex items-center justify-center flex-shrink-0`}
        >
          {icon}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-4">{note}</p>
    </div>
  )
}
