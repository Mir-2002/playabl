"use server"

import { createClient } from "@/lib/supabase/server"
import { throwOnDbError } from "@/lib/supabase/errors"

export type ProfileSummary = {
  id: string
  username: string | null
  avatar_url: string | null
}

export type FriendRequestRow = {
  id: string
  status: string
  created_at: string
  sender: ProfileSummary
  receiver: ProfileSummary
}

export type FriendsData = {
  pending: FriendRequestRow[]
  friends: FriendRequestRow[]
}

export async function getFriendsData(viewerId: string): Promise<FriendsData> {
  const supabase = await createClient()

  const [pendingResult, friendsResult] = await Promise.all([
    supabase
      .from("friend_requests")
      .select("id, status, created_at, sender_id")
      .eq("receiver_id", viewerId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("friend_requests")
      .select("id, status, created_at, sender_id, receiver_id")
      .or(`sender_id.eq.${viewerId},receiver_id.eq.${viewerId}`)
      .eq("status", "accepted")
      .order("created_at", { ascending: false }),
  ])

  // A failed read must surface, not render as an empty friends list.
  throwOnDbError(pendingResult.error)
  throwOnDbError(friendsResult.error)

  // Collect all profile IDs we need to fetch
  const pendingRows = pendingResult.data ?? []
  const friendRows = friendsResult.data ?? []

  const allIds = new Set<string>()
  for (const r of pendingRows) allIds.add(r.sender_id)
  for (const r of friendRows) {
    allIds.add(r.sender_id)
    allIds.add(r.receiver_id)
  }

  const profileMap = new Map<string, ProfileSummary>()
  if (allIds.size > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", Array.from(allIds))
    throwOnDbError(profilesError)
    for (const p of profiles ?? []) {
      profileMap.set(p.id, p)
    }
  }

  const getProfile = (id: string): ProfileSummary =>
    profileMap.get(id) ?? { id, username: null, avatar_url: null }

  const pending: FriendRequestRow[] = pendingRows.map((r) => ({
    id: r.id,
    status: r.status,
    created_at: r.created_at,
    sender: getProfile(r.sender_id),
    receiver: { id: viewerId, username: null, avatar_url: null },
  }))

  const friends: FriendRequestRow[] = friendRows.map((r) => ({
    id: r.id,
    status: r.status,
    created_at: r.created_at,
    sender: getProfile(r.sender_id),
    receiver: getProfile(r.receiver_id),
  }))

  return { pending, friends }
}
