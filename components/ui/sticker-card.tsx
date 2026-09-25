import { cn } from "cn"

interface StickerCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function StickerCard({ children, className, style }: StickerCardProps) {
  return (
    <div
      className={cn(
        "h-full bg-white border-2 border-foreground rounded-2xl p-6 shadow-hard animate-pop-in",
        "transition-all duration-[--dur-base] ease-[--ease-pop] hover:-translate-y-1 hover:rotate-[-1deg]",
        className
      )}
      style={style}
    >
      {children}
    </div>
  )
}
