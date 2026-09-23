import { type NextRequest } from "next/server"
import { env } from "@/lib/env"
import { parseNowPlaying } from "@/supabase/functions/_shared/lastfm"

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")
  if (!username) return Response.json(null)

  const url = new URL("https://ws.audioscrobbler.com/2.0/")
  url.searchParams.set("method", "user.getRecentTracks")
  url.searchParams.set("user", username)
  url.searchParams.set("api_key", env.LASTFM_API_KEY)
  url.searchParams.set("format", "json")
  url.searchParams.set("limit", "1")

  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) })
    if (!res.ok) return Response.json(null)
    return Response.json(parseNowPlaying(await res.json()))
  } catch {
    return Response.json(null)
  }
}
