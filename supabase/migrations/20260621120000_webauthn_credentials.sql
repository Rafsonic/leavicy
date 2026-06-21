-- ============================================================================
-- WebAuthn / passkey credentials — "App Unlock" with Face ID / Touch ID.
--
-- These credentials gate access to the installed Portal PWA: after a normal
-- Supabase password login, a user may enrol a platform authenticator (Face ID /
-- Touch ID). On subsequent app opens the UI is locked until a WebAuthn assertion
-- is verified. The Supabase session itself is unchanged — this is a convenience
-- lock layered on top, enforced server-side via the proxy.
--
-- Owner-only: every operation runs as the authenticated user (a valid Supabase
-- session already exists during unlock), so RLS is `user_id = auth.uid()` and we
-- never need the service role. GDPR: the user fully controls (lists/deletes)
-- their own credentials.
-- ============================================================================

create table public.webauthn_credentials (
  id            text primary key,                       -- credential ID (base64url)
  user_id       uuid not null references auth.users (id) on delete cascade,
  public_key    text not null,                          -- base64url-encoded COSE public key
  counter       bigint not null default 0 check (counter >= 0),
  transports    text[] not null default '{}',
  device_type   text,                                   -- 'singleDevice' | 'multiDevice'
  backed_up     boolean not null default false,         -- synced via iCloud Keychain etc.
  nickname      text,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz
);

-- FK + the only filter we ever run (credentials for the current user)
create index webauthn_credentials_user_idx on public.webauthn_credentials (user_id);

-- ----------------------------------------------------------------------------
-- Row Level Security — strictly owner-only
-- ----------------------------------------------------------------------------
alter table public.webauthn_credentials enable row level security;

create policy "webauthn: read own"
  on public.webauthn_credentials for select to authenticated
  using (user_id = (select auth.uid()));

create policy "webauthn: insert own"
  on public.webauthn_credentials for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "webauthn: update own"
  on public.webauthn_credentials for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "webauthn: delete own"
  on public.webauthn_credentials for delete to authenticated
  using (user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- Grants (RLS still applies)
-- ----------------------------------------------------------------------------
grant select, insert, update, delete on public.webauthn_credentials to authenticated;
