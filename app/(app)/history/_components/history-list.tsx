"use client"

import { useState, useTransition } from "react"
import { formatDistanceToNow } from "date-fns"
import { Music } from "lucide-react"
import { getMoreHistory, type HistoryRow } from "../actions"
import { hasMorePages, keysetCursor, pointsForDuration } from "@/lib/history"

export function HistoryList({ initialRows }: { initialRows: HistoryRow[] }) {
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

  return (
    <div className="space-y-4">
      <ul className="bg-white border-2 border-foreground rounded-2xl overflow-hidden shadow-hard divide-y-2 divide-foreground/10">
        {rows.map((row) => (
          <li
            key={`${row.played_at}`}
            className="flex items-center gap-4 px-6 py-4"
          >
            <div className="w-9 h-9 rounded-full border-2 border-foreground bg-muted flex-shrink-0 flex items-center justify-center">
              <Music className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {row.track_name}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {row.artist}
              </p>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="font-heading font-bold text-primary tabular-nums">
                +{pointsForDuration(row.duration_ms).toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(row.played_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl border-2 border-foreground bg-white font-heading font-bold text-sm shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-60 disabled:pointer-events-none"
          >
            {isPending ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  )
}
