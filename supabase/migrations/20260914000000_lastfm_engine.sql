-- Drop old Spotify-era trigger and function (points from duration_ms).
-- Cap logic moves to pure TypeScript in the edge function.
drop trigger if exists trg_update_profile_points on public.listening_events;
drop function if exists public.update_profile_points();

-- listening_events: swap out Spotify columns, add Last.fm credited flag.
-- UNIQUE(user_id, played_at) stays — still the idempotency key.
alter table public.listening_events
  drop column duration_ms,
  drop column spotify_track_id;

alter table public.listening_events
  add column track_id text,                             -- Last.fm mbid; null when empty
  add column credited boolean not null default false;   -- set true by credit() in edge fn

-- profiles: drop total_ms (duration-based), add per-user IANA timezone.
alter table public.profiles
  drop column total_ms,
  add column timezone text not null default 'UTC';

-- lastfm_accounts: poll watermark + adaptive backoff state.
alter table public.lastfm_accounts
  add column last_uts               bigint,
  add column next_poll_at           timestamptz not null default now(),
  add column consecutive_empty_polls int        not null default 0;

-- daily_activity: permanent per-user-local-day aggregate.
-- Written by the edge function at credit time; read by heatmap/streak surfaces.
-- activity_date is the user's LOCAL calendar day (bucketed once at write time).
create table public.daily_activity (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  track_count   int  not null default 0,
  points        int  not null default 0,
  unique (user_id, activity_date)
);

alter table public.daily_activity enable row level security;

create policy "Public can view daily_activity"
  on public.daily_activity for select using (true);

-- anticheat_config: singleton row of tunable caps.
-- id CHECK (id = 1) enforces exactly one row.
create table public.anticheat_config (
  id         int primary key default 1 check (id = 1),
  hourly_cap int not null default 40,
  daily_cap  int not null default 400
);

alter table public.anticheat_config enable row level security;

insert into public.anticheat_config (id, hourly_cap, daily_cap)
values (1, 40, 400);

-- flagged_accounts: manual-review surface (no auto-ban).
-- Surfaces users whose uncredited fraction exceeds 50%.
create view public.flagged_accounts as
  select
    la.user_id,
    la.lastfm_user,
    p.total_points,
    count(le.id)                                          as total_events,
    count(le.id) filter (where le.credited = false)       as uncredited_events
  from public.lastfm_accounts la
  join public.profiles p on p.id = la.user_id
  left join public.listening_events le on le.user_id = la.user_id
  group by la.user_id, la.lastfm_user, p.total_points
  having
    count(le.id) > 0
    and count(le.id) filter (where le.credited = false)::float
        / count(le.id) > 0.5;

-- Reschedule cron to 1-min base tick.
-- cron.schedule upserts by name, replacing the 3-min Spotify job from migration
-- 20260906000002. Vault secrets are seeded outside migrations (seed.sql locally,
-- by hand for cloud) — the cron command itself carries no secrets.
select cron.schedule(
  'poll-recently-played',
  '* * * * *',
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
