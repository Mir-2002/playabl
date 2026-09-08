import { describe, expect, it } from "vitest"
import {
  buildStreakMonth,
  canGoPrev,
  canGoNext,
  prevMonthAnchor,
  nextMonthAnchor,
} from "../../lib/streak-calendar"
import type { WeekRow } from "../../lib/streak-calendar"

// September 2026 layout (Sunday-first):
// Week 0: [blank, blank, Sep1(Tue), Sep2, Sep3, Sep4, Sep5(Sat)]
// Week 1: [Sep6(Sun), Sep7, Sep8, Sep9, Sep10(Thu), Sep11(Fri), Sep12(Sat)]
// Week 2: [Sep13, Sep14, Sep15, Sep16, Sep17, Sep18, Sep19]
// Week 3: [Sep20, Sep21, Sep22, Sep23, Sep24, Sep25, Sep26]
// Week 4: [Sep27, Sep28, Sep29, Sep30, blank, blank, blank]

const YEAR_MONTH = "2026-09"
const TODAY = "2026-09-08"
const SIGNUP_DAY = "2026-09-01"

function qs(...dates: string[]): Set<string> {
  return new Set(dates)
}

function findCell(weeks: WeekRow[], date: string) {
  for (const week of weeks) {
    for (const cell of week) {
      if (cell.date === date) return cell
    }
  }
  return null
}

