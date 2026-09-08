import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const rawNext = searchParams.get("next") ?? "/home"
  const next = rawNext.startsWith("/") ? rawNext : "/home"

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const { session } = data

  // Upsert profile from Spotify user metadata
  await supabase.from("profiles").upsert({
    id: session.user.id,
    username: session.user.user_metadata.full_name ?? session.user.user_metadata.name,
    avatar_url: session.user.user_metadata.avatar_url ?? session.user.user_metadata.picture,
  })

  // Capture provider_refresh_token using the service-role client — spotify_accounts has
  // no SELECT policy, which blocks PostgREST's ON CONFLICT evaluation with the user JWT.
  if (session.provider_refresh_token) {
    const service = createServiceClient()
    await service.from("spotify_accounts").upsert({
      user_id: session.user.id,
      provider_refresh_token: session.provider_refresh_token,
      // Reconnecting issues a new refresh token (and may add scopes), which
      // invalidates any previously-minted access token on Spotify's side. Clear
      // the cache and reset needs_reauth so the next poll mints fresh from the
      // new token instead of reusing a stale, now-scope-mismatched one.
      access_token: null,
      expires_at: null,
      needs_reauth: false,
      updated_at: new Date().toISOString(),
    })
  }

  return NextResponse.redirect(`${origin}${next}`)
}
