---
name: gcommit
description: >-
  Stage and commit ONLY the files the AI created or modified in the current
  session — plus the unit / integration / e2e tests covering that code —
  never the user's or other sessions' changes. Triggered when the user types
  `gcommit`.
---

# gcommit

When the user types `gcommit`, run the workflow below. The goal: commit
**only the agent's own work from the current session**, fully tested.

## 1. Scope: only THIS session's AI changes

`git` cannot tell you who changed a file. **You** are the only source of truth.

- Build the list of files **you** created or edited via Edit / Write / NotebookEdit
  tool calls **in the current session only**. Track these explicitly — do not
  infer from `git status`.
- **NEVER** use `git add .`, `git add -A`, `git add -u`, or `git commit -a`.
  Stage each file by its explicit path: `git add <path1> <path2> …`.
- **Exclude**: files the user edited by hand, files changed by other/previous
  sessions, and any unrelated dirty files in the working tree. If you are unsure
  whether you touched a file this session, **leave it out**.
- If a single file has both your edits and pre-existing user edits mixed in,
  stop and ask the user before staging it — do not stage partial hunks silently.

## 2. Write tests covering the changed code

Before committing, ensure the session's code changes are covered by tests.
Add or update **all three layers** as applicable to what changed, following the
testing rules in `AGENTS.md`:

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

The code you commit must be **at least 90% covered**. This is *patch* coverage:
it applies to the files you added or changed this session, **not** the whole
repo.

- Run `pnpm test:coverage` (unified v8 coverage across the monorepo). It writes
  `coverage/coverage-summary.json` and `coverage/cobertura-coverage.xml`.
- For **every source file you added or changed** this session, check its entry
  in `coverage/coverage-summary.json` and confirm **lines ≥ 90% and branches ≥
  90%**. Pure `*.types.ts` files are excluded and don't count.
- If any changed file is below 90%, **add more tests** (error paths, branches,
  edge cases) until it clears, then re-run. **Do not commit below 90%.**
- This is the same gate CI enforces on the PR: the `coverage` job runs
  `diff-cover` against the base branch and **fails the check under 90%**, posting
  a patch-coverage comment. Clearing it locally keeps the PR green.

## 4. Stage and commit

- Stage **only** the explicit paths from step 1 **plus** the test files written
  in step 2 (the tests are part of this commit).
- Show the user `git status` / `git diff --staged` summary of exactly what will
  be committed before finalizing, so the scope is visible.
- Write a clear, concise commit message describing the session's change.
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

## Guardrails

- Never stage or commit changes you did not make this session.
- Never use bulk staging flags (`.`, `-A`, `-u`, `-a`).
- Never commit without the covering tests, and never commit failing tests.
- Never commit when a changed file is below 90% coverage — add tests first.
- **Never push** without an explicit instruction to push in the current turn.
- When in doubt about ownership of a change, ask the user rather than guessing.
