@AGENTS.md

# Playabl
Playabl is a social listening app connected to Spotify. Users earn points based on verified listening time, maintain listening streaks, view their activity history, compare their rank with other users, and add friends.

# Key Features

### Points System
Players accumulate points based on their listening activity. 1 second of music listend to = 1 point.

### Ranking
A ranking system that players can compete to get into.

### Streaks
Listening continuously extends a user's daily streak

### Activity Heatmap

A GitHub style heatmap that tracks user's activity. The deeper the shade = more activity.

# Project MVP

- Allow users to connect their spotify accounts
- Track verified listening time
- Convert listening time (seconds) into points
- Display a Global All Time Leaderboard
- Show listening streak and heatmap activity
- Allow users to add friends

# User Stories
###  Authentication

-   As a user, I want to create a Playabl account using Spotify so that I do not need a separate password.
    
-   As a user, I want to disconnect Spotify from Playabl.
    
-   As a user, I want to delete my Playabl account and associated data.
    

### Listening tracking
    
-   As a user, I want to see how many points I earned.
    
### Profile and activity

-   As a user, I want to see my total points.
    
-   As a user, I want to see my current and longest streaks.
    
-   As a user, I want to see my listening activity in a heatmap.
    
-   As a user, I want to share a profile that shows my progress.
    

### Leaderboard

-   As a user, I want to see the global all-time leaderboard.
    
### Friends
    
-   As a user, I want to send a friend request.

-   As a user, I want to generate a link where my friends can use to add me. 
    
-   As a user, I want to accept or reject friend requests.
    
-   As a user, I want to remove a friend.
    
-   As a user, I want to view a friend’s profile.

# Architecture

Settled design. Portfolio piece, ≤5 users (Spotify Feb-2026 dev-app allowlist cap) — optimize for a clean full-stack story, not scale. The signature technical detail is the recently-played verification engine.

### Auth & identity
- Supabase Auth with **Spotify as the sole OAuth provider**. `config.toml` wires Spotify; `.env.example` documents the creds (placed in `.env.local`). Scope: `user-read-recently-played`.
- On sign-in, capture `provider_refresh_token` from the session (Supabase surfaces it only at login/refresh and will **not** refresh the Spotify token itself) and upsert it into an RLS-locked `spotify_accounts` table (service-role read only). The cron mints Spotify access tokens directly against `accounts.spotify.com/api/token`.

### Tracking engine
- Server-side cron: **Supabase `pg_cron` → Edge Function** (via `pg_net`), every ~3 min. Free, all-in-Supabase.
- Per user, poll `GET /me/recently-played` using an `after` cursor (last max `played_at`).
- **`/recently-played` is the single source of truth.** Spotify's built-in ~30s-to-log rule is the only anti-cheat screen; looped repeats legitimately count (the user is genuinely listening). `/currently-playing` is rejected **for points** — it exposes one track at a time and would require per-second polling, and must never feed `listening_events`/points/aggregates. (It *is* used, read-only, for the cosmetic Now Playing widget — see `docs/01_extended_features.md`.)
- **Points = full `duration_ms` per logged track.** The endpoint exposes no intra-track progress, so mid-track pauses/scrubs are invisible and accepted. "1 second = 1 point" means points equal the summed duration of logged tracks.

### Data model
- `listening_events (user_id, spotify_track_id, track_name, artist, duration_ms, played_at)` — **unique `(user_id, played_at)`**, inserts `ON CONFLICT DO NOTHING`. This is the idempotency key that dedupes overlapping poll windows and is the substrate for points, heatmap, and streaks.
- `profiles.total_points` / `total_ms` — **materialized via an `AFTER INSERT` trigger** on `listening_events`.
- `spotify_accounts` — Spotify tokens, service-role only.
- Friends via a `friend_requests` / friendship table with `pending` / `accepted` states. **No block.**

### Derived features
- **Leaderboard:** global all-time, `ORDER BY total_points DESC`, tie-break `created_at ASC`. No self-rank lookup (moot at ≤5 users).
- **Day boundary:** fixed **`Asia/Manila`** for all bucketing — not a global launch, so no per-user timezone.
- **Heatmap:** GitHub-style, per-Manila-day sum of activity.
- **Streaks:** a day qualifies with **≥1 credited track**. Current streak = consecutive qualifying days (counts today if it qualifies, else runs through yesterday and breaks on a missed yesterday). Longest = max historical run. No grace/freezes.

### Profile & friends
- **One public profile page that doubles as the invite link.** Public (anon) RLS `SELECT` on safe columns (display name, avatar, points, streak, heatmap). Opening the link shows the user's stats plus an **Add friend** button that sends a request when the viewer is logged in; the recipient accepts/declines. Private columns (email, tokens) are locked to self / service-role.
- Account lifecycle: disconnect Spotify, delete account + associated data.

# Stack & Workflows

Settled design, second phase. Library and workflow choices for the architecture above. Bias: leanest idiomatic Next 16 path, no infrastructure that ≤5 users can't justify.

