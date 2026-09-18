import { TZDate } from "@date-fns/tz"
import { format } from "date-fns"
import { safeTimezone } from "@/supabase/functions/_shared/timezone"

/** Format an ISO string as the user's local calendar day ("yyyy-MM-dd"). */
export function toUserDay(isoString: string, timezone: string): string {
  return format(new TZDate(new Date(isoString), safeTimezone(timezone)), "yyyy-MM-dd")
}

/** Today's date in the given IANA timezone ("yyyy-MM-dd"). */
export function todayInTimezone(timezone: string): string {
  return format(new TZDate(new Date(), safeTimezone(timezone)), "yyyy-MM-dd")
}
