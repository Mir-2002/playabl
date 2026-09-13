"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { env } from "@/lib/env"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function signInWithLastfm() {
  const origin = (await headers()).get("origin") ?? env.NEXT_PUBLIC_SITE_URL
  redirect(
    `https://www.last.fm/api/auth/?api_key=${env.LASTFM_API_KEY}&cb=${origin}/auth/lastfm/callback`,
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
  await service.auth.admin.deleteUser(user.id)
  redirect("/")
}
