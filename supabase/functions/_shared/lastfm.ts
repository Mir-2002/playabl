import { z } from "zod"

// ── Zod schemas ────────────────────────────────────────────────────────────────

const ArtistSchema = z.object({
  "#text": z.string(),
  mbid: z.string().optional(),
})

const AlbumSchema = z.object({
  "#text": z.string(),
  mbid: z.string().optional(),
})

const TrackImageSchema = z.object({
  "#text": z.string(),
  size: z.enum(["small", "medium", "large", "extralarge"]),
})

const TrackDateSchema = z.object({
  uts: z.string(),
  "#text": z.string().optional(),
})

// @attr only appears on the nowplaying item.
const TrackAttrSchema = z
  .object({ nowplaying: z.literal("true") })
  .optional()

const LastfmTrackRawSchema = z.object({
  name: z.string(),
  artist: ArtistSchema,
  mbid: z.string().optional(),
  date: TrackDateSchema.optional(),
  "@attr": TrackAttrSchema,
  album: AlbumSchema.optional(),
  image: z.array(TrackImageSchema).optional(),
})

const RecentTracksAttrSchema = z.object({
  user: z.string(),
  totalPages: z.string(),
  page: z.string(),
  perPage: z.string(),
  total: z.string(),
})

// Last.fm returns track as an object (not array) when the result has 1 item.
const RecentTracksBodySchema = z.object({
  track: z.union([
    z.array(LastfmTrackRawSchema),
    LastfmTrackRawSchema,
  ]),
  "@attr": RecentTracksAttrSchema,
})

const ResponseSchema = z.object({
  recenttracks: RecentTracksBodySchema,
})

const ErrorSchema = z.object({ error: z.number() })

const UserImageSchema = z.object({
  "#text": z.string(),
  size: z.enum(["small", "medium", "large", "extralarge"]),
})

const UserInfoResponseSchema = z.object({
  user: z.object({
    image: z.array(UserImageSchema).optional(),
  }),
})

// ── Private helpers ────────────────────────────────────────────────────────────

const PLACEHOLDER_FRAGMENT = "2a96cbd8b46e442fc41c2b86b821562f"

function pickImage(images?: { "#text": string; size: string }[]): string | null {
  if (!images || images.length === 0) return null
  for (const size of ["extralarge", "large", "medium", "small"]) {
    const img = images.find((i) => i.size === size)
    if (img && img["#text"] !== "" && !img["#text"].includes(PLACEHOLDER_FRAGMENT)) {
      return img["#text"]
    }
  }
  return null
}

function pickAlbum(album?: { "#text": string }): string | null {
  const name = album?.["#text"]?.trim()
  return name || null
}

// ── Public types ───────────────────────────────────────────────────────────────

export type LastfmTrack = {
  track_id:   string | null
  track_name: string
  artist:     string
  played_at:  string  // ISO 8601 UTC
  uts:        number  // unix seconds (used as watermark)
  album:      string | null
  image_url:  string | null
}

export type ParseResult = {
  tracks:     LastfmTrack[]
  totalPages: number
}

export type NowPlaying = {
  isPlaying:  boolean
  track_name: string
  artist:     string
  album:      string | null
  image_url:  string | null
  played_at:  string | null  // null while nowplaying; ISO 8601 UTC when idle
}

// ── Parsers ────────────────────────────────────────────────────────────────────

/**
 * Parse the raw JSON from user.getRecentTracks.
 *
 * - Normalises single-track-as-object → array (Last.fm quirk when limit=1).
 * - Filters out nowplaying items (no date field; not yet scrobbled).
 * - Coerces date.uts (unix-second string) → played_at (ISO 8601 UTC).
 * - Normalises mbid="" → track_id=null.
 * - Captures album name and largest non-placeholder art URL.
 * - Throws on a Last.fm error envelope or invalid uts.
 */
export function parseRecentTracks(raw: unknown): ParseResult {
  const maybeError = ErrorSchema.safeParse(raw)
  if (maybeError.success) {
    const msg = (raw as Record<string, unknown>).message ?? ""
    throw new Error(`Last.fm error ${maybeError.data.error}: ${msg}`)
  }

  const parsed = ResponseSchema.parse(raw)
  const trackArr = Array.isArray(parsed.recenttracks.track)
    ? parsed.recenttracks.track
    : [parsed.recenttracks.track]

  const tracks: LastfmTrack[] = trackArr
    .filter((t) => !t["@attr"]?.nowplaying && t.date !== undefined)
    .map((t) => {
      const uts = parseInt(t.date!.uts, 10)
      if (!Number.isFinite(uts) || uts <= 0) {
        throw new Error(`Invalid uts value: ${t.date!.uts}`)
      }
      return {
        track_id:   t.mbid && t.mbid !== "" ? t.mbid : null,
        track_name: t.name,
        artist:     t.artist["#text"],
        played_at:  new Date(uts * 1000).toISOString(),
        uts,
        album:      pickAlbum(t.album),
        image_url:  pickImage(t.image),
      }
    })

  return {
    tracks,
    totalPages: parseInt(parsed.recenttracks["@attr"].totalPages, 10),
  }
}

/**
 * Parse the raw JSON from user.getRecentTracks (limit=1) for the now-playing widget.
 *
 * Never throws — view-time reads must degrade to null.
 * - If the first track has @attr.nowplaying → isPlaying=true, played_at=null.
 * - Otherwise falls back to arr[0] with isPlaying=false and a computed played_at.
 * - Returns null for empty arrays or unparseable envelopes.
 */
export function parseNowPlaying(raw: unknown): NowPlaying | null {
  const parsed = ResponseSchema.safeParse(raw)
  if (!parsed.success) return null
  const arr = Array.isArray(parsed.data.recenttracks.track)
    ? parsed.data.recenttracks.track
    : [parsed.data.recenttracks.track]
  if (arr.length === 0) return null

  const nowplaying = arr.find((t) => t["@attr"]?.nowplaying)
  const t = nowplaying ?? arr[0]!
  const isPlaying = Boolean(nowplaying)

  let played_at: string | null = null
  if (!isPlaying && t.date) {
    const uts = parseInt(t.date.uts, 10)
    if (Number.isFinite(uts) && uts > 0) played_at = new Date(uts * 1000).toISOString()
  }

  return {
    isPlaying,
    track_name: t.name,
    artist:     t.artist["#text"],
    album:      pickAlbum(t.album),
    image_url:  pickImage(t.image),
    played_at,
  }
}

/**
 * Parse the raw JSON from user.getInfo.
 *
 * Picks the largest non-empty avatar URL from the image array.
 * Returns { avatarUrl: null } on any error or missing image — never throws.
 */
export function parseUserInfo(raw: unknown): { avatarUrl: string | null } {
  if (ErrorSchema.safeParse(raw).success) return { avatarUrl: null }

  const parsed = UserInfoResponseSchema.safeParse(raw)
  if (!parsed.success) return { avatarUrl: null }

  const images = parsed.data.user.image ?? []
  for (const size of ["extralarge", "large", "medium", "small"] as const) {
    const img = images.find((i) => i.size === size)
    if (img && img["#text"] !== "") return { avatarUrl: img["#text"] }
  }

  return { avatarUrl: null }
}
