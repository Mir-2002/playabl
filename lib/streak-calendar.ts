import {
  parseISO,
  format,
  startOfMonth,
  getDaysInMonth,
  getDay,
  addDays,
} from "date-fns"

export type CellState =
  | "blank"
  | "pre-signup"
  | "future"
  | "today-pending"
  | "missed"
  | "lit"

export interface CalendarCell {
  date: string | null
  dayNumber: number | null
  state: CellState
  connectsLeft: boolean
  connectsRight: boolean
}

export type WeekRow = [
  CalendarCell,
  CalendarCell,
  CalendarCell,
  CalendarCell,
  CalendarCell,
  CalendarCell,
  CalendarCell,
]

export interface StreakMonth {
  yearMonth: string
  monthLabel: string
  yearLabel: string
  weeks: WeekRow[]
}

export interface BuildStreakMonthInput {
  yearMonth: string
  today: string
  signupDay: string
  qualifyingDays: Set<string>
}

function resolveState(
  dateStr: string,
  today: string,
  signupDay: string,
  qualifyingDays: Set<string>,
): CellState {
  if (dateStr < signupDay) return "pre-signup"
  if (dateStr > today) return "future"
  if (qualifyingDays.has(dateStr)) return "lit"
  if (dateStr === today) return "today-pending"
  return "missed"
}

const BLANK: CalendarCell = {
  date: null,
  dayNumber: null,
  state: "blank",
  connectsLeft: false,
  connectsRight: false,
}

export function buildStreakMonth(input: BuildStreakMonthInput): StreakMonth {
  const { yearMonth, today, signupDay, qualifyingDays } = input

  const anchorDate = parseISO(yearMonth + "-01")
  const monthStart = startOfMonth(anchorDate)
  const daysInMonth = getDaysInMonth(anchorDate)
  const leadingBlanks = getDay(monthStart) // 0=Sun…6=Sat

  const cells: CalendarCell[] = []

  for (let i = 0; i < leadingBlanks; i++) {
    cells.push({ ...BLANK })
  }

  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const d = addDays(monthStart, dayNum - 1)
    const dateStr = format(d, "yyyy-MM-dd")
    cells.push({
      date: dateStr,
      dayNumber: dayNum,
      state: resolveState(dateStr, today, signupDay, qualifyingDays),
      connectsLeft: false,
      connectsRight: false,
    })
  }

  const trailingBlanks = (7 - (cells.length % 7)) % 7
  for (let i = 0; i < trailingBlanks; i++) {
    cells.push({ ...BLANK })
  }

  // Second pass: compute connectsLeft and connectsRight
  for (let i = 0; i < cells.length; i++) {
    const col = i % 7
    cells[i].connectsLeft =
      cells[i].state === "lit" && col !== 0 && cells[i - 1].state === "lit"
    cells[i].connectsRight =
      cells[i].state === "lit" &&
      i + 1 < cells.length &&
      cells[i + 1].state === "lit"
  }

  // Slice into week rows
  const weeks: WeekRow[] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7) as WeekRow)
  }

  return {
    yearMonth,
    monthLabel: format(anchorDate, "MMMM"),
    yearLabel: format(anchorDate, "yyyy"),
    weeks,
  }
}

export function prevMonthAnchor(yearMonth: string): string {
  let [y, m] = yearMonth.split("-").map(Number)
  m -= 1
  if (m === 0) {
    m = 12
    y -= 1
  }
  return `${y}-${String(m).padStart(2, "0")}`
}

export function nextMonthAnchor(yearMonth: string): string {
  let [y, m] = yearMonth.split("-").map(Number)
  m += 1
  if (m === 13) {
    m = 1
    y += 1
  }
  return `${y}-${String(m).padStart(2, "0")}`
}

export function canGoPrev(yearMonth: string, signupDay: string): boolean {
  return prevMonthAnchor(yearMonth) >= signupDay.slice(0, 7)
}

export function canGoNext(yearMonth: string, today: string): boolean {
  return nextMonthAnchor(yearMonth) <= today.slice(0, 7)
}
