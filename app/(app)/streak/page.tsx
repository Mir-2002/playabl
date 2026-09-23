import type { Metadata } from "next"
import { getUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Flame } from "lucide-react"
import { getStreakCalendarData } from "./actions"
import { StreakCalendar } from "./_components/streak-calendar"
import { PageHeader } from "@/components/ui/page-header"

export const metadata: Metadata = { title: "Streak — Playabl" }

export default async function StreakPage() {
  const {
    data: { user },
  } = await getUser()

  if (!user) redirect("/login")

  const data = await getStreakCalendarData(user.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Streak"
        subtitle="Your daily listening calendar."
        icon={<Flame className="w-5 h-5 text-white" />}
        iconBg="bg-[#F472B6]"
        backHref="/home"
      />

      <StreakHero
        currentStreak={data.currentStreak}
        longestStreak={data.longestStreak}
      />

      <StreakCalendar
        qualifyingDays={data.qualifyingDays}
        signupDay={data.signupDay}
        today={data.today}
      />
    </div>
  )
}

function StreakHero({
  currentStreak,
  longestStreak,
}: {
  currentStreak: number
  longestStreak: number
}) {
  const isActive = currentStreak > 0

  return (
    <div className="bg-white border-2 border-foreground rounded-2xl p-8 shadow-hard-pink text-center">
      <div
        className={`w-20 h-20 rounded-full border-2 border-foreground mx-auto flex items-center justify-center mb-4 ${
          isActive ? "bg-[#FBBF24]" : "bg-muted opacity-50"
        }`}
      >
        <Flame
          className={`w-10 h-10 ${isActive ? "text-foreground" : "text-muted-foreground"}`}
        />
      </div>

      {isActive ? (
        <>
          <p className="font-heading font-extrabold text-7xl text-foreground">
            {currentStreak}
          </p>
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mt-1">
            day streak
          </p>
          <hr className="border-foreground/10 my-4" />
          <p className="text-sm text-muted-foreground">
            Longest:{" "}
            <strong>
              {longestStreak} day{longestStreak === 1 ? "" : "s"}
            </strong>
          </p>
        </>
      ) : (
        <>
          <p className="font-heading font-extrabold text-7xl text-muted-foreground">
            0
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Your streak&apos;s out — listen today to relight it.
          </p>
          {longestStreak > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              Longest:{" "}
              <strong>
                {longestStreak} day{longestStreak === 1 ? "" : "s"}
              </strong>
            </p>
          )}
        </>
      )}
    </div>
  )
}
