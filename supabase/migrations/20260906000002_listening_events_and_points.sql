-- PREREQUISITE: Before the first cron execution, set these two database-level settings
-- in the Supabase SQL editor (or psql) for each environment:
--
-- Local dev:
--   ALTER DATABASE postgres SET app.edge_function_url =
--     'http://host.docker.internal:54321/functions/v1/poll-recently-played';
--   ALTER DATABASE postgres SET app.service_role_key = '<service-role-key>';
--   (find the service role key with: supabase status)
--
-- Cloud (Supabase dashboard → SQL editor):
--   ALTER DATABASE postgres SET app.edge_function_url =
--     'https://<project-ref>.supabase.co/functions/v1/poll-recently-played';
--   ALTER DATABASE postgres SET app.service_role_key = '<service-role-key>';
--
-- These settings are read at cron-execution time via current_setting(), so they can
-- be set at any point before the first scheduled run.

-- Extensions (must come before any objects that reference them)
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- listening_events: one row per Spotify track play.
-- UNIQUE(user_id, played_at) is the idempotency key — overlapping poll windows
-- are silently deduped via ON CONFLICT DO NOTHING in the edge function upsert.
create table public.listening_events (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  spotify_track_id text not null,
  track_name       text not null,
  artist           text not null,
  duration_ms      bigint not null,
  played_at        timestamptz not null,
  created_at       timestamptz not null default now(),
  unique (user_id, played_at)
);

alter table public.listening_events enable row level security;

-- Users can read their own listening history (heatmap, history views).
-- No INSERT policy — only the service-role cron writes to this table.
create policy "Users can view own listening events"
  on public.listening_events for select
  using (auth.uid() = user_id);

-- Add point tracking columns to profiles.
-- total_ms is the running accumulator; total_points = floor(total_ms / 1000).
-- Keeping both avoids re-deriving points from raw ms on every read.
alter table public.profiles
  add column total_ms     bigint not null default 0,
  add column total_points bigint not null default 0;

-- Trigger function: fires after each real INSERT into listening_events.
-- ON CONFLICT DO NOTHING skips the insert entirely so this never fires twice
-- for the same event — idempotency is guaranteed at the constraint level.
--
-- PostgreSQL evaluates right-hand-side expressions using pre-UPDATE column values,
-- so (total_ms + NEW.duration_ms) / 1000 correctly computes the new floor-second
-- total even though total_ms is being updated in the same SET clause.
--
-- SECURITY DEFINER runs as the function owner (postgres) so it can UPDATE profiles
-- regardless of RLS on that table. search_path is pinned to prevent injection.
create or replace function public.update_profile_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    total_ms     = total_ms + new.duration_ms,
    total_points = (total_ms + new.duration_ms) / 1000
  where id = new.user_id;
  return new;
end;
$$;

create trigger trg_update_profile_points
  after insert on public.listening_events
  for each row execute procedure public.update_profile_points();

-- pg_cron job: invoke the edge function every 3 minutes.
-- current_setting() is evaluated at execution time, not at schedule time,
-- so the DB settings above can be set after this migration runs.
select cron.schedule(
  'poll-recently-played',
  '*/3 * * * *',
  $$
    select net.http_post(
      url     := current_setting('app.edge_function_url'),
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body    := '{}'::jsonb
    );
  $$
);
