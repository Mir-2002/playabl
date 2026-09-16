import { cn } from "cn"

type Accent = "violet" | "pink" | "amber" | "mint"

const accentShadow: Record<Accent, string> = {
  violet: "shadow-hard-violet",
  pink:   "shadow-hard-pink",
  amber:  "shadow-hard-amber",
  mint:   "shadow-hard-mint",
}

const accentBg: Record<Accent, string> = {
  violet: "bg-primary",
  pink:   "bg-[#F472B6]",
  amber:  "bg-[#FBBF24]",
  mint:   "bg-[#34D399]",
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  note?: string
  accent?: Accent
  index?: number
  className?: string
}

export function StatCard({
  icon,
  label,
  value,
  note,
  accent = "violet",
  index = 0,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative pt-8 bg-card border-2 border-foreground rounded-2xl p-6",
        accentShadow[accent],
        "animate-pop-in",
        "hover:-translate-y-0.5 hover:rotate-[-1deg] transition-all duration-[--dur-base] ease-[--ease-pop]",
        className
      )}
      style={{ "--i": index } as React.CSSProperties}
    >
      {/* Floating icon-in-circle */}
      <div
        className={cn(
          "absolute -top-5 left-5 w-10 h-10 rounded-full border-2 border-foreground flex items-center justify-center",
          accentBg[accent]
        )}
      >
        {icon}
      </div>

      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">
        {label}
      </p>
      <p className="font-heading font-extrabold text-4xl text-foreground mt-2 leading-none">
        {value}
      </p>
      {note && (
        <p className="text-sm text-muted-foreground mt-3">{note}</p>
      )}
    </div>
  )
}
