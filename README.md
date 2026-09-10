# RCCG Goodnews Area Youth Church HQ — Website

A production-ready church website: a public site (services, programs, events with flyers, past-event recaps linking to social media, announcements, contact) and a role-based admin panel (announcements, events/flyers, members + email campaigns, brand assets/logos, adverts, site settings, admin user management).

**Stack:** React + Vite + TypeScript + Tailwind CSS + Supabase (Postgres, Auth, Storage) + Vercel (hosting + serverless functions + cron), email via [Resend](https://resend.com).

---

## 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier is enough to start)
- A [Resend](https://resend.com) account and API key
- A [Vercel](https://vercel.com) account for deployment

## 2. Local setup

```bash
npm install
cp .env.example .env
# fill in .env — see "Environment variables" below
npm run dev
```

## 3. Set up Supabase

1. Create a new Supabase project.
2. In the SQL Editor, run the migrations **in order**:
   - `supabase/migrations/0001_init.sql` — tables
   - `supabase/migrations/0002_rls.sql` — Row Level Security policies
   - `supabase/migrations/0003_storage.sql` — storage buckets (`flyers`, `brand-assets`, `adverts`)
3. Optionally run `supabase/seed.sql` to pre-fill Site Settings with sensible defaults (all editable later from **Admin → Site Settings**).
4. Copy your project's **URL** and **anon public key** (Settings → API) into `.env` as `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
5. Copy the **service_role key** (Settings → API) into `.env` as `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_URL` (same URL). **Never** prefix this with `VITE_` — it must stay server-only.

### Bootstrapping your first admin

Auth users can't be created from plain SQL. Create your first Super Admin with:

1. Supabase Dashboard → **Authentication → Add User** (set an email + password).
2. In the SQL Editor:
   ```sql
   insert into public.admins (id, full_name, email, role)
   values ('<the-new-user-uuid-from-step-1>', 'Your Name', 'you@example.com', 'super_admin');
   ```
3. Sign in at `/admin/login`.

Every admin invited afterwards (**Admin → Admin Users**, Super Admin only) is handled automatically via the `/api/create-admin` serverless function, which emails them an invite link.

## 4. Set up Resend

1. Create a Resend account and verify a sending domain (or use their test domain while developing).
2. Create an API key and set `RESEND_API_KEY` in `.env`.
3. Set `RESEND_FROM_EMAIL` to a verified sender, e.g. `"RCCG Goodnews Area Youth Church <hello@yourdomain.org>"`.

## 5. Environment variables

See `.env.example` for the full list. Summary:

| Variable | Where it's used | Exposed to browser? |
|---|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Frontend Supabase client | Yes (safe — access is controlled by RLS) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | `/api/*` serverless functions only | **No — never** |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | `/api/*` serverless functions only | No |
| `VITE_SITE_URL` | Canonical URLs, sitemap, unsubscribe links | Yes |
| `CRON_SECRET` | Authenticates the scheduled event-reminder job | No |

## 6. Deploying to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. Import the repo in Vercel — it auto-detects Vite.
3. Add all the environment variables from `.env.example` in **Project Settings → Environment Variables** (for Production, and Preview if you want staging to work too).
4. Deploy. Vercel will run `npm run build`, which also generates `sitemap.xml` from your live Supabase data via the `postbuild` script.
5. The daily event-reminder cron (`vercel.json` → `crons`) is enabled automatically on Vercel's Pro plan; on the Hobby plan, Vercel Cron still works for a single daily job.
6. Point your domain's DNS at Vercel and enable HTTPS (automatic via Vercel).
7. Update `VITE_SITE_URL` and the `Sitemap:` line in `public/robots.txt` to your real domain.

## 7. Project structure

```
src/
  components/     Shared UI (layout, forms, admin widgets, SEO, icons)
  pages/public/   Public site pages
  pages/admin/    Admin dashboard pages (protected)
  context/        Auth + site settings React context
  hooks/          Data-fetching hooks (React Query + Supabase)
  lib/            Supabase client, validators (zod), utilities
  types/          Hand-authored types mirroring the Supabase schema
api/              Vercel serverless functions (service-role operations)
supabase/         SQL migrations + seed data
scripts/          Build-time sitemap generator
```

## 8. Admin roles

- **Super Admin** — full access, including inviting/removing other admins and changing roles.
- **Editor** — everything except Admin Users management.

Role checks are enforced in three layers: the UI (routes/menus hide what a role can't use), the database (Row Level Security — `public.is_super_admin()`), and the serverless functions that touch Supabase Auth (`/api/create-admin`, `/api/delete-admin`) each re-verify the caller's role server-side before doing anything.

## 9. Content & assets that were assumed

This project was built from a project brief without a finalized real-world address, phone number, or social handles. The following are **editable placeholders** (Admin → Site Settings) and should be updated before go-live:

- Physical address, phone number, and email
- Social media handles/URLs
- Exact service times (a reasonable RCCG-style weekly schedule was seeded)

The church logo (RCCG seal + Goodnews Area Youth Church seal, shown together) and the three media/ministry partner logos (Goodnews Creative Media, Swizz Fashion Collections, FoundersHub) supplied for this project are already wired in at `public/assets/`.

## 10. Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Type-check, build, and generate `sitemap.xml` |
| `npm run typecheck` | Type-check only |
| `npm run lint` | Lint with oxlint |
| `npm run preview` | Preview the production build locally |
| `npm run generate:sitemap` | Regenerate `sitemap.xml` on demand |

## 11. Security notes

- The Supabase **anon key** is safe in the browser bundle by design — every table has Row Level Security enabled, and public access is limited to exactly what's needed (e.g., published announcements, active adverts, inserting a contact message).
- The Supabase **service-role key** and **Resend API key** are used only inside `/api/*`, which runs solely on Vercel's server — they are never sent to the browser and are excluded from git via `.gitignore`.
- All admin-mutating serverless functions re-verify the caller's Supabase session and admin role server-side (`api/_lib/auth.ts`) — client-side route protection is a UX convenience, not the real access control.
- Image uploads are validated by MIME type and size (5MB cap) both client-side and via Supabase Storage bucket policies.
- See the **Production Readiness Report** delivered alongside this codebase for the full security/SEO/performance/accessibility audit.
