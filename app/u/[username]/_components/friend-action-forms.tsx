"use client"

import { useActionState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  type ActionResult,
} from "../actions"

function useActionToast(state: ActionResult) {
  const toast = useToast()
  useEffect(() => {
    if (state.toast) toast.success(state.toast)
    if (state.error) toast.error(state.error)
  }, [state])
}

export function AcceptForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    acceptFriendRequest,
    {},
  )
  useActionToast(state)
  return (
    <form action={action}>
      <input type="hidden" name="requestId" value={requestId} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Accepting…" : "Accept"}
      </Button>
    </form>
  )
}

export function DeclineForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    declineFriendRequest,
    {},
  )
  useActionToast(state)
  return (
    <form action={action}>
      <input type="hidden" name="requestId" value={requestId} />
      <Button type="submit" variant="destructive" size="lg" disabled={pending}>
        {pending ? "Declining…" : "Decline"}
      </Button>
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
  useActionToast(state)
  return (
    <form action={action}>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="otherUserId" value={otherUserId} />
      <Button type="submit" variant="destructive" size="default" disabled={pending}>
        {pending ? "Removing…" : "Remove"}
      </Button>
    </form>
  )
}
