@AGENTS.md

# Playabl
Playabl is a social listening app connected to **Last.fm**. Users earn points based on their scrobbles, maintain listening streaks, view their activity history, compare their rank with other users, and add friends.

> **Migration status:** Phase 1 (auth cutover), Phase 2 (cron engine), Phase 3 (now-playing widget + history enrichment), and Phase 4 (UI polish) are all **done**. The authoritative specs are `docs/lastfm/phase-1-auth.md`, `docs/lastfm/phase-2-cron-engine.md`, `docs/lastfm/phase-3-nowplaying-history.md`, and `docs/lastfm/phase-4-ui-polish.md`. Where this file and those specs disagree, **the phase docs win** — this file describes the target state.

# Key Features

### Points System
Players accumulate points based on their scrobbles. **1 credited scrobble = 1 point** (Last.fm scrobbles carry no reliable duration). A two-tier anti-cheat cap (per-local-hour + per-local-day) bounds the payoff; over-cap scrobbles are stored but not counted.

### Ranking
A ranking system that players can compete to get into.

### Streaks
Listening continuously extends a user's daily streak

### Activity Heatmap

A GitHub style heatmap that tracks user's activity. The deeper the shade = more activity.

# Project MVP

- Allow users to log in with their Last.fm account
- Track scrobbles via Last.fm `user.getRecentTracks`
- Convert credited scrobbles into points (1 scrobble = 1 point, capped)
- Display a Global All Time Leaderboard
- Show listening streak and heatmap activity
- Allow users to add friends

# User Stories
###  Authentication

-   As a user, I want to create a Playabl account using Last.fm so that I do not need a separate password.
    
-   As a user, I want to disconnect Last.fm from Playabl.
    
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

Settled design. Portfolio piece, **design target ~1,000 users** (Last.fm `user.getRecentTracks` is public — no per-user OAuth, no allowlist, so the Spotify 5-user cap is gone). The signature technical detail is the **adaptive Last.fm polling engine** with a pure, testable anti-cheat cap.

### Auth & identity
- Supabase Auth, **Last.fm as the sole login path** via a hand-rolled web-auth flow (Architecture **B**): Last.fm web-auth → `admin.createUser` shadow user → `generateLink`/`verifyOtp` mints a real Supabase session. **No self-signed JWT** (this stack signs ES256). `auth.users` is retained as the identity anchor; `enable_signup=false`; no passwords. Full spec: `docs/lastfm/phase-1-auth.md`.
- Last.fm identity maps to `auth.users` via **`lastfm_accounts`** (username + session key `lastfm_sk`), RLS-locked to service-role only. The `sk` is stored but not needed for the read-only public polling.

