import { SkeletonCard, SkeletonHeatmap } from "@/components/ui/skeleton"

export default function PublicProfileLoading() {
  return (
    <div className="min-h-screen bg-background bg-dots">
      {/* Mimic AppHeader height — py-4 × 2 + h-16 logo = ~96px */}
      <div className="h-24 border-b border-border" />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-[--dur-slow]">
        {/* Profile card skeleton */}
        <div className="bg-card border-2 border-foreground/10 rounded-2xl p-8 flex items-center gap-6">
          <div className="w-[72px] h-[72px] rounded-full bg-muted flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 bg-muted rounded-md" />
            <div className="h-8 w-48 bg-muted rounded-md" />
          </div>
          <div className="w-28 h-10 bg-muted rounded-full flex-shrink-0" />
        </div>

        {/* Stats grid */}
        <div className="grid sm:grid-cols-2 gap-10">
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Heatmap */}
        <div className="bg-card border-2 border-foreground/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
            <div className="h-6 w-20 bg-muted rounded-md" />
          </div>
          <SkeletonHeatmap />
        </div>
      </main>
    </div>
  )
}
