import { createClient } from "npm:@supabase/supabase-js@2"
import { parseRecentTracks } from "../_shared/lastfm.ts"
import { buildDayCounts, buildHourCounts, credit, localDayKey } from "../_shared/credit.ts"
import { computeNextInterval } from "../_shared/backoff.ts"
import { safeTimezone } from "../_shared/timezone.ts"

const LOOKBACK         = 600   // seconds — overlap window on existing watermark
const INITIAL_LOOKBACK = 86400 // 24 h on first poll (last_uts is null)
const MAX_PAGES        = 5     // max pages to paginate per user per tick
const PER_TICK_BUDGET  = 180   // max users to poll per tick
const FETCH_TIMEOUT_MS = 8000  // per-request deadline — a hung socket must not stall the tick
const ERROR_BACKOFF    = 900   // seconds — penalty next_poll_at on 429/5xx (no Retry-After)

// Thrown on a Last.fm rate-limit / server error so the per-user catch can log
// it and, for a 429, cool down the rest of the tick.
class LastfmBackoffError extends Error {
  rateLimited: boolean
  constructor(message: string, rateLimited: boolean) {
    super(message)
    this.name = "LastfmBackoffError"
    this.rateLimited = rateLimited
  }
}

const LASTFM_API = "https://ws.audioscrobbler.com/2.0/"

