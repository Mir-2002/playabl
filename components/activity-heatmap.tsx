"use client"

import { parseISO, format, subDays, addDays, startOfWeek, isAfter } from "date-fns"
import { Tooltip } from "@base-ui/react/tooltip"
import type { HeatmapDay } from "@/app/(app)/home/actions"

interface Props {
  data: HeatmapDay[]
  today: string
}

type Cell = {
  date:          string
  count:         number
  isPlaceholder: boolean
}

function buildGrid(data: HeatmapDay[], today: string): Cell[][] {
  const dayMap    = new Map(data.map((d) => [d.date, d.count]))
  const todayDate = parseISO(today)
  const gridStart = startOfWeek(subDays(todayDate, 52 * 7), { weekStartsOn: 0 })

  const weeks: Cell[][] = []
  let cursor = gridStart

  while (!isAfter(cursor, todayDate)) {
    const week: Cell[] = []
    for (let i = 0; i < 7; i++) {
      const d       = addDays(cursor, i)
      const dateStr = format(d, "yyyy-MM-dd")
      const isFuture = isAfter(d, todayDate)
      week.push({
        date:          dateStr,
        count:         isFuture ? 0 : (dayMap.get(dateStr) ?? 0),
        isPlaceholder: isFuture,
      })
    }
    weeks.push(week)
    cursor = addDays(cursor, 7)
  }

  return weeks
}

function colorClass(count: number): string {
  if (count <= 0)  return "bg-muted"
  if (count < 5)   return "bg-[#34D399]/30"
  if (count < 20)  return "bg-[#34D399]/55"
  if (count < 50)  return "bg-[#34D399]/80"
  return "bg-[#34D399]"
}

function formatTooltip(date: string, count: number): string {
  const d = parseISO(date)
  const label = format(d, "MMM d")
  if (count === 0) return `No scrobbles · ${label}`
  return `${count} scrobble${count !== 1 ? "s" : ""} · ${label}`
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

export function ActivityHeatmap({ data, today }: Props) {
  const weeks = buildGrid(data, today)

  const activeDays = data.filter((d) => d.count > 0).length

  const monthLabels: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, col) => {
    const month = parseISO(week[0].date).getMonth()
    if (month !== lastMonth) {
      monthLabels.push({ label: MONTHS[month], col })
      lastMonth = month
    }
  })

  return (
    <Tooltip.Provider delay={200}>
      <div className="overflow-x-auto">
        {/* AT summary for screen-reader users */}
        <p className="sr-only">
          Listening activity over the last year: {activeDays} active {activeDays === 1 ? "day" : "days"}.
        </p>

        {/* Month labels */}
        <div className="relative mb-1" aria-hidden>
          <div className="flex text-[10px] text-muted-foreground" style={{ gap: "3px" }}>
            {weeks.map((_, col) => {
              const label = monthLabels.find((m) => m.col === col)
              return (
                <div key={col} className="w-3 flex-shrink-0 font-medium">
                  {label ? label.label : ""}
                </div>
              )
            })}
          </div>
        </div>

        {/* Week columns with stagger — hidden from AT; the sr-only summary above covers it */}
        <div
          className="flex"
          style={{ gap: "3px" }}
          aria-hidden
        >
          {weeks.map((week, col) => (
            <div
              key={col}
              className="flex flex-col animate-pop-in"
              style={{
                gap: "3px",
                "--i": Math.min(col, 13),
              } as React.CSSProperties}
            >
              {week.map((cell, row) => (
                cell.isPlaceholder ? (
                  <div key={`${col}-${row}`} className="w-3 h-3 rounded-sm flex-shrink-0 opacity-0" />
                ) : (
                  <Tooltip.Root key={`${col}-${row}`}>
                    <Tooltip.Trigger
                      render={
                        <button
                          type="button"
                          className={`w-3 h-3 rounded-sm flex-shrink-0 cursor-default transition-transform duration-[--dur-base] hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground ${colorClass(cell.count)}`}
                        />
                      }
                      aria-label={formatTooltip(cell.date, cell.count)}
                    />
                    <Tooltip.Portal>
                      <Tooltip.Positioner sideOffset={6}>
                        <Tooltip.Popup className="z-50 rounded-lg border-2 border-foreground bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-hard-sm animate-in fade-in zoom-in-95 duration-[--dur-fast]">
                          {formatTooltip(cell.date, cell.count)}
                        </Tooltip.Popup>
                      </Tooltip.Positioner>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                )
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 justify-end" aria-hidden>
          <span className="text-[10px] text-muted-foreground">Less</span>
          {["bg-muted", "bg-[#34D399]/30", "bg-[#34D399]/55", "bg-[#34D399]/80", "bg-[#34D399]"].map(
            (cls) => (
              <div key={cls} className={`w-3 h-3 rounded-sm ${cls}`} />
            ),
          )}
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
      </div>
    </Tooltip.Provider>
  )
}
