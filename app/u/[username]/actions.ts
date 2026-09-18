"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { computeStreaks } from "@/lib/streaks"
import { todayInTimezone } from "@/lib/user-time"
import { subDays } from "date-fns"
import type { StreakStats, HeatmapDay } from "@/app/(app)/home/actions"

// ─── Public profile data (service client, runs server-side only) ──────────────

export async function fetchPublicProfile(username: string) {
  const service = createServiceClient()
  const { data } = await service
    .from("profiles")
    .select("id, username, avatar_url, total_points, timezone, created_at")
    .ilike("username", username)
    .single()
  return data
}

export async function fetchPublicStreakStats(userId: string): Promise<StreakStats> {
  const service = createServiceClient()
  const [{ data: activity }, { data: profile }] = await Promise.all([
    service
      .from("daily_activity")
      .select("activity_date")
      .eq("user_id", userId)
      .gte("track_count", 1),
    service.from("profiles").select("timezone, created_at").eq("id", userId).single(),
  ])

  const timezone   = profile?.timezone ?? "UTC"
  const today      = todayInTimezone(timezone)
  const signupDay  = profile?.created_at?.slice(0, 10) ?? today

  const qualifyingDays = (activity ?? [])
    .map((r) => r.activity_date as string)
    .filter((d) => d >= signupDay)
    .sort()

  return computeStreaks(qualifyingDays, today)
}

export async function fetchPublicHeatmapData(userId: string): Promise<HeatmapDay[]> {
  const service    = createServiceClient()
  const oneYearAgo = subDays(new Date(), 371).toISOString().slice(0, 10)

  const { data } = await service
    .from("daily_activity")
    .select("activity_date, track_count")
    .eq("user_id", userId)
    .gte("activity_date", oneYearAgo)

  return (data ?? []).map((r) => ({
    date:  r.activity_date as string,
    count: r.track_count,
  }))
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

export type ActionResult = { error?: string; toast?: string }

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

  if (!user) redirect("/login")

  const { error } = await supabase.from("friend_requests").insert({
    sender_id: user.id,
    receiver_id: receiverId,
    status: "pending",
  })

  if (error && error.code !== "23505") return { error: "Could not send friend request." }

  const { data: receiverProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", receiverId)
    .single()
  if (receiverProfile?.username) revalidatePath(`/u/${receiverProfile.username}`)
  revalidatePath("/friends")
  return { toast: "Request sent!" }
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
  return { toast: "You're now friends!" }
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
  return { toast: "Request declined." }
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

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", otherUserId)
    .single()
  if (otherProfile?.username) revalidatePath(`/u/${otherProfile.username}`)
  revalidatePath("/friends")
  return { toast: "Friend removed." }
}
