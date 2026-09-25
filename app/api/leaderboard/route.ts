import { getLeaderboard } from "@/app/(app)/leaderboard/actions"

export async function GET() {
  const data = await getLeaderboard()
  return Response.json(data, {
    headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=10" },
  })
}
