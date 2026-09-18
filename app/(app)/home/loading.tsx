import { SkeletonCard, SkeletonHeatmap, SkeletonRow } from "@/components/ui/skeleton"

export default function HomeLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-[--dur-slow]">
      {/* Welcome card skeleton */}
      <div className="bg-card border-2 border-foreground/10 rounded-2xl p-8 flex items-center gap-6">
        <div className="w-[72px] h-[72px] rounded-full bg-muted flex-shrink-0" />
        <div className="space-y-2">
          <div className="h-3 w-24 bg-muted rounded-md" />
          <div className="h-8 w-40 bg-muted rounded-md" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 gap-6">
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
        <div className="h-6 w-32 bg-muted rounded-md" />
        <div className="bg-card border-2 border-foreground/10 rounded-2xl overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} className="border-b border-foreground/5 last:border-0" />
          ))}
        </div>
      </div>
    </div>
  )
}
