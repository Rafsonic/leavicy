# Leavicy — Business Analysis

> Leave-management platform for the Cyprus (EU) market, delivered as a multi-tenant
> SaaS. The product is built as a Turborepo monorepo composed of **two Next.js
> applications** that share a single Supabase backend and a set of common packages.

## 1. Overview

Leavicy lets organizations (tenants) manage employee leave end to end: requesting
time off, approving it, and configuring how leave works for each company. The
system is split into two applications, each serving a distinct audience and
permission scope.

| App | Audience | Primary purpose | Port |
| --- | --- | --- | --- |
| **Central** | Leavicy super-admins | Onboard and manage tenants | 3550 |
| **Portal** | Employees, managers & tenant admins | Request leave, approve it, and administer the organization (users, teams, leave configuration) | 3560 |

Both apps share one Supabase database. Tenant isolation and role enforcement
are handled at the data layer through Row Level Security (RLS). Within the Portal,
what each user sees is driven by their **role** (`admin` / `manager` / `employee`):
employees get self-service, managers also approve, and admins additionally get the
organization-administration surface.

## 2. The two applications

### 2.1 Central App — Super-admin back-office

The Central app is the platform-level control plane operated by Leavicy itself. It
is **not** exposed to customers — **only super-admin users** (today, the platform
owner) can sign in. A tenant admin, manager, or employee never reaches Central; the
only thing customers touch is the Portal.

**Goals**
- **Add new customers / tenants** (companies) onto the platform.
- Manage the lifecycle of existing tenants (view, update, suspend, offboard).
- Oversee platform-wide configuration and health.

**Primary users:** Leavicy super-admins **only**.

### 2.2 Portal App — Employee, manager & tenant-admin surface

The Portal is the single customer-facing application. It is the day-to-day
self-service app for employees and managers, **and** the per-tenant administration
surface for tenant admins. Which capabilities a user sees is decided by their
**role** in the tenant (RLS + role checks); each tenant is fully isolated from
every other tenant.

**Goals — self-service (employees)**
- **Request leave** — submit a time-off request choosing a leave type and dates.
- **See own availability** — remaining allowance per leave type, plus history and
  the status of each request.

**Goals — approvals (managers)**
- **Review and approve/reject** leave requests from their team members.
- See the **team calendar** to spot overlaps before approving.

**Goals — organization administration (tenant admins, e.g. HR)**
- **Invite employees** to the company and manage them (roles, status).
- **Manage teams** and organizational structure (who reports to / is approved by whom).
- **Configure leave allowances** — the available number of days per leave type
  (e.g. annual entitlement) for the organization / per member.
- **Manage leave types** — the catalogue of leave the company offers (e.g. normal /
  annual, sick, army, etc.).
- **Configure company closed days** — public holidays and company-shutdown dates on
  which employees **cannot** request leave (those days are blocked/disabled in the
  request flow and excluded from working-day counts).
- General tenant configuration.

**Primary users:** employees; managers (approval rights over a team); tenant admins
(organization administration). One account, one app — the surface adapts to the role.

## 3. Roles & responsibilities

| Role | Lives in | Can do |
| --- | --- | --- |
| Super-admin | Central | Create and manage tenants; platform configuration |
| Tenant admin | Portal | Invite/manage employees, create/manage teams, manage leave types, set leave allowances, configure company closed days, tenant settings — plus everything a manager/employee can do |
| Manager | Portal | Request own leave **and** approve/reject team members' requests |
| Employee | Portal | Request leave; view balances, history, and status |

## 4. Core workflows

1. **Tenant onboarding** — A super-admin creates a tenant in **Central**. The tenant
   admin gains access to the **Portal** with the `admin` role.
2. **Organization setup** — In the **Portal** (admin surface), the tenant admin
   invites employees, builds teams, defines the **leave types** the company offers,
   sets the **allowances** (available days per type), and marks the **company closed
   days** (holidays / shutdowns) on which leave can't be taken.
3. **Leave request** — In the **Portal**, an employee submits a leave request,
   picking a type and dates; company closed days are blocked and don't count as
   working days, and the employee sees their remaining availability.
4. **Approval** — In the **Portal**, the relevant manager reviews the request (using
   the **team calendar** to check overlaps) and approves or rejects it; the employee
   is notified and balances are updated.

## 5. Authentication & session (single sign-on across apps)

The two apps are **separate Next.js applications** but they share **one Supabase
project**, so a user authenticates once and is recognized everywhere they have
access.

**Each app has its own AUTH layout for login.** Central and Portal each ship
a dedicated authentication layout/route used to sign in. The login UI is owned by
the app — the session is owned by Supabase.

