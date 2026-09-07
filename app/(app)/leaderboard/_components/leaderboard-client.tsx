"use client"

import { useQuery } from "@tanstack/react-query"
import { getLeaderboard, type LeaderboardEntry } from "../actions"
import { Music } from "lucide-react"
import { cn } from "@/lib/utils"

const MEDAL: Record<1 | 2 | 3, { bg: string; text: string; label: string }> = {
  1: { bg: "#FBBF24", text: "#1E293B", label: "Gold" },
  2: { bg: "#94A3B8", text: "#1E293B", label: "Silver" },
  3: { bg: "#CD7C2F", text: "#FFFFFF", label: "Bronze" },
}

interface Props {
  initialData: LeaderboardEntry[]
  currentUserId: string
}

export function LeaderboardClient({ initialData, currentUserId }: Props) {
  const { data: entries = [], dataUpdatedAt } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
    refetchInterval: 30_000,
    initialData,
  })

  return (
    <div className="bg-white border-2 border-foreground rounded-2xl overflow-hidden shadow-hard">
      <LiveBar dataUpdatedAt={dataUpdatedAt} />

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <ol className="divide-y-2 divide-foreground/10">
          {entries.map((entry, index) => {
            const rank = (index + 1) as number
            const isCurrentUser = entry.id === currentUserId
            const displayName = entry.username ?? "Listener"
            const medal = rank <= 3 ? MEDAL[rank as 1 | 2 | 3] : null

            return (
              <li
                key={entry.id}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 transition-colors",
                  isCurrentUser && "bg-primary/5"
                )}
              >
                {/* Rank badge */}
                <div
                  className="w-9 h-9 rounded-full border-2 border-foreground flex-shrink-0 flex items-center justify-center font-heading font-bold text-sm"
                  style={
                    medal
                      ? {
                          background: medal.bg,
                          color: medal.text,
                          boxShadow: "2px 2px 0px 0px #1E293B",
                        }
                      : {
                          background: "hsl(var(--muted))",
                          boxShadow: "2px 2px 0px 0px #1E293B",
                        }
                  }
                  aria-label={
                    medal ? `${medal.label} medal, rank ${rank}` : `Rank ${rank}`
                  }
                >
                  {rank}
                </div>

                {/* Avatar */}
                {entry.avatar_url ? (
                  <img
                    src={entry.avatar_url}
                    alt={displayName}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full border-2 border-foreground flex-shrink-0"
                    style={{ boxShadow: "2px 2px 0px 0px #1E293B" }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full border-2 border-foreground bg-primary flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                    style={{ boxShadow: "2px 2px 0px 0px #1E293B" }}
                    aria-hidden
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Name + You badge */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">
                      {displayName}
                    </span>
                    {isCurrentUser && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border border-primary text-primary bg-primary/10">
                        You
                      </span>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Music className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-heading font-bold text-lg text-foreground tabular-nums">
                    {entry.total_points.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    pts
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function LiveBar({ dataUpdatedAt }: { dataUpdatedAt: number }) {
  return (
    <div className="flex items-center justify-end gap-2 px-6 py-2.5 bg-muted border-b-2 border-foreground/10">
      <span
        className="w-2 h-2 rounded-full bg-[#34D399] flex-shrink-0 animate-pulse"
        aria-hidden
      />
      <p className="text-xs text-muted-foreground">
        Last updated{" "}
        {new Date(dataUpdatedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="px-6 py-12 text-center">
      <div className="w-14 h-14 rounded-full border-2 border-foreground bg-[#FBBF24] flex items-center justify-center mx-auto mb-4">
        <Music className="w-6 h-6 text-foreground" />
      </div>
      <p className="font-heading font-bold text-lg text-foreground">
        No one on the board yet
      </p>
      <p className="text-muted-foreground text-sm mt-1">
        Start listening and check back after the cron runs.
      </p>
    </div>
  )
}
