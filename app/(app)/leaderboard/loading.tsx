import { SkeletonRow } from "@/components/ui/skeleton"

export default function LeaderboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-[--dur-slow]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
        <div className="h-8 w-40 bg-muted rounded-md" />
      </div>

      {/* Live bar */}
      <div className="bg-card border-2 border-foreground/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-end gap-2 px-6 py-2.5 bg-muted/50 border-b border-foreground/10">
          <div className="w-2 h-2 rounded-full bg-muted" />
          <div className="h-3 w-24 bg-muted rounded-md" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonRow key={i} className="border-b border-foreground/5 last:border-0 px-6" />
        ))}
      </div>
    </div>
  )
}
