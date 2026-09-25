import { describe, expect, it } from "vitest"
import { buildCsp } from "../../lib/security/csp"

const SUPABASE_URL = "https://abcdefgh.supabase.co"

describe("buildCsp", () => {
  it("locks down framing and plugins", () => {
    const csp = buildCsp({ isDev: false, supabaseUrl: SUPABASE_URL })
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain("form-action 'self'")
    expect(csp).toContain("upgrade-insecure-requests")
  })

  it("allows the Last.fm image CDN and inline data/blob images", () => {
    const csp = buildCsp({ isDev: false, supabaseUrl: SUPABASE_URL })
    expect(csp).toMatch(/img-src[^;]*https:\/\/\*\.freetls\.fastly\.net/)
    expect(csp).toMatch(/img-src[^;]*data:/)
    expect(csp).toMatch(/img-src[^;]*blob:/)
  })

  it("allows the Supabase origin in connect-src", () => {
    const csp = buildCsp({ isDev: false, supabaseUrl: SUPABASE_URL })
    expect(csp).toMatch(new RegExp(`connect-src[^;]*'self'`))
    expect(csp).toContain(SUPABASE_URL)
  })

  it("includes 'unsafe-eval' for scripts only in development", () => {
    const dev = buildCsp({ isDev: true, supabaseUrl: SUPABASE_URL })
    const prod = buildCsp({ isDev: false, supabaseUrl: SUPABASE_URL })
    expect(dev).toMatch(/script-src[^;]*'unsafe-eval'/)
    expect(prod).not.toContain("'unsafe-eval'")
  })

  it("is a single-line header value (no newlines, no double spaces)", () => {
    const csp = buildCsp({ isDev: false, supabaseUrl: SUPABASE_URL })
    expect(csp).not.toContain("\n")
    expect(csp).not.toContain("  ")
  })
})
