-- ============================================================================
-- Platform super-admin + tenant lifecycle (Central back-office)
-- Adds a platform-level super-admin role (Leavicy staff — NOT tenant members),
-- an organization lifecycle status, and platform-admin-gated RPCs for managing
-- tenants and reading platform-wide stats. Existing tenant RLS is left intact:
-- platform-admin access is ADDED via permissive policies (Postgres OR-es them).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Organization lifecycle status
-- ----------------------------------------------------------------------------
create type public.org_status as enum ('active', 'suspended', 'archived');

alter table public.organizations
  add column status public.org_status not null default 'active';

create index organizations_status_idx on public.organizations (status);

-- ----------------------------------------------------------------------------
-- Platform admins (super-admins). Granted out-of-band (seed / service role);
-- NOT readable or writable by tenant users (no policy for `authenticated`).
-- ----------------------------------------------------------------------------
create table public.platform_admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
-- intentionally no policies: only the service role (bypasses RLS) and the seed
-- can read/write this table; the API roles (anon/authenticated) cannot.

-- ----------------------------------------------------------------------------
-- Helper: is the current user a platform super-admin?
-- SECURITY DEFINER so it reads platform_admins without exposing the table,
-- and never recurses (no policy references platform_admins in its USING clause).
-- ----------------------------------------------------------------------------
create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.platform_admins pa
    where pa.user_id = (select auth.uid())
  );
$$;

-- ----------------------------------------------------------------------------
-- Organizations: ADD platform-admin access alongside the existing tenant
-- policies. Permissive policies are OR-ed, so tenant behaviour is unchanged.
-- ----------------------------------------------------------------------------
create policy "orgs: platform admins read all"
  on public.organizations for select to authenticated
  using (public.is_platform_admin());

create policy "orgs: platform admins insert"
  on public.organizations for insert to authenticated
  with check (public.is_platform_admin());

create policy "orgs: platform admins update all"
  on public.organizations for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
-- No DELETE policy: a tenant "delete" is a soft archive (status = 'archived').

-- ----------------------------------------------------------------------------
-- Tenant CRUD RPCs (platform-admin gated). SECURITY DEFINER so cross-tenant
-- writes are controlled centrally rather than via broad table policies.
-- ----------------------------------------------------------------------------
create or replace function public.admin_create_tenant(_name text, _slug text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  _org_id     uuid;
  _final_slug text;
begin
  if not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;
  if coalesce(trim(_name), '') = '' then
    raise exception 'Tenant name is required';
  end if;

  _final_slug := nullif(trim(coalesce(_slug, '')), '');
  if _final_slug is null then
    _final_slug := lower(regexp_replace(_name, '[^a-zA-Z0-9]+', '-', 'g'))
                   || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end if;

  insert into public.organizations (name, slug, status)
  values (trim(_name), _final_slug, 'active')
  returning id into _org_id;

  return _org_id;
end;
$$;

create or replace function public.admin_update_tenant(
  _org uuid, _name text, _slug text, _status public.org_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;
  if coalesce(trim(_name), '') = '' then
    raise exception 'Tenant name is required';
  end if;
  if coalesce(trim(_slug), '') = '' then
    raise exception 'Tenant slug is required';
  end if;

  update public.organizations
  set name = trim(_name), slug = trim(_slug), status = _status
  where id = _org;

  if not found then
    raise exception 'Tenant not found';
  end if;
end;
$$;

create or replace function public.admin_set_tenant_status(_org uuid, _status public.org_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;

  update public.organizations set status = _status where id = _org;

  if not found then
    raise exception 'Tenant not found';
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- Stats RPCs (platform-admin gated)
-- ----------------------------------------------------------------------------
create or replace function public.get_platform_stats()
returns table (
  total_tenants     bigint,
  active_tenants    bigint,
  suspended_tenants bigint,
  archived_tenants  bigint,
  total_users       bigint,
  total_requests    bigint,
  pending_requests  bigint
)
language plpgsql
security definer
set search_path = ''
stable
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;

  return query
    select
      (select count(*) from public.organizations),
      (select count(*) from public.organizations where status = 'active'),
      (select count(*) from public.organizations where status = 'suspended'),
      (select count(*) from public.organizations where status = 'archived'),
      (select count(*) from public.profiles),
      (select count(*) from public.leave_requests),
      (select count(*) from public.leave_requests where status = 'pending');
end;
$$;

create or replace function public.get_tenant_stats()
returns table (
  org_id        uuid,
  name          text,
  slug          text,
  status        public.org_status,
  created_at    timestamptz,
  member_count  bigint,
  request_count bigint,
  pending_count bigint
)
language plpgsql
security definer
set search_path = ''
stable
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;

  return query
    select
      o.id, o.name, o.slug, o.status, o.created_at,
      (select count(*) from public.memberships m where m.org_id = o.id),
      (select count(*) from public.leave_requests lr where lr.org_id = o.id),
      (select count(*) from public.leave_requests lr
         where lr.org_id = o.id and lr.status = 'pending')
    from public.organizations o
    order by o.created_at desc;
end;
$$;

-- ----------------------------------------------------------------------------
-- Grants (in-function guards enforce platform-admin access)
-- ----------------------------------------------------------------------------
grant execute on function public.is_platform_admin()                                          to authenticated;
grant execute on function public.admin_create_tenant(text, text)                              to authenticated;
grant execute on function public.admin_update_tenant(uuid, text, text, public.org_status)     to authenticated;
grant execute on function public.admin_set_tenant_status(uuid, public.org_status)             to authenticated;
grant execute on function public.get_platform_stats()                                         to authenticated;
grant execute on function public.get_tenant_stats()                                           to authenticated;
