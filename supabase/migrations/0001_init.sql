-- ============================================================================
-- RCCG Goodnews Area Youth Church HQ — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh
-- project, in order: 0001_init.sql -> 0002_rls.sql -> 0003_storage.sql
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── Admins ───────────────────────────────────────────────────────────────
-- Mirrors auth.users by id. A row here is what makes a Supabase Auth user an
-- "admin" at all — creating an auth user alone grants no dashboard access.
create table if not exists public.admins (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null default 'editor' check (role in ('super_admin', 'editor')),
  created_at timestamptz not null default now()
);

-- ── Announcements ────────────────────────────────────────────────────────
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 180),
  body text not null check (char_length(body) between 10 and 8000),
  status text not null default 'draft' check (status in ('draft', 'published')),
  publish_at timestamptz,
  created_by uuid references public.admins (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists announcements_status_idx on public.announcements (status, publish_at desc);

-- ── Events ───────────────────────────────────────────────────────────────
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null check (char_length(description) between 10 and 8000),
  category text,
  event_date date not null,
  start_time time,
  end_time time,
  location text,
  flyer_url text,
  flyer_alt text,
  status text not null default 'upcoming' check (status in ('upcoming', 'past', 'cancelled')),
  social_links jsonb not null default '[]'::jsonb,
  created_by uuid references public.admins (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists events_status_date_idx on public.events (status, event_date);
create index if not exists events_slug_idx on public.events (slug);

-- ── Members (newsletter / email list) ───────────────────────────────────
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text not null unique,
  phone text,
  subscribed boolean not null default true,
  source text,
  unsubscribe_token text not null unique,
  joined_at timestamptz not null default now()
);
create index if not exists members_subscribed_idx on public.members (subscribed);

-- ── Email campaigns ──────────────────────────────────────────────────────
create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (char_length(subject) between 3 and 200),
  body_html text not null,
  campaign_type text not null default 'general' check (campaign_type in ('announcement', 'event_reminder', 'service_reminder', 'general')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  related_event_id uuid references public.events (id) on delete set null,
  created_by uuid references public.admins (id) on delete set null,
  recipient_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Brand assets (church logo, member/media logos, partner logos) ──────
create table if not exists public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 150),
  type text not null check (type in ('church_logo', 'member_logo', 'partner_logo')),
  image_url text not null,
  active boolean not null default true,
  uploaded_by uuid references public.admins (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ── Adverts ──────────────────────────────────────────────────────────────
create table if not exists public.adverts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 150),
  image_url text not null,
  link_url text,
  placement text not null check (placement in ('home_top', 'home_middle', 'events_sidebar', 'footer')),
  active boolean not null default true,
  start_date date,
  end_date date,
  created_by uuid references public.admins (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists adverts_placement_idx on public.adverts (placement, active);

-- ── Contact messages ─────────────────────────────────────────────────────
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null,
  phone text,
  subject text not null check (char_length(subject) between 3 and 150),
  message text not null check (char_length(message) between 10 and 4000),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Site settings (key/value store, editable from Admin → Settings) ─────
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null
);

-- ── updated_at triggers ──────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.announcements;
create trigger set_updated_at before update on public.announcements
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.events;
create trigger set_updated_at before update on public.events
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.email_campaigns;
create trigger set_updated_at before update on public.email_campaigns
  for each row execute function public.set_updated_at();
