// Name of the HttpOnly cookie holding the Last.fm auth `state` nonce.
// Shared between the redirect action (which sets it) and the callback route
// (which verifies and clears it).
export const LASTFM_STATE_COOKIE = "lastfm_oauth_state"
