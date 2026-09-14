import { z } from "zod"

// ── Zod schemas ────────────────────────────────────────────────────────────────

const ArtistSchema = z.object({
  "#text": z.string(),
  mbid: z.string().optional(),
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

// ── Public types ───────────────────────────────────────────────────────────────

export type LastfmTrack = {
  track_id:   string | null
  track_name: string
  artist:     string
  played_at:  string  // ISO 8601 UTC
  uts:        number  // unix seconds (used as watermark)
}

export type ParseResult = {
  tracks:     LastfmTrack[]
  totalPages: number
}

// ── Parser ─────────────────────────────────────────────────────────────────────

/**
 * Parse the raw JSON from user.getRecentTracks.
 *
 * - Normalises single-track-as-object → array (Last.fm quirk when limit=1).
 * - Filters out nowplaying items (no date field; not yet scrobbled).
 * - Coerces date.uts (unix-second string) → played_at (ISO 8601 UTC).
 * - Normalises mbid="" → track_id=null.
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
      }
    })

  return {
    tracks,
    totalPages: parseInt(parsed.recenttracks["@attr"].totalPages, 10),
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
