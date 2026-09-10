-- ============================================================================
-- Optional starter data. Safe to run once after the migrations. Everything
-- here can also be edited later from Admin → Settings, so treat these as
-- starting points, not permanent values.
-- ============================================================================

insert into public.site_settings (key, value) values
  ('church_name', '"RCCG Goodnews Area Youth Church HQ"'),
  ('church_short_name', '"Goodnews Youth Church"'),
  ('pastor_name', '"Dr. Onifade David Kayode"'),
  ('pastor_title', '"Pastor in Charge"'),
  ('tagline', '"A house of faith, family, and purpose for every young person."'),
  ('address', '"Goodnews Area"'),
  ('city', '"Lagos"'),
  ('country', '"Nigeria"'),
  ('phone', '"+234 800 000 0000"'),
  ('email', '"info@goodnewsyouthchurch.org"'),
  ('service_times', '[
    {"label": "Sunday Worship Service", "time": "Sundays, 8:00 AM – 10:30 AM"},
    {"label": "Midweek Bible Study", "time": "Wednesdays, 6:00 PM – 7:30 PM"},
    {"label": "House Fellowship", "time": "Fridays, 6:00 PM – 7:30 PM"}
  ]'),
  ('socials', '[
    {"platform": "instagram", "url": "https://instagram.com/", "label": "@goodnewsyouthchurch"},
    {"platform": "facebook", "url": "https://facebook.com/", "label": "Goodnews Youth Church"},
    {"platform": "youtube", "url": "https://youtube.com/", "label": "Goodnews Youth Church"}
  ]'),
  ('seo_default_title', '"RCCG Goodnews Area Youth Church HQ"'),
  ('seo_default_description', '"Join RCCG Goodnews Area Youth Church HQ for Sunday worship, midweek programs, and community events under Pastor Dr. Onifade David Kayode."'),
  ('og_image_url', 'null')
on conflict (key) do nothing;

-- NOTE — bootstrapping your first admin:
-- Auth users can't be created from plain SQL (Supabase manages auth.users
-- internally), so create the first Super Admin via ONE of:
--   1. Supabase Dashboard → Authentication → Add User (set a password),
--      then run:
--        insert into public.admins (id, full_name, email, role)
--        values ('<the-new-user-uuid>', 'Your Name', 'you@example.com', 'super_admin');
--   2. Or run `supabase.auth.admin.inviteUserByEmail()` once via the
--      Supabase SQL editor's REST helpers / a one-off script using your
--      service-role key, then insert the matching `admins` row as above.
-- Every admin invited afterwards (Admin → Admin Users) is handled for you
-- by /api/create-admin.
