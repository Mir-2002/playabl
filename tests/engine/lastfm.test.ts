import { describe, expect, it } from "vitest"
import { parseRecentTracks } from "../../supabase/functions/_shared/lastfm"

// ── fixtures ──────────────────────────────────────────────────────────────────

const validTrack = {
  name: "Blinding Lights",
  artist: { "#text": "The Weeknd", mbid: "abc123" },
  mbid: "track-mbid-xyz",
  date: { uts: "1725616800", "#text": "06 Sep 2024, 10:00" },
}

const nowplayingTrack = {
  name: "Blinding Lights",
  artist: { "#text": "The Weeknd" },
  mbid: "",
  "@attr": { nowplaying: "true" as const },
  // no date field
}

const validResponse = {
  recenttracks: {
    track: [validTrack],
    "@attr": {
      user: "testuser",
      totalPages: "1",
      page: "1",
      perPage: "200",
      total: "1",
    },
  },
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("parseRecentTracks", () => {
  it("parses a valid array envelope", () => {
    const { tracks, totalPages } = parseRecentTracks(validResponse)
    expect(tracks).toHaveLength(1)
    expect(tracks[0].track_name).toBe("Blinding Lights")
    expect(tracks[0].artist).toBe("The Weeknd")
    expect(tracks[0].track_id).toBe("track-mbid-xyz")
    expect(totalPages).toBe(1)
  })

  it("coerces uts → ISO 8601 UTC played_at", () => {
    const { tracks } = parseRecentTracks(validResponse)
    // 1725616800 seconds → 2024-09-06T10:00:00.000Z
    expect(tracks[0].played_at).toBe("2024-09-06T10:00:00.000Z")
    expect(tracks[0].uts).toBe(1725616800)
  })

  it("normalises mbid='' → track_id=null", () => {
    const withEmptyMbid = {
      ...validResponse,
      recenttracks: {
        ...validResponse.recenttracks,
        track: [{ ...validTrack, mbid: "" }],
      },
    }
    const { tracks } = parseRecentTracks(withEmptyMbid)
    expect(tracks[0].track_id).toBeNull()
  })

  it("normalises single-track-as-object → array (limit=1 quirk)", () => {
    const singleObject = {
      recenttracks: {
        track: validTrack,  // object, not array
        "@attr": {
          user: "testuser",
          totalPages: "1",
          page: "1",
          perPage: "1",
          total: "1",
        },
      },
    }
    const { tracks } = parseRecentTracks(singleObject)
    expect(tracks).toHaveLength(1)
    expect(tracks[0].track_name).toBe("Blinding Lights")
  })

  it("filters out nowplaying items", () => {
    const withNowplaying = {
      recenttracks: {
        track: [nowplayingTrack, validTrack],
        "@attr": {
          user: "testuser",
          totalPages: "1",
          page: "1",
          perPage: "200",
          total: "2",
        },
      },
    }
    const { tracks } = parseRecentTracks(withNowplaying)
    expect(tracks).toHaveLength(1)
    expect(tracks[0].track_name).toBe("Blinding Lights")
  })

  it("returns empty tracks array when all items are nowplaying", () => {
    const allNowplaying = {
      recenttracks: {
        track: [nowplayingTrack],
        "@attr": {
          user: "testuser",
          totalPages: "1",
          page: "1",
          perPage: "200",
          total: "1",
        },
      },
    }
    const { tracks } = parseRecentTracks(allNowplaying)
    expect(tracks).toHaveLength(0)
  })

  it("throws on Last.fm error envelope", () => {
    expect(() =>
      parseRecentTracks({ error: 6, message: "User not found" }),
    ).toThrow("Last.fm error 6: User not found")
  })

  it("throws on invalid (non-numeric) uts", () => {
    const badUts = {
      ...validResponse,
      recenttracks: {
        ...validResponse.recenttracks,
        track: [{ ...validTrack, date: { uts: "not-a-number" } }],
      },
    }
    expect(() => parseRecentTracks(badUts)).toThrow()
  })

  it("throws when recenttracks is missing (schema error)", () => {
    expect(() => parseRecentTracks({ items: [] })).toThrow()
  })

  it("handles multi-page response (totalPages > 1)", () => {
    const multiPage = {
      recenttracks: {
        track: [validTrack],
        "@attr": {
          user: "testuser",
          totalPages: "5",
          page: "1",
          perPage: "200",
          total: "900",
        },
      },
    }
    const { totalPages } = parseRecentTracks(multiPage)
    expect(totalPages).toBe(5)
  })
})
