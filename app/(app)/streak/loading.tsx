import { Skeleton } from "@/components/ui/skeleton"

export default function StreakLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-[--dur-slow]">
      {/* Header */}
      <div className="space-y-3">
        <div className="h-4 w-24 bg-muted rounded-md" />
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
          <div className="space-y-1">
            <div className="h-6 w-20 bg-muted rounded-md" />
            <div className="h-3 w-40 bg-muted rounded-md" />
          </div>
        </div>
      </div>

      {/* Streak hero */}
      <div className="bg-card border-2 border-foreground/10 rounded-2xl p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4" />
        <Skeleton className="h-16 w-24 rounded-md mx-auto" />
        <Skeleton className="h-3 w-20 rounded-md mx-auto mt-2" />
        <div className="border-t border-foreground/10 my-4" />
        <Skeleton className="h-4 w-28 rounded-md mx-auto" />
      </div>

      {/* Calendar grid skeleton */}
      <div className="bg-card border-2 border-foreground/10 rounded-2xl p-6">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
