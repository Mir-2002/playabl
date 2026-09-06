"use client"

import { useQuery } from "@tanstack/react-query"
import { getLeaderboard } from "@/app/(app)/leaderboard/actions"
import type { LeaderboardEntry } from "@/app/(app)/leaderboard/actions"

export function PointsDisplay({
  currentUserId,
  initialData,
  initialPoints,
}: {
  currentUserId: string
  initialData: LeaderboardEntry[]
  initialPoints: number
}) {
  const { data = initialData } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
    initialData,
    refetchInterval: 30_000,
  })
  const points = data.find((e) => e.id === currentUserId)?.total_points ?? initialPoints
  return <>{points > 0 ? points.toLocaleString() : "0"}</>
}
