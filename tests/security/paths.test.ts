import { describe, expect, it } from "vitest"
import { isPublicPath } from "../../lib/security/paths"

describe("isPublicPath", () => {
  it("treats the landing and login pages as public", () => {
    expect(isPublicPath("/")).toBe(true)
    expect(isPublicPath("/login")).toBe(true)
  })

  it("treats the auth callback and any /auth/* route as public", () => {
    expect(isPublicPath("/auth/lastfm/callback")).toBe(true)
    expect(isPublicPath("/auth")).toBe(true)
  })

  it("treats public profile / invite links as public", () => {
    expect(isPublicPath("/u/rj")).toBe(true)
    expect(isPublicPath("/u/Some-User_1")).toBe(true)
  })

  it("treats the (app) route-group pages as protected", () => {
    expect(isPublicPath("/home")).toBe(false)
    expect(isPublicPath("/history")).toBe(false)
    expect(isPublicPath("/streak")).toBe(false)
    expect(isPublicPath("/leaderboard")).toBe(false)
    expect(isPublicPath("/friends")).toBe(false)
  })

  it("is default-secure: unknown routes are protected", () => {
    expect(isPublicPath("/settings")).toBe(false)
    expect(isPublicPath("/admin")).toBe(false)
  })

  it("does not let a lookalike prefix bypass the allowlist", () => {
    expect(isPublicPath("/logins")).toBe(false)
    expect(isPublicPath("/userland")).toBe(false)
    expect(isPublicPath("/authenticate")).toBe(false)
  })
})
