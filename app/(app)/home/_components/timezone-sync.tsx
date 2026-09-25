"use client"

import { useEffect } from "react"
import { setTimezone } from "@/app/(app)/home/actions"

export function TimezoneSync({ profileTimezone }: { profileTimezone: string }) {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz && tz !== profileTimezone) {
      setTimezone(tz)
    }
  }, [profileTimezone])
  return null
}
