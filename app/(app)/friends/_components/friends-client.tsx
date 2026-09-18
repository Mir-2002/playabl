"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getFriendsData, type FriendsData, type FriendRequestRow, type ProfileSummary } from "../actions"
import {
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from "@/app/u/[username]/actions"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ListRow } from "@/components/ui/list-row"
import { EmptyState } from "@/components/ui/empty-state"
import { useToast } from "@/hooks/use-toast"

interface Props {
  viewerId: string
  initialData: FriendsData
}

type MutationResult = { error?: string; toast?: string }

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

export function FriendsClient({ viewerId, initialData }: Props) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const queryKey = ["friends", viewerId]

  const { data = initialData, isError } = useQuery({
    queryKey,
    queryFn: () => getFriendsData(viewerId),
    refetchInterval: 30_000,
    initialData,
  })

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) =>
      acceptFriendRequest({}, makeFormData({ requestId })) as Promise<MutationResult>,
    onMutate: async (requestId) => {
      await queryClient.cancelQueries({ queryKey })
      const snapshot = queryClient.getQueryData<FriendsData>(queryKey)
      queryClient.setQueryData<FriendsData>(queryKey, (old) => {
        if (!old) return old
        const req = old.pending.find((r) => r.id === requestId)
        return {
          pending: old.pending.filter((r) => r.id !== requestId),
          friends: req ? [{ ...req, status: "accepted" }, ...old.friends] : old.friends,
        }
      })
      return { snapshot }
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) queryClient.setQueryData(queryKey, context.snapshot)
      toast.error("Could not accept request. Please try again.")
    },
    onSuccess: (result) => {
      if (result.error) toast.error(result.error)
      else toast.success(result.toast ?? "You're now friends!")
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const declineMutation = useMutation({
    mutationFn: (requestId: string) =>
      declineFriendRequest({}, makeFormData({ requestId })) as Promise<MutationResult>,
    onMutate: async (requestId) => {
      await queryClient.cancelQueries({ queryKey })
      const snapshot = queryClient.getQueryData<FriendsData>(queryKey)
      queryClient.setQueryData<FriendsData>(queryKey, (old) =>
        old ? { ...old, pending: old.pending.filter((r) => r.id !== requestId) } : old
      )
      return { snapshot }
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) queryClient.setQueryData(queryKey, context.snapshot)
      toast.error("Could not decline request. Please try again.")
    },
    onSuccess: (result) => {
      if (result.error) toast.error(result.error)
      else toast.success(result.toast ?? "Request declined.")
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const removeMutation = useMutation({
    mutationFn: ({ requestId, otherUserId }: { requestId: string; otherUserId: string }) =>
      removeFriend({}, makeFormData({ requestId, otherUserId })) as Promise<MutationResult>,
    onMutate: async ({ requestId }) => {
      await queryClient.cancelQueries({ queryKey })
      const snapshot = queryClient.getQueryData<FriendsData>(queryKey)
      queryClient.setQueryData<FriendsData>(queryKey, (old) =>
        old ? { ...old, friends: old.friends.filter((r) => r.id !== requestId) } : old
      )
      return { snapshot }
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) queryClient.setQueryData(queryKey, context.snapshot)
      toast.error("Could not remove friend. Please try again.")
    },
    onSuccess: (result) => {
      if (result.error) toast.error(result.error)
      else toast.success(result.toast ?? "Friend removed.")
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  return (
    <div className="space-y-8">
      {/* Refetch failed — flag that the list may be stale rather than showing
          it as silently live. */}
      {isError && (
        <div className="flex items-center gap-2 rounded-xl border-2 border-foreground/10 bg-muted px-4 py-2.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0 bg-muted-foreground/40" aria-hidden />
          <p className="text-xs text-muted-foreground">
            Couldn&apos;t refresh — showing last known data.
          </p>
        </div>
      )}

      {/* Pending inbox */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full border-2 border-foreground bg-[#FBBF24] flex items-center justify-center">
            <Users className="w-5 h-5 text-foreground" />
          </div>
          <h2 className="font-heading font-bold text-xl">Friend Requests</h2>
          {data.pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs font-bold animate-pop-in">
              {data.pending.length}
            </span>
          )}
        </div>

        {data.pending.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6 text-white" />}
            title="No pending requests"
            body="When someone sends you a friend request, it will appear here."
            accentColor="#FBBF24"
          />
        ) : (
          <div className="bg-white border-2 border-foreground rounded-2xl overflow-hidden shadow-hard">
            <ul>
              {data.pending.map((req, i) => (
                <li key={req.id} className="border-b-2 border-foreground/10 last:border-0">
                  <ListRow
                    index={i}
                    leading={<ProfileAvatar profile={req.sender} />}
                    title={req.sender.username ?? "Listener"}
                    trailing={
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => acceptMutation.mutate(req.id)}
                          disabled={acceptMutation.isPending || declineMutation.isPending}
                        >
                          {acceptMutation.isPending && acceptMutation.variables === req.id
                            ? "Accepting…"
                            : "Accept"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => declineMutation.mutate(req.id)}
                          disabled={acceptMutation.isPending || declineMutation.isPending}
                        >
                          {declineMutation.isPending && declineMutation.variables === req.id
                            ? "Declining…"
                            : "Decline"}
                        </Button>
                      </div>
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Friends list */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full border-2 border-foreground bg-[#34D399] flex items-center justify-center">
            <Users className="w-5 h-5 text-foreground" />
          </div>
          <h2 className="font-heading font-bold text-xl">Friends</h2>
        </div>

        {data.friends.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6 text-white" />}
            title="No friends yet"
            body="Share your profile link to invite someone to Playabl."
            accentColor="#34D399"
          />
        ) : (
          <div className="bg-white border-2 border-foreground rounded-2xl overflow-hidden shadow-hard">
            <ul>
              {data.friends.map((req, i) => {
                const friend: ProfileSummary =
                  req.sender.id === viewerId ? req.receiver : req.sender
                return (
                  <li key={req.id} className="border-b-2 border-foreground/10 last:border-0">
                    <ListRow
                      index={i}
                      href={`/u/${friend.username}`}
                      leading={<ProfileAvatar profile={friend} />}
                      title={friend.username ?? "Listener"}
                      trailing={
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            removeMutation.mutate({ requestId: req.id, otherUserId: friend.id })
                          }}
                          disabled={removeMutation.isPending}
                        >
                          {removeMutation.isPending &&
                          removeMutation.variables?.requestId === req.id
                            ? "Removing…"
                            : "Remove"}
                        </Button>
                      }
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}

function ProfileAvatar({ profile }: { profile: ProfileSummary }) {
  const name = profile.username ?? "Listener"
  return profile.avatar_url ? (
    <img
      src={profile.avatar_url}
      alt={name}
      width={40}
      height={40}
      className="w-10 h-10 rounded-full border-2 border-foreground flex-shrink-0"
      style={{ boxShadow: "2px 2px 0px 0px #1E293B" }}
    />
  ) : (
    <div
      className="w-10 h-10 rounded-full border-2 border-foreground bg-primary flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
      style={{ boxShadow: "2px 2px 0px 0px #1E293B" }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
