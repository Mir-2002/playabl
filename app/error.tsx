"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ErrorPage({
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
    <div className="min-h-screen bg-background bg-dots flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border-2 border-foreground rounded-2xl shadow-hard-lg p-10 text-center animate-pop-in">
        {/* Icon in circle */}
        <div
          className="w-16 h-16 rounded-full border-2 border-foreground mx-auto mb-6 flex items-center justify-center text-2xl font-bold text-foreground"
          style={{ background: "#F472B6", boxShadow: "4px 4px 0px 0px #1E293B" }}
          aria-hidden
        >
          !
        </div>
        {/* Large tinted bg shape */}
        <h1 className="font-heading font-bold text-2xl text-foreground">
          Something broke
        </h1>
        <p className="text-muted-foreground text-sm mt-2 mb-8 leading-relaxed">
          An unexpected error occurred. Try again or go back home.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button onClick={reset} size="lg">
            Try again
          </Button>
          <Link
            href="/"
            className="h-10 gap-1.5 px-4 inline-flex items-center justify-center rounded-full border-2 border-foreground text-sm font-medium hover:bg-[#FBBF24] transition-all duration-[--dur-base] ease-[--ease-pop] focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
