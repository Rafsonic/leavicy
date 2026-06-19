-- ============================================================================
-- Storage: private bucket for doctor's notes / medical certificates.
-- Object path convention:  {org_id}/{user_id}/{filename}
--   folder[1] = org_id  -> any org member may read
--   folder[2] = user_id -> only the owner may upload into their folder
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'doctor-notes',
  'doctor-notes',
  false,
  10485760, -- 10 MB
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

create policy "doctor-notes: org members can read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'doctor-notes'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

create policy "doctor-notes: owner can upload to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'doctor-notes'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

create policy "doctor-notes: owner can delete own files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'doctor-notes'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );
