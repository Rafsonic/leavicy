-- ============================================================================
-- Sick Leave SaaS — multi-tenant schema (shared DB + Row Level Security)
-- Tenant = organization. Every tenant-scoped row carries org_id and is
-- isolated by RLS. Membership/role checks go through SECURITY DEFINER helper
-- functions so policies never recurse on the memberships table.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'manager', 'employee');
create type public.leave_type as enum ('sick', 'injury', 'family_care', 'medical_appointment', 'other');
create type public.leave_status as enum ('pending', 'approved', 'rejected', 'cancelled');

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

-- Global user profile (1:1 with auth.users)
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Tenants
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

-- Which users belong to which org, and in what role
create table public.memberships (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organizations (id) on delete cascade,
  user_id             uuid not null references auth.users (id) on delete cascade,
  role                public.app_role not null default 'employee',
  annual_sick_days    integer not null default 12 check (annual_sick_days >= 0),
  created_at          timestamptz not null default now(),
  unique (org_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);
create index memberships_org_idx on public.memberships (org_id);

-- Pending invitations to join an org
create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  email       text not null,
  role        public.app_role not null default 'employee',
  token       uuid not null default gen_random_uuid() unique,
  invited_by  uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (org_id, email)
);
create index invitations_token_idx on public.invitations (token);

-- Sick leave requests
create table public.leave_requests (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  leave_type      public.leave_type not null default 'sick',
  start_date      date not null,
  end_date        date not null,
  working_days    integer not null check (working_days > 0),
  reason          text,
  status          public.leave_status not null default 'pending',
  doctor_note_path text,
  reviewed_by     uuid references auth.users (id) on delete set null,
  reviewed_at     timestamptz,
  review_note     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (end_date >= start_date)
);
create index leave_requests_org_idx on public.leave_requests (org_id);
create index leave_requests_user_idx on public.leave_requests (user_id);
create index leave_requests_status_idx on public.leave_requests (org_id, status);

-- ----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER -> bypass RLS to avoid policy recursion)
-- ----------------------------------------------------------------------------

create or replace function public.is_org_member(_org uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = _org and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_org_role(_org uuid, _roles public.app_role[])
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = _org
      and m.user_id = (select auth.uid())
      and m.role = any (_roles)
  );
$$;

-- Do I share at least one org with the given user? (used for profile visibility)
create or replace function public.shares_org(_uid uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.memberships me
    join public.memberships them on them.org_id = me.org_id
    where me.user_id = (select auth.uid())
      and them.user_id = _uid
  );
$$;

