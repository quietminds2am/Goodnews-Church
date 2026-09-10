-- ============================================================================
-- Auto-archive past events.
--
-- `events.status` ('upcoming' / 'past' / 'cancelled') is set by hand today —
-- nothing corrects it once an event's date has passed, so it silently stays
-- "upcoming" (still shown on the homepage/Events page) until an admin
-- remembers to edit it. This schedules a nightly job, at the Postgres level,
-- that does the correction automatically. Combined with 0007's realtime
-- publication, a visitor with the page open sees the event quietly move to
-- Past Events overnight with no admin action and no page reload.
--
-- Does not touch 'cancelled' events, and an admin can still hand-set status
-- at any time — this only ever moves a still-'upcoming' row whose date has
-- gone by.
-- ============================================================================

create extension if not exists pg_cron with schema extensions;

-- `cron.schedule(job_name, ...)` upserts by name (pg_cron 1.4+, Supabase
-- ships 1.6.4) — safe to rerun this migration.
select cron.schedule(
  'archive-past-events',
  '0 0 * * *', -- every day at 00:00 UTC
  $$
  update public.events
  set status = 'past'
  where status = 'upcoming'
    and event_date < current_date;
  $$
);
