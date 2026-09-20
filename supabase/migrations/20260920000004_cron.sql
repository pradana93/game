-- Schedule daily cleanup at 04:00 UTC via pg_cron (single cron only).
create extension if not exists pg_cron;
do $$ begin
  if exists (select 1 from cron.job where jobname = 'daily-cleanup') then
    perform cron.unschedule('daily-cleanup');
  end if;
  perform cron.schedule('daily-cleanup', '0 4 * * *', 'select public.daily_cleanup()');
exception when undefined_table then
  -- pg_cron not available on this plan; Edge Function can be cron-triggered instead.
  null;
end $$;
