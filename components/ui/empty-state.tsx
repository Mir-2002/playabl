import { cn } from "cn"

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  body: string
  action?: React.ReactNode
  accentColor?: string
  className?: string
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  accentColor = "#8B5CF6",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 border-dashed border-foreground/30 p-10 flex flex-col items-center text-center overflow-hidden",
        className
      )}
    >
      {/* Large tinted background circle */}
      <div
        className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-15 pointer-events-none"
        style={{ background: accentColor }}
        aria-hidden
      />
      {/* Icon in circle */}
      <div
        className="w-14 h-14 rounded-full border-2 border-foreground flex items-center justify-center mb-4 relative z-10"
        style={{ background: accentColor }}
      >
        {icon}
      </div>
      <p className="font-heading font-bold text-lg text-foreground relative z-10">{title}</p>
      <p className="text-muted-foreground text-sm mt-1 max-w-xs relative z-10">{body}</p>
      {action && <div className="mt-4 relative z-10">{action}</div>}
    </div>
  )
}
