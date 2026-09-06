import { describe, expect, it } from "vitest"
import { computeStreaks } from "../../lib/streaks"

const TODAY = "2026-09-06"

function days(...offsets: number[]): string[] {
  const base = new Date(TODAY)
  return offsets
    .map((n) => {
      const d = new Date(base)
      d.setDate(d.getDate() + n)
      return d.toISOString().slice(0, 10)
    })
    .sort()
}

describe("computeStreaks", () => {
  it("returns 0/0 for empty history", () => {
    expect(computeStreaks([], TODAY)).toEqual({
      currentStreak: 0,
      longestStreak: 0,
    })
  })

  it("today only → current = 1, longest = 1", () => {
    expect(computeStreaks(days(0), TODAY)).toEqual({
      currentStreak: 1,
      longestStreak: 1,
    })
  })

  it("yesterday only (today not listened) → current = 1, longest = 1", () => {
    expect(computeStreaks(days(-1), TODAY)).toEqual({
      currentStreak: 1,
      longestStreak: 1,
    })
  })

  it("two days before yesterday, no yesterday → current = 0", () => {
    expect(computeStreaks(days(-2), TODAY)).toEqual({
      currentStreak: 0,
      longestStreak: 1,
    })
  })

  it("5 consecutive days ending today → current = 5, longest = 5", () => {
    expect(computeStreaks(days(-4, -3, -2, -1, 0), TODAY)).toEqual({
      currentStreak: 5,
      longestStreak: 5,
    })
  })

  it("5 consecutive days ending yesterday → current = 5, longest = 5", () => {
    expect(computeStreaks(days(-5, -4, -3, -2, -1), TODAY)).toEqual({
      currentStreak: 5,
      longestStreak: 5,
    })
  })

  it("gap in the middle breaks current but longest captures the run", () => {
    // 5-day run ending 10 days ago, then nothing until today
    const oldRun = days(-14, -13, -12, -11, -10)
    const result = computeStreaks([...oldRun, ...days(0)], TODAY)
    expect(result.currentStreak).toBe(1)
    expect(result.longestStreak).toBe(5)
  })

  it("longest streak in the past beats shorter current streak", () => {
    const oldRun = days(-20, -19, -18, -17, -16, -15) // 6-day run
    const current = days(-1, 0) // 2-day current streak
    const result = computeStreaks([...oldRun, ...current], TODAY)
    expect(result.currentStreak).toBe(2)
    expect(result.longestStreak).toBe(6)
  })

  it("single-day history far in the past → both streaks = 0 for current, 1 for longest", () => {
    const result = computeStreaks(days(-30), TODAY)
    expect(result.currentStreak).toBe(0)
    expect(result.longestStreak).toBe(1)
  })

  it("deduplication: duplicate day strings don't inflate current streak", () => {
    const withDup = [TODAY, TODAY, TODAY]
    const result = computeStreaks(withDup, TODAY)
    expect(result.currentStreak).toBe(1)
    expect(result.longestStreak).toBe(1)
  })

  it("deduplication: duplicate entries don't break longest-streak count", () => {
    // Sep 4, 5 (dup), 6 = 3 consecutive unique days; longest must be 3, not 2
    const withDup = days(-2, -1, -1, 0)
    const result = computeStreaks(withDup, TODAY)
    expect(result.longestStreak).toBe(3)
    expect(result.currentStreak).toBe(3)
  })
})
