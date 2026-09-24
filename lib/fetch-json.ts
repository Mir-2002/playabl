/**
 * fetch + parse JSON with an explicit status check.
 *
 * A bare `fetch(url).then((r) => r.json())` calls `.json()` even on a failed
 * response. When the server returns an error with an empty (or non-JSON) body,
 * that surfaces as a cryptic `SyntaxError: Unexpected end of JSON input`,
 * masking the real HTTP failure. This throws a meaningful error on !ok so
 * TanStack Query's `onError` logs the actual status.
 */
export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (!res.ok) {
    throw new Error(`Request to ${String(input)} failed: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}
