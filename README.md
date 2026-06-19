# SickDesk — Multi-tenant Sick Leave Platform (Turborepo)

A pnpm + Turborepo monorepo. Three Next.js 16 apps share a single Supabase
backend and a set of shared packages.

## Apps

| App           | Purpose                          | Port | `NEXT_PUBLIC_APP_NAME` |
| ------------- | -------------------------------- | ---- | ---------------------- |
| `apps/portal` | Employee / company self-service  | 3100 | SickDesk Portal        |
| `apps/crm`    | HR / company management          | 3200 | SickDesk CRM           |
| `apps/central`| Super-admin back-office          | 3300 | SickDesk Central       |

All three consume the shared sick-leave feature; visibility is role-driven
(employee / manager / admin) via Postgres RLS.

## Packages

| Package                     | What it contains                                              |
| --------------------------- | ------------------------------------------------------------ |
| `@repo/ui`                  | shadcn/ui (Base UI) primitives + our feature components, theme |
| `@repo/database`            | Supabase clients, DAL, types, `format`, server actions       |
| `@repo/email`               | Resend client + invitation email template                    |
| `@repo/sick-leave`          | Shared route views (`pages/*`) and layouts (`layouts/*`)     |
| `@repo/typescript-config`   | Shared `tsconfig` presets                                     |
| `@repo/eslint-config`       | Shared ESLint flat config                                     |
| `@repo/vitest-config`       | Shared Vitest config (`/base` node, `/react` jsdom)          |

Each app's route files are thin re-exports of `@repo/sick-leave/*`; the real
logic lives in the packages.

## Conventions (enforced — see `AGENTS.md`)

- **pnpm only** — never npm/yarn.
- **Latest stable** versions only — never canary/beta/RC.
- **Component structure** (our components, not vendored primitives): split into
  `name.tsx` (component, single export), `name.types.ts` (types/props),
  `name.utils.ts` (helpers). One exported component per `.tsx`.

## Prerequisites

- Node 20+, **pnpm**, **Docker** running, Supabase CLI.

## Getting started

```bash
pnpm install
pnpm supabase:start         # local Supabase on custom ports 55321–55327
pnpm db:reset               # migrations + demo seed

pnpm dev                    # run all three apps (turbo)
# or a single app:
pnpm --filter portal dev    # http://localhost:3100
pnpm --filter crm dev       # http://localhost:3200
pnpm --filter central dev   # http://localhost:3300
```

Env per app lives in `apps/<app>/.env.local` (already populated for local dev).
See [`.env.example`](./.env.example) for the variables (app + MCP server secrets).

## Demo accounts

Password for all: **`Password123!`**

| Email               | Company     | Role     |
| ------------------- | ----------- | -------- |
| `admin@acme.test`   | Acme Health | Admin    |
| `manager@acme.test` | Acme Health | Manager  |
| `nurse@acme.test`   | Acme Health | Employee |
| `tech@acme.test`    | Acme Health | Employee |
| `admin@globex.test` | Globex      | Admin    |

## Scripts

| Command                     | What it does                                |
| --------------------------- | ------------------------------------------- |
| `pnpm dev` / `build` / `lint` / `typecheck` | Turbo across the workspace   |
| `pnpm --filter <app> <cmd>` | Run a task for one app                      |
| `pnpm db:reset`             | Recreate DB from migrations + seed          |
| `pnpm db:types`             | Regenerate `@repo/database` types           |
| `pnpm test`                 | Unit tests (Vitest) across packages         |
| `pnpm test:integration`     | Live-Supabase integration tests (RLS/RPCs)  |
| `pnpm test:e2e`             | Playwright e2e (builds/serves portal:3100)  |
| `pnpm verify:rls`           | Multi-tenant RLS isolation tests            |
| `pnpm verify:auth`          | Authenticated page smoke test (portal:3100) |
| `pnpm gdpr:purge`           | Run the retention/auto-delete job           |

## Tooling versions

Latest stable within ecosystem compatibility: Next 16.2.9, React 19.2, Turbo
2.9.18, Tailwind v4, TypeScript 5.9 (pinned <6 by typescript-eslint), ESLint 9
(pinned by eslint-config-next).

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on push to `main` and on PRs:

- **quality** — `pnpm lint`, `typecheck`, `test` (unit) and `build`.
- **integration** — boots local Supabase via the CLI (applies migrations + seed),
  then runs `pnpm test:integration` against it (keys read from `supabase status`).
- **e2e** — boots Supabase, builds the portal, and runs Playwright (`pnpm test:e2e`)
  against the running app.

## GDPR

The product targets Cyprus (EU) and handles health data, so GDPR is built in:

- **Docs** in [`docs/gdpr/`](./docs/gdpr/) — ROPA, retention policy, sub-processors,
  breach register, data-subject-request register.
- **Retention/auto-delete** — `purge_expired_data()` (migration) + `pnpm gdpr:purge`
  (schedulable): expires doctor's notes, deletes old cancelled/rejected requests,
  scrubs old reasons.
- **Data-subject rights** — self-service **export** (`export_my_data` RPC) and
  **account deletion** on the `/account` (Privacy & data) page.
- **Transparency & consent** — public `/privacy` and `/cookies` pages and a
  required consent checkbox on signup (`consented_at` recorded).
- **EU data residency** — host Supabase, Resend and the app in the EU.

## Notes (Next.js 16)

- Middleware is `src/proxy.ts` (re-exports `updateSession` from `@repo/database/middleware`).
- `params`/`searchParams`/`cookies()` are async.
- shadcn primitives use Base UI: use the `render` prop, not `asChild`.
- Doctor's notes live in a **private** `doctor-notes` Storage bucket (signed URLs).
