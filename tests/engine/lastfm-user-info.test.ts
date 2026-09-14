import { describe, expect, it } from "vitest"
import { parseUserInfo } from "../../supabase/functions/_shared/lastfm"

const makeResponse = (images: Array<{ "#text": string; size: string }>) => ({
  user: { name: "testuser", image: images },
})

describe("parseUserInfo", () => {
  it("returns extralarge avatar URL when available", () => {
    const res = makeResponse([
      { "#text": "https://lastfm/s.jpg", size: "small" },
      { "#text": "https://lastfm/m.jpg", size: "medium" },
      { "#text": "https://lastfm/l.jpg", size: "large" },
      { "#text": "https://lastfm/xl.jpg", size: "extralarge" },
    ])
    expect(parseUserInfo(res).avatarUrl).toBe("https://lastfm/xl.jpg")
  })

  it("falls back to large when extralarge is empty string", () => {
    const res = makeResponse([
      { "#text": "https://lastfm/l.jpg", size: "large" },
      { "#text": "", size: "extralarge" },
    ])
    expect(parseUserInfo(res).avatarUrl).toBe("https://lastfm/l.jpg")
  })

  it("falls back to medium when large and extralarge are empty", () => {
    const res = makeResponse([
      { "#text": "https://lastfm/m.jpg", size: "medium" },
      { "#text": "", size: "large" },
      { "#text": "", size: "extralarge" },
    ])
    expect(parseUserInfo(res).avatarUrl).toBe("https://lastfm/m.jpg")
  })

  it("falls back to small as last resort", () => {
    const res = makeResponse([
      { "#text": "https://lastfm/s.jpg", size: "small" },
      { "#text": "", size: "medium" },
      { "#text": "", size: "large" },
      { "#text": "", size: "extralarge" },
    ])
    expect(parseUserInfo(res).avatarUrl).toBe("https://lastfm/s.jpg")
  })

  it("returns null when all images are empty strings", () => {
    const res = makeResponse([
      { "#text": "", size: "small" },
      { "#text": "", size: "medium" },
      { "#text": "", size: "large" },
      { "#text": "", size: "extralarge" },
    ])
    expect(parseUserInfo(res).avatarUrl).toBeNull()
  })

  it("returns null when image array is absent", () => {
    expect(parseUserInfo({ user: { name: "testuser" } }).avatarUrl).toBeNull()
  })

  it("returns null on Last.fm error envelope", () => {
    expect(
      parseUserInfo({ error: 6, message: "User not found" }).avatarUrl,
    ).toBeNull()
  })

  it("returns null on unexpected shape (graceful degradation)", () => {
    expect(parseUserInfo({ foo: "bar" }).avatarUrl).toBeNull()
    expect(parseUserInfo(null).avatarUrl).toBeNull()
    expect(parseUserInfo(undefined).avatarUrl).toBeNull()
  })
})