-- ----------------------------------------------------------------------------
-- New-user trigger: create a profile row automatically
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger leave_requests_set_updated_at
  before update on public.leave_requests
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RPC: create an organization (creator becomes admin) — atomic & safe
-- ----------------------------------------------------------------------------
create or replace function public.create_organization(_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  _org_id uuid;
  _slug   text;
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated';
  end if;
  if coalesce(trim(_name), '') = '' then
    raise exception 'Organization name is required';
  end if;

  _slug := lower(regexp_replace(_name, '[^a-zA-Z0-9]+', '-', 'g'))
           || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.organizations (name, slug)
  values (trim(_name), _slug)
  returning id into _org_id;

  insert into public.memberships (org_id, user_id, role, annual_sick_days)
  values (_org_id, (select auth.uid()), 'admin', 12);

  return _org_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC: accept an invitation by token -> creates membership
-- ----------------------------------------------------------------------------
create or replace function public.accept_invitation(_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  _inv    public.invitations;
  _email  text;
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated';
  end if;

  select * into _inv from public.invitations
  where token = _token and accepted_at is null;

  if _inv.id is null then
    raise exception 'Invitation not found or already used';
  end if;

  select email into _email from auth.users where id = (select auth.uid());
  if lower(_email) <> lower(_inv.email) then
    raise exception 'This invitation was issued for a different email address';
  end if;

  insert into public.memberships (org_id, user_id, role)
  values (_inv.org_id, (select auth.uid()), _inv.role)
  on conflict (org_id, user_id) do nothing;

  update public.invitations set accepted_at = now() where id = _inv.id;

  return _inv.org_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC: team calendar — limited, non-sensitive view visible to all org members
-- (returns approved + pending leave; never exposes the free-text reason)
-- ----------------------------------------------------------------------------
create or replace function public.get_team_calendar(_org uuid)
returns table (
  id          uuid,
  user_id     uuid,
  full_name   text,
  leave_type  public.leave_type,
  start_date  date,
  end_date    date,
  status      public.leave_status
)
language sql
security definer
set search_path = ''
stable
as $$
  select lr.id, lr.user_id, p.full_name, lr.leave_type,
         lr.start_date, lr.end_date, lr.status
  from public.leave_requests lr
  join public.profiles p on p.id = lr.user_id
  where lr.org_id = _org
    and public.is_org_member(_org)
    and lr.status in ('approved', 'pending')
  order by lr.start_date desc;
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.organizations  enable row level security;
alter table public.memberships    enable row level security;
alter table public.invitations    enable row level security;
alter table public.leave_requests enable row level security;

-- profiles ------------------------------------------------------------------
create policy "profiles: read self or co-members"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_org(id));

create policy "profiles: update self"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- organizations -------------------------------------------------------------
create policy "orgs: members can read"
  on public.organizations for select to authenticated
  using (public.is_org_member(id));

create policy "orgs: admins can update"
  on public.organizations for update to authenticated
  using (public.has_org_role(id, array['admin']::public.app_role[]))
  with check (public.has_org_role(id, array['admin']::public.app_role[]));
-- (creation/deletion handled by SECURITY DEFINER RPCs)

-- memberships ---------------------------------------------------------------
create policy "memberships: members can read org roster"
  on public.memberships for select to authenticated
  using (public.is_org_member(org_id));

create policy "memberships: admins manage"
  on public.memberships for all to authenticated
  using (public.has_org_role(org_id, array['admin']::public.app_role[]))
  with check (public.has_org_role(org_id, array['admin']::public.app_role[]));

-- invitations ---------------------------------------------------------------
create policy "invitations: managers/admins can read"
  on public.invitations for select to authenticated
  using (public.has_org_role(org_id, array['admin','manager']::public.app_role[]));

create policy "invitations: admins manage"
  on public.invitations for all to authenticated
  using (public.has_org_role(org_id, array['admin']::public.app_role[]))
  with check (public.has_org_role(org_id, array['admin']::public.app_role[]));

-- leave_requests ------------------------------------------------------------
create policy "leave: read own"
  on public.leave_requests for select to authenticated
  using (user_id = (select auth.uid()));

create policy "leave: managers read org"
  on public.leave_requests for select to authenticated
  using (public.has_org_role(org_id, array['admin','manager']::public.app_role[]));

create policy "leave: create own pending"
  on public.leave_requests for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_org_member(org_id)
    and status = 'pending'
  );

-- Owners may edit/cancel their own PENDING requests, but must NOT be able to
-- self-approve/reject: the resulting status is constrained to pending|cancelled.
create policy "leave: owner edits own pending"
  on public.leave_requests for update to authenticated
  using (user_id = (select auth.uid()) and status = 'pending')
  with check (
    user_id = (select auth.uid())
    and status in ('pending', 'cancelled')
  );

create policy "leave: managers review org"
  on public.leave_requests for update to authenticated
  using (public.has_org_role(org_id, array['admin','manager']::public.app_role[]))
  with check (public.has_org_role(org_id, array['admin','manager']::public.app_role[]));

create policy "leave: owner deletes own pending"
  on public.leave_requests for delete to authenticated
  using (user_id = (select auth.uid()) and status = 'pending');

-- ----------------------------------------------------------------------------
-- Grants (RLS still applies; these expose the objects to API roles)
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles       to authenticated;
grant select, insert, update, delete on public.organizations  to authenticated;
grant select, insert, update, delete on public.memberships    to authenticated;
grant select, insert, update, delete on public.invitations    to authenticated;
grant select, insert, update, delete on public.leave_requests to authenticated;

grant execute on function public.create_organization(text)    to authenticated;
grant execute on function public.accept_invitation(uuid)      to authenticated;
grant execute on function public.get_team_calendar(uuid)      to authenticated;
grant execute on function public.is_org_member(uuid)          to authenticated;
grant execute on function public.has_org_role(uuid, public.app_role[]) to authenticated;
grant execute on function public.shares_org(uuid)             to authenticated;