**Shared login cookie / auto-login.** Authentication is carried in a cookie:
- `sb-{project}-auth-token` — the Supabase SSR session (issued/refreshed by
  `@supabase/ssr`).
- `active_org` — a custom cookie remembering the currently selected organization
  (`sameSite: lax`, 1-year max-age; see `packages/database/src/dal.ts`).

Because the cookie is shared across the apps, sign-on is single:

> If a user (identified by `user-email`) is **already signed in to the Portal** and
> that same account **also has access to Central**, then when they navigate to
> Central they must **not** be asked to log in again — the app must **auto-login**
> from the existing session. The dedicated AUTH layout is only shown when there is
> **no** valid session.

**How it works**
- The session cookie is scoped to the shared **parent domain** (e.g.
  `.leavicy.com`) so `portal.leavicy.com` and `central.leavicy.com` both read the
  same auth token.
- Every request runs through shared middleware (`updateSession` from
  `@repo/database/middleware`, wired via each app's `src/proxy.ts`), which refreshes
  the session and makes the authenticated user available server-side.
- **Access is still gated per app.** A valid session means "who you are"; whether
  you may use a given app is decided by your membership/role in that tenant (RLS +
  role checks). A user with no Central access who is signed in via the Portal reaches
  Central authenticated but is denied/redirected by authorization, not asked to
  re-authenticate.

> Note: in local development the apps run on different **ports** (3550/3560),
> which are separate cookie origins, so cross-app auto-login is a **production**
> behavior (shared parent domain across subdomains).

## 6. Leave types, allowances & statuses

**Leave types.** Today the catalogue is a fixed database enum (`leave_type`). The
product target is for each tenant admin to **manage their own leave types** in the
Portal — e.g. *normal/annual*, *sick*, *army*, etc. — so the list below is the
current built-in set, expected to become tenant-configurable (see §8, planned).

| Value (current enum) | Meaning |
| --- | --- |
| `sick` | General sick leave |
| `injury` | Injury-related leave |
| `family_care` | Caring for a family member |
| `medical_appointment` | Time off for a medical appointment |
| `other` | Any other leave reason |

**Allowances.** Each leave type has an **available number of days** the employee may
take in a period (e.g. annual entitlement). Today only an annual sick-day allowance
is modelled (`memberships.annual_sick_days`); the target is a configurable allowance
**per leave type**, set by the tenant admin (see §8, planned).

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

### 6.1 Company closed days

Tenant admins maintain a list of **company closed days** — public holidays and
company shutdown dates. On these dates:

- Employees **cannot** request leave (the dates are disabled/blocked in the request
  flow — you can't "spend" leave on a day the company is already closed).
- They are **excluded from the working-day count** of any request that spans them,
  so allowances aren't consumed for closed days.

This is a planned tenant-scoped entity (see §8).

### 6.2 Availability & balances

Every employee can see their **availability** — for each leave type, the allowance
minus what's already approved/pending, i.e. how many days remain. Managers and admins
see the same figures for the people they oversee, to inform approval decisions.

### 6.3 Team calendar

The Portal surfaces a **calendar of employees' leave** so managers and admins can see
who is off and when, and catch overlaps before approving. This is backed by the
existing `get_team_calendar` RPC, which returns each team member's leave entries
(type, dates, status) for a date range, gated by tenant + role via RLS.

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
- The **team calendar** is served by the `get_team_calendar` RPC over `leave_requests`.

**Planned entities (not yet in the schema).** The admin features in §2.2 / §6 imply
tenant-scoped tables that don't exist yet and will be added by migration (each with
`org_id` + RLS, FKs indexed):

| Planned entity | Purpose | Notes |
| --- | --- | --- |
| `teams` (+ membership link) | Organizational structure & who approves whom | Referenced in the narrative; no table today |
| `leave_types` | Tenant-managed catalogue of leave (normal, sick, army, …) | Replaces / augments the fixed `leave_type` enum so admins define their own |
| `leave_allowances` | Available days per leave type (per member/period) | Generalizes today's `memberships.annual_sick_days` |
| `company_closed_days` | Public holidays / shutdown dates | Blocks requests and is excluded from working-day counts (§6.1) |

## 9. Architecture at a glance

- **Monorepo:** Turborepo + pnpm workspaces.
- **Apps:** `central`, `portal` (both Next.js).
- **Shared backend:** a single Supabase project (Postgres) with RLS enforcing
  tenant and role boundaries.
- **Shared packages:** design system (`@repo/ui`), data access (`@repo/database`),
  email (`@repo/email`), shared leave views (`@repo/leavicy`), utilities
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
