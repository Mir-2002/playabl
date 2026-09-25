import { SkeletonRow } from "@/components/ui/skeleton"

export default function FriendsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-[--dur-slow]">
      {/* PageHeader skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="h-7 w-24 bg-muted rounded-md" />
          <div className="h-3 w-52 bg-muted rounded-md" />
        </div>
        <div className="w-28 h-9 bg-muted rounded-full flex-shrink-0" />
      </div>

      {/* Invite URL chip */}
      <div className="h-8 w-64 bg-muted rounded-md" />

      {/* Friend Requests section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
          <div className="h-6 w-36 bg-muted rounded-md" />
        </div>
        <div className="bg-card border-2 border-foreground/10 rounded-2xl overflow-hidden">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonRow key={i} className="border-b border-foreground/5 last:border-0 px-3" />
          ))}
        </div>
      </div>

      {/* Friends section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
          <div className="h-6 w-20 bg-muted rounded-md" />
        </div>
        <div className="bg-card border-2 border-foreground/10 rounded-2xl overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRow key={i} className="border-b border-foreground/5 last:border-0 px-3" />
          ))}
        </div>
      </div>
    </div>
  )
}
