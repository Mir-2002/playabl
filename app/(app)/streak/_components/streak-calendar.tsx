"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Flame } from "lucide-react"
import {
  buildStreakMonth,
  canGoPrev,
  canGoNext,
  prevMonthAnchor,
  nextMonthAnchor,
} from "@/lib/streak-calendar"
import type { CalendarCell, WeekRow } from "@/lib/streak-calendar"

interface Props {
  qualifyingDays: string[]
  signupDay: string
  today: string
}

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

export function StreakCalendar({ qualifyingDays, signupDay, today }: Props) {
  const [yearMonth, setYearMonth] = useState(today.slice(0, 7))

  const qualifyingSet = new Set(qualifyingDays)
  const month = buildStreakMonth({ yearMonth, today, signupDay, qualifyingDays: qualifyingSet })

  return (
    <div className="bg-white border-2 border-foreground rounded-2xl p-6 shadow-hard">
      {/* Month nav header */}
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={() => setYearMonth(prevMonthAnchor(yearMonth))}
          disabled={!canGoPrev(yearMonth, signupDay)}
          aria-label="Previous month"
          className="w-9 h-9 rounded-full border-2 border-foreground flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <p className="font-heading font-extrabold text-xl text-foreground">
            {month.monthLabel}
          </p>
          <p className="text-xs text-muted-foreground">{month.yearLabel}</p>
        </div>

        <button
          type="button"
          onClick={() => setYearMonth(nextMonthAnchor(yearMonth))}
          disabled={!canGoNext(yearMonth, today)}
          aria-label="Next month"
          className="w-9 h-9 rounded-full border-2 border-foreground flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day-of-week column headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="flex items-center justify-center h-6 text-xs font-bold text-muted-foreground uppercase"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-2">
        {month.weeks.map((week, wi) => (
          <WeekRowView key={wi} week={week} />
        ))}
      </div>
    </div>
  )
}

/** Finds consecutive runs of lit cells within a 7-cell week, returning [colStart, colEnd] pairs. */
function litRuns(week: WeekRow): Array<[number, number]> {
  const runs: Array<[number, number]> = []
  let start = -1
  for (let i = 0; i <= 7; i++) {
    const lit = i < 7 && week[i].state === "lit"
    if (lit && start === -1) {
      start = i
    } else if (!lit && start !== -1) {
      if (i - start >= 2) runs.push([start, i - 1])
      start = -1
    }
  }
  return runs
}

function WeekRowView({ week }: { week: WeekRow }) {
  const runs = litRuns(week)

  return (
    <div className="relative">
      {/*
        Connector bars drawn at row level. Using column-center percentages means both
        endpoints share the same width reference — no sub-pixel gap at column boundaries.

        Circle center is at top 20px (half of h-10 = 40px).
        Column i center (0-indexed): (i + 0.5) / 7 * 100%
      */}
      {runs.map(([s, e]) => (
        <div
          key={`${s}-${e}`}
          aria-hidden
          className="absolute h-3 bg-[#FBBF24]"
          style={{
            top: 20,
            transform: "translateY(-50%)",
            left: `${((s + 0.5) / 7) * 100}%`,
            right: `${((7 - e - 0.5) / 7) * 100}%`,
          }}
        />
      ))}

      {/* Cells rendered above bars via stacking context */}
      <div className="grid grid-cols-7 relative z-10">
        {week.map((cell, ci) => (
          <CalendarCellView key={cell.date ?? `blank-${ci}`} cell={cell} />
        ))}
      </div>
    </div>
  )
}

function CalendarCellView({ cell }: { cell: CalendarCell }) {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Circle slot — 40px height */}
      <div className="h-10 w-full flex items-center justify-center">
        {cell.state === "lit" && (
          <div className="w-10 h-10 rounded-full bg-[#FBBF24] border-2 border-foreground flex items-center justify-center">
            <Flame className="w-5 h-5 text-foreground" />
          </div>
        )}

        {cell.state === "missed" && (
          <div className="w-10 h-10 rounded-full bg-muted border-2 border-foreground/20 flex items-center justify-center opacity-40">
            <Flame className="w-5 h-5 text-muted-foreground" />
          </div>
        )}

        {cell.state === "today-pending" && (
          <div className="relative w-10 h-10 rounded-full border-2 border-[#F472B6] flex items-center justify-center">
            <span className="absolute inset-0 rounded-full border-2 border-[#F472B6] animate-ping opacity-50" />
            <span className="text-xs font-bold text-foreground/60">{cell.dayNumber}</span>
          </div>
        )}

        {(cell.state === "future" || cell.state === "pre-signup") && (
          <span className="text-xs text-muted-foreground/40 font-medium">{cell.dayNumber}</span>
        )}
      </div>

      {/* Day number slot — 16px */}
      <div className="h-4 flex items-center justify-center">
        {cell.state === "lit" && (
          <span className="text-[10px] font-bold text-foreground/70 leading-none">
            {cell.dayNumber}
          </span>
        )}
        {cell.state === "missed" && (
          <span className="text-[10px] font-medium text-muted-foreground/40 leading-none">
            {cell.dayNumber}
          </span>
        )}
      </div>
    </div>
  )
}
