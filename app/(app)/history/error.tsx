"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function HistoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="bg-white border-2 border-foreground/10 rounded-2xl p-8 text-center">
      <h2 className="font-heading font-bold text-lg text-foreground">
        Couldn&apos;t load your history
      </h2>
      <p className="text-sm text-muted-foreground mt-1 mb-5">
        Something went wrong fetching your plays. Try again in a moment.
      </p>
      <Button onClick={reset} size="sm">
        Try again
      </Button>
    </div>
  )
}
