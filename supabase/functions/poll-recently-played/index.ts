import { createClient } from "npm:@supabase/supabase-js@2"
import { parseRecentTracks } from "../_shared/lastfm.ts"
import { credit } from "../_shared/credit.ts"
import { computeNextInterval } from "../_shared/backoff.ts"
import { format } from "date-fns"
import { TZDate } from "@date-fns/tz"

const LOOKBACK       = 600   // seconds — overlap window to catch late scrobbles
const MAX_PAGES      = 5     // max pages to paginate per user per tick
const PER_TICK_BUDGET = 180  // max users to poll per tick

const LASTFM_API = "https://ws.audioscrobbler.com/2.0/"

// ── Entry point ───────────────────────────────────────────────────────────────

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  )

  const apiKey = Deno.env.get("LASTFM_API_KEY")!

  const { data: config } = await supabase
    .from("anticheat_config")
    .select("hourly_cap, daily_cap")
    .eq("id", 1)
    .single()

  const hourlyCap = config?.hourly_cap ?? 40
  const dailyCap  = config?.daily_cap  ?? 400

  const { data: dueAccounts } = await supabase
    .from("lastfm_accounts")
    .select("user_id, lastfm_user, last_uts, consecutive_empty_polls")
    .lte("next_poll_at", new Date().toISOString())
    .order("next_poll_at", { ascending: true })
    .limit(PER_TICK_BUDGET)

  for (const account of dueAccounts ?? []) {
    try {
      await pollUser(supabase, apiKey, account, hourlyCap, dailyCap)
    } catch (err) {
      console.error(`[poll] ${account.lastfm_user} failed:`, err)
    }
  }

  return new Response("ok", { status: 200 })
})

// ── Per-user polling ──────────────────────────────────────────────────────────