### Tracking engine
- Server-side cron: **Supabase `pg_cron` → Edge Function** (via `pg_net`), **1-min base tick**. Free, all-in-Supabase.
- **Adaptive polling:** each tick selects only users whose `next_poll_at` is due (up to a per-tick request budget), then per user polls `user.getRecentTracks` with a `from` cursor. Interval backs off exponentially on empty polls (floor 3 min → cap 60 min) and resets to the floor on new scrobbles — this keeps the single Supabase egress IP under Last.fm's ~5 req/s guideline at 1k users.
- **`user.getRecentTracks` is the single source of truth.** The currently-playing item (`@attr.nowplaying`, no `date`) is skipped for points. Scrobbles carry **no duration** — points are not duration-based.
- **Points = 1 per credited scrobble.** A two-tier cap (per user's local hour + local day, from `anticheat_config`) decides credited-ness; over-cap scrobbles are stored (`credited=false`) but not counted. Cap logic lives in **pure TypeScript** in the edge function (Vitest-tested), not a SQL trigger.

### Data model
- `listening_events (user_id, track_id, track_name, artist, played_at, credited)` — **unique `(user_id, played_at)`**, inserts `ON CONFLICT DO NOTHING RETURNING *`. The idempotency key dedupes overlapping poll windows; `credited` is the source of truth for the hourly cap. Pruned to the **last 100 rows/user** (retention — keeps the DB under the free-tier 500 MB cap).
- `daily_activity (user_id, activity_date, track_count, points)` — permanent per-**local-day** aggregate; the heatmap/streak source. Written by the edge function; public-read RLS.
- `profiles.total_points` (credited scrobble count), plus **`profiles.timezone`** (IANA, default `'UTC'`) — written by the edge function on each credited batch.
- `lastfm_accounts` — username + `lastfm_sk` + poll state (`last_uts` watermark, `next_poll_at`, `consecutive_empty_polls`); service-role only.
- `anticheat_config` — singleton, tunable caps (`hourly_cap`, `daily_cap`); `flagged_accounts` view for manual review.
- Friends via a `friend_requests` / friendship table with `pending` / `accepted` states. **No block.**

### Derived features
- **Leaderboard:** global all-time, `ORDER BY total_points DESC`, tie-break `created_at ASC`.
- **Day boundary:** **per-user IANA timezone** (`profiles.timezone`, default `'UTC'`), bucketed **once at write time** in the edge function, so `daily_activity.activity_date` is already the user's local day and read paths stay timezone-agnostic. DST is handled by `@date-fns/tz`; zone changes apply forward-only (no history recompute).
- **Heatmap:** GitHub-style, reads `daily_activity.track_count` per local day.
- **Streaks:** a day qualifies with **≥1 credited scrobble** (`daily_activity.track_count >= 1`). Current streak = consecutive qualifying days ("today" computed in the user's timezone). Longest = max historical run. No grace/freezes.

### Profile & friends
- **One public profile page that doubles as the invite link.** Public (anon) RLS `SELECT` on safe columns (display name, avatar, points, streak, heatmap). Opening the link shows the user's stats plus an **Add friend** button that sends a request when the viewer is logged in; the recipient accepts/declines. Private columns (email, tokens) are locked to self / service-role.
- Account lifecycle: disconnect Last.fm, delete account + associated data.

# Stack & Workflows

Settled design, second phase. Library and workflow choices for the architecture above. Bias: leanest idiomatic Next 16 path.

### Data flow
- **RSC + Server Actions are the default.** Fetch on the server with the Supabase server client; most data never touches a client cache. **TanStack Query is scoped to three live surfaces** — the leaderboard, the friend-request inbox, and the now-playing widget (interval refetch + optimistic mutations). No client API layer for anything RSC can serve.
- **Mutations are formless Server Actions.** Friend send/accept/reject and profile edits are `action` functions using `useActionState`; **Zod parses the `FormData` inside the action**. No form library — inputs are too small to justify one.
- **Leaderboard/friends liveness = TanStack Query `refetchInterval` (~30–60s), not Supabase Realtime.** The cron writes at most every few minutes per active user, so a websocket earns nothing. **Now-playing** uses a 30s `refetchInterval` — it fetches Last.fm live at view time (never the DB).

### Supabase clients & auth
- **`@supabase/ssr`** with three client factories (browser, server-component, route-handler/action) + Next **middleware** to refresh the auth cookie per request. (`auth-helpers` is deprecated — do not use.)
- The cron/Edge Function uses a **separate service-role client** that never touches cookies.

### Types & validation
- **Generated DB types are the source for internal query results** (`supabase gen types typescript --local > lib/database.types.ts`, committed, regenerated after every schema change).
- **Zod only at untrusted boundaries** — the Last.fm API response and user input. Zod does **not** mirror the whole DB.
- **Typed env via `@t3-oss/env-nextjs`** — the server/client split keeps the service-role key from ever leaking client-side.

### Engine (Edge Function)
- Edge Functions run on **Deno** (bare/`npm:` imports via a `deno.json` import map, no `node_modules`).
- **Shared pure modules** in `supabase/functions/_shared/`, imported by both the Deno function and Node/Vitest (bare specifiers, no Deno-only globals): `lastfm.ts` (the `user.getRecentTracks` Zod schema), `credit.ts` (two-tier cap + per-user-timezone bucketing — the centerpiece, fully unit-tested), `backoff.ts` (adaptive interval).
- **Raw `fetch`** for `user.getRecentTracks`, response validated by the shared Zod schema (single-track-as-object normalized; `nowplaying` filtered; `uts → played_at`). No Last.fm SDK.
- **No token refresh** — public reads need only `api_key` + username, so polling never fails on auth (no `needs_reauth`). Cursor is the `lastfm_accounts.last_uts` watermark (survives the 100-row prune); polls use a **10-min overlap lookback** + dedupe to catch eventually-consistent late scrobbles; paginates up to 5 pages on catch-up.
- **Crediting is pure TS:** `INSERT … RETURNING` the genuinely-new rows, feed them (plus current hour/day counts + the user's timezone) to `credit()`, then batch-write `credited` flags, `daily_activity`, and `profiles.total_points`. The **single-writer invariant** (one sequential cron tick) is what makes this safe — do not parallelize per-user work without re-deriving idempotency.
- **Resilience:** per-user try/catch so one failure never aborts the batch; always return 200 so pg_cron doesn't thrash; per-tick request budget caps req/s. Sequential polling.
- **Retention:** prune `listening_events` to the newest 100 rows/user, same-tick, after insert+credit.
- **Time zones:** **date-fns v4 + `@date-fns/tz`** (`TZDate`) for **per-user IANA** bucketing at write time — keeps the streak/heatmap math explicit and testable.

### UI
- **shadcn preset** (`base-luma` style, `mist` base color, `@base-ui/react`). **`ui-master` skill invoked once up front** to set direction/tokens, then reused per surface. Full UI polish completed in Phase 4 — see `docs/lastfm/phase-4-ui-polish.md`.
- **Motion:** `motion` package (React 19-ready framer-motion successor) is installed but scoped to **exactly 2 dynamically-imported client leaves**: `AnimatedNumber` (points counter tween) and `MotionList` (leaderboard FLIP reorder). Do not add `motion` imports to server components or eagerly-loaded client modules.
- **Toast feedback:** `@base-ui/react/toast` — `Toast.createToastManager()` singleton in `hooks/use-toast.ts`, `Toast.Provider` in `components/providers.tsx`. Use `useToast()` for all user feedback; do not add a second toast library.
- **Shared UI primitives** in `components/ui/`: `StatCard`, `ListRow`, `SectionHeading`, `EmptyState`, `Skeleton` (+ presets), `PageHeader`. Use these before reaching for inline markup.
- **Heatmap is a hand-rolled Tailwind CSS grid** over the `daily_activity` per-local-day aggregate — no heatmap library.
- **Error UI:** styled root **`not-found.tsx`** (dead/deleted profile invite links 404 cleanly) + root **`error.tsx`**. No granular per-segment boundaries until a surface needs isolation.
- **Skeletons + loading.tsx** exist for all 5 major routes (home, leaderboard, streak, history, profile). Each skeleton matches its page layout to avoid CLS.

### Account lifecycle
- **Disconnect Last.fm** = null `lastfm_sk` on `lastfm_accounts` (profile/points/history kept). *(Polling uses the public username, so disconnect is primarily a consent gesture; a disconnected account can also be excluded from the poll set.)*
- **Delete account** = `auth.admin.deleteUser` via a service-role Server Action; **`ON DELETE CASCADE` FKs** on `auth.users.id` from every table (`profiles`, `lastfm_accounts`, `listening_events`, `daily_activity`, `friend_requests`) do the atomic wipe. Hard delete — friend rows vanish from others' lists, the invite link 404s.

### Migrations & deploy
- **Migrations are the only source of truth.** Schema, RLS policies, and pg_cron setup all live in `supabase/migrations/` — the whole engine reproducible from the repo. Local dev on the **Supabase local stack** (Docker Postgres).
- **Next app on Vercel; DB + Edge Function on Supabase cloud.** `LASTFM_API_KEY` / `LASTFM_SHARED_SECRET` + service-role key are server secrets (Vercel for the app; Supabase Edge Function secrets / Vault for the cron); Vercel/client holds only the anon key + URL. Edge Function deployed via `supabase functions deploy` (manual — no GH Action at this scale).

#### Cron / Vault setup
- **The `poll-recently-played` cron command carries no secrets.** The `cron.schedule` (in the Phase 2 engine migration; the old Spotify schedule was torn down in Phase 1) resolves the edge-function URL and service-role key from **Vault at runtime** (`vault.decrypted_secrets`), so the migration is byte-identical local and cloud. `cron.schedule` upserts by name, so every reset re-syncs the job.
- **Never hardcode the command or set it via a Studio SQL snippet.** A snippet is not a migration — `supabase db reset` reruns migrations only, so a snippet-set command gets silently reverted to whatever the migration says. (This is exactly the bug that once left the job running a `SELECT 1;` no-op after a reset.)
- **Vault secrets are seeded per-environment, outside migrations:**
  - **Local** — `supabase/seed.sql` inserts `poll_edge_function_url` (`host.docker.internal` URL) and `poll_service_role_key` (the public Supabase *local demo* key, safe to commit). Seeds run on `db reset`, **never** on `db push`, so these stay local.
  - **Cloud** — seed Vault **once by hand** with the same two secret names (real project URL + real service-role key); the real key never lives in the repo.
- If a tick fails, check `cron.job_run_details` (job status) and `net._http_response` (HTTP status/body). Missing Vault secrets make the tick **fail loudly** there rather than silently no-op.

### Testing
- **Vitest on the engine + Zod schemas** — dedupe idempotency, `1 credited scrobble = 1 point`, hourly/daily cap boundaries, `nowplaying` skip, per-user-timezone day/hour bucketing (incl. a non-UTC boundary + a DST transition), backoff curve. UI verified manually via the `verify`/`run` skills. **No Playwright** yet; add only if the leaderboard/friends flow gets fragile.