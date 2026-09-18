import Link from "next/link"
import { Music, Flame, Trophy } from "lucide-react"
import { signInWithLastfm } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { InViewSection } from "./_components/in-view-section"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background bg-dots overflow-x-hidden">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <span className="font-heading font-bold text-xl text-foreground">
          Playabl
        </span>
        <Link
          href="/login"
          className="px-4 py-2 rounded-full border-2 border-foreground text-sm font-medium hover:bg-[#FBBF24] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sign in
        </Link>
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
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-full text-white font-bold border-2 border-foreground shadow-hard transition-all duration-[--dur-base] ease-[--ease-pop] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm"
                  style={{ background: "#d51007" }}
                >
                  <LastfmIcon />
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
                🏆 #3 on leaderboard
              </div>
            </div>
          </InViewSection>
        </div>
      </section>

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
          Playabl, built by Ahmer.
        </p>
      </footer>
    </div>
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
    <div
      className="h-full bg-white border-2 border-foreground rounded-2xl p-6 shadow-hard animate-pop-in transition-all duration-[--dur-base] ease-[--ease-pop] hover:-translate-y-1 hover:rotate-[-1deg]"
      style={{ "--i": index } as React.CSSProperties}
    >
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
    </div>
  )
}

function LastfmIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M10.599 17.211l-.881-2.393s-1.433 1.596-3.579 1.596c-1.9 0-3.249-1.652-3.249-4.296 0-3.384 1.708-4.596 3.388-4.596 2.418 0 3.188 1.568 3.849 3.589l.871 2.724c.871 2.647 2.513 4.774 7.241 4.774 3.389 0 5.686-1.037 5.686-3.764 0-2.204-1.258-3.344-3.599-3.893l-1.741-.38c-1.2-.271-1.558-.749-1.558-1.549 0-.899.712-1.428 1.87-1.428 1.27 0 1.952.474 2.063 1.6l2.641-.319c-.219-2.373-1.851-3.343-4.563-3.343-2.382 0-4.673.899-4.673 3.791 0 1.799.871 2.935 3.059 3.491l1.85.463c1.368.34 1.961.84 1.961 1.72 0 1.025-.989 1.443-2.952 1.443-2.862 0-4.053-1.5-4.754-3.562l-.893-2.74C12.06 8.117 10.49 6 6.349 6 2.478 6 0 8.543 0 12.195c0 3.521 1.811 6.344 5.909 6.344 2.312 0 3.741-.82 4.69-1.328z" />
    </svg>
  )
}
