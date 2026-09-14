import { createHash } from "node:crypto"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { env } from "@/lib/env"
import { parseUserInfo } from "@/supabase/functions/_shared/lastfm"

const LastfmSessionSchema = z.object({
  session: z.object({
    name: z.string(),
    key: z.string(),
    subscriber: z.number().optional(),
  }),
})

const LastfmErrorSchema = z.object({
  error: z.number(),
  message: z.string(),
})

function computeApiSig(
  params: Record<string, string>,
  secret: string,
): string {
  // Sort params by name, concatenate name+value for each (no separator),
  // append secret, MD5 hex. Exclude 'format' and 'callback'.
  const sig = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => k + v)
    .join("")
  return createHash("md5")
    .update(sig + secret)
    .digest("hex")
}

export async function GET(request: NextRequest) {
  const { origin } = request.nextUrl
  const token = request.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=denied`)
  }

  // Compute api_sig and call auth.getSession
  const sigParams = {
    api_key: env.LASTFM_API_KEY,
    method: "auth.getSession",
    token,
  }
  const api_sig = computeApiSig(sigParams, env.LASTFM_SHARED_SECRET)

  const sessionUrl = new URL("https://ws.audioscrobbler.com/2.0/")
  sessionUrl.searchParams.set("method", "auth.getSession")
  sessionUrl.searchParams.set("api_key", env.LASTFM_API_KEY)
  sessionUrl.searchParams.set("token", token)
  sessionUrl.searchParams.set("api_sig", api_sig)
  sessionUrl.searchParams.set("format", "json")

  let name: string
  let key: string
  try {
    const res = await fetch(sessionUrl.toString())
    const body: unknown = await res.json()

    // Last.fm errors return { error, message } at HTTP 200
    if (LastfmErrorSchema.safeParse(body).success) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    const parsed = LastfmSessionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    name = parsed.data.session.name
    key = parsed.data.session.key
  } catch {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // user.getInfo is a public read — no api_sig required.
  let avatarUrl: string | null = null
  try {
    const infoUrl = new URL("https://ws.audioscrobbler.com/2.0/")
    infoUrl.searchParams.set("method", "user.getInfo")
    infoUrl.searchParams.set("user", name)
    infoUrl.searchParams.set("api_key", env.LASTFM_API_KEY)
    infoUrl.searchParams.set("format", "json")
    const infoRes = await fetch(infoUrl.toString())
    avatarUrl = parseUserInfo(await infoRes.json()).avatarUrl
  } catch {
    // avatar failure must never block login
  }

  const service = createServiceClient()
  const email = `${name.toLowerCase()}@lastfm.playabl.local`

  // Resolve the Supabase user: existing → reuse, new → create
  let userId: string
  const { data: existing } = await service
    .from("lastfm_accounts")
    .select("user_id")
    .eq("lastfm_user", name)
    .single()

  if (existing) {
    userId = existing.user_id
    await Promise.all([
      service
        .from("lastfm_accounts")
        .update({ lastfm_sk: key, updated_at: new Date().toISOString() })
        .eq("user_id", userId),
      avatarUrl !== null
        ? service
            .from("profiles")
            .update({ avatar_url: avatarUrl })
            .eq("id", userId)
        : Promise.resolve(),
    ])
  } else {
    const { data: created, error: createErr } =
      await service.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { lastfm_user: name, display_name: name, avatar_url: avatarUrl },
      })
    if (createErr || !created.user) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
    userId = created.user.id

    await service.from("lastfm_accounts").insert({
      user_id: userId,
      lastfm_user: name,
      lastfm_sk: key,
    })

    await service.from("profiles").upsert({
      id: userId,
      username: name,
      avatar_url: avatarUrl,
    })
  }

  // Mint a real Supabase session (passwordless; no email is sent).
  // generateLink produces a hashed_token; verifyOtp consumes it and sets
  // the auth cookies via the cookie-bound SSR client.
  const { data: linkData, error: linkErr } =
    await service.auth.admin.generateLink({
      type: "magiclink",
      email,
    })
  if (linkErr || !linkData?.properties?.hashed_token) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const supabase = await createClient()
  const { error: verifyErr } = await supabase.auth.verifyOtp({
    type: "email",
    token_hash: linkData.properties.hashed_token,
  })
  if (verifyErr) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  return NextResponse.redirect(`${origin}/home`)
}
