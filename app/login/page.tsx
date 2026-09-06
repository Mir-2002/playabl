import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { signInWithSpotify } from "@/app/auth/actions"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect("/home")

  const { error } = await searchParams

  return (
    <div className="min-h-screen bg-background bg-dots flex items-center justify-center p-6">
      {/* Floating decorations */}
      <div
        className="fixed top-24 left-16 w-16 h-16 rounded-full border-2 border-foreground opacity-70"
        style={{ background: "#F472B6" }}
        aria-hidden
      />
      <div
        className="fixed bottom-32 right-20 w-24 h-24 rounded-full border-2 border-foreground opacity-50"
        style={{ background: "#8B5CF6" }}
        aria-hidden
      />
      <div
        className="fixed top-1/2 right-12 w-10 h-10 rounded-full border-2 border-foreground opacity-60"
        style={{ background: "#FBBF24" }}
        aria-hidden
      />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm bg-white border-2 border-foreground rounded-2xl shadow-hard-lg p-10">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <span className="font-heading font-extrabold text-3xl text-foreground">
            Playabl
          </span>
          <p className="text-sm text-muted-foreground mt-2">
            Your music. Proven. Ranked.
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl border-2 border-destructive bg-destructive/10 text-destructive text-sm font-medium">
            {error === "missing_code"
              ? "Something went wrong. Please try again."
              : "Authentication failed. Please try again."}
          </div>
        )}

        {/* Spotify button */}
        <form action={signInWithSpotify}>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-full font-bold border-2 border-foreground shadow-hard transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1E293B] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1E293B]"
            style={{ background: "#1DB954", color: "#fff" }}
          >
            <SpotifyIcon />
            Continue with Spotify
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
          We only read your recently played tracks.
          <br />
          We never control your playback.
        </p>

        {/* Decorative strip */}
        <div className="mt-8 flex gap-1.5 justify-center">
          {["#8B5CF6", "#F472B6", "#FBBF24", "#34D399"].map((c) => (
            <div
              key={c}
              className="w-6 h-1.5 rounded-full"
              style={{ background: c }}
              aria-hidden
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SpotifyIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}
