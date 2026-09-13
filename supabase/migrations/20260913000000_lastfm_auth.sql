-- Unschedule the Spotify poll job. Keep pg_cron/pg_net extensions for the engine rebuild.
do $$
begin
  perform cron.unschedule('poll-recently-played');
exception when others then
  null;
end;
$$;

-- Drop the Spotify token table (its whole purpose — token storage/refresh — is gone).
drop table if exists public.spotify_accounts cascade;

-- Last.fm account mapping. Mirrors spotify_accounts' RLS posture:
-- no SELECT policy → service-role only. lastfm_sk must never be publicly readable.
create table public.lastfm_accounts (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  lastfm_user text unique not null,
  lastfm_sk   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.lastfm_accounts enable row level security;
