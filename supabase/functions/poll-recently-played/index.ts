import { createClient } from "npm:@supabase/supabase-js@2";
import { RecentlyPlayedSchema } from "../_shared/types.ts";
import {
  mintSpotifyToken,
  SpotifyRateLimitError,
  SpotifyReauthError,
} from "../_shared/token.ts";

const SPOTIFY_RECENTLY_PLAYED_URL =
  "https://api.spotify.com/v1/me/player/recently-played";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by the Edge Runtime.
// SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set via:
//   supabase secrets set SPOTIFY_CLIENT_ID=<value> SPOTIFY_CLIENT_SECRET=<value>

Deno.serve(async (_req: Request) => {
  try {
    console.log("[poll] tick start");
    const { data: accounts, error } = await supabase
      .from("spotify_accounts")
      .select(
        "user_id, provider_refresh_token, access_token, expires_at, needs_reauth",
      )
      .eq("needs_reauth", false);

    if (error) throw error;

    console.log(`[poll] accounts found: ${accounts?.length ?? 0}`);
    for (const account of accounts ?? []) {
      try {
        await processUser(account);
      } catch (err) {
        console.error(`[poll] user ${account.user_id} failed:`, err);
      }
    }
    console.log("[poll] tick done");
  } catch (err) {
    console.error("[poll] fatal:", err);
  }

  // Always 200 — a non-200 causes pg_cron to thrash.
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

type Account = {
  user_id: string;
  provider_refresh_token: string | null;
  access_token: string | null;
  expires_at: string | null;
  needs_reauth: boolean;
};

async function processUser(account: Account): Promise<void> {
  const accessToken = await ensureValidToken(account);
  if (!accessToken) return; // needs_reauth set; skip

  const cursor = await getLastPlayedAt(account.user_id);

  const url = new URL(SPOTIFY_RECENTLY_PLAYED_URL);
  url.searchParams.set("limit", "50");
  if (cursor) url.searchParams.set("after", cursor);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 429) {
    const retryAfter = res.headers.get("Retry-After") ?? "unknown";
    console.warn(
      `[poll] user ${account.user_id} rate limited; retry-after=${retryAfter}s`,
    );
    return;
  }

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Spotify API ${res.status} for user ${account.user_id}: ${errBody}`);
  }

  console.log(`[poll] user ${account.user_id}: Spotify API ok`);
  const body = await res.json();
  const parsed = RecentlyPlayedSchema.parse(body);

  if (parsed.items.length === 0) return;

  const rows = parsed.items.map((item) => ({
    user_id: account.user_id,
    spotify_track_id: item.track.id,
    track_name: item.track.name,
    artist: item.track.artists[0].name,
    duration_ms: item.track.duration_ms,
    played_at: item.played_at,
  }));

  const { error } = await supabase
    .from("listening_events")
    .upsert(rows, { onConflict: "user_id,played_at", ignoreDuplicates: true });

  if (error) throw error;

  console.log(
    `[poll] user ${account.user_id}: upserted ${rows.length} events`,
  );
}

async function ensureValidToken(account: Account): Promise<string | null> {
  const expiresAt = account.expires_at ? new Date(account.expires_at) : null;
  const bufferMs = 60 * 1000;
  const needsRefresh =
    !account.access_token ||
    !expiresAt ||
    expiresAt.getTime() - Date.now() < bufferMs;

  if (!needsRefresh) {
    console.log(`[poll] user ${account.user_id}: token still valid`);
    return account.access_token!;
  }

  if (!account.provider_refresh_token) {
    console.warn(`[poll] user ${account.user_id}: no refresh token — marking needs_reauth`);
    await markNeedsReauth(account.user_id);
    return null;
  }

  console.log(`[poll] user ${account.user_id}: minting new access token`);

  let minted;
  try {
    minted = await mintSpotifyToken({
      refreshToken: account.provider_refresh_token,
      clientId: Deno.env.get("SPOTIFY_CLIENT_ID")!,
      clientSecret: Deno.env.get("SPOTIFY_CLIENT_SECRET")!,
    });
  } catch (err) {
    if (err instanceof SpotifyReauthError) {
      console.warn(
        `[poll] user ${account.user_id}: invalid_grant — marking needs_reauth`,
      );
      await markNeedsReauth(account.user_id);
      return null;
    }
    if (err instanceof SpotifyRateLimitError) {
      console.warn(
        `[poll] user ${account.user_id}: token mint rate limited; skip this tick`,
      );
      return null;
    }
    throw err;
  }

  const update: Record<string, unknown> = {
    access_token: minted.accessToken,
    expires_at: minted.expiresAt,
    updated_at: new Date().toISOString(),
  };
  // Spotify may rotate the refresh token; persist it if so.
  if (minted.rotatedRefreshToken) {
    update.provider_refresh_token = minted.rotatedRefreshToken;
  }

  const { error } = await supabase
    .from("spotify_accounts")
    .update(update)
    .eq("user_id", account.user_id);

  if (error) throw error;

  return minted.accessToken;
}

async function markNeedsReauth(userId: string): Promise<void> {
  const { error } = await supabase
    .from("spotify_accounts")
    .update({ needs_reauth: true, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw error;
}

async function getLastPlayedAt(userId: string): Promise<string | undefined> {
  const { data } = await supabase
    .from("listening_events")
    .select("played_at")
    .eq("user_id", userId)
    .order("played_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return undefined;
  return String(new Date(data.played_at).getTime());
}