async function pollUser(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  account: {
    user_id: string
    lastfm_user: string
    last_uts: number | null
    consecutive_empty_polls: number
  },
  hourlyCap: number,
  dailyCap: number,
): Promise<void> {
  const { user_id, lastfm_user, last_uts, consecutive_empty_polls } = account

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, total_points")
    .eq("id", user_id)
    .single()

  const timezone   = profile?.timezone   ?? "UTC"
  const nowSeconds = Math.floor(Date.now() / 1000)
  const fromUts    = (last_uts ?? nowSeconds) - LOOKBACK

  // ── Fetch tracks from Last.fm ─────────────────────────────────────────────

  const allTracks: Awaited<ReturnType<typeof parseRecentTracks>>["tracks"] = []
  let newLastUts = last_uts

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = new URL(LASTFM_API)
    url.searchParams.set("method", "user.getRecentTracks")
    url.searchParams.set("user",   lastfm_user)
    url.searchParams.set("api_key", apiKey)
    url.searchParams.set("format", "json")
    url.searchParams.set("from",   String(fromUts))
    url.searchParams.set("limit",  "200")
    url.searchParams.set("page",   String(page))

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Last.fm HTTP ${res.status}`)

    const { tracks, totalPages } = parseRecentTracks(await res.json())
    allTracks.push(...tracks)

    if (page >= totalPages) break
  }

  // Update watermark to the max uts seen across all fetched tracks.
  if (allTracks.length > 0) {
    newLastUts = Math.max(...allTracks.map((t) => t.uts))
  }

  // ── Handle empty poll ─────────────────────────────────────────────────────

  if (allTracks.length === 0) {
    const newEmpty       = consecutive_empty_polls + 1
    const intervalSec    = computeNextInterval(newEmpty, Math.random)
    const nextPollAt     = new Date(Date.now() + intervalSec * 1000).toISOString()
    await supabase.from("lastfm_accounts").update({
      consecutive_empty_polls: newEmpty,
      next_poll_at: nextPollAt,
    }).eq("user_id", user_id)
    return
  }

  // ── Insert new scrobbles (ON CONFLICT DO NOTHING) ─────────────────────────

  const inserts = allTracks.map((t) => ({
    user_id,
    track_id:   t.track_id,
    track_name: t.track_name,
    artist:     t.artist,
    played_at:  t.played_at,
    credited:   false,
    album:      t.album,
    image_url:  t.image_url,
  }))

  const { data: insertedRows } = await supabase
    .from("listening_events")
    .upsert(inserts, { ignoreDuplicates: true, onConflict: "user_id,played_at" })
    .select("id, played_at")

  const actualNewRows = insertedRows ?? []

  // ── Credit new rows ───────────────────────────────────────────────────────

  if (actualNewRows.length > 0) {
    // Fetch existing credited rows to compute pre-existing hour/day counts.
    const { data: existingCredited } = await supabase
      .from("listening_events")
      .select("played_at")
      .eq("user_id", user_id)
      .eq("credited", true)

    const existingHourCounts = new Map<string, number>()
    const existingDayCounts  = new Map<string, number>()

    for (const row of existingCredited ?? []) {
      const tzDate  = new TZDate(new Date(row.played_at), timezone)
      const dayKey  = format(tzDate, "yyyy-MM-dd")
      const hourKey = format(tzDate, "yyyy-MM-dd'T'HH")
      existingHourCounts.set(hourKey, (existingHourCounts.get(hourKey) ?? 0) + 1)
      existingDayCounts.set(dayKey,   (existingDayCounts.get(dayKey)   ?? 0) + 1)
    }

    const creditResult = credit(
      actualNewRows,
      existingHourCounts,
      existingDayCounts,
      hourlyCap,
      dailyCap,
      timezone,
    )

    if (creditResult.creditedIds.length > 0) {
      // Mark credited rows.
      await supabase
        .from("listening_events")
        .update({ credited: true })
        .in("id", creditResult.creditedIds)

      // Upsert daily_activity (increment existing counts).
      const affectedDates = creditResult.dayDeltas.map((d) => d.activity_date)
      const { data: existingActivity } = await supabase
        .from("daily_activity")
        .select("activity_date, track_count, points")
        .eq("user_id", user_id)
        .in("activity_date", affectedDates)

      const activityMap = new Map(
        (existingActivity ?? []).map((a) => [a.activity_date, a]),
      )

      const activityUpserts = creditResult.dayDeltas.map((d) => {
        const existing = activityMap.get(d.activity_date)
        return {
          user_id,
          activity_date: d.activity_date,
          track_count:   (existing?.track_count ?? 0) + d.track_count,
          points:        (existing?.points       ?? 0) + d.points,
        }
      })

      await supabase
        .from("daily_activity")
        .upsert(activityUpserts, { onConflict: "user_id,activity_date" })

      // Increment total_points.
      await supabase
        .from("profiles")
        .update({
          total_points: (profile?.total_points ?? 0) + creditResult.totalCredited,
        })
        .eq("id", user_id)
    }
  }

  // ── Update poll state ─────────────────────────────────────────────────────

  const newEmpty    = actualNewRows.length > 0 ? 0 : consecutive_empty_polls + 1
  const intervalSec = computeNextInterval(newEmpty, Math.random)
  const nextPollAt  = new Date(Date.now() + intervalSec * 1000).toISOString()

  await supabase.from("lastfm_accounts").update({
    last_uts:                newLastUts,
    consecutive_empty_polls: newEmpty,
    next_poll_at:            nextPollAt,
  }).eq("user_id", user_id)

  // ── Prune: keep newest 100 listening_events per user ─────────────────────

  const { data: overflow } = await supabase
    .from("listening_events")
    .select("played_at")
    .eq("user_id", user_id)
    .order("played_at", { ascending: false })
    .range(100, 100)

  if (overflow?.length) {
    await supabase
      .from("listening_events")
      .delete()
      .eq("user_id", user_id)
      .lt("played_at", overflow[0].played_at)
  }
}
