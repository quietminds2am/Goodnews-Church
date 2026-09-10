-- ============================================================================
-- Table-level GRANTs for anon / authenticated.
--
-- 0002_rls.sql defines exactly what each role may see/change, but Postgres
-- checks GRANTs *before* it ever evaluates a row-level security policy — a
-- role with zero table privileges is denied outright, regardless of how
-- permissive its RLS policies are. Tables created directly via SQL (as these
-- were) don't get PostgREST's usual default grants the way tables created
-- through Studio's table editor do, so every one of these was missing on
-- the live project: anon could not read events/announcements/adverts/
-- brand_assets/site_settings, could not subscribe to the newsletter, and
-- could not submit the contact form; authenticated (i.e. logged-in admins)
-- could not read or manage almost anything from the dashboard.
--
-- Each GRANT below mirrors exactly the commands the matching RLS policy in
-- 0002_rls.sql already allows for that role — this does not widen access,
-- it unblocks the access that was already meant to exist.
-- ============================================================================

grant usage on schema public to anon, authenticated;

-- ── admins ── authenticated only (viewed/updated only by admins; RLS narrows
-- further to is_admin()/is_super_admin()). Rows are created/deleted only by
-- the service role via /api, which bypasses grants and RLS entirely.
grant select, update on public.admins to authenticated;

-- ── announcements ── anon reads published only (RLS); authenticated (admins)
-- read/write everything (RLS narrows to is_admin()).
grant select on public.announcements to anon;
grant select, insert, update, delete on public.announcements to authenticated;

-- ── events ── public listing; admins manage.
grant select on public.events to anon;
grant select, insert, update, delete on public.events to authenticated;

-- ── members ── anyone (logged in or not) can subscribe; admins view/manage.
grant insert on public.members to anon, authenticated;
grant select, update, delete on public.members to authenticated;

-- ── email_campaigns ── admin-only in every direction.
grant select, insert, update, delete on public.email_campaigns to authenticated;

-- ── brand_assets ── public reads active logos/media assets; admins manage.
grant select on public.brand_assets to anon;
grant select, insert, update, delete on public.brand_assets to authenticated;

-- ── adverts ── public reads active adverts; admins manage.
grant select on public.adverts to anon;
grant select, insert, update, delete on public.adverts to authenticated;

-- ── contact_messages ── anyone can submit; admins view/manage.
grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;

-- ── site_settings ── public reads; admins manage.
grant select on public.site_settings to anon;
grant select, insert, update, delete on public.site_settings to authenticated;
