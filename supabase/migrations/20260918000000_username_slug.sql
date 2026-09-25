alter table public.profiles
  alter column username set not null,
  add constraint profiles_username_key unique (username),
  add constraint profiles_username_check check (username ~ '^[A-Za-z0-9_-]+$');
