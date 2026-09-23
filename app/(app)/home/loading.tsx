import { SkeletonCard, SkeletonHeatmap, SkeletonRow } from "@/components/ui/skeleton"

export default function HomeLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-[--dur-slow]">
      {/* Welcome card skeleton — matches real card including now-playing slot */}
      <div className="bg-card border-2 border-foreground/10 rounded-2xl p-8 flex items-center gap-6">
        <div className="w-[72px] h-[72px] rounded-full bg-muted flex-shrink-0" />
        <div className="space-y-2">
          <div className="h-3 w-24 bg-muted rounded-md" />
          <div className="h-8 w-40 bg-muted rounded-md" />
        </div>
        {/* Reserve space for NowPlaying widget */}
        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
          <div className="space-y-1.5 flex flex-col items-end">
            <div className="h-3 w-20 bg-muted rounded-md" />
            <div className="h-4 w-32 bg-muted rounded-md" />
            <div className="h-3 w-24 bg-muted rounded-md" />
          </div>
          <div className="w-14 h-14 rounded-lg bg-muted flex-shrink-0" />
        </div>
      </div>

      {/* Stats grid — gap-10 matches real page */}
      <div className="grid sm:grid-cols-2 gap-10 mt-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Heatmap */}
      <div className="bg-card border-2 border-foreground/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
          <div className="h-6 w-24 bg-muted rounded-md" />
        </div>
        <SkeletonHeatmap />
      </div>

      {/* Leaderboard */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
          <div className="h-6 w-32 bg-muted rounded-md" />
        </div>
        <div className="bg-card border-2 border-foreground/10 rounded-2xl overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} className="border-b border-foreground/5 last:border-0" />
          ))}
        </div>
      </div>
    </div>
  )
}
