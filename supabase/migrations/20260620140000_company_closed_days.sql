-- ============================================================================
-- Company closed days — tenant-scoped public holidays / shutdown dates.
-- Employees cannot request leave on these dates and they are excluded from a
-- request's working-day count. Read by all org members; managed by admins.
-- ============================================================================

create table public.company_closed_days (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  closed_date date not null,
  name        text not null check (char_length(trim(name)) > 0),
  created_at  timestamptz not null default now(),
  unique (org_id, closed_date)
);

-- FK + the hot lookup (closed days for an org within a date range)
create index company_closed_days_org_idx on public.company_closed_days (org_id);
create index company_closed_days_org_date_idx
  on public.company_closed_days (org_id, closed_date);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.company_closed_days enable row level security;

-- Every member of the org can read its closed days (the request flow needs them
-- to block dates and exclude them from the working-day count).
create policy "closed_days: members can read"
  on public.company_closed_days for select to authenticated
  using (public.is_org_member(org_id));

-- Only admins create/update/delete closed days.
create policy "closed_days: admins manage"
  on public.company_closed_days for all to authenticated
  using (public.has_org_role(org_id, array['admin']::public.app_role[]))
  with check (public.has_org_role(org_id, array['admin']::public.app_role[]));

-- ----------------------------------------------------------------------------
-- Grants (RLS still applies)
-- ----------------------------------------------------------------------------
grant select, insert, update, delete on public.company_closed_days to authenticated;
