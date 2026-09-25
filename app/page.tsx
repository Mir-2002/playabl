import Link from "next/link"
import { Music, Flame, Trophy } from "lucide-react"
import { signInWithLastfm } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { StickerCard } from "@/components/ui/sticker-card"
import { InViewSection } from "./_components/in-view-section"
import { StatFigure } from "./_components/stat-figure"
import { getLandingStats, type LandingStats } from "@/app/_lib/landing-stats"

export default async function LandingPage() {
  let stats: LandingStats | null = null
  try {
    stats = await getLandingStats()
  } catch {
    // Decision 7: a decorative stats band must never 500 the hero/CTA.
    // On any query error, omit the band; the rest of the page renders.
    stats = null
  }

  return (
    <div className="min-h-screen bg-background bg-dots overflow-x-hidden">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <img src="/playabl-text.svg" alt="Playabl" className="h-16 w-auto" />
        <Button render={<Link href="/login" />} nativeButton={false} variant="secondary" size="sm">
          Sign in
        </Button>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 relative overflow-hidden">
        {/* Blob shape behind headline */}
        <div
          className="absolute -top-16 -left-20 w-[480px] h-[480px] -z-10 opacity-15"
          style={{
            background: "#8B5CF6",
            borderRadius: "60% 40% 70% 30% / 50% 60% 40% 50%",
          }}
          aria-hidden
        />
        {/* Amber circle */}
        <div
          className="absolute top-0 right-24 w-20 h-20 rounded-full border-2 border-foreground -z-10"
          style={{ background: "#FBBF24" }}
          aria-hidden
        />

        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left: headline */}
          <InViewSection className="animate-pop-in" style={{ "--i": 0 } as React.CSSProperties}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-foreground bg-white shadow-hard-sm text-xs font-bold uppercase tracking-widest mb-6">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "#34D399" }}
              />
              Now in early access
            </div>
            <h1 className="font-heading font-extrabold text-6xl md:text-7xl leading-[1.05] text-foreground">
              Your music.
              <br />
              <span style={{ color: "#8B5CF6" }}>Proven.</span>
              <br />
              Ranked.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-sm leading-relaxed">
              Connect Last.fm, earn a point for every track you scrobble, and
              compete with friends on the global leaderboard.
            </p>
            <div className="mt-8 flex items-center gap-4 flex-wrap">
              <form action={signInWithLastfm}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-full text-white font-bold border-2 border-foreground shadow-hard transition-all duration-[--dur-base] ease-[--ease-pop] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                  style={{ background: "#d51007" }}
                >
                  Connect Last.fm
                </button>
              </form>
            </div>
          </InViewSection>

          {/* Right: decorative card */}
          <InViewSection className="relative hidden md:flex justify-center animate-pop-in" style={{ "--i": 1 } as React.CSSProperties}>
            <div className="w-72 h-80 bg-white border-2 border-foreground rounded-2xl shadow-hard-lg flex flex-col items-center justify-center gap-4 p-6 relative overflow-hidden">
              <div
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-40"
                style={{ background: "#F472B6" }}
                aria-hidden
              />
              <div className="relative z-10 w-14 h-14 rounded-full border-2 border-foreground bg-primary flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div className="relative z-10 text-center">
                <p className="font-heading font-extrabold text-4xl text-foreground">
                  12,480
                </p>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  points earned
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-foreground bg-[#FBBF24]">
                <Flame className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">7 day streak</span>
              </div>
              <div className="relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-foreground bg-white shadow-hard text-xs font-bold">
                <span aria-hidden>🏆</span> #3 on leaderboard
              </div>
            </div>
          </InViewSection>
        </div>
      </section>

      {stats && <StatsBand stats={stats} />}

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <InViewSection>
          <h2 className="font-heading font-bold text-3xl text-center text-foreground mb-12">
            How Playabl works
          </h2>
        </InViewSection>
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {[
            {
              icon: <Music className="w-5 h-5 text-white" />,
              iconBg: "bg-primary",
              title: "Listen & Earn",
              description: "Earn points for every track you listen to. No tricks, just pure scrobbles.",
              accentColor: "#8B5CF6",
              index: 0,
            },
            {
              icon: <Flame className="w-5 h-5 text-white" />,
              iconBg: "bg-[#F472B6]",
              title: "Keep Streaks",
              description: "Scrobble at least once daily to build and maintain your streak. Miss a day and start over.",
              accentColor: "#F472B6",
              index: 1,
            },
            {
              icon: <Trophy className="w-5 h-5 text-white" />,
              iconBg: "bg-[#FBBF24]",
              title: "Climb the Ranks",
              description: "Compete on the global all-time leaderboard along with other users.",
              accentColor: "#FBBF24",
              index: 2,
            },
          ].map((card) => (
            <InViewSection key={card.title} className="h-full">
              <FeatureCard {...card} />
            </InViewSection>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <InViewSection>
          <div
            className="rounded-3xl border-2 border-foreground p-12 text-center"
            style={{ background: "#34D399" }}
          >
            <h2 className="font-heading font-bold text-3xl text-foreground">
              Ready to prove your taste?
            </h2>
            <p className="mt-2 text-lg" style={{ color: "rgba(30,41,59,0.8)" }}>
              Connect your Last.fm and start earning points today.
            </p>
            <form action={signInWithLastfm} className="mt-8 inline-block">
              <Button type="submit" size="lg">
                Get started →
              </Button>
            </form>
          </div>
        </InViewSection>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-border py-8">
        <p className="text-center text-sm text-muted-foreground">
          Playabl
        </p>
      </footer>
    </div>
  )
}

function StatsBand({ stats }: { stats: LandingStats }) {
  const items = [
    {
      value: stats.listeners,
      label: "Listeners",
      accentColor: "#8B5CF6",
      index: 0,
    },
    {
      value: stats.totalPoints,
      label: "Points earned",
      accentColor: "#F472B6",
      index: 1,
    },
    {
      value: stats.daysTracked,
      label: "Days tracked",
      accentColor: "#FBBF24",
      index: 2,
    },
  ]

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        {items.map((it) => (
          <InViewSection key={it.label} className="h-full">
            <div
              className="h-full flex flex-col items-center text-center animate-pop-in"
              style={{ "--i": it.index } as React.CSSProperties}
            >
              <span style={{ color: it.accentColor }}>
                <StatFigure
                  value={it.value}
                  className="block font-heading font-extrabold text-7xl md:text-8xl leading-none"
                />
              </span>
              <p className="text-lg font-bold text-foreground mt-3">
                {it.label}
              </p>
            </div>
          </InViewSection>
        ))}
      </div>
    </section>
  )
}

function FeatureCard({
  icon,
  iconBg,
  title,
  description,
  accentColor,
  index,
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
  accentColor: string
  index: number
}) {
  return (
    <StickerCard style={{ "--i": index } as React.CSSProperties}>
      <div
        className={`w-11 h-11 rounded-full border-2 border-foreground ${iconBg} flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <h3 className="font-heading font-bold text-xl text-foreground mb-2">
        {title}
        <span
          className="block h-0.5 mt-1 rounded-full w-10"
          style={{ background: accentColor }}
          aria-hidden
        />
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </StickerCard>
  )
}
