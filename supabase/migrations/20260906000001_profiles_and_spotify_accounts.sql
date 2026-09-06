-- profiles: public-readable display info, created/updated on Spotify sign-in
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly viewable"
  on public.profiles for select
  using (true);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- spotify_accounts: Spotify OAuth tokens — no SELECT policy (service-role only reads)
create table public.spotify_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider_refresh_token text,
  access_token text,
  expires_at timestamptz,
  needs_reauth boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.spotify_accounts enable row level security;

create policy "Users can insert own spotify account"
  on public.spotify_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own spotify account"
  on public.spotify_accounts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
