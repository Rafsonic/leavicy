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

## 3. Stage and commit

- Stage **only** the explicit paths from step 1 **plus** the test files written
  in step 2 (the tests are part of this commit).
- Show the user `git status` / `git diff --staged` summary of exactly what will
  be committed before finalizing, so the scope is visible.
- Write a clear, concise commit message describing the session's change.
- If on the default branch (`main`) and the user has not said otherwise, follow
  the repo's git guidance (branch first if required by project workflow).
- **Do not push** unless the user explicitly asks.

End every commit message with this footer:

```
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

## Guardrails

- Never stage or commit changes you did not make this session.
- Never use bulk staging flags (`.`, `-A`, `-u`, `-a`).
- Never commit without the covering tests, and never commit failing tests.
- When in doubt about ownership of a change, ask the user rather than guessing.
