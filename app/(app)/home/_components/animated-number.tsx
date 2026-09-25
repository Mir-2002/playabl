"use client"

import { useEffect, useRef } from "react"
import { animate } from "motion"

interface Props {
  value: number
  className?: string
}

export function AnimatedNumber({ value, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const prevRef = useRef<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const from = prevRef.current ?? 0
    prevRef.current = value

    if (from === value) return

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (prefersReducedMotion) {
      el.textContent = value > 0 ? value.toLocaleString() : "0"
      return
    }

    const controls = animate(from, value, {
      duration: 0.38,
      ease: [0.25, 1, 0.5, 1],
      onUpdate: (v) => {
        el.textContent = Math.round(v) > 0 ? Math.round(v).toLocaleString() : "0"
      },
    })

    return () => controls.stop()
  }, [value])

  return (
    <span ref={ref} className={className}>
      {value > 0 ? value.toLocaleString() : "0"}
    </span>
  )
}
