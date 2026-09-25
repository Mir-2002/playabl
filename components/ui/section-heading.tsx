import { cn } from "cn"

interface SectionHeadingProps {
  title: string
  squiggle?: boolean
  action?: React.ReactNode
  className?: string
  icon?: React.ReactNode
  iconBg?: string
}

export function SectionHeading({ title, squiggle, action, className, icon, iconBg }: SectionHeadingProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className="w-10 h-10 rounded-full border-2 border-foreground flex items-center justify-center flex-shrink-0"
            style={iconBg ? { background: iconBg } : undefined}
          >
            {icon}
          </div>
        )}
        <div>
          <h2 className="font-heading font-bold text-xl text-foreground">{title}</h2>
          {squiggle && (
            <svg
              width="48"
              height="6"
              viewBox="0 0 48 6"
              fill="none"
              aria-hidden
              className="mt-0.5"
            >
              <path
                d="M0 3 C6 0, 12 6, 18 3 S30 0, 36 3 S42 6, 48 3"
                stroke="var(--brand-violet)"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
