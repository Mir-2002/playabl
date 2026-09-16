import { SkeletonRow } from "@/components/ui/skeleton"

export default function HistoryLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-[--dur-slow]">
      {/* Header */}
      <div className="space-y-3">
        <div className="h-4 w-24 bg-muted rounded-md" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
          <div className="space-y-1">
            <div className="h-6 w-36 bg-muted rounded-md" />
            <div className="h-3 w-48 bg-muted rounded-md" />
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="bg-card border-2 border-foreground/10 rounded-2xl overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonRow key={i} className="border-b border-foreground/5 last:border-0 px-3" />
        ))}
      </div>
    </div>
  )
}
