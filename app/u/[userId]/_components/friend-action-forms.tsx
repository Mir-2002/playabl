"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import {
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  type ActionResult,
} from "../actions"

export function AcceptForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    acceptFriendRequest,
    {},
  )
  return (
    <form action={action}>
      <input type="hidden" name="requestId" value={requestId} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Accepting…" : "Accept"}
      </Button>
      {state.error && <p className="text-xs text-red-500 mt-1">{state.error}</p>}
    </form>
  )
}

export function DeclineForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    declineFriendRequest,
    {},
  )
  return (
    <form action={action}>
      <input type="hidden" name="requestId" value={requestId} />
      <Button type="submit" variant="destructive" size="lg" disabled={pending}>
        {pending ? "Declining…" : "Decline"}
      </Button>
      {state.error && <p className="text-xs text-red-500 mt-1">{state.error}</p>}
    </form>
  )
}

export function RemoveForm({
  requestId,
  otherUserId,
}: {
  requestId: string
  otherUserId: string
}) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    removeFriend,
    {},
  )
  return (
    <form action={action}>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="otherUserId" value={otherUserId} />
      <Button type="submit" variant="destructive" size="default" disabled={pending}>
        {pending ? "Removing…" : "Remove"}
      </Button>
      {state.error && <p className="text-xs text-red-500 mt-1">{state.error}</p>}
    </form>
  )
}
