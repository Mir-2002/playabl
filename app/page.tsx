import Link from "next/link"
import { Music, Flame, Trophy } from "lucide-react"
import { signInWithSpotify } from "@/app/auth/actions"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background bg-dots">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <span className="font-heading font-bold text-xl text-foreground">
          Playabl
        </span>
        <Link
          href="/login"
          className="px-4 py-2 rounded-full border-2 border-foreground text-sm font-medium hover:bg-[#FBBF24] transition-colors duration-200"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 relative overflow-hidden">
        {/* Big violet circle decoration */}
        <div
          className="absolute -top-12 -left-16 w-96 h-96 rounded-full -z-10 opacity-20"
          style={{ background: "#8B5CF6" }}
          aria-hidden
        />
        {/* Amber blob */}
        <div
          className="absolute top-0 right-24 w-20 h-20 rounded-full border-2 border-foreground -z-10"
          style={{ background: "#FBBF24" }}
          aria-hidden
        />

        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left: headline */}
          <div>
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
              Connect Spotify, earn points for every second you listen, and
              compete with friends on the global leaderboard.
            </p>
            <div className="mt-8 flex items-center gap-4 flex-wrap">
              <form action={signInWithSpotify}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary text-white font-bold border-2 border-foreground shadow-hard transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1E293B] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1E293B]"
                >
                  <SpotifyIcon />
                  Connect Spotify
                </button>
              </form>
              <p className="text-xs text-muted-foreground">
                Free &middot; No credit card
              </p>
            </div>
          </div>

          {/* Right: decorative card */}
          <div className="relative hidden md:flex justify-center">
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
            </div>
            <div className="absolute -bottom-4 -left-8 bg-white border-2 border-foreground rounded-xl px-3 py-2 shadow-hard text-sm font-bold">
              🏆 #3 on leaderboard
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-heading font-bold text-3xl text-center text-foreground mb-12">
          How Playabl works
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Music className="w-5 h-5 text-white" />}
            iconBg="bg-primary"
            title="Listen & Earn"
            description="Every second of verified Spotify listening converts to points automatically."
            accentColor="#8B5CF6"
          />
          <FeatureCard
            icon={<Flame className="w-5 h-5 text-white" />}
            iconBg="bg-[#F472B6]"
            title="Keep Streaks"
            description="Listen at least once daily to build your streak. Miss a day and start over."
            accentColor="#F472B6"
          />
          <FeatureCard
            icon={<Trophy className="w-5 h-5 text-white" />}
            iconBg="bg-[#FBBF24]"
            title="Climb the Ranks"
            description="Compete on the global all-time leaderboard. Pure listening hours — no tricks."
            accentColor="#FBBF24"
          />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div
          className="rounded-3xl border-2 border-foreground p-12 text-center"
          style={{ background: "#34D399" }}
        >
          <h2 className="font-heading font-bold text-3xl text-foreground">
            Ready to prove your taste?
          </h2>
          <p className="mt-2 text-lg" style={{ color: "rgba(30,41,59,0.8)" }}>
            Connect your Spotify and start earning points today.
          </p>
          <form action={signInWithSpotify} className="mt-8 inline-block">
            <button
              type="submit"
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-foreground text-white font-bold border-2 border-foreground shadow-hard transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1E293B] active:translate-x-0.5 active:translate-y-0.5"
            >
              Get started &rarr;
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-border py-8">
        <p className="text-center text-sm text-muted-foreground">
          Playabl &mdash; built with Spotify &amp; Supabase
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
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
  accentColor: string
}) {
  return (
    <div className="bg-white border-2 border-foreground rounded-2xl p-6 shadow-hard transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:rotate-[-1deg] hover:scale-[1.02]">
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

function SpotifyIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}
