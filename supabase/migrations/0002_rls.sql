-- ============================================================================
-- Row Level Security policies.
-- Every table is locked down by default; each policy below opens exactly
-- the access the app needs and nothing more. The Supabase anon key is safe
-- to ship in the browser bundle precisely because these policies — not the
-- key itself — are what control access.
-- ============================================================================

-- Helper: is the current authenticated user a registered admin, and what role?
create or replace function public.current_admin_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.admins where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admins where id = auth.uid());
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_admin_role() = 'super_admin';
$$;

-- ── admins ───────────────────────────────────────────────────────────────
alter table public.admins enable row level security;

drop policy if exists "Admins can view admin list" on public.admins;
create policy "Admins can view admin list"
  on public.admins for select
  using (public.is_admin());

drop policy if exists "Super admins can update admin roles" on public.admins;
create policy "Super admins can update admin roles"
  on public.admins for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Insert/delete are performed only by the service role (via /api/create-admin
-- and /api/delete-admin), which bypasses RLS entirely — no policy needed,
-- and none is granted, so even a super admin cannot self-service this from
-- the browser (creating an auth user requires the service role key).

-- ── announcements ────────────────────────────────────────────────────────
alter table public.announcements enable row level security;

drop policy if exists "Public can view published announcements" on public.announcements;
create policy "Public can view published announcements"
  on public.announcements for select
  using (status = 'published');

drop policy if exists "Admins can view all announcements" on public.announcements;
create policy "Admins can view all announcements"
  on public.announcements for select
  using (public.is_admin());

drop policy if exists "Admins can manage announcements" on public.announcements;
create policy "Admins can manage announcements"
  on public.announcements for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── events ───────────────────────────────────────────────────────────────
alter table public.events enable row level security;

drop policy if exists "Public can view events" on public.events;
create policy "Public can view events"
  on public.events for select
  using (true);

drop policy if exists "Admins can manage events" on public.events;
create policy "Admins can manage events"
  on public.events for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── members ──────────────────────────────────────────────────────────────
alter table public.members enable row level security;

drop policy if exists "Public can subscribe" on public.members;
create policy "Public can subscribe"
  on public.members for insert
  with check (true);

drop policy if exists "Admins can view members" on public.members;
create policy "Admins can view members"
  on public.members for select
  using (public.is_admin());

drop policy if exists "Admins can manage members" on public.members;
create policy "Admins can manage members"
  on public.members for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete members" on public.members;
create policy "Admins can delete members"
  on public.members for delete
  using (public.is_admin());

-- ── email_campaigns ──────────────────────────────────────────────────────
alter table public.email_campaigns enable row level security;

drop policy if exists "Admins can manage campaigns" on public.email_campaigns;
create policy "Admins can manage campaigns"
  on public.email_campaigns for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── brand_assets ─────────────────────────────────────────────────────────
alter table public.brand_assets enable row level security;

drop policy if exists "Public can view active brand assets" on public.brand_assets;
create policy "Public can view active brand assets"
  on public.brand_assets for select
  using (active = true);

drop policy if exists "Admins can view all brand assets" on public.brand_assets;
create policy "Admins can view all brand assets"
  on public.brand_assets for select
  using (public.is_admin());

drop policy if exists "Admins can manage brand assets" on public.brand_assets;
create policy "Admins can manage brand assets"
  on public.brand_assets for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── adverts ──────────────────────────────────────────────────────────────
alter table public.adverts enable row level security;

drop policy if exists "Public can view active adverts" on public.adverts;
create policy "Public can view active adverts"
  on public.adverts for select
  using (active = true);

drop policy if exists "Admins can view all adverts" on public.adverts;
create policy "Admins can view all adverts"
  on public.adverts for select
  using (public.is_admin());

drop policy if exists "Admins can manage adverts" on public.adverts;
create policy "Admins can manage adverts"
  on public.adverts for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── contact_messages ─────────────────────────────────────────────────────
alter table public.contact_messages enable row level security;

drop policy if exists "Public can submit contact messages" on public.contact_messages;
create policy "Public can submit contact messages"
  on public.contact_messages for insert
  with check (true);

drop policy if exists "Admins can view contact messages" on public.contact_messages;
create policy "Admins can view contact messages"
  on public.contact_messages for select
  using (public.is_admin());

drop policy if exists "Admins can manage contact messages" on public.contact_messages;
create policy "Admins can manage contact messages"
  on public.contact_messages for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete contact messages" on public.contact_messages;
create policy "Admins can delete contact messages"
  on public.contact_messages for delete
  using (public.is_admin());

-- ── site_settings ────────────────────────────────────────────────────────
alter table public.site_settings enable row level security;

drop policy if exists "Public can view site settings" on public.site_settings;
create policy "Public can view site settings"
  on public.site_settings for select
  using (true);

drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());
