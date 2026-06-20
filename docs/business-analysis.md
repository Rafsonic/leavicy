# Leavicy — Business Analysis

> Leave-management platform for the Cyprus (EU) market, delivered as a multi-tenant
> SaaS. The product is built as a Turborepo monorepo composed of **three Next.js
> applications** that share a single Supabase backend and a set of common packages.

## 1. Overview

Leavicy lets organizations (tenants) manage employee leave end to end: requesting
time off, approving it, and configuring how leave works for each company. The
system is split into three applications, each serving a distinct audience and
permission scope.

| App | Audience | Primary purpose | Port |
| --- | --- | --- | --- |
| **Central** | Leavicy super-admins | Onboard and manage tenants | 3550 |
| **CRM** | Tenant admins & tenant users | Manage their organization (users, teams, leave configuration) | 3555 |
| **Portal** | Employees & managers | Request leave; managers also approve it | 3560 |

All three apps share one Supabase database. Tenant isolation and role enforcement
are handled at the data layer through Row Level Security (RLS).

## 2. The three applications

### 2.1 Central App — Super-admin back-office

The Central app is the platform-level control plane operated by Leavicy itself. It
is **not** exposed to customers.

**Goals**
- Provision new tenants (companies) onto the platform.
- Manage the lifecycle of existing tenants (view, update, suspend, offboard).
- Oversee platform-wide configuration and health.

**Primary users:** Leavicy super-admins.

### 2.2 CRM App — Tenant management

The CRM app is the per-tenant administration surface. Each tenant administers its
own organization here, fully isolated from every other tenant.

**Goals**
- Invite users and manage them (roles, status, teams).
- Configure leave policy: the **types of leave** offered, allowances, rules, and
  related settings.
- Create and manage **teams** and organizational structure.
- General tenant configuration.

**Primary users:** tenant admins and tenant users (with appropriate permissions).

### 2.3 Portal App — Employee & manager self-service

The Portal app is the day-to-day, employee-facing application.

**Goals**
- Allow an employee to **request leave**.
- Allow a manager to **review and approve/reject** leave requests from their team.
- Give users visibility into their balances, history, and request status.

**Primary users:** employees; managers (an employee with approval rights over a team).

## 3. Roles & responsibilities

| Role | Lives in | Can do |
| --- | --- | --- |
| Super-admin | Central | Create and manage tenants; platform configuration |
| Tenant admin | CRM | Invite/manage users, configure leave types, create teams, tenant settings |
| Tenant user | CRM | Manage assigned areas of the organization (scoped permissions) |
| Manager | Portal | Request own leave **and** approve/reject team members' requests |
| Employee | Portal | Request leave; view balances, history, and status |

## 4. Core workflows

1. **Tenant onboarding** — A super-admin creates a tenant in **Central**. The tenant
   admin gains access to the **CRM**.
2. **Organization setup** — In the **CRM**, the tenant admin invites users, builds
   teams, and configures the leave types and rules for the company.
3. **Leave request** — In the **Portal**, an employee submits a leave request.
4. **Approval** — In the **Portal**, the relevant manager reviews and approves or
   rejects the request; the employee is notified and balances are updated.

## 5. Authentication & session (single sign-on across apps)

The three apps are **separate Next.js applications** but they share **one Supabase
project**, so a user authenticates once and is recognized everywhere they have
access.

**Each app has its own AUTH layout for login.** Central, CRM, and Portal each ship
a dedicated authentication layout/route used to sign in. The login UI is owned by
the app — the session is owned by Supabase.

**Shared login cookie / auto-login.** Authentication is carried in a cookie:
- `sb-{project}-auth-token` — the Supabase SSR session (issued/refreshed by
  `@supabase/ssr`).
- `active_org` — a custom cookie remembering the currently selected organization
  (`sameSite: lax`, 1-year max-age; see `packages/database/src/dal.ts`).

Because the cookie is shared across the apps, sign-on is single:

> If a user (identified by `user-email`) is **already signed in to the Portal** and
> that same account **also has access to the CRM**, then when they navigate to the
> CRM they must **not** be asked to log in again — the app must **auto-login** from
> the existing session. The dedicated AUTH layout is only shown when there is **no**
> valid session.

**How it works**
- The session cookie is scoped to the shared **parent domain** (e.g.
  `.leavicy.com`) so `portal.leavicy.com`, `crm.leavicy.com`, and
  `central.leavicy.com` all read the same auth token.
