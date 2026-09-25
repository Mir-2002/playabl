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
