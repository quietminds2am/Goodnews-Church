-- ============================================================================
-- Enable live updates for the public site.
--
-- The frontend now subscribes to Postgres changes on these tables (see
-- src/hooks/useRealtimeInvalidate.ts) so a new announcement/event/advert or
-- an updated brand asset / site setting appears for visitors already on the
-- page, no refresh needed. Supabase Realtime only streams changes for tables
-- explicitly added to the `supabase_realtime` publication — checked: it
-- currently has none of this project's tables in it.
-- ============================================================================

alter publication supabase_realtime add table
  public.announcements,
  public.events,
  public.adverts,
  public.brand_assets,
  public.site_settings;
