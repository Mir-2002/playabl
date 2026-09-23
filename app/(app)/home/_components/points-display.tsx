"use client"

import dynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import type { LeaderboardEntry } from "@/app/(app)/leaderboard/actions"

const AnimatedNumber = dynamic(
  () => import("./animated-number").then((m) => m.AnimatedNumber),
  { ssr: false }
)

export function PointsDisplay({
  currentUserId,
  initialData,
  initialPoints,
}: {
  currentUserId: string
  initialData?: LeaderboardEntry[]
  initialPoints: number
}) {
  const { data = initialData ?? [] } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: (): Promise<LeaderboardEntry[]> =>
      fetch("/api/leaderboard").then((r) => r.json()),
    initialData,
    refetchInterval: 30_000,
  })
  const points = data.find((e) => e.id === currentUserId)?.total_points ?? initialPoints
  return <AnimatedNumber value={points} />
}
