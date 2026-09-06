import { TZDate } from "@date-fns/tz"
import { format } from "date-fns"

const MANILA = "Asia/Manila"

export function toManilaDay(isoString: string): string {
  return format(new TZDate(new Date(isoString), MANILA), "yyyy-MM-dd")
}

export function todayInManila(): string {
  return format(new TZDate(new Date(), MANILA), "yyyy-MM-dd")
}
