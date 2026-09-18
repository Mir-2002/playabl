/**
 * Resolve an untrusted IANA timezone string to one safe to bucket dates with.
 *
 * `@date-fns/tz` `TZDate` with an unrecognized zone silently produces
 * `Invalid Date`, and `format()` on it throws a `RangeError` — which, deep
 * inside the crediting path, aborts a user's entire poll every tick (a
 * permanent, silent stall). On the read side the same bad value 500s a page.
 *
 * `Intl.DateTimeFormat` throws a `RangeError` for an unrecognized `timeZone`
 * on both Deno (edge function) and Node (Next app), so it is the reliable
 * validity probe. Returns the input when valid, otherwise falls back to "UTC".
 */
export function safeTimezone(tz: string | null | undefined): string {
  if (!tz) return "UTC"
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz })
    return tz
  } catch {
    return "UTC"
  }
}
