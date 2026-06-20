-- ============================================================================
-- Demo seed data
-- Two tenants (Acme Health, Globex) to demonstrate RLS isolation.
-- All demo users share the password:  Password123!
-- ============================================================================

-- Create demo auth users (+ email identities so password login works locally).
-- The on_auth_user_created trigger creates the matching public.profiles rows.
do $$
declare
  u record;
begin
  for u in
    select * from (values
      ('a0000000-0000-0000-0000-000000000001'::uuid, 'admin@acme.test',   'Alice Admin'),
      ('a0000000-0000-0000-0000-000000000002'::uuid, 'manager@acme.test', 'Mona Manager'),
      ('a0000000-0000-0000-0000-000000000003'::uuid, 'nurse@acme.test',   'Nina Nurse'),
      ('a0000000-0000-0000-0000-000000000004'::uuid, 'tech@acme.test',    'Tom Tech'),
      ('b0000000-0000-0000-0000-000000000001'::uuid, 'admin@globex.test', 'Greg Globex'),
      ('c0000000-0000-0000-0000-000000000001'::uuid, 'super@leavicy.test', 'Sam Super')
    ) as t(id, email, full_name)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
      u.email, crypt('Password123!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', u.full_name),
      '', '', '', ''
    );

    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), u.id::text, u.id,
      jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
      'email', now(), now(), now()
    );
  end loop;
end $$;

-- Tenants
insert into public.organizations (id, name, slug) values
  ('11111111-1111-1111-1111-111111111111', 'Acme Health', 'acme-health-demo01'),
  ('22222222-2222-2222-2222-222222222222', 'Globex',      'globex-demo000002');

-- Memberships (Acme Health)
insert into public.memberships (org_id, user_id, role, annual_sick_days) values
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'admin',    12),
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002', 'manager',  12),
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000003', 'employee', 10),
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000004', 'employee', 12);

-- Membership (Globex) — separate tenant, must never see Acme data
insert into public.memberships (org_id, user_id, role, annual_sick_days) values
  ('22222222-2222-2222-2222-222222222222', 'b0000000-0000-0000-0000-000000000001', 'admin',    12);

-- Platform super-admin (Leavicy staff) — manages tenants in Central.
-- Deliberately has NO membership row: super-admin is independent of any tenant.
insert into public.platform_admins (user_id) values
  ('c0000000-0000-0000-0000-000000000001');

-- Sample leave requests for Acme Health
insert into public.leave_requests
  (org_id, user_id, leave_type, start_date, end_date, working_days, reason, status, reviewed_by, reviewed_at, review_note)
values
  -- Nina Nurse: approved flu leave last month
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000003',
   'sick', current_date - 30, current_date - 28, 3, 'Flu with high fever', 'approved',
   'a0000000-0000-0000-0000-000000000002', now() - interval '29 days', 'Get well soon.'),

  -- Nina Nurse: pending medical appointment next week
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000003',
   'medical_appointment', current_date + 5, current_date + 5, 1, 'Specialist follow-up', 'pending',
   null, null, null),

  -- Tom Tech: approved injury leave, ongoing
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000004',
   'injury', current_date - 2, current_date + 2, 5, 'Sprained ankle', 'approved',
   'a0000000-0000-0000-0000-000000000002', now() - interval '3 days', 'Rest and recover.'),

  -- Tom Tech: rejected request
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000004',
   'other', current_date - 10, current_date - 10, 1, 'Personal', 'rejected',
   'a0000000-0000-0000-0000-000000000001', now() - interval '11 days', 'Please use annual leave for this.'),

  -- Mona Manager: pending family care
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002',
   'family_care', current_date + 1, current_date + 2, 2, 'Caring for sick child', 'pending',
   null, null, null);

-- Company closed days for Acme Health (public holidays — Globex has none,
-- so tenant isolation is observable). Fixed dates keep tests deterministic.
insert into public.company_closed_days (org_id, closed_date, name) values
  ('11111111-1111-1111-1111-111111111111', '2026-12-25', 'Christmas Day'),
  ('11111111-1111-1111-1111-111111111111', '2026-12-28', 'Company shutdown');
