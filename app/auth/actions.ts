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
