"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { sendFriendRequest, type FriendshipStatus, type ActionResult } from "../actions"
import { AcceptForm, DeclineForm, RemoveForm } from "./friend-action-forms"
import Link from "next/link"
import { useState } from "react"

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
  if (isOwner) return <CopyLinkButton profileUserId={profileUserId} />
  if (!viewerId) {
    return (
      <Link href={`/login?next=/u/${profileUserId}`}>
        <Button variant="outline" size="sm">
          Sign in to add friend
        </Button>
      </Link>
    )
  }

  if (status === "pending_sent") {
    return (
      <Button variant="outline" size="sm" disabled>
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
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Sending…" : "Add Friend"}
      </Button>
      {state.error && <p className="text-xs text-red-500 mt-1">{state.error}</p>}
    </form>
  )
}

function CopyLinkButton({ profileUserId }: { profileUserId: string }) {
  const [copied, setCopied] = useState(false)
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/u/${profileUserId}`
      : `/u/${profileUserId}`

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? "Copied!" : "Copy invite link"}
    </Button>
  )
}
