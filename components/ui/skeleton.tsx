import { cn } from "cn"

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-muted", className)}>
      <div
        className="absolute inset-0 -translate-x-full"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, oklch(1 0 0 / 0.4) 50%, transparent 100%)",
          animation: "shimmer 1.4s var(--ease-out-quart, cubic-bezier(0.25,1,0.5,1)) infinite",
        }}
        aria-hidden
      />
    </div>
  )
}

export function SkeletonText({ className }: { className?: string }) {
  return <Skeleton className={cn("h-4 w-32 rounded-md", className)} />
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative pt-8 bg-card border-2 border-foreground/10 rounded-2xl p-6",
        className
      )}
    >
      <div className="absolute -top-5 left-5 w-10 h-10 rounded-full bg-muted" />
      <Skeleton className="h-3 w-20 rounded-md mt-2" />
      <Skeleton className="h-10 w-28 rounded-md mt-3" />
      <Skeleton className="h-3 w-36 rounded-md mt-4" />
    </div>
  )
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 px-3 py-2.5", className)}>
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-3 w-20 rounded-md" />
      </div>
      <Skeleton className="h-5 w-12 rounded-md flex-shrink-0" />
    </div>
  )
}

export function SkeletonHeatmap({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      {/* Month label row */}
      <div className="flex gap-[3px] mb-1">
        {Array.from({ length: 53 }).map((_, i) => (
          <div key={i} className="w-3 h-2 flex-shrink-0" />
        ))}
      </div>
      {/* Week columns */}
      <div className="flex gap-[3px]">
        {Array.from({ length: 53 }).map((_, col) => (
          <div key={col} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }).map((_, row) => (
              <Skeleton key={row} className="w-3 h-3 rounded-sm" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
