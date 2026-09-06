"use client"

import { parseISO, format, subDays, addDays, startOfWeek, isAfter } from "date-fns"
import type { HeatmapDay } from "@/app/(app)/home/actions"

interface Props {
  data: HeatmapDay[]
  today: string
}

type Cell = {
  date: string
  totalMs: number
  isPlaceholder: boolean
}

function buildGrid(data: HeatmapDay[], today: string): Cell[][] {
  const dayMap = new Map(data.map((d) => [d.date, d.totalMs]))
  const todayDate = parseISO(today)
  const gridStart = startOfWeek(subDays(todayDate, 13 * 7), { weekStartsOn: 0 })

  const weeks: Cell[][] = []
  let cursor = gridStart

  while (!isAfter(cursor, todayDate)) {
    const week: Cell[] = []
    for (let i = 0; i < 7; i++) {
      const d = addDays(cursor, i)
      const dateStr = format(d, "yyyy-MM-dd")
      const isFuture = isAfter(d, todayDate)
      week.push({
        date: dateStr,
        totalMs: isFuture ? 0 : (dayMap.get(dateStr) ?? 0),
        isPlaceholder: isFuture,
      })
    }
    weeks.push(week)
    cursor = addDays(cursor, 7)
  }

  return weeks
}

function colorClass(totalMs: number): string {
  if (totalMs <= 0)         return "bg-muted"
  if (totalMs < MS_30_MIN)  return "bg-[#34D399]/30"
  if (totalMs < MS_2_HR)    return "bg-[#34D399]/55"
  if (totalMs < MS_4_HR)    return "bg-[#34D399]/80"
  return "bg-[#34D399]"
}

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

const MS_30_MIN = 1_800_000
const MS_2_HR   = 7_200_000
const MS_4_HR   = 14_400_000

export function ActivityHeatmap({ data, today }: Props) {
  const weeks = buildGrid(data, today)

  // Build month labels: track which column each new month starts at.
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
      <div className="relative mb-1" style={{ paddingLeft: 0 }}>
        <div
          className="flex text-[10px] text-muted-foreground"
          style={{ gap: "3px" }}
        >
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

      <div
        className="grid grid-rows-7 grid-flow-col"
        style={{ gap: "3px" }}
      >
        {weeks.flatMap((week, col) =>
          week.map((cell, row) => (
            <div
              key={`${col}-${row}`}
              className={`w-3 h-3 rounded-sm flex-shrink-0 ${
                cell.isPlaceholder ? "opacity-0" : colorClass(cell.totalMs)
              }`}
              title={
                cell.isPlaceholder || cell.totalMs === 0
                  ? cell.date
                  : `${cell.date} — ${formatDuration(cell.totalMs)}`
              }
            />
          ))
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-muted-foreground">Less</span>
        {["bg-muted", "bg-[#34D399]/30", "bg-[#34D399]/55", "bg-[#34D399]/80", "bg-[#34D399]"].map(
          (cls) => (
            <div key={cls} className={`w-3 h-3 rounded-sm ${cls}`} />
          )
        )}
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>
    </div>
  )
}
