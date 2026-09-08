"use server"

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function signInWithSpotify() {
  const supabase = await createClient()
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL!

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "spotify",
    options: {
      scopes: "user-read-recently-played user-read-currently-playing",
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) throw error
  redirect(data.url!)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}
