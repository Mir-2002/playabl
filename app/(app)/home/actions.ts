"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { env } from "@/lib/env"
import { computeStreaks } from "@/lib/streaks"
import { toManilaDay, todayInManila } from "@/lib/manila-time"
import { TZDate } from "@date-fns/tz"
import { subDays } from "date-fns"
import { z } from "zod"
import {
  mintSpotifyToken,
  SpotifyRateLimitError,
  SpotifyReauthError,
} from "@/supabase/functions/_shared/token"

const MANILA = "Asia/Manila"

export type StreakStats = {
  currentStreak: number
  longestStreak: number
}

export async function getStreakStats(userId: string): Promise<StreakStats> {
  const supabase = await createClient()
  const [{ data: events }, { data: profile }] = await Promise.all([
    supabase.from("listening_events").select("played_at").eq("user_id", userId),
    supabase.from("profiles").select("created_at").eq("id", userId).single(),
  ])

  const connectionDay = profile?.created_at ? toManilaDay(profile.created_at) : null

  const uniqueDays = [
    ...new Set((events ?? []).map((e) => toManilaDay(e.played_at))),
  ]
    .filter((d) => !connectionDay || d >= connectionDay)
    .sort()

  return computeStreaks(uniqueDays, todayInManila())
}

export type HeatmapDay = {
  date: string
  totalMs: number
}

export async function getHeatmapData(userId: string): Promise<HeatmapDay[]> {
  const supabase = await createClient()
  const oneYearAgo = subDays(new TZDate(new Date(), MANILA), 371).toISOString()

  const { data } = await supabase
    .from("listening_events")
    .select("played_at, duration_ms")
    .eq("user_id", userId)
    .gte("played_at", oneYearAgo)

  const totals = new Map<string, number>()
  for (const event of data ?? []) {
    const day = toManilaDay(event.played_at)
    totals.set(day, (totals.get(day) ?? 0) + event.duration_ms)
  }

  return Array.from(totals.entries()).map(([date, totalMs]) => ({ date, totalMs }))
}

// --- Now Playing (display-only) ---
//
// Cosmetic widget for the home page. Reads Spotify's /currently-playing purely
// for display — it NEVER writes listening_events, feeds points, or touches any
// aggregate. /recently-played (the cron) remains the sole source of truth for
// points. Any failure degrades to the idle state rather than throwing, so the
// widget never breaks the page.

const SPOTIFY_CURRENTLY_PLAYING_URL =
  "https://api.spotify.com/v1/me/player/currently-playing"

const TOKEN_REFRESH_BUFFER_MS = 60 * 1000

export type NowPlaying = {
  isPlaying: boolean
  albumArt: string | null
  trackName: string | null
  artists: string | null
}

const IDLE: NowPlaying = {
  isPlaying: false,
  albumArt: null,
  trackName: null,
  artists: null,
}

// Untrusted boundary — validate Spotify's response shape defensively.
const CurrentlyPlayingSchema = z.object({
  is_playing: z.boolean(),
  currently_playing_type: z.string().optional(),
  item: z
    .object({
      name: z.string(),
      artists: z.array(z.object({ name: z.string() })).optional(),
      album: z
        .object({ images: z.array(z.object({ url: z.string() })) })
        .optional(),
    })
    .nullable(),
})

export async function getNowPlaying(): Promise<NowPlaying> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return IDLE

  const service = createServiceClient()
  const { data: account } = await service
    .from("spotify_accounts")
    .select("access_token, expires_at, provider_refresh_token, needs_reauth")
    .eq("user_id", user.id)
    .single()

  if (!account || account.needs_reauth || !account.provider_refresh_token) {
    return IDLE
  }

  const accessToken = await ensureAccessToken(user.id, account, service)
  if (!accessToken) return IDLE

  let res: Response
  try {
    res = await fetch(SPOTIFY_CURRENTLY_PLAYING_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
  } catch {
    return IDLE
  }

  // 204 = nothing playing / no active device. 429 = rate limited (display-only,
  // so just show idle). Any other non-2xx also degrades to idle.
  if (res.status === 204 || res.status === 429 || !res.ok) return IDLE

  const parsed = CurrentlyPlayingSchema.safeParse(await res.json().catch(() => null))
  if (!parsed.success) return IDLE

  const body = parsed.data
  const isTrack =
    body.currently_playing_type === undefined ||
    body.currently_playing_type === "track"
  if (!body.is_playing || !body.item || !isTrack) return IDLE

  return {
    isPlaying: true,
    albumArt: body.item.album?.images?.[0]?.url ?? null,
    trackName: body.item.name,
    artists: body.item.artists?.map((a) => a.name).join(", ") ?? null,
  }
}

type SpotifyAccountRow = {
  access_token: string | null
  expires_at: string | null
  provider_refresh_token: string | null
  needs_reauth: boolean
}

// Reuse the cached access token while it's fresh; otherwise mint a new one via
// the shared pure helper and cache it back to the same spotify_accounts row the
// cron uses. Returns null (→ idle) when the token can't be obtained.
async function ensureAccessToken(
  userId: string,
  account: SpotifyAccountRow,
  service: ReturnType<typeof createServiceClient>,
): Promise<string | null> {
  const expiresAt = account.expires_at ? new Date(account.expires_at) : null
  const fresh =
    account.access_token &&
    expiresAt &&
    expiresAt.getTime() - Date.now() > TOKEN_REFRESH_BUFFER_MS
  if (fresh) return account.access_token

  if (!account.provider_refresh_token) return null

  let minted
  try {
    minted = await mintSpotifyToken({
      refreshToken: account.provider_refresh_token,
      clientId: env.SUPABASE_AUTH_EXTERNAL_SPOTIFY_CLIENT_ID,
      clientSecret: env.SUPABASE_AUTH_EXTERNAL_SPOTIFY_SECRET,
    })
  } catch (err) {
    if (err instanceof SpotifyReauthError) {
      await service
        .from("spotify_accounts")
        .update({ needs_reauth: true, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
    }
    // SpotifyRateLimitError and any other error also degrade to idle.
    return null
  }

  const update: {
    access_token: string
    expires_at: string
    updated_at: string
    provider_refresh_token?: string
  } = {
    access_token: minted.accessToken,
    expires_at: minted.expiresAt,
    updated_at: new Date().toISOString(),
  }
  if (minted.rotatedRefreshToken) {
    update.provider_refresh_token = minted.rotatedRefreshToken
  }
  await service.from("spotify_accounts").update(update).eq("user_id", userId)

  return minted.accessToken
}