// ── Entry point ───────────────────────────────────────────────────────────────

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  )

  const apiKey = Deno.env.get("LASTFM_API_KEY")!

  const { data: config, error: configError } = await supabase
    .from("anticheat_config")
    .select("hourly_cap, daily_cap")
    .eq("id", 1)
    .single()

  // A failed config read must be loud, not a silent fall back to hardcoded
  // caps that may differ from tuned production values (would mis-credit all).
  if (configError) {
    console.error("[poll] anticheat_config read failed; using default caps:", configError)
  }

  const hourlyCap = config?.hourly_cap ?? 40
  const dailyCap  = config?.daily_cap  ?? 400

  const { data: dueAccounts, error: dueError } = await supabase
    .from("lastfm_accounts")
    .select("user_id, lastfm_user, last_uts, consecutive_empty_polls")
    // Skip disconnected accounts (lastfm_sk nulled by the disconnect action).
    // sk is only ever null after an explicit disconnect — creation and re-login
    // always set it — so this self-heals: logging back in resumes polling.
    .not("lastfm_sk", "is", null)
    .lte("next_poll_at", new Date().toISOString())
    .order("next_poll_at", { ascending: true })
    .limit(PER_TICK_BUDGET)

  // A failed due-accounts read otherwise iterates over [] and returns "ok" —
  // a silent no-op tick indistinguishable from "nothing was due".
  if (dueError) {
    console.error("[poll] due-accounts read failed; tick is a no-op:", dueError)
  }

  for (const account of dueAccounts ?? []) {
    try {
      await pollUser(supabase, apiKey, account, hourlyCap, dailyCap)
    } catch (err) {
      console.error(`[poll] ${account.lastfm_user} failed:`, err)
      // On a 429, drop req/s immediately: cool down the rest of this tick.
      if (err instanceof LastfmBackoffError && err.rateLimited) {
        console.warn("[poll] rate-limited by Last.fm — cooling down the rest of this tick")
        break
      }
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user_id)
    .single()

  if (profileError) {
    console.error(`[poll] ${lastfm_user} profile read failed; using defaults:`, profileError)
  }

  const timezone   = safeTimezone(profile?.timezone as string | null | undefined)
  const nowSeconds = Math.floor(Date.now() / 1000)
  const fromUts    = last_uts !== null
    ? last_uts - LOOKBACK
    : nowSeconds - INITIAL_LOOKBACK

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

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })

    // 429/5xx: back this user off (respect Retry-After) and leave last_uts
    // unchanged so the overlap window re-processes. A generic throw would
    // leave next_poll_at untouched → aggressive 1-min retry, the opposite of
    // backoff under pressure.
    if (res.status === 429 || res.status >= 500) {
      const retryAfter = parseInt(res.headers.get("retry-after") ?? "", 10)
      const penalty    = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : ERROR_BACKOFF
      const nextPollAt = new Date(Date.now() + penalty * 1000).toISOString()
      await supabase.from("lastfm_accounts").update({ next_poll_at: nextPollAt }).eq("user_id", user_id)
      throw new LastfmBackoffError(
        `Last.fm HTTP ${res.status}; backing off ${penalty}s`,
        res.status === 429,
      )
    }
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

  const { data: insertedRows, error: insertError } = await supabase
    .from("listening_events")
    .upsert(inserts, { ignoreDuplicates: true, onConflict: "user_id,played_at" })
    .select("id")

  // Throw on insert error so the watermark is not advanced past rows we failed
  // to persist; the overlap window re-processes them next tick.
  if (insertError) throw new Error(`insert failed: ${insertError.message}`)

  // actualNewRows = genuinely-new rows this tick — drives the backoff reset
  // (all-duplicate fetches count as an empty poll).
  const actualNewRows = insertedRows ?? []

  // ── Credit the pending set ──────────────────────────────────────────────
  //
  // Credit off credited=false rows, not just the ones inserted this tick: if a
  // prior tick's atomic write-back rolled back, those rows are still pending
  // and get retried here — the self-heal that makes crediting durable. Bounded
  // by the 100-row prune; over-cap rows stay uncredited and are re-evaluated
  // harmlessly (their hour/day bucket is already full).
  const { data: pendingRows, error: pendingError } = await supabase
    .from("listening_events")
    .select("id, played_at")
    .eq("user_id", user_id)
    .eq("credited", false)

  if (pendingError) throw new Error(`pending read failed: ${pendingError.message}`)

  if (pendingRows && pendingRows.length > 0) {
    // Hour counts come from listening_events (credited=true): the hourly cap is
    // always < the 100-row retention window, so a recent hour's credited rows
    // are guaranteed present and the count is accurate.
    const { data: existingCredited, error: existingError } = await supabase
      .from("listening_events")
      .select("played_at")
      .eq("user_id", user_id)
      .eq("credited", true)

    if (existingError) throw new Error(`credited read failed: ${existingError.message}`)

    const existingHourCounts = buildHourCounts(existingCredited ?? [], timezone)

    // Day counts come from daily_activity, NOT listening_events: track_count is
    // the durable, never-pruned per-local-day credited count, so the daily cap
    // survives the 100-row prune (audit F3 — the daily-cap bypass fix). Scope to
    // the local days the pending rows fall in.
    const pendingDayKeys = [...new Set(pendingRows.map((r) => localDayKey(r.played_at, timezone)))]

    const { data: dayActivity, error: dayActivityError } = await supabase
      .from("daily_activity")
      .select("activity_date, track_count")
      .eq("user_id", user_id)
      .in("activity_date", pendingDayKeys)

    if (dayActivityError) throw new Error(`daily_activity read failed: ${dayActivityError.message}`)

    const existingDayCounts = buildDayCounts(
      (dayActivity ?? []) as { activity_date: string; track_count: number }[],
    )

    const creditResult = credit(
      pendingRows,
      existingHourCounts,
      existingDayCounts,
      hourlyCap,
      dailyCap,
      timezone,
    )

    if (creditResult.creditedIds.length > 0) {
      // Atomic write-back: flag credited rows + increment daily_activity +
      // total_points in a single transaction. Throw on error so nothing
      // partially commits and the watermark stays put for a clean retry.
      const { error: creditError } = await supabase.rpc("apply_credits", {
        p_user_id:      user_id,
        p_credited_ids: creditResult.creditedIds,
        p_day_deltas:   creditResult.dayDeltas,
        p_total_delta:  creditResult.totalCredited,
      })
      if (creditError) throw new Error(`apply_credits failed: ${creditError.message}`)
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
