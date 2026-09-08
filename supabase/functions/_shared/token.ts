// Pure Spotify token-mint helper shared by the Deno edge function (imported with
// the `.ts` extension) and the Next.js `getNowPlaying` server action (imported
// via the bundler). Intentionally IMPORT-FREE — it relies only on globals that
// exist in both Deno and Node 18+ (fetch, btoa, URLSearchParams, Date) so it can
// cross the runtime boundary without pulling in `npm:`/Node-only specifiers.
//
// It does ONLY the token exchange. Each caller keeps its own DB read/write and
// needs_reauth handling around it — the per-side persistence is a tiny diff not
// worth abstracting here.

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

export type MintResult = {
  accessToken: string;
  /** ISO 8601 timestamp when the access token expires. */
  expiresAt: string;
  /** Present only when Spotify rotated the refresh token this exchange. */
  rotatedRefreshToken?: string;
};

/** Thrown when Spotify rejects the refresh token (revoked consent). Caller should mark needs_reauth. */
export class SpotifyReauthError extends Error {
  constructor(message = "Spotify refresh token is invalid (invalid_grant)") {
    super(message);
    this.name = "SpotifyReauthError";
  }
}

/** Thrown when Spotify rate-limits the token mint. Caller should back off and retry later. */
export class SpotifyRateLimitError extends Error {
  constructor(message = "Spotify token mint rate limited (429)") {
    super(message);
    this.name = "SpotifyRateLimitError";
  }
}

export async function mintSpotifyToken(input: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<MintResult> {
  const credentials = btoa(`${input.clientId}:${input.clientSecret}`);

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: input.refreshToken,
    }),
  });

  if (res.status === 429) {
    throw new SpotifyRateLimitError();
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (data && (data as { error?: string }).error === "invalid_grant") {
      throw new SpotifyReauthError();
    }
    throw new Error(`Token mint failed ${res.status}: ${JSON.stringify(data)}`);
  }

  const expiresAt = new Date(
    Date.now() + (data as { expires_in: number }).expires_in * 1000,
  ).toISOString();

  const result: MintResult = {
    accessToken: (data as { access_token: string }).access_token,
    expiresAt,
  };

  const rotated = (data as { refresh_token?: string }).refresh_token;
  if (rotated) result.rotatedRefreshToken = rotated;

  return result;
}
