"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { sendFriendRequest, type FriendshipStatus, type ActionResult } from "../actions"
import { AcceptForm, DeclineForm, RemoveForm } from "./friend-action-forms"
import { CopyLinkButton } from "@/components/copy-link-button"
import Link from "next/link"

interface Props {
  profileUserId: string
  viewerId: string | null
  isOwner: boolean
  status: FriendshipStatus
  requestId: string | null
}

export function FriendButton({
  profileUserId,
  viewerId,
  isOwner,
  status,
  requestId,
}: Props) {
  if (isOwner) {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/u/${profileUserId}`
        : `/u/${profileUserId}`
    return <CopyLinkButton url={url} />
  }
  if (!viewerId) {
    return (
      <Link href={`/login?next=/u/${profileUserId}`}>
        <Button variant="outline" size="lg">
          Sign in to add friend
        </Button>
      </Link>
    )
  }

  if (status === "pending_sent") {
    return (
      <Button variant="outline" size="lg" disabled>
        Request Sent
      </Button>
    )
  }

  if (status === "accepted") {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-[#34D399]">Friends ✓</span>
        <RemoveForm requestId={requestId!} otherUserId={profileUserId} />
      </div>
    )
  }

  if (status === "pending_received") {
    return (
      <div className="flex gap-2">
        <AcceptForm requestId={requestId!} />
        <DeclineForm requestId={requestId!} />
      </div>
    )
  }

  return <AddFriendForm receiverId={profileUserId} />
}

function AddFriendForm({ receiverId }: { receiverId: string }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    sendFriendRequest,
    {},
  )
  return (
    <form action={action}>
      <input type="hidden" name="receiverId" value={receiverId} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Add Friend"}
      </Button>
      {state.error && <p className="text-xs text-red-500 mt-1">{state.error}</p>}
    </form>
  )
}
