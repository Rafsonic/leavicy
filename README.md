# Leavicy — Multi-tenant Sick Leave Platform (Turborepo)

A pnpm + Turborepo monorepo. Two Next.js 16 apps share a single Supabase
backend and a set of shared packages.

## Apps

| App           | Purpose                          | Port | `NEXT_PUBLIC_APP_NAME` |
| ------------- | -------------------------------- | ---- | ---------------------- |
| `apps/portal` | Employee / company self-service  | 3560 | Leavicy Portal        |
| `apps/central`| Super-admin back-office          | 3550 | Leavicy Central       |

Both consume the shared sick-leave feature; visibility is role-driven
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

pnpm dev                    # run both apps (turbo)
# or a single app:
pnpm --filter portal dev    # http://localhost:3560
pnpm --filter central dev   # http://localhost:3550
```

Env per app lives in `apps/<app>/.env.local` (already populated for local dev).
See [`.env.example`](./.env.example) for the variables (app + MCP server secrets).

### Prod-like local hostnames (optional)

Run the apps behind prod-like hostnames with HTTPS and no ports:

| App     | Local URL                          | Dev server               | Prod                          |
| ------- | ---------------------------------- | ------------------------ | ----------------------------- |
| Portal  | `https://dev.portal.leavicy.com`   | `http://localhost:3560`  | `https://portal.leavicy.com`  |
| Central | `https://dev.central.leavicy.com`  | `http://localhost:3550`  | `https://central.leavicy.com` |

First, point both hostnames at localhost (needed for either option below):

```bash
sudo sh -c 'printf "\n127.0.0.1 dev.portal.leavicy.com dev.central.leavicy.com\n" >> /etc/hosts'
```

#### Option A — Laravel Herd (if Herd is installed)

Herd's bundled nginx owns ports **80/443**, so Caddy can't bind them — use Herd as
the reverse proxy instead. The proxy server-blocks + TLS certs (signed by Herd's
already-trusted CA) live alongside Herd's other sites under
`~/Library/Application Support/Herd/config/valet/`, so they survive Herd restarts.
With the apps running (`pnpm dev`) the hostnames just work — no extra process to run.

> Note: these are added manually (Herd's `herd proxy` forces its own `.test` TLD),
> so they won't appear in `herd proxies` — but they route normally.

#### Option B — Caddy (no Herd)

Run the apps behind the [`Caddyfile`](./Caddyfile) reverse proxy:

```bash
brew install caddy
# trust Caddy's local CA so HTTPS is valid (no browser warning)
sudo caddy trust
```

Then, alongside `pnpm dev`:

```bash
pnpm dev:proxy              # sudo caddy run --config Caddyfile
```

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
| `pnpm test:e2e`             | Playwright e2e (builds/serves portal:3560)  |
| `pnpm verify:rls`           | Multi-tenant RLS isolation tests            |
| `pnpm verify:auth`          | Authenticated page smoke test (portal:3560) |
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

The product targets Cyprus (EU) and processes employees' personal data, so GDPR
is built in:

- **Docs** in [`docs/gdpr/`](./docs/gdpr/) — ROPA, retention policy, sub-processors,
  breach register, data-subject-request register.
- **Retention/auto-delete** — `purge_expired_data()` (migration) + `pnpm gdpr:purge`
  (schedulable): deletes old cancelled/rejected requests and scrubs old reasons.
- **Data-subject rights** — self-service **export** (`export_my_data` RPC) and
  **account deletion** on the `/account` (Privacy & data) page.
- **Transparency & consent** — public `/privacy` and `/cookies` pages and a
  required consent checkbox on signup (`consented_at` recorded).
- **EU data residency** — host Supabase, Resend and the app in the EU.

## Notes (Next.js 16)

- Middleware is `src/proxy.ts` (re-exports `updateSession` from `@repo/database/middleware`).
- `params`/`searchParams`/`cookies()` are async.
- shadcn primitives use Base UI: use the `render` prop, not `asChild`.
