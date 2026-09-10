-- ============================================================================
-- Security hardening flagged by `supabase db advisors`.
-- ============================================================================

-- `set_updated_at` had no fixed search_path (mutable search_path lets a
-- malicious search_path swap resolve unqualified identifiers to attacker
-- tables). It doesn't reference anything unqualified, but pin it anyway to
-- match the other functions and close the lint finding.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
set search_path = public;

-- is_admin/is_super_admin/current_admin_role are SECURITY DEFINER, so Postgres
-- grants EXECUTE to PUBLIC by default — meaning anon/authenticated could call
-- them directly as RPCs (e.g. POST /rest/v1/rpc/is_admin) even though they're
-- only meant to be read internally by RLS policies. Calling them leaks no
-- data beyond the caller's own admin status, but there's no reason to expose
-- them as a public API surface, so restrict EXECUTE to the roles that
-- actually need it (RLS policies still work: the policy's calling role needs
-- EXECUTE to evaluate the USING/WITH CHECK expression).
revoke execute on function public.is_admin() from public;
revoke execute on function public.is_super_admin() from public;
revoke execute on function public.current_admin_role() from public;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_super_admin() to anon, authenticated;
grant execute on function public.current_admin_role() to anon, authenticated;

-- Note: `public.rls_auto_enable()` (also flagged) is a Supabase-managed event
-- trigger installed on every project to auto-enable RLS on new tables. It's
-- platform infrastructure, not app code, and isn't actually invokable as a
-- normal RPC (it returns `event_trigger`, callable only by the trigger
-- machinery) — left alone intentionally.
