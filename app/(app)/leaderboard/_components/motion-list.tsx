"use client"

import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import type { LeaderboardEntry } from "../actions"

const MEDAL: Record<1 | 2 | 3, { bg: string; text: string; label: string }> = {
  1: { bg: "#FBBF24", text: "#1E293B", label: "Gold" },
  2: { bg: "#94A3B8", text: "#1E293B", label: "Silver" },
  3: { bg: "#CD7C2F", text: "#FFFFFF", label: "Bronze" },
}

interface Props {
  entries: LeaderboardEntry[]
  currentUserId: string
  rankChanged: Set<string>
}

export function MotionList({ entries, currentUserId, rankChanged }: Props) {
  return (
    <motion.ol layout className="divide-y-2 divide-foreground/10">
      <AnimatePresence initial={false}>
        {entries.map((entry, index) => {
          const rank = index + 1
          const isCurrentUser = entry.id === currentUserId
          const displayName = entry.username ?? "Listener"
          const medal = rank <= 3 ? MEDAL[rank as 1 | 2 | 3] : null
          const didChange = rankChanged.has(entry.id)

          return (
            <motion.li
              key={entry.id}
              layout
              layoutId={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: [0.34, 1.56, 0.64, 1] }}
              className={cn(
                "flex items-center gap-4 px-6 py-4",
                isCurrentUser && "bg-primary/5",
                didChange && "animate-rank-flash"
              )}
              style={{ "--i": index } as React.CSSProperties}
            >
              {/* Rank badge */}
              <div
                className="w-9 h-9 rounded-full border-2 border-foreground flex-shrink-0 flex items-center justify-center font-heading font-bold text-sm"
                style={
                  medal
                    ? { background: medal.bg, color: medal.text, boxShadow: "2px 2px 0px 0px #1E293B" }
                    : { background: "var(--color-muted)", boxShadow: "2px 2px 0px 0px #1E293B" }
                }
                aria-label={medal ? `${medal.label} medal, rank ${rank}` : `Rank ${rank}`}
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
                  <span className="font-medium text-foreground truncate">{displayName}</span>
                  {isCurrentUser && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border border-primary text-primary bg-primary/10">
                      You
                    </span>
                  )}
                </div>
              </div>

              {/* Points */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="font-heading font-bold text-lg text-foreground tabular-nums">
                  {entry.total_points.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">pts</span>
              </div>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </motion.ol>
  )
}
