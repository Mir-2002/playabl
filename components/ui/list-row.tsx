import { cn } from "cn"
import Link from "next/link"

interface ListRowProps {
  leading?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  trailing?: React.ReactNode
  href?: string
  index?: number
  className?: string
}

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  href,
  index = 0,
  className,
}: ListRowProps) {
  const inner = (
    <>
      {leading && (
        <div className="flex-shrink-0">{leading}</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground truncate">{title}</div>
        {subtitle && (
          <div className="text-sm text-muted-foreground truncate">{subtitle}</div>
        )}
      </div>
      {trailing && (
        <div className="flex-shrink-0">{trailing}</div>
      )}
    </>
  )

  const shared = cn(
    "flex items-center gap-3 border-2 border-transparent rounded-xl px-3 py-2.5",
    "hover:border-foreground hover:bg-card hover:shadow-hard-sm",
    "transition-all duration-[--dur-base] ease-[--ease-pop]",
    "animate-pop-in",
    className
  )

  if (href) {
    return (
      <Link
        href={href}
        className={shared}
        style={{ "--i": index } as React.CSSProperties}
      >
        {inner}
      </Link>
    )
  }

  return (
    <div
      className={shared}
      style={{ "--i": index } as React.CSSProperties}
    >
      {inner}
    </div>
  )
}
