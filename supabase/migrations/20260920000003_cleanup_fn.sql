-- Daily cleanup: prune old reports/battles/closed rooms, recompute counts.
-- Scheduled via pg_cron at 04:00 UTC (see migration 04).

create or replace function public.daily_cleanup() returns void
language plpgsql security definer as $$
begin
  delete from offline_reports where created_at < now() - interval '30 days';
  delete from battles where created_at < now() - interval '7 days';
  delete from rooms where status = 'closed' and created_at < now() - interval '1 hour';
  update rooms r set current_players = coalesce(
    (select count(*) from room_members m where m.room_id = r.id and m.last_heartbeat_at > now() - interval '90 seconds'), 0);
end $$;
