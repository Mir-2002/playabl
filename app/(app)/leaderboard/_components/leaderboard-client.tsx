"use client"

import dynamic from "next/dynamic"
import { useRef, useEffect, useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchJson } from "@/lib/fetch-json"
import type { LeaderboardEntry } from "../actions"
import { Music } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

const MotionList = dynamic(
  () => import("./motion-list").then((m) => m.MotionList),
  { ssr: false }
)

interface Props {
  initialData: LeaderboardEntry[]
  currentUserId: string
}

export function LeaderboardClient({ initialData, currentUserId }: Props) {
  const prevOrderRef = useRef<string[]>(initialData.map((e) => e.id))
  const [rankChanged, setRankChanged] = useState<Set<string>>(new Set())

  const { data: entries = [], dataUpdatedAt, isFetching, isError } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetchJson<LeaderboardEntry[]>("/api/leaderboard"),
    refetchInterval: 30_000,
    initialData,
  })

  useEffect(() => {
    const newOrder = entries.map((e) => e.id)
    const changed = new Set<string>()
    newOrder.forEach((id, newIdx) => {
      const prevIdx = prevOrderRef.current.indexOf(id)
      if (prevIdx !== -1 && prevIdx !== newIdx) changed.add(id)
    })
    prevOrderRef.current = newOrder
    if (changed.size > 0) {
      setRankChanged(changed)
      // clear after animation plays
      const timer = setTimeout(() => setRankChanged(new Set()), 1100)
      return () => clearTimeout(timer)
    }
  }, [entries])

  return (
    <div className="bg-white border-2 border-foreground rounded-2xl overflow-hidden shadow-hard">
      <LiveBar dataUpdatedAt={dataUpdatedAt} isFetching={isFetching} isError={isError} />

      {entries.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={<Music className="w-6 h-6 text-white" />}
            title="No one on the board yet"
            body="Start listening and check back after the cron runs."
            accentColor="#FBBF24"
          />
        </div>
      ) : (
        <MotionList
          entries={entries}
          currentUserId={currentUserId}
          rankChanged={rankChanged}
        />
      )}
    </div>
  )
}

function LiveBar({
  dataUpdatedAt,
  isFetching,
  isError,
}: {
  dataUpdatedAt: number
  isFetching: boolean
  isError: boolean
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const formattedTime = useMemo(() => {
    if (!mounted) return null
    return new Date(dataUpdatedAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [mounted, dataUpdatedAt])

  return (
    <div className="flex items-center justify-end gap-2 px-6 py-2.5 bg-muted border-b-2 border-foreground/10">
      {/* On a refetch failure, drop the pulsing green "live" dot so stale data
          isn't presented as live. */}
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          isError ? "bg-muted-foreground/40" : `bg-[#34D399] ${isFetching ? "animate-pulse" : ""}`
        }`}
        aria-hidden
      />
      <p className="text-xs text-muted-foreground">
        {isError ? (
          "Reconnecting…"
        ) : mounted && formattedTime ? (
          <>Last updated {formattedTime}</>
        ) : (
          <span className="opacity-0">Last updated --:--</span>
        )}
      </p>
    </div>
  )
}
