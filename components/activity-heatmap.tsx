"use client"

import { parseISO, format, subDays, addDays, startOfWeek, isAfter } from "date-fns"
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

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

export function ActivityHeatmap({ data, today }: Props) {
  const weeks = buildGrid(data, today)

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
    <div className="overflow-x-auto">
      <div className="relative mb-1">
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

      <div className="flex" style={{ gap: "3px" }}>
        {weeks.map((week, col) => (
          <div key={col} className="flex flex-col" style={{ gap: "3px" }}>
            {week.map((cell, row) => (
              <div
                key={`${col}-${row}`}
                className={`w-3 h-3 rounded-sm flex-shrink-0 ${
                  cell.isPlaceholder ? "opacity-0" : colorClass(cell.count)
                }`}
                title={
                  cell.isPlaceholder || cell.count === 0
                    ? cell.date
                    : `${cell.date} — ${cell.count} scrobble${cell.count !== 1 ? "s" : ""}`
                }
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-muted-foreground">Less</span>
        {["bg-muted", "bg-[#34D399]/30", "bg-[#34D399]/55", "bg-[#34D399]/80", "bg-[#34D399]"].map(
          (cls) => (
            <div key={cls} className={`w-3 h-3 rounded-sm ${cls}`} />
          ),
        )}
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>
    </div>
  )
}
