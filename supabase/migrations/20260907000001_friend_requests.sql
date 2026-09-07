create table public.friend_requests (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'pending'
                check (status in ('pending', 'accepted')),
  created_at  timestamptz not null default now(),
  unique (sender_id, receiver_id),
  check (sender_id != receiver_id)
);

alter table public.friend_requests enable row level security;

create policy "Parties can view their own requests"
  on public.friend_requests for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Authenticated users can send requests"
  on public.friend_requests for insert
  with check (auth.uid() = sender_id);

create policy "Receiver can accept requests"
  on public.friend_requests for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

create policy "Parties can delete their requests"
  on public.friend_requests for delete
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
