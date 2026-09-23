-- P2: Explicit indexes for the three hot cross-user query paths.
--
-- The per-user tables (listening_events, daily_activity) are already served by
-- the UNIQUE constraints on (user_id, played_at) and (user_id, activity_date),
-- which create composite btrees covering history, heatmap, and streak reads.
-- These indexes cover the paths that had no usable index at all.

-- Leaderboard sort: ORDER BY total_points DESC, created_at ASC
create index on public.profiles (total_points desc, created_at asc);

-- Cron due-accounts scan: WHERE lastfm_sk IS NOT NULL AND next_poll_at <= now
-- Partial index skips disconnected accounts (lastfm_sk IS NULL) entirely.
create index on public.lastfm_accounts (next_poll_at) where lastfm_sk is not null;

-- Friend inbox + header badge: WHERE receiver_id = ? AND status = 'pending'
-- Also covers the receiver_id arm of the accepted-friends OR query.
-- The existing UNIQUE(sender_id, receiver_id) cannot serve a receiver_id-only
-- predicate (leftmost-prefix rule).
create index on public.friend_requests (receiver_id, status);
