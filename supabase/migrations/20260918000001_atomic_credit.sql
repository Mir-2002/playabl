-- Atomic credit write-back.
--
-- Crediting used to perform three independent, unchecked writes (flag rows,
-- upsert daily_activity, bump total_points). If any one failed after the
-- rows were flagged credited=true, the point was counted in listening_events
-- but lost forever from daily_activity/total_points — permanent, silent drift
-- between the three sources of truth.
--
-- This function performs all three in a single transaction (a plpgsql function
-- body is atomic — it all commits or all rolls back), so credited/daily_activity/
-- total_points can never diverge. The edge function credits off credited=false
-- rows, so a rolled-back tick self-heals on the next non-empty poll.
--
-- SECURITY DEFINER runs as the owner (postgres) so it can write past RLS; the
-- search_path is pinned to prevent injection. Only the service-role cron calls
-- it, so execute is revoked from anon/authenticated.
--
-- p_day_deltas is a JSON array of { activity_date, track_count, points } — the
-- per-local-day increments already bucketed in the edge function's credit().
create or replace function public.apply_credits(
  p_user_id      uuid,
  p_credited_ids uuid[],
  p_day_deltas   jsonb,
  p_total_delta  int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1. Flag the credited rows (scoped to the user).
  update public.listening_events
     set credited = true
   where user_id = p_user_id
     and id = any (p_credited_ids);

  -- 2. Increment the per-local-day aggregate for each affected day.
  insert into public.daily_activity (user_id, activity_date, track_count, points)
  select
    p_user_id,
    (d->>'activity_date')::date,
    (d->>'track_count')::int,
    (d->>'points')::int
  from jsonb_array_elements(p_day_deltas) as d
  on conflict (user_id, activity_date) do update
    set track_count = public.daily_activity.track_count + excluded.track_count,
        points      = public.daily_activity.points      + excluded.points;

  -- 3. Increment lifetime points.
  update public.profiles
     set total_points = total_points + p_total_delta
   where id = p_user_id;
end;
$$;

revoke all on function public.apply_credits(uuid, uuid[], jsonb, int) from public;
revoke all on function public.apply_credits(uuid, uuid[], jsonb, int) from anon;
revoke all on function public.apply_credits(uuid, uuid[], jsonb, int) from authenticated;