describe("buildStreakMonth", () => {
  it("gap between two lit days: day after gap has connectsLeft = false", () => {
    // Sep 1 (Tue, col 2) and Sep 3 (Thu, col 4) lit; Sep 2 (col 3) is missed
    const month = buildStreakMonth({
      yearMonth: YEAR_MONTH,
      today: TODAY,
      signupDay: SIGNUP_DAY,
      qualifyingDays: qs("2026-09-01", "2026-09-03"),
    })
    const sep2 = findCell(month.weeks, "2026-09-02")
    const sep3 = findCell(month.weeks, "2026-09-03")
    expect(sep2?.state).toBe("missed")
    expect(sep3?.state).toBe("lit")
    expect(sep3?.connectsLeft).toBe(false)
  })

  it("isolated lit day has connectsLeft = false", () => {
    // Sep 5 (Sat, col 6) — past date, isolated (no adjacent lit neighbors)
    const month = buildStreakMonth({
      yearMonth: YEAR_MONTH,
      today: TODAY,
      signupDay: SIGNUP_DAY,
      qualifyingDays: qs("2026-09-05"),
    })
    const sep5 = findCell(month.weeks, "2026-09-05")
    expect(sep5?.state).toBe("lit")
    expect(sep5?.connectsLeft).toBe(false)
  })

  it("two consecutive lit days mid-week: second has connectsLeft, first has connectsRight", () => {
    // Sep 3 (Thu, col 4) and Sep 4 (Fri, col 5) — both past, adjacent in week 0
    const month = buildStreakMonth({
      yearMonth: YEAR_MONTH,
      today: TODAY,
      signupDay: SIGNUP_DAY,
      qualifyingDays: qs("2026-09-03", "2026-09-04"),
    })
    const sep3 = findCell(month.weeks, "2026-09-03")
    const sep4 = findCell(month.weeks, "2026-09-04")
    expect(sep3?.state).toBe("lit")
    expect(sep3?.connectsLeft).toBe(false)
    expect(sep3?.connectsRight).toBe(true)
    expect(sep4?.state).toBe("lit")
    expect(sep4?.connectsLeft).toBe(true)
    expect(sep4?.connectsRight).toBe(false)
  })

  it("today with no activity → today-pending", () => {
    const month = buildStreakMonth({
      yearMonth: YEAR_MONTH,
      today: TODAY,
      signupDay: SIGNUP_DAY,
      qualifyingDays: qs(),
    })
    const todayCell = findCell(month.weeks, TODAY)
    expect(todayCell?.state).toBe("today-pending")
    expect(todayCell?.connectsLeft).toBe(false)
  })

  it("today with activity → lit", () => {
    const month = buildStreakMonth({
      yearMonth: YEAR_MONTH,
      today: TODAY,
      signupDay: SIGNUP_DAY,
      qualifyingDays: qs(TODAY),
    })
    const todayCell = findCell(month.weeks, TODAY)
    expect(todayCell?.state).toBe("lit")
  })

  it("days before signupDay → pre-signup", () => {
    // signupDay is Sep 5; Sep 3 and Sep 4 should be pre-signup
    const month = buildStreakMonth({
      yearMonth: YEAR_MONTH,
      today: TODAY,
      signupDay: "2026-09-05",
      qualifyingDays: qs(),
    })
    expect(findCell(month.weeks, "2026-09-03")?.state).toBe("pre-signup")
    expect(findCell(month.weeks, "2026-09-04")?.state).toBe("pre-signup")
    expect(findCell(month.weeks, "2026-09-05")?.state).toBe("missed")
  })

  it("days after today → future", () => {
    const month = buildStreakMonth({
      yearMonth: YEAR_MONTH,
      today: TODAY,
      signupDay: SIGNUP_DAY,
      qualifyingDays: qs(),
    })
    expect(findCell(month.weeks, "2026-09-09")?.state).toBe("future")
    expect(findCell(month.weeks, "2026-09-30")?.state).toBe("future")
  })

  it("month boundary: first cell of month never connectsLeft, even if lit", () => {
    // Sep 1 is Tue (col 2); cells[0] and cells[1] are blank; cells[2] = Sep 1 lit
    const month = buildStreakMonth({
      yearMonth: YEAR_MONTH,
      today: TODAY,
      signupDay: SIGNUP_DAY,
      qualifyingDays: qs("2026-09-01"),
    })
    const sep1 = findCell(month.weeks, "2026-09-01")
    expect(sep1?.state).toBe("lit")
    expect(sep1?.connectsLeft).toBe(false)
  })

  it("correct leading blanks for September 2026 (starts Tuesday)", () => {
    const month = buildStreakMonth({
      yearMonth: YEAR_MONTH,
      today: TODAY,
      signupDay: SIGNUP_DAY,
      qualifyingDays: qs(),
    })
    expect(month.weeks[0][0].state).toBe("blank")   // Sun
    expect(month.weeks[0][1].state).toBe("blank")   // Mon
    expect(month.weeks[0][2].date).toBe("2026-09-01") // Tue = day 1
    expect(month.weeks[0][2].dayNumber).toBe(1)
  })

  it("correct trailing blanks: Sep 30 is Wed, so Thu/Fri/Sat of last row are blank", () => {
    const month = buildStreakMonth({
      yearMonth: YEAR_MONTH,
      today: TODAY,
      signupDay: SIGNUP_DAY,
      qualifyingDays: qs(),
    })
    const lastWeek = month.weeks[month.weeks.length - 1]
    expect(lastWeek[3].date).toBe("2026-09-30")  // Wed = col 3
    expect(lastWeek[4].state).toBe("blank")       // Thu
    expect(lastWeek[5].state).toBe("blank")       // Fri
    expect(lastWeek[6].state).toBe("blank")       // Sat
  })

  it("week boundary: Saturday→Sunday lit pair does NOT set connectsLeft on Sunday", () => {
    // Sep 5 = Sat (col 6), Sep 6 = Sun (col 0 of next row) — both lit
    const month = buildStreakMonth({
      yearMonth: YEAR_MONTH,
      today: TODAY,
      signupDay: SIGNUP_DAY,
      qualifyingDays: qs("2026-09-05", "2026-09-06"),
    })
    const sep5 = findCell(month.weeks, "2026-09-05")
    const sep6 = findCell(month.weeks, "2026-09-06")
    expect(sep5?.state).toBe("lit")
    expect(sep6?.state).toBe("lit")
    expect(sep6?.connectsLeft).toBe(false) // col 0 = Sunday, never connects left
  })

  it("month label and year label are correct", () => {
    const month = buildStreakMonth({
      yearMonth: YEAR_MONTH,
      today: TODAY,
      signupDay: SIGNUP_DAY,
      qualifyingDays: qs(),
    })
    expect(month.monthLabel).toBe("September")
    expect(month.yearLabel).toBe("2026")
    expect(month.yearMonth).toBe(YEAR_MONTH)
  })
})

describe("nav helpers", () => {
  it("prevMonthAnchor decrements month", () => {
    expect(prevMonthAnchor("2026-09")).toBe("2026-08")
    expect(prevMonthAnchor("2026-01")).toBe("2025-12")
  })

  it("nextMonthAnchor increments month", () => {
    expect(nextMonthAnchor("2026-08")).toBe("2026-09")
    expect(nextMonthAnchor("2026-12")).toBe("2027-01")
  })

  it("canGoPrev: true when prev month >= signup month", () => {
    // signupDay = 2026-07-15; prev of 2026-09 = 2026-08 >= 2026-07 → true
    expect(canGoPrev("2026-09", "2026-07-15")).toBe(true)
    // prev of 2026-07 = 2026-06 < 2026-07 → false
    expect(canGoPrev("2026-07", "2026-07-15")).toBe(false)
  })

  it("canGoNext: true when next month <= today month", () => {
    // today = 2026-09-08; next of 2026-09 = 2026-10 > 2026-09 → false
    expect(canGoNext("2026-09", "2026-09-08")).toBe(false)
    // next of 2026-08 = 2026-09 <= 2026-09 → true
    expect(canGoNext("2026-08", "2026-09-08")).toBe(true)
  })
})