- Every request runs through shared middleware (`updateSession` from
  `@repo/database/middleware`, wired via each app's `src/proxy.ts`), which refreshes
  the session and makes the authenticated user available server-side.
- **Access is still gated per app.** A valid session means "who you are"; whether
  you may use a given app is decided by your membership/role in that tenant (RLS +
  role checks). A user with no CRM access who is signed in via the Portal reaches
  the CRM authenticated but is denied/redirected by authorization, not asked to
  re-authenticate.

> Note: in local development the apps run on different **ports** (3550/3555/3560),
> which are separate cookie origins, so cross-app auto-login is a **production**
> behavior (shared parent domain across subdomains).

## 6. Leave types & statuses

**Leave types** (`leave_type` enum):

| Value | Meaning |
| --- | --- |
| `sick` | General sick leave |
| `injury` | Injury-related leave |
| `family_care` | Caring for a family member |
| `medical_appointment` | Time off for a medical appointment |
| `other` | Any other leave reason |

**Request statuses** (`leave_status` enum):

| Value | Meaning |
| --- | --- |
| `pending` | Submitted, awaiting manager review |
| `approved` | Approved by a manager |
| `rejected` | Declined by a manager |
| `cancelled` | Withdrawn by the requester |

**Status lifecycle**

```
            submit                approve
  (none) ───────────▶ pending ───────────▶ approved
                         │
                         ├──── reject ────▶ rejected
                         │
                         └──── cancel ────▶ cancelled
```

> The platform does **not** collect health data or medical documents (no doctor's
> notes) — see the Compliance section.

## 7. Notifications

- **Channel:** transactional **email** via **Resend** (`@repo/email`).
- **Current scope:** **invitation emails** — sent when a tenant admin invites a
  user to an organization. The email carries the org name, the assigned role, and
  an accept link.
- **Configuration:** `RESEND_API_KEY` (optional — email is skipped gracefully if
  unset) and `RESEND_FROM_EMAIL`. In production Resend runs in the **EU region**
  under a signed DPA (the email carries PII).
- There is currently **no in-app notification center** and no push notifications —
  a likely future addition (e.g. notifying a requester when their leave is
  approved/rejected).

## 8. Data model (entity overview)

Core tables (PostgreSQL / Supabase). Every tenant-scoped table carries `org_id` and
is protected by Row Level Security.

| Entity | Purpose | Key fields |
| --- | --- | --- |
| `profiles` | Global user profile, 1:1 with `auth.users` | `id` (PK → auth.users), `email`, `full_name`, `avatar_url` |
| `organizations` | Tenant / company | `id` (PK), `name`, `slug` (unique) |
| `memberships` | Links a user to an org with a role | `id` (PK), `org_id` →, `user_id` →, `role` (`app_role`), `annual_sick_days` |
| `leave_requests` | A leave request and its review | `id` (PK), `org_id` →, `user_id` →, `leave_type`, `start_date`, `end_date`, `working_days`, `reason`, `status`, `reviewed_by` →, `reviewed_at`, `review_note` |
| `invitations` | Pending invite to join an org | `id` (PK), `org_id` →, `email`, `role`, `token`, `invited_by` →, `accepted_at` |

**Roles** (`app_role` enum): `admin`, `manager`, `employee`.

**Relationships**

```
auth.users ─1:1─ profiles
                    │
                    │ user_id
                    ▼
organizations ─1:N─ memberships ─N:1─ (role: admin | manager | employee)
      │
      ├─1:N─ leave_requests ──(user_id)──▶ profiles
      │            └──(reviewed_by)──────▶ profiles (manager/admin)
      │
      └─1:N─ invitations
```

- A **user** can belong to **multiple organizations** (one `membership` per org),
  each with its own role — this is what enables a single account to access more
  than one app/tenant.
- A **leave request** belongs to one org and one requester; once reviewed it
  records the reviewer (`reviewed_by`) and outcome.
- **RLS helpers** (`is_org_member`, `has_org_role`, `shares_org`) are
  `SECURITY DEFINER` functions used by policies to enforce tenant + role boundaries
  without recursion.

## 9. Architecture at a glance

- **Monorepo:** Turborepo + pnpm workspaces.
- **Apps:** `central`, `crm`, `portal` (all Next.js).
- **Shared backend:** a single Supabase project (Postgres) with RLS enforcing
  tenant and role boundaries.
- **Shared packages:** design system (`@repo/ui`), data access (`@repo/database`),
  email (`@repo/email`), shared leave views (`@repo/sick-leave`), utilities
  (`@repo/utils`), and shared tooling configs.

## 10. Compliance & data residency

The product targets **Cyprus (EU)**. Leave records are personal data under GDPR, so:

- Hosting and the database run in an **EU region** (closest to Cyprus, e.g.
  Frankfurt `eu-central-1`).
- Data collection is minimized; access is restricted via RLS.
- No health data or medical documents are collected (no doctor's notes).
- Sub-processors (e.g. email delivery) are also EU-region, under signed DPAs.

Defaults: timezone `Europe/Nicosia`, currency EUR (€), week starts Monday, dates
`dd/mm/yyyy`, language English (with Greek `el-CY` a likely future addition).
