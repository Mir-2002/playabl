"use client"

import { AnimatedNumber } from "@/app/(app)/home/_components/animated-number"

// Thin marketing-side wrapper so the landing page imports a co-located leaf
// rather than reaching into the dashboard folder at every call site.
// Reuses AnimatedNumber (one of the two allowed `motion` client leaves) — no
// third `motion` import is introduced.
export function StatFigure({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  return <AnimatedNumber value={value} className={className} />
}
