import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { signInWithLastfm } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"

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
            {error === "denied"
              ? "Authorization was cancelled. Please try again."
              : "Authentication failed. Please try again."}
          </div>
        )}

        {/* Last.fm button */}
        <form action={signInWithLastfm} className="w-full">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            style={{ background: "#d51007", color: "#fff" }}
          >
            <LastfmIcon />
            Continue with Last.fm
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
          We only read your recently scrobbled tracks.
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

function LastfmIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M10.599 17.211l-.881-2.393s-1.433 1.596-3.579 1.596c-1.9 0-3.249-1.652-3.249-4.296 0-3.384 1.708-4.596 3.388-4.596 2.418 0 3.188 1.568 3.849 3.589l.871 2.724c.871 2.647 2.513 4.774 7.241 4.774 3.389 0 5.686-1.037 5.686-3.764 0-2.204-1.258-3.344-3.599-3.893l-1.741-.38c-1.2-.271-1.558-.749-1.558-1.549 0-.899.712-1.428 1.87-1.428 1.27 0 1.952.474 2.063 1.6l2.641-.319c-.219-2.373-1.851-3.343-4.563-3.343-2.382 0-4.673.899-4.673 3.791 0 1.799.871 2.935 3.059 3.491l1.85.463c1.368.34 1.961.84 1.961 1.72 0 1.025-.989 1.443-2.952 1.443-2.862 0-4.053-1.5-4.754-3.562l-.893-2.74C12.06 8.117 10.49 6 6.349 6 2.478 6 0 8.543 0 12.195c0 3.521 1.811 6.344 5.909 6.344 2.312 0 3.741-.82 4.69-1.328z" />
    </svg>
  )
}
