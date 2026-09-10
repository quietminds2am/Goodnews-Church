-- ============================================================================
-- Storage buckets for uploaded images. All buckets are public-read (so
-- flyers/logos/adverts can be displayed on the public site without signed
-- URLs) but writes are restricted to authenticated admins only.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('flyers', 'flyers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('brand-assets', 'brand-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('adverts', 'adverts', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

drop policy if exists "Public can view uploaded images" on storage.objects;
create policy "Public can view uploaded images"
  on storage.objects for select
  using (bucket_id in ('flyers', 'brand-assets', 'adverts'));

drop policy if exists "Admins can upload images" on storage.objects;
create policy "Admins can upload images"
  on storage.objects for insert
  with check (
    bucket_id in ('flyers', 'brand-assets', 'adverts')
    and public.is_admin()
  );

drop policy if exists "Admins can update their uploaded images" on storage.objects;
create policy "Admins can update their uploaded images"
  on storage.objects for update
  using (bucket_id in ('flyers', 'brand-assets', 'adverts') and public.is_admin())
  with check (bucket_id in ('flyers', 'brand-assets', 'adverts') and public.is_admin());

drop policy if exists "Admins can delete uploaded images" on storage.objects;
create policy "Admins can delete uploaded images"
  on storage.objects for delete
  using (bucket_id in ('flyers', 'brand-assets', 'adverts') and public.is_admin());
