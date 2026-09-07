"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { computeStreaks } from "@/lib/streaks"
import { toManilaDay, todayInManila } from "@/lib/manila-time"
import { TZDate } from "@date-fns/tz"
import { subDays } from "date-fns"
import type { StreakStats, HeatmapDay } from "@/app/(app)/home/actions"

const MANILA = "Asia/Manila"

// ─── Public profile data (service client, runs server-side only) ──────────────

export async function fetchPublicProfile(userId: string) {
  const service = createServiceClient()
  const { data } = await service
    .from("profiles")
    .select("id, username, avatar_url, total_points, created_at")
    .eq("id", userId)
    .single()
  return data
}

export async function fetchPublicStreakStats(userId: string): Promise<StreakStats> {
  const service = createServiceClient()
  const [{ data: events }, { data: profile }] = await Promise.all([
    service.from("listening_events").select("played_at").eq("user_id", userId),
    service.from("profiles").select("created_at").eq("id", userId).single(),
  ])

  const connectionDay = profile?.created_at ? toManilaDay(profile.created_at) : null
  const uniqueDays = [
    ...new Set((events ?? []).map((e) => toManilaDay(e.played_at))),
  ]
    .filter((d) => !connectionDay || d >= connectionDay)
    .sort()

  return computeStreaks(uniqueDays, todayInManila())
}

export async function fetchPublicHeatmapData(userId: string): Promise<HeatmapDay[]> {
  const service = createServiceClient()
  const oneYearAgo = subDays(new TZDate(new Date(), MANILA), 371).toISOString()

  const { data } = await service
    .from("listening_events")
    .select("played_at, duration_ms")
    .eq("user_id", userId)
    .gte("played_at", oneYearAgo)

  const totals = new Map<string, number>()
  for (const event of data ?? []) {
    const day = toManilaDay(event.played_at)
    totals.set(day, (totals.get(day) ?? 0) + event.duration_ms)
  }

  return Array.from(totals.entries()).map(([date, totalMs]) => ({ date, totalMs }))
}

export type FriendshipStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "accepted"

export type FriendshipInfo = {
  status: FriendshipStatus
  requestId: string | null
}

export async function fetchFriendshipStatus(
  profileUserId: string,
  viewerId: string | undefined,
): Promise<FriendshipInfo> {
  if (!viewerId || viewerId === profileUserId) {
    return { status: "none", requestId: null }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("friend_requests")
    .select("id, status, sender_id")
    .or(
      `and(sender_id.eq.${viewerId},receiver_id.eq.${profileUserId}),and(sender_id.eq.${profileUserId},receiver_id.eq.${viewerId})`,
    )
    .limit(1)
    .maybeSingle()

  if (!data) return { status: "none", requestId: null }

  if (data.status === "accepted") return { status: "accepted", requestId: data.id }
  if (data.sender_id === viewerId) return { status: "pending_sent", requestId: data.id }
  return { status: "pending_received", requestId: data.id }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

const receiverSchema = z.object({ receiverId: z.string().uuid() })
const requestSchema = z.object({ requestId: z.string().uuid() })
const removeSchema = z.object({
  requestId: z.string().uuid(),
  otherUserId: z.string().uuid(),
})

export type ActionResult = { error?: string }

export async function sendFriendRequest(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const parsed = receiverSchema.safeParse({ receiverId: formData.get("receiverId") })
  if (!parsed.success) return { error: "Invalid request." }
  const { receiverId } = parsed.data

  if (!user) redirect(`/login?next=/u/${receiverId}`)

  const { error } = await supabase.from("friend_requests").insert({
    sender_id: user.id,
    receiver_id: receiverId,
    status: "pending",
  })

  if (error && error.code !== "23505") return { error: "Could not send friend request." }

  revalidatePath(`/u/${receiverId}`)
  revalidatePath("/friends")
  return {}
}

export async function acceptFriendRequest(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const parsed = requestSchema.safeParse({ requestId: formData.get("requestId") })
  if (!parsed.success) return { error: "Invalid request." }
  const { requestId } = parsed.data

  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId)
    .eq("receiver_id", user.id)

  if (error) return { error: "Could not accept request." }

  revalidatePath("/friends")
  return {}
}

export async function declineFriendRequest(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const parsed = requestSchema.safeParse({ requestId: formData.get("requestId") })
  if (!parsed.success) return { error: "Invalid request." }
  const { requestId } = parsed.data

  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("id", requestId)
    .eq("receiver_id", user.id)

  if (error) return { error: "Could not decline request." }

  revalidatePath("/friends")
  return {}
}

export async function removeFriend(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const parsed = removeSchema.safeParse({
    requestId: formData.get("requestId"),
    otherUserId: formData.get("otherUserId"),
  })
  if (!parsed.success) return { error: "Invalid request." }
  const { requestId, otherUserId } = parsed.data

  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("id", requestId)

  if (error) return { error: "Could not remove friend." }

  revalidatePath("/friends")
  revalidatePath(`/u/${otherUserId}`)
  return {}
}
