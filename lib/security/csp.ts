// Pure builder for the Content-Security-Policy header value.
//
// Pragmatic (non-nonce) CSP: keeps static rendering while still providing a
// meaningful backstop — clickjacking (frame-ancestors), plugin/embed lockdown
// (object-src), image/connect allowlists, and forced HTTPS. Scripts and styles
// use 'unsafe-inline' because Next.js injects inline hydration payloads and the
// app uses inline `style` attributes; a nonce-based policy would force every
// page into dynamic rendering.

const LASTFM_IMG_HOST = "https://*.freetls.fastly.net"

export function buildCsp({
  isDev,
  supabaseUrl,
}: {
  isDev: boolean
  supabaseUrl: string
}): string {
  const directives = [
    `default-src 'self'`,
    // 'unsafe-eval' is only needed by React in development.
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: ${LASTFM_IMG_HOST}`,
    `connect-src 'self' ${supabaseUrl}`,
    `font-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ]
  return directives.join("; ")
}
