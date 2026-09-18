import { describe, expect, it } from "vitest"
import { parseRecentTracks, parseNowPlaying } from "../../supabase/functions/_shared/lastfm"

// ── fixtures ──────────────────────────────────────────────────────────────────

const validTrack = {
  name: "Blinding Lights",
  artist: { "#text": "The Weeknd", mbid: "abc123" },
  mbid: "track-mbid-xyz",
  date: { uts: "1725616800", "#text": "06 Sep 2024, 10:00" },
}

const trackWithArt = {
  ...validTrack,
  album: { "#text": "After Hours", mbid: "" },
  image: [
    { "#text": "https://lastfm.freetls.fastly.net/i/u/34s/art.png", size: "small" },
    { "#text": "https://lastfm.freetls.fastly.net/i/u/64s/art.png", size: "medium" },
    { "#text": "https://lastfm.freetls.fastly.net/i/u/174s/art.png", size: "large" },
    { "#text": "https://lastfm.freetls.fastly.net/i/u/300x300/art.png", size: "extralarge" },
  ],
}

const placeholderUrl =
  "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"

const trackWithPlaceholderImage = {
  ...validTrack,
  album: { "#text": "After Hours", mbid: "" },
  image: [{ "#text": placeholderUrl, size: "extralarge" }],
}

const nowplayingTrackWithArt = {
  name: "Save Your Tears",
  artist: { "#text": "The Weeknd" },
  mbid: "",
  "@attr": { nowplaying: "true" as const },
  album: { "#text": "After Hours" },
  image: [{ "#text": "https://lastfm.freetls.fastly.net/i/u/300x300/art.png", size: "extralarge" }],
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

  it("skips a row with an invalid (non-numeric) uts instead of throwing", () => {
    const badUts = {
      ...validResponse,
      recenttracks: {
        ...validResponse.recenttracks,
        track: [{ ...validTrack, date: { uts: "not-a-number" } }],
      },
    }
    const { tracks } = parseRecentTracks(badUts)
    expect(tracks).toHaveLength(0)
  })

  it("keeps good rows when one row has an invalid uts (no page poisoning)", () => {
    const mixed = {
      recenttracks: {
        track: [{ ...validTrack, date: { uts: "not-a-number" } }, validTrack],
        "@attr": {
          user: "testuser",
          totalPages: "1",
          page: "1",
          perPage: "200",
          total: "2",
        },
      },
    }
    const { tracks } = parseRecentTracks(mixed)
    expect(tracks).toHaveLength(1)
    expect(tracks[0].track_name).toBe("Blinding Lights")
  })

  it("returns an empty result for an unrecognised shape (treated as empty poll)", () => {
    expect(parseRecentTracks({ items: [] })).toEqual({ tracks: [], totalPages: 1 })
    expect(parseRecentTracks({})).toEqual({ tracks: [], totalPages: 1 })
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

// ── album / image enrichment ──────────────────────────────────────────────────

const attr = { user: "testuser", totalPages: "1", page: "1", perPage: "200", total: "1" }

describe("parseRecentTracks album/image enrichment", () => {
  it("captures album name and largest art URL", () => {
    const res = { recenttracks: { track: [trackWithArt], "@attr": attr } }
    const { tracks } = parseRecentTracks(res)
    expect(tracks[0].album).toBe("After Hours")
    expect(tracks[0].image_url).toBe("https://lastfm.freetls.fastly.net/i/u/300x300/art.png")
  })

  it("returns image_url=null for the Last.fm placeholder image", () => {
    const res = { recenttracks: { track: [trackWithPlaceholderImage], "@attr": attr } }
    const { tracks } = parseRecentTracks(res)
    expect(tracks[0].image_url).toBeNull()
  })

  it("returns album=null and image_url=null when fields are absent", () => {
    const res = { recenttracks: { track: [validTrack], "@attr": attr } }
    const { tracks } = parseRecentTracks(res)
    expect(tracks[0].album).toBeNull()
    expect(tracks[0].image_url).toBeNull()
  })

  it("returns album=null when album text is empty string", () => {
    const trackWithEmptyAlbum = { ...validTrack, album: { "#text": "" } }
    const res = { recenttracks: { track: [trackWithEmptyAlbum], "@attr": attr } }
    const { tracks } = parseRecentTracks(res)
    expect(tracks[0].album).toBeNull()
  })
})

// ── parseNowPlaying ───────────────────────────────────────────────────────────

const npAttr = { user: "testuser", totalPages: "1", page: "1", perPage: "1", total: "1" }

const recentScrobble = {
  name: "Blinding Lights",
  artist: { "#text": "The Weeknd" },
  mbid: "",
  date: { uts: "1725616800", "#text": "06 Sep 2024, 10:00" },
}

describe("parseNowPlaying", () => {
  it("returns isPlaying=true and played_at=null when nowplaying item is present", () => {
    const res = {
      recenttracks: {
        track: [nowplayingTrackWithArt, recentScrobble],
        "@attr": npAttr,
      },
    }
    const result = parseNowPlaying(res)
    expect(result).not.toBeNull()
    expect(result!.isPlaying).toBe(true)
    expect(result!.played_at).toBeNull()
    expect(result!.track_name).toBe("Save Your Tears")
    expect(result!.artist).toBe("The Weeknd")
    expect(result!.album).toBe("After Hours")
    expect(result!.image_url).toBe("https://lastfm.freetls.fastly.net/i/u/300x300/art.png")
  })

  it("returns isPlaying=false with ISO played_at when no nowplaying flag (idle state)", () => {
    const res = {
      recenttracks: {
        track: recentScrobble,  // single-track-as-object (limit=1 quirk)
        "@attr": npAttr,
      },
    }
    const result = parseNowPlaying(res)
    expect(result).not.toBeNull()
    expect(result!.isPlaying).toBe(false)
    expect(result!.played_at).toBe("2024-09-06T10:00:00.000Z")
    expect(result!.track_name).toBe("Blinding Lights")
  })

  it("returns null for an empty track list", () => {
    const res = {
      recenttracks: {
        track: [],
        "@attr": npAttr,
      },
    }
    expect(parseNowPlaying(res)).toBeNull()
  })

  it("returns null for a Last.fm error envelope — never throws", () => {
    expect(parseNowPlaying({ error: 6, message: "User not found" })).toBeNull()
  })

  it("returns null for garbage input — never throws", () => {
    expect(parseNowPlaying(null)).toBeNull()
    expect(parseNowPlaying("not json")).toBeNull()
    expect(parseNowPlaying({})).toBeNull()
  })
})
