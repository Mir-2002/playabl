import { createClient } from "@/lib/supabase/server"
import { Music, Flame, Trophy } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user!.id)
    .single()

  const displayName = profile?.username ?? "Listener"

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
        {/* Decorative accent */}
        <div className="ml-auto hidden sm:block w-12 h-12 rounded-full bg-[#FBBF24] border-2 border-foreground" />
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 gap-6">
        <StatCard
          icon={<Music className="w-5 h-5 text-white" />}
          iconBg="bg-primary"
          label="Total Points"
          value="—"
          note="Start listening to earn points"
          shadowClass="shadow-hard-violet"
        />
        <StatCard
          icon={<Flame className="w-5 h-5 text-white" />}
          iconBg="bg-[#F472B6]"
          label="Current Streak"
          value="—"
          note="Listen daily to build a streak"
          shadowClass="shadow-hard-pink"
        />
      </div>

      {/* Leaderboard placeholder */}
      <div className="bg-white border-2 border-foreground rounded-2xl p-8 shadow-hard">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full border-2 border-foreground bg-[#FBBF24] flex items-center justify-center">
            <Trophy className="w-5 h-5 text-foreground" />
          </div>
          <h2 className="font-heading font-bold text-xl">Leaderboard</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Rankings will appear here once listening data is tracked. Check back after
          the cron engine is set up.
        </p>
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
  value: string
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
