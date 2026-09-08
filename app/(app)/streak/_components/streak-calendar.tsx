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
import type { CalendarCell } from "@/lib/streak-calendar"

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
      <div className="grid grid-cols-7 gap-2 mb-2">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="w-10 h-6 mx-auto flex items-center justify-center text-xs font-bold text-muted-foreground uppercase"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid — one div per week row */}
      <div className="space-y-2">
        {month.weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-2">
            {week.map((cell, ci) => (
              <CalendarCellView
                key={cell.date ?? `blank-${wi}-${ci}`}
                cell={cell}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function CalendarCellView({ cell }: { cell: CalendarCell }) {
  if (cell.state === "blank") {
    return <div className="w-10 h-14" aria-hidden />
  }

  return (
    // Each cell is a column: 40px circle + 4px gap + ~10px number = ~54px (~h-14)
    <div className="relative flex flex-col items-center gap-1 w-10 mx-auto">
      {/* Connector strips — bridge the gap-2 (8px) to the adjacent lit cells.
          Positioned at the circle's vertical center (top 20px = half of 40px). */}
      {cell.connectsLeft && (
        <span
          aria-hidden
          className="absolute top-[20px] -translate-y-1/2 right-full w-2 h-3 bg-[#FBBF24]"
        />
      )}
      {cell.connectsRight && (
        <span
          aria-hidden
          className="absolute top-[20px] -translate-y-1/2 left-full w-2 h-3 bg-[#FBBF24]"
        />
      )}

      {cell.state === "lit" && (
        <>
          <div className="w-10 h-10 rounded-full bg-[#FBBF24] border-2 border-foreground flex items-center justify-center z-10 relative">
            <Flame className="w-5 h-5 text-foreground" />
          </div>
          <span className="text-[10px] font-bold text-foreground/70 leading-none">
            {cell.dayNumber}
          </span>
        </>
      )}

      {cell.state === "missed" && (
        <>
          <div className="w-10 h-10 rounded-full bg-muted border-2 border-foreground/20 flex items-center justify-center opacity-40">
            <Flame className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground/40 leading-none">
            {cell.dayNumber}
          </span>
        </>
      )}

      {cell.state === "today-pending" && (
        <>
          <div className="relative w-10 h-10 rounded-full border-2 border-[#F472B6] flex items-center justify-center">
            <span className="absolute inset-0 rounded-full border-2 border-[#F472B6] animate-ping opacity-50" />
            <span className="text-xs font-bold text-foreground/60">
              {cell.dayNumber}
            </span>
          </div>
          {/* spacer to keep height consistent with lit/missed cells */}
          <span className="h-[10px]" aria-hidden />
        </>
      )}

      {(cell.state === "future" || cell.state === "pre-signup") && (
        <>
          <div className="w-10 h-10 flex items-center justify-center">
            <span className="text-xs text-muted-foreground/40 font-medium">
              {cell.dayNumber}
            </span>
          </div>
          <span className="h-[10px]" aria-hidden />
        </>
      )}
    </div>
  )
}