### Data flow
- **RSC + Server Actions are the default.** Fetch on the server with the Supabase server client; most data never touches a client cache. **TanStack Query is scoped to the two live surfaces only** — the leaderboard and the friend-request inbox (interval refetch + optimistic mutations). No client API layer for anything RSC can serve.
- **Mutations are formless Server Actions.** Friend send/accept/reject and profile edits are `action` functions using `useActionState`; **Zod parses the `FormData` inside the action**. No form library — inputs are too small to justify one.
- **Leaderboard/friends liveness = TanStack Query `refetchInterval` (~30–60s), not Supabase Realtime.** The cron writes at most every ~3 min, so a websocket earns nothing.

### Supabase clients & auth
- **`@supabase/ssr`** with three client factories (browser, server-component, route-handler/action) + Next **middleware** to refresh the auth cookie per request. (`auth-helpers` is deprecated — do not use.)
- The cron/Edge Function uses a **separate service-role client** that never touches cookies.

### Types & validation
- **Generated DB types are the source for internal query results** (`supabase gen types typescript --local > lib/database.types.ts`, committed, regenerated after every schema change).
- **Zod only at untrusted boundaries** — the Spotify API response and user input. Zod does **not** mirror the whole DB.
- **Typed env via `@t3-oss/env-nextjs`** — the server/client split keeps the service-role key from ever leaking client-side.

### Engine (Edge Function)
- Edge Functions run on **Deno** (URL/`npm:` imports, no `node_modules`).
- The Spotify recently-played shape and the `listening_events` row shape live in a **shared `supabase/functions/_shared/` module** (Zod schemas) imported by both the Deno function and the Next app — one source of truth for the engine contract.
- **Raw `fetch`** for both the token mint and `/me/recently-played`, response validated by the shared Zod schema. No Spotify SDK (Deno rules most out anyway).
- **Token refresh is automatic.** Each tick mints a fresh access token from the stored `provider_refresh_token`; cache `access_token` + `expires_at` on the `spotify_accounts` row and only re-mint when expired. Persist a rotated refresh token if Spotify returns one.
- **Resilience:** per-user try/catch so one failure never aborts the batch; **`invalid_grant` (revoked consent) → mark the row for re-auth** and surface "reconnect Spotify" in the UI (the only case needing the user back); **`429` → respect `Retry-After`**, skip, catch up next tick; always return 200 so pg_cron doesn't thrash. Sequential polling — no concurrency at this scale.
- **Time zones:** **date-fns v4 + `@date-fns/tz`** (`TZDate`) for all `Asia/Manila` bucketing — keeps the streak/heatmap math explicit and testable.

### UI
- **shadcn preset** (`base-luma` style, `mist` base color, `@base-ui/react`). **`ui-master` skill invoked once up front** to set direction/tokens, then reused per surface.
- **Heatmap is a hand-rolled Tailwind CSS grid** over a server-side per-Manila-day aggregate — no heatmap library.
- **Error UI:** styled root **`not-found.tsx`** (dead/deleted profile invite links 404 cleanly) + root **`error.tsx`**. No granular per-segment boundaries until a surface needs isolation.

### Account lifecycle
- **Disconnect Spotify** = null the tokens on `spotify_accounts` (polling stops, profile/points/history kept).
- **Delete account** = `auth.admin.deleteUser` via a service-role Server Action; **`ON DELETE CASCADE` FKs** on `auth.users.id` from every table (`profiles`, `spotify_accounts`, `listening_events`, `friend_requests`) do the atomic wipe. Hard delete — friend rows vanish from others' lists, the invite link 404s.

### Migrations & deploy
- **Migrations are the only source of truth.** Schema, RLS policies, the `AFTER INSERT` trigger, and pg_cron setup all live in `supabase/migrations/` — the whole engine reproducible from the repo. Local dev on the **Supabase local stack** (Docker Postgres).
- **Next app on Vercel; DB + Edge Function on Supabase cloud.** Spotify client secret + service-role key are **Supabase Edge Function secrets**; Vercel holds only the anon key, URL, and Spotify client ID. Edge Function deployed via `supabase functions deploy` (manual — no GH Action at this scale).

#### Cron / Vault setup
- **The `poll-recently-played` cron command carries no secrets.** The `cron.schedule` in migration `20260906000002` resolves the edge-function URL and service-role key from **Vault at runtime** (`vault.decrypted_secrets`), so the migration is byte-identical local and cloud. `cron.schedule` upserts by name, so every reset re-syncs the job.
- **Never hardcode the command or set it via a Studio SQL snippet.** A snippet is not a migration — `supabase db reset` reruns migrations only, so a snippet-set command gets silently reverted to whatever the migration says. (This is exactly the bug that once left the job running a `SELECT 1;` no-op after a reset.)
- **Vault secrets are seeded per-environment, outside migrations:**
  - **Local** — `supabase/seed.sql` inserts `poll_edge_function_url` (`host.docker.internal` URL) and `poll_service_role_key` (the public Supabase *local demo* key, safe to commit). Seeds run on `db reset`, **never** on `db push`, so these stay local.
  - **Cloud** — seed Vault **once by hand** with the same two secret names (real project URL + real service-role key); the real key never lives in the repo.
- If a tick fails, check `cron.job_run_details` (job status) and `net._http_response` (HTTP status/body). Missing Vault secrets make the tick **fail loudly** there rather than silently no-op.

### Testing
- **Vitest on the engine + Zod schemas** — dedupe idempotency, points = summed duration, Manila streak/day-boundary math. UI verified manually via the `verify`/`run` skills. **No Playwright** yet; add only if the leaderboard/friends flow gets fragile.