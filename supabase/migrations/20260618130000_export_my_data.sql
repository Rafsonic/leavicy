-- ============================================================================
-- GDPR data portability / access (Art. 15 & 20)
-- Returns all of the caller's personal data as JSON.
-- ============================================================================

create or replace function public.export_my_data()
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (
      select to_jsonb(p) from public.profiles p where p.id = (select auth.uid())
    ),
    'memberships', (
      select coalesce(
        jsonb_agg(jsonb_build_object(
          'organization', o.name,
          'role', m.role,
          'annual_sick_days', m.annual_sick_days,
          'joined_at', m.created_at
        )),
        '[]'::jsonb)
      from public.memberships m
      join public.organizations o on o.id = m.org_id
      where m.user_id = (select auth.uid())
    ),
    'leave_requests', (
      select coalesce(jsonb_agg(to_jsonb(lr) order by lr.created_at desc), '[]'::jsonb)
      from public.leave_requests lr
      where lr.user_id = (select auth.uid())
    )
  );
$$;

revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
