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

-- pg_cron job that pokes the poll-recently-played edge function every 3 min.
--
-- The command resolves the function URL and service-role key from Vault AT RUNTIME
-- (each tick), so this migration carries NO secrets and is byte-identical local and
-- cloud. The environment-specific values live in Vault, seeded separately:
--   - local: supabase/seed.sql (runs on `db reset`, never on `db push`)
--   - cloud: seeded once by hand — see CLAUDE.md "Cron / Vault setup"
--
-- cron.schedule upserts by name, so this both creates and keeps the job in sync on
-- every reset. Missing Vault secrets → the tick fails loudly in cron.job_run_details
-- rather than silently no-op'ing (the failure mode a hardcoded placeholder caused).
select cron.schedule(
  'poll-recently-played',
  '*/3 * * * *',
  $$
    select net.http_post(
      url     := (select decrypted_secret from vault.decrypted_secrets where name = 'poll_edge_function_url'),
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'poll_service_role_key')
      ),
      body    := '{}'::jsonb
    );
  $$
);
