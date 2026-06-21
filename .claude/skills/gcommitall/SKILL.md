---
name: gcommitall
description: >-
  Stage and commit ALL uncommitted changes in the working tree — from every
  session AND the user/developer's own edits — with covering unit / integration
  / e2e tests. Same workflow as `gcommit` but without the current-session scope
  limit. Triggered when the user types `gcommitall`.
---

# gcommitall

When the user types `gcommitall`, run the workflow below. This is the **same as
the `gcommit` skill** with ONE difference: the scope is **every** uncommitted
change in the working tree, not just the current session's AI edits.

## 1. Scope: ALL changes in the working tree

- Include **everything** that is modified, added, or untracked: changes from the
  current session, previous/other sessions, AND the user/developer's own manual
  edits.
- First run `git status` and review what will be included so the scope is
  visible to the user.
- Staging all changes with `git add -A` is acceptable here (that is the point of
  this skill). Still review the list before committing.
- If there are clearly unrelated junk/throwaway files (logs, `.env`, secrets,
  build artifacts), call them out to the user before committing them.

## 2. Write tests covering the changed code

Before committing, ensure the changed code is covered by tests. Add or update
**all three layers** as applicable to what changed, following the testing rules
in `AGENTS.md`:

- **Unit tests** — in `__tests__/` beside each changed source file
  (`entity.tsx` → `__tests__/entity.tests.tsx`, `entity.utils.ts` →
  `__tests__/entity.utils.tests.ts`). Pure `*.types.ts` files need none.
- **Integration tests** — in `tests/integration/` when the change touches the
  DB layer, RLS policies, RPCs, server actions, or the leave lifecycle.
- **E2E tests** — in `tests/e2e/` when the change affects a user-facing flow in
  an app (auth, RBAC, a screen the user interacts with).

Cover **all scenarios**, not just the happy path: success, validation/empty
states, error paths, permission/RLS denials, and edge cases. Match the existing
test style and `@repo/vitest-config` setup.

Run the relevant suites and make sure they pass before committing
(`pnpm test`, and `pnpm test:integration` / `pnpm test:e2e` when those layers
changed). If tests fail, fix them — do not commit red tests.

## 3. Coverage gate — ≥ 90% on the changed code (MUST)

The code being committed must be **at least 90% covered**. This is *patch*
coverage: it applies to the files changed in the working tree, **not** the whole
repo.

- Run `pnpm test:coverage` (unified v8 coverage across the monorepo). It writes
  `coverage/coverage-summary.json` and `coverage/cobertura-coverage.xml`.
- For **every changed source file**, check its entry in
  `coverage/coverage-summary.json` and confirm **lines ≥ 90% and branches ≥
  90%**. Pure `*.types.ts` files are excluded and don't count.
- If any changed file is below 90%, **add more tests** (error paths, branches,
  edge cases) until it clears, then re-run. **Do not commit below 90%.**
- This is the same gate CI enforces on the PR: the `coverage` job runs
  `diff-cover` against the base branch and **fails the check under 90%**, posting
  a patch-coverage comment. Clearing it locally keeps the PR green.

## 4. Stage and commit

- Stage all changes (`git add -A`) plus the test files written in step 2.
- Show the user `git status` / `git diff --staged` summary of exactly what will
  be committed before finalizing.
- Write a clear, concise commit message describing the change set.
- If on the default branch (`main`) and the user has not said otherwise, follow
  the repo's git guidance (branch first if required by project workflow).
- **NEVER push.** Stop after committing. The user pushes themselves ~99% of the
  time and will explicitly tell you on the rare occasion they want you to push.
  Do not run `git push`, do not infer permission from context (a failing CI, an
  added remote, "publish", etc.), and do not offer to push as a default. Only
  push if, in the current turn, the user explicitly tells you to.

Do **not** add any AI/assistant attribution to the commit message — no
`Co-Authored-By` trailer, no "Generated with"/"Claude"/"Anthropic" lines, no
emoji credit. The commit message is the change description only.

## Difference from `gcommit`

- `gcommit` → commits **only** the files the AI changed in the **current
  session**; never touches the user's or other sessions' changes.
- `gcommitall` → commits **everything** uncommitted in the working tree,
  regardless of who or which session produced it.

## Guardrails

- Never commit without the covering tests, and never commit failing tests.
- Never commit when a changed file is below 90% coverage — add tests first.
- Flag secrets / `.env` / build artifacts before committing them.
- **Never push** without an explicit instruction to push in the current turn.
