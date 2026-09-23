import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "cn"

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  icon?: React.ReactNode
  iconBg?: string
  className?: string
  backHref?: string
  backLabel?: string
}

export function PageHeader({ title, subtitle, action, icon, iconBg = "bg-primary", className, backHref, backLabel = "Back to home" }: PageHeaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>
      )}
      <div className="flex items-center gap-4">
        {icon && (
          <div
            className={cn(
              "w-10 h-10 rounded-full border-2 border-foreground flex items-center justify-center flex-shrink-0",
              iconBg
            )}
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-extrabold text-2xl text-foreground leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0">{action}</div>
        )}
      </div>
    </div>
  )
}
