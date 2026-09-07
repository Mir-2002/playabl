"use client"

import { useQuery } from "@tanstack/react-query"
import { getFriendsData, type FriendsData, type FriendRequestRow, type ProfileSummary } from "../actions"
import { AcceptForm, DeclineForm, RemoveForm } from "@/app/u/[userId]/_components/friend-action-forms"
import Link from "next/link"
import { Users } from "lucide-react"

interface Props {
  viewerId: string
  initialData: FriendsData
}

export function FriendsClient({ viewerId, initialData }: Props) {
  const { data = initialData } = useQuery({
    queryKey: ["friends", viewerId],
    queryFn: () => getFriendsData(viewerId),
    refetchInterval: 30_000,
    initialData,
  })

  return (
    <div className="space-y-8">
      {/* Pending inbox */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full border-2 border-foreground bg-[#FBBF24] flex items-center justify-center">
            <Users className="w-5 h-5 text-foreground" />
          </div>
          <h2 className="font-heading font-bold text-xl">Friend Requests</h2>
          {data.pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs font-bold">
              {data.pending.length}
            </span>
          )}
        </div>
        <div className="bg-white border-2 border-foreground rounded-2xl overflow-hidden shadow-hard">
          {data.pending.length === 0 ? (
            <EmptyState message="No pending requests" />
          ) : (
            <ul className="divide-y-2 divide-foreground/10">
              {data.pending.map((req) => (
                <PendingRow key={req.id} request={req} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Friends list */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full border-2 border-foreground bg-[#34D399] flex items-center justify-center">
            <Users className="w-5 h-5 text-foreground" />
          </div>
          <h2 className="font-heading font-bold text-xl">Friends</h2>
        </div>
        <div className="bg-white border-2 border-foreground rounded-2xl overflow-hidden shadow-hard">
          {data.friends.length === 0 ? (
            <EmptyState message="No friends yet — share your profile link to invite someone" />
          ) : (
            <ul className="divide-y-2 divide-foreground/10">
              {data.friends.map((req) => (
                <FriendRow key={req.id} request={req} viewerId={viewerId} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

function PendingRow({ request }: { request: FriendRequestRow }) {
  return (
    <li className="flex items-center gap-4 px-6 py-4">
      <ProfileAvatar profile={request.sender} />
      <span className="flex-1 font-medium text-foreground truncate">
        {request.sender.username ?? "Listener"}
      </span>
      <div className="flex gap-2 flex-shrink-0">
        <AcceptForm requestId={request.id} />
        <DeclineForm requestId={request.id} />
      </div>
    </li>
  )
}

function FriendRow({
  request,
  viewerId,
}: {
  request: FriendRequestRow
  viewerId: string
}) {
  const friend: ProfileSummary =
    request.sender.id === viewerId ? request.receiver : request.sender

  return (
    <li className="flex items-center gap-4 px-6 py-4">
      <ProfileAvatar profile={friend} />
      <Link
        href={`/u/${friend.id}`}
        className="flex-1 font-medium text-foreground truncate hover:text-primary transition-colors"
      >
        {friend.username ?? "Listener"}
      </Link>
      <RemoveForm
        requestId={request.id}
        otherUserId={friend.id}
      />
    </li>
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}
