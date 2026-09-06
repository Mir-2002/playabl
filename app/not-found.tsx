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

      <div className="w-full max-w-sm bg-white border-2 border-foreground rounded-2xl shadow-hard-lg p-10 text-center relative z-10">
        <p
          className="font-heading font-extrabold text-7xl mb-0"
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
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-bold border-2 border-foreground shadow-hard text-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1E293B] transition-all duration-200"
        >
          ← Back to Playabl
        </Link>
      </div>
    </div>
  )
}
