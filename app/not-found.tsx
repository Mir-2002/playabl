import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background bg-dots flex items-center justify-center p-6">
      {/* Decorations */}
      <div
        className="fixed top-20 right-20 w-20 h-20 rounded-full border-2 border-foreground opacity-60"
        style={{ background: "#8B5CF6" }}
        aria-hidden
      />
      <div
        className="fixed bottom-24 left-16 w-14 h-14 rounded-full border-2 border-foreground opacity-50"
        style={{ background: "#FBBF24" }}
        aria-hidden
      />

      <div className="w-full max-w-sm bg-white border-2 border-foreground rounded-2xl shadow-hard-lg p-10 text-center relative z-10 animate-pop-in">
        {/* Icon in circle */}
        <div
          className="w-16 h-16 rounded-full border-2 border-foreground mx-auto mb-4 flex items-center justify-center font-heading font-extrabold text-2xl text-white"
          style={{ background: "#8B5CF6", boxShadow: "4px 4px 0px 0px #1E293B" }}
          aria-hidden
        >
          ?
        </div>
        <p
          className="font-heading font-extrabold text-6xl mb-0"
          style={{ color: "#8B5CF6" }}
        >
          404
        </p>
        <h1 className="font-heading font-bold text-2xl text-foreground mt-2">
          Page not found
        </h1>
        <p className="text-muted-foreground text-sm mt-3 mb-8 leading-relaxed">
          This profile or page doesn&apos;t exist. It may have been deleted.
        </p>
        <Link
          href="/"
          className="h-10 gap-1.5 px-4 inline-flex items-center justify-center rounded-full border-2 border-foreground bg-primary text-primary-foreground text-sm font-bold shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm transition-all duration-[--dur-base] ease-[--ease-pop] focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          ← Back to Playabl
        </Link>
      </div>
    </div>
  )
}
