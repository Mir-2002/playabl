"use client"

import { useEffect } from "react"

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
      <div className="w-full max-w-sm bg-white border-2 border-foreground rounded-2xl shadow-hard-lg p-10 text-center">
        <div
          className="w-14 h-14 rounded-full border-2 border-foreground mx-auto mb-4 flex items-center justify-center text-2xl"
          style={{ background: "#F472B6" }}
          aria-hidden
        >
          !
        </div>
        <h1 className="font-heading font-bold text-2xl text-foreground">
          Something broke
        </h1>
        <p className="text-muted-foreground text-sm mt-2 mb-6">
          An unexpected error occurred. Try again or go back home.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-full bg-primary text-white font-bold border-2 border-foreground shadow-hard text-sm hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-4 py-2 rounded-full border-2 border-foreground font-bold text-sm hover:bg-[#FBBF24] transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  )
}
