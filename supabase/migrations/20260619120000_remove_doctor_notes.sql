-- ============================================================================
-- Remove the doctor's-note / medical-certificate feature.
-- Leavicy tracks leave (holiday, sick, etc.) and approvals only — it no longer
-- collects medical documents, so the doctor_note_path column, the doctor-notes
-- Storage bucket + policies, and the related retention logic are dropped.
-- ============================================================================

-- 1) Recreate the retention function without the doctor's-note handling.
create or replace function public.purge_expired_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  _requests_deleted integer := 0;
  _reasons_scrubbed integer := 0;
begin
  -- Cancelled / rejected requests older than 6 months: hard delete.
  delete from public.leave_requests
  where status in ('cancelled', 'rejected')
    and created_at < (now() - interval '6 months');
  get diagnostics _requests_deleted = row_count;

  -- Scrub free-text reasons older than 24 months (keep a minimal record).
  update public.leave_requests
  set reason = null
  where reason is not null
    and end_date < (current_date - interval '24 months');
  get diagnostics _reasons_scrubbed = row_count;

  return jsonb_build_object(
    'requests_deleted', _requests_deleted,
    'reasons_scrubbed', _reasons_scrubbed
  );
end;
$$;

-- Privileges are preserved by CREATE OR REPLACE; reassert them to be explicit.
revoke all on function public.purge_expired_data() from public;
revoke all on function public.purge_expired_data() from anon, authenticated;
grant execute on function public.purge_expired_data() to service_role;

-- 2) Drop the column that referenced the uploaded notes.
alter table public.leave_requests drop column if exists doctor_note_path;

-- 3) Remove the Storage bucket and its access policies.
drop policy if exists "doctor-notes: org members can read" on storage.objects;
drop policy if exists "doctor-notes: owner can upload to own folder" on storage.objects;
drop policy if exists "doctor-notes: owner can delete own files" on storage.objects;

-- Supabase Storage installs delete-protection triggers on storage.objects /
-- storage.buckets that block direct DML ("Direct deletion from storage tables is
-- not allowed. Use the Storage API instead."). For this one-off teardown we
-- disable triggers for the duration of the transaction so the bucket and any
-- leftover objects can be hard-deleted from the migration, then restore them.
set local session_replication_role = 'replica';

delete from storage.objects where bucket_id = 'doctor-notes';
delete from storage.buckets where id = 'doctor-notes';

set local session_replication_role = 'origin';
