"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { env } from "@/lib/env"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { LASTFM_STATE_COOKIE } from "@/lib/security/lastfm-state"

export async function signInWithLastfm() {
  const origin = (await headers()).get("origin") ?? env.NEXT_PUBLIC_SITE_URL

  // CSRF/login-CSRF protection: plant an opaque per-request `state` in an
  // HttpOnly cookie and echo it in the callback URL. The callback rejects any
  // return whose `state` doesn't match the cookie.
  const state = crypto.randomUUID()
  ;(await cookies()).set(LASTFM_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 minutes — the auth round-trip is short-lived.
  })

  // Echo the state in the callback URL. `state` is a URL-safe UUID, so no
  // encoding is needed; Last.fm appends `&token=...` and preserves our query.
  redirect(
    `https://www.last.fm/api/auth/?api_key=${env.LASTFM_API_KEY}&cb=${origin}/auth/lastfm/callback?state=${state}`,
  )
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

export async function disconnectLastfm() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  // lastfm_accounts is service-role-only (RLS), so null the session key with the
  // service client. This is the spec's definition of "disconnect"; the poll
  // engine also skips accounts whose lastfm_sk is null, so tracking stops until
  // the user logs back in (which restores the key).
  const service = createServiceClient()
  const { error } = await service
    .from("lastfm_accounts")
    .update({ lastfm_sk: null, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
  // Don't signal success on an unverified state change — a silently-failed
  // disconnect would leave the account still connected and still tracked.
  if (error) throw new Error(`Disconnect failed: ${error.message}`)

  await supabase.auth.signOut()
  redirect("/")
}

export async function deleteAccount() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const service = createServiceClient()
  const { error } = await service.auth.admin.deleteUser(user.id)
  // Never signal success (redirect home) on an unverified destructive op — for
  // a "delete my data" flow a silently-failed delete is a consent/GDPR problem.
  if (error) throw new Error(`Account deletion failed: ${error.message}`)
  redirect("/")
}
