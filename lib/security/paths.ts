// Default-secure route classification for the proxy auth gate.
//
// Route-group names (e.g. `(app)`) don't appear in the URL, so protection is
// expressed as a public allowlist: anything not listed here requires a session.
// New routes are therefore protected by default.

// Exact public paths.
const PUBLIC_EXACT = new Set(["/", "/login"])

// Public path prefixes (each also matches the bare prefix itself).
// `/auth/*` — the Last.fm web-auth callback.
// `/u/*`    — public profile / invite links.
const PUBLIC_PREFIXES = ["/auth/", "/u/"]

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix),
  )
}
