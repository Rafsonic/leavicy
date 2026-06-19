-- ============================================================================
-- GDPR retention / auto-delete
-- Deletes/anonymizes personal & health data past its retention period.
-- Idempotent; safe to run repeatedly. See docs/gdpr/retention-policy.md.
-- ============================================================================

create or replace function public.purge_expired_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  _notes_deleted    integer := 0;
  _requests_deleted integer := 0;
  _reasons_scrubbed integer := 0;
begin
  -- 1) Doctor's notes (health) older than 12 months after the leave end_date:
  --    remove the Storage object first...
  delete from storage.objects o
  using public.leave_requests lr
  where o.bucket_id = 'doctor-notes'
    and o.name = lr.doctor_note_path
    and lr.doctor_note_path is not null
    and lr.end_date < (current_date - interval '12 months');
  get diagnostics _notes_deleted = row_count;

  --    ...then clear the reference on the request.
  update public.leave_requests
  set doctor_note_path = null
  where doctor_note_path is not null
    and end_date < (current_date - interval '12 months');

  -- 2) Cancelled / rejected requests older than 6 months: hard delete.
  delete from public.leave_requests
  where status in ('cancelled', 'rejected')
    and created_at < (now() - interval '6 months');
  get diagnostics _requests_deleted = row_count;

  -- 3) Scrub free-text reasons older than 24 months (keep a minimal record).
  update public.leave_requests
  set reason = null
  where reason is not null
    and end_date < (current_date - interval '24 months');
  get diagnostics _reasons_scrubbed = row_count;

  return jsonb_build_object(
    'notes_deleted', _notes_deleted,
    'requests_deleted', _requests_deleted,
    'reasons_scrubbed', _reasons_scrubbed
  );
end;
$$;

-- Only privileged callers (service role / cron), never app users.
revoke all on function public.purge_expired_data() from public;
revoke all on function public.purge_expired_data() from anon, authenticated;
grant execute on function public.purge_expired_data() to service_role;

-- Best-effort daily schedule via pg_cron when the extension is available.
-- (Locally pg_cron is usually absent — run scripts/purge-expired.mjs instead.)
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule(
      'purge-expired-data',
      '0 3 * * *',
      'select public.purge_expired_data();'
    );
  else
    raise notice 'pg_cron not available; schedule purge_expired_data() externally';
  end if;
exception when others then
  raise notice 'pg_cron scheduling skipped: %', sqlerrm;
end $$;
