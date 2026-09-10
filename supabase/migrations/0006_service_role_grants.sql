-- ============================================================================
-- service_role table grants.
--
-- service_role bypasses RLS entirely (that's its whole purpose — it's the key
-- used only by the trusted /api/* serverless functions, never the browser),
-- but it still needs the underlying Postgres GRANTs, exactly like anon and
-- authenticated did. It had none: TRUNCATE/TRIGGER/REFERENCES only, on every
-- table. That means /api/create-admin, /api/delete-admin, /api/send-campaign,
-- /api/unsubscribe and /api/cron-event-reminders have all been failing with
-- "permission denied" against Postgres despite using the service-role key.
-- ============================================================================

grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

-- Cover future tables created the same way (direct SQL/migration, not via
-- Studio's table editor) so this can't silently regress again.
alter default privileges in schema public
  grant all privileges on tables to service_role;
alter default privileges in schema public
  grant all privileges on sequences to service_role;
