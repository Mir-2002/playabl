import { describe, expect, it } from "vitest"
import { computeNextInterval } from "../../supabase/functions/_shared/backoff"

const FLOOR = 180
const CAP   = 3600
const JITTER = 0.15

// Deterministic rng helpers
const fixed = (v: number) => () => v
const midRng = fixed(0.5)   // 0 jitter: result = base exactly
const maxRng = fixed(1.0)   // +15% jitter
const minRng = fixed(0.0)   // -15% jitter

describe("computeNextInterval", () => {
  it("n=0 (new scrobbles): returns ~FLOOR (180s)", () => {
    const result = computeNextInterval(0, midRng)
    expect(result).toBe(FLOOR)
  })

  it("n=1: doubles to ~360s", () => {
    const result = computeNextInterval(1, midRng)
    expect(result).toBe(360)
  })

  it("n=2: doubles to ~720s", () => {
    const result = computeNextInterval(2, midRng)
    expect(result).toBe(720)
  })

  it("n=5: 180 * 32 = 5760 → capped at 3600s", () => {
    const result = computeNextInterval(5, midRng)
    expect(result).toBe(CAP)
  })

  it("n=100 (extreme): still capped at 3600s", () => {
    const result = computeNextInterval(100, midRng)
    expect(result).toBe(CAP)
  })

  it("jitter max (+15%): floor → 180 * 1.15 = 207", () => {
    const result = computeNextInterval(0, maxRng)
    expect(result).toBe(Math.round(FLOOR * 1.15))
  })

  it("jitter min (-15%): floor → 180 * 0.85 = 153", () => {
    const result = computeNextInterval(0, minRng)
    expect(result).toBe(Math.round(FLOOR * 0.85))
  })

  it("jitter stays within ±15% across many samples", () => {
    for (let i = 0; i < 200; i++) {
      const r = computeNextInterval(0, Math.random)
      const lo = Math.round(FLOOR * (1 - JITTER))
      const hi = Math.round(FLOOR * (1 + JITTER))
      expect(r).toBeGreaterThanOrEqual(lo)
      expect(r).toBeLessThanOrEqual(hi)
    }
  })

  it("capped value also stays within ±15% of CAP", () => {
    for (let i = 0; i < 200; i++) {
      const r = computeNextInterval(5, Math.random)
      const lo = Math.round(CAP * (1 - JITTER))
      const hi = Math.round(CAP * (1 + JITTER))
      expect(r).toBeGreaterThanOrEqual(lo)
      expect(r).toBeLessThanOrEqual(hi)
    }
  })
})
