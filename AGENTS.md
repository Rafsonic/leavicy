<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Leavicy monorepo — agent guide

Turborepo + pnpm workspaces. Three Next.js apps share a single Supabase backend
and a set of shared packages.

> **Project rules (MUST follow)** live in [`dev-rules.md`](./dev-rules.md),
> imported alongside this guide from `CLAUDE.md`.

## Structure

```
apps/
  portal/    Employee/company self-service  (port 3100, "Leavicy Portal")
  crm/       HR / company management        (port 3200, "Leavicy CRM")
  central/   Super-admin back-office        (port 3300, "Leavicy Central")
packages/
  ui/                Design system (shadcn/Base UI) + our feature components (@repo/ui)
  database/          Supabase clients, DAL, types, server actions (@repo/database)
  email/             Resend client + invitation email template (@repo/email)
  sick-leave/        Shared route views + layouts (@repo/sick-leave)
  typescript-config/ Shared tsconfig presets (@repo/typescript-config)
  eslint-config/     Shared ESLint flat config (@repo/eslint-config)
  vitest-config/     Shared Vitest config: /base (node), /react (jsdom) (@repo/vitest-config)
supabase/            Single shared backend: migrations, seed, config (custom ports 55321+)
tests/integration/   Live-Supabase integration tests (RLS, RPCs, leave lifecycle)
tests/e2e/           Playwright e2e (auth/RBAC against the running portal)
```

Apps consume the shared feature by re-exporting from `@repo/sick-leave/*`. Each
app's route files are thin re-exports; the real views live in `packages/sick-leave`.

## Notes specific to Next.js 16 here

- Middleware is **`src/proxy.ts`** (re-exports `updateSession` from `@repo/database/middleware`).
- `params`/`searchParams`/`cookies()`/`headers()` are async — always `await`.
- shadcn primitives use Base UI: use the `render` prop, not `asChild`.
- Each app sets `transpilePackages` for the workspace packages and `NEXT_PUBLIC_APP_NAME`.
- **Error boundaries**: prefer `unstable_retry()` over `reset()` in `error.tsx`; for
  component-level boundaries use `unstable_catchError()` (client only).
- **PPR/static shell** (when Cache Components is enabled): push per-request fetches
  into their own `<Suspense>` leaf so the static shell stays large.
- **Turbopack** is the default (dev + build); FS cache is on. For CSP prefer
  `experimental.sri` over nonces (no forced dynamic rendering).
- Browser errors are forwarded to the terminal by default (`logging.browserToTerminal`).
- **One dev server per dir**: `next dev` writes `.next/dev/lock`; don't start a second —
  kill the PID or reuse the URL.
- **Deployment**: stable Adapter API — host in the EU (Vercel EU / OpenNext) per the
  region rule.

## Common commands

- `pnpm dev` — run all apps (turbo) · `pnpm --filter portal dev` — one app
- `pnpm build` / `pnpm typecheck` / `pnpm lint` / `pnpm test`
- `pnpm test:integration` — live-Supabase integration tests (needs `pnpm supabase:start`)
- `pnpm test:e2e` — Playwright e2e (needs Supabase + a built portal; Playwright serves it on :3100)
- `pnpm db:reset` — recreate DB from migrations + seed
- `pnpm verify:rls` / `pnpm verify:auth` — security & smoke tests

## Agent commands

- `gcommit` — stage & commit **only** the files the agent changed in the current
  session, with covering unit/integration/e2e tests. See the `gcommit` skill
  (`.claude/skills/gcommit/SKILL.md`) for the full workflow.
- `gcommitall` — same as `gcommit` but commits **all** uncommitted changes in the
  working tree (every session + the user/developer's own edits). See the
  `gcommitall` skill (`.claude/skills/gcommitall/SKILL.md`).
