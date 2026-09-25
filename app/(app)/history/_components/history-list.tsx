"use client"

import { useState, useTransition } from "react"
import { formatDistanceToNow } from "date-fns"
import { Music } from "lucide-react"
import Image from "next/image"
import { getMoreHistory, type HistoryRow } from "../actions"
import { hasMorePages, keysetCursor, groupByLocalDay } from "@/lib/history"
import { ListRow } from "@/components/ui/list-row"

export function HistoryList({
  initialRows,
  timezone,
  today,
}: {
  initialRows: HistoryRow[]
  timezone: string
  today: string
}) {
  const [rows, setRows] = useState(initialRows)
  const [hasMore, setHasMore] = useState(hasMorePages(initialRows.length))
  const [isPending, startTransition] = useTransition()

  function loadMore() {
    const cursor = keysetCursor(rows)
    if (!cursor) return
    startTransition(async () => {
      const next = await getMoreHistory(cursor)
      setRows((prev) => [...prev, ...next])
      setHasMore(hasMorePages(next.length))
    })
  }

  const groups = groupByLocalDay(rows, timezone, today)

  return (
    <div className="space-y-4">
      <div className="bg-white border-2 border-foreground rounded-2xl overflow-hidden shadow-hard">
        {groups.map((group, groupIdx) => (
          <div key={group.key}>
            <div
              className={`flex items-center justify-between px-6 py-2 bg-muted/40 ${
                groupIdx > 0 ? "border-t-2 border-foreground/10" : ""
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {group.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {group.rows.length} {group.rows.length === 1 ? "play" : "plays"}
              </span>
            </div>
            <ul className="px-3 py-1">
              {group.rows.map((row, rowIdx) => (
                <li key={`${row.played_at}`}>
                  <ListRow
                    index={rowIdx}
                    leading={
                      <div className="w-10 h-10 rounded-lg border-2 border-foreground bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {row.image_url ? (
                          <Image
                            src={row.image_url}
                            alt={row.track_name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <Music className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    }
                    title={row.track_name}
                    subtitle={`${row.artist}${row.album ? ` · ${row.album}` : ""}`}
                    trailing={
                      <div className="flex flex-col items-end gap-0.5">
                        {!row.credited && (
                          <span
                            className="text-xs font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-foreground/20"
                            title="Over the hourly/daily cap — stored but not counted toward points"
                          >
                            Capped
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(row.played_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl border-2 border-foreground bg-white font-heading font-bold text-sm shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            {isPending ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  )
}
