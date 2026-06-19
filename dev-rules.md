## Project rules (MUST follow)

### Package management

- Always use **`pnpm`** (e.g. `pnpm add <pkg>`, `pnpm dlx`). **Never** `npm` or `yarn`.

### Versions

- Always use the **latest stable** version of every library/package.
- **Never** install canary / beta / RC / alpha / `next` / experimental tags.
- Resolve with `npm view <pkg> version` before pinning; use caret ranges on stable.

### Component structure (our own components only — not vendored shadcn/ui primitives)

- Each reusable component lives in its **own kebab-case directory** under `src/components`:
  ```
  info-display/
    info-display.tsx        # the component (the only thing it exports)
    info-display.types.ts   # types, including exported/imported props
    info-display.utils.ts   # exported/imported helpers (only when needed)
    __tests__/
      info-display.tests.tsx   # tests live in __tests__/, never beside the source
  ```
- **One exported component per `.tsx` file.** Never two exported components in one file.
- Every reusable component's **root element** must include:
  - `data-component="<ComponentName>"` (PascalCase)
  - `data-cy={id}` (forwarded from the component's `id` prop)

### Buttons

- Every `<Button>` / `<button>` MUST include both:
  - `id` — unique, descriptive, stable
  - `data-cy` — stable test selector
- Never create a button without both. No generic values (`button`, `btn`, `btn1`, `click-button`).
- `id` and `data-cy` should match unless there's a specific reason not to.
  ```tsx
  <Button id="save-profile-button" data-cy="save-profile-button" type="button">
    Save Profile
  </Button>
  ```

### General code style

- **Functional components only** — never class components; prefer hooks over class-based patterns.
- Use **arrow functions** and **always include explicit return types**.
- Use proper **TypeScript types — never `any`**.
- Keep components **small, modular, and reusable**.
- **Do not rewrite or modify files unrelated to the current task.**
- Prefer **simple, clean, readable** solutions over clever ones.

(Applies to new and changed code; do not mass-refactor existing files just to conform.)

### Styling

- Use **Tailwind CSS** for all styling.
- **Do not use inline styles** (`style={{…}}`) unless absolutely necessary.

### UI components

- Use **`shadcn/ui`** components whenever possible.
- If a needed component doesn't exist locally, **install it via the shadcn/ui CLI** — do not hand-roll a replacement.
- shadcn components live in **`packages/ui`**. Install from there:
  ```bash
  cd packages/ui && pnpm dlx shadcn@latest add <component>
  ```
  Then export it from `packages/ui/src/index.ts` (the `@repo/ui` barrel).

### State management

- Do **not** keep a redundant boolean `open` state alongside an entity state for
  modals, dialogs, sheets, drawers, or confirmation prompts. One state is enough —
  derive the open flag from the entity state.
- Use a single state shaped like `Entity | null`; set it to open, clear it to
  `null` to close.
- The dialog component (`<EntityFormDialog>`) expects a **non-null** `entity`/`user`
  prop — never pass `null`. **Guard-render** it: `{entity && <EntityFormDialog … />}`
  so the prop is always the narrowed non-null entity.

  Wrong — two states for one concept:

  ```tsx
  const [open, setOpen] = useState<boolean>(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  ```

  Right — single source of truth, guard-rendered so `user` is never null:

  ```tsx
  const [userEditDialog, setUserEditDialog] = useState<User | null>(null);

  // open:
  <Button
    id="edit-user-button"
    data-cy="edit-user-button"
    onClick={() => setUserEditDialog(user)}
  >
    Edit
  </Button>;

  // dialog — render only when an entity is selected (so it's always open here):
  {
    userEditDialog && (
      <UserFormDialog
        user={userEditDialog}
        open
        onOpenChange={(open) => {
          if (!open) setUserEditDialog(null);
        }}
      />
    );
  }
  ```

### Testing

- **Every code change must come with unit tests** (add or update them).
- Tests live in a **`__tests__/` directory inside each source directory**.
- Each source file has its own corresponding test file, named `<source>.tests.ts(x)`:
  - `entity.tsx` → `__tests__/entity.tests.tsx`
  - `entity.utils.ts` → `__tests__/entity.utils.tests.ts`
  - (pure `*.types.ts` files have no runtime and don't need tests)
- Example:
  ```
  components/info-display/
    info-display.tsx
    info-display.types.ts
    info-display.utils.ts
    __tests__/
      info-display.tests.tsx
      info-display.utils.tests.ts
  ```

### Database

Always design with **performance, indexes, and security** in mind, and **follow
best practices** — prefer the harder _recommended_ path over the lazy shortcut.

- **Security**: RLS enabled on every tenant table; policies enforce tenant +
  role. `SECURITY DEFINER` functions must set `search_path = ''` and use fully
  qualified names. Least privilege on grants. Never disable/bypass RLS for
  convenience. Validate/parameterize all input — never build SQL by string concat.
- **Indexes**: index every foreign key and every column used in `where` / `join`
  / `order by` / RLS predicates. Add composite indexes for common filter combos.
  Don't over-index (writes cost too) — justify each one.
- **Performance**: select only needed columns (no blind `select *`); avoid N+1
  (join / batch); paginate large lists; keep RLS helper functions `stable` and
  cheap; consider the query plan for hot paths.
- **Principles**: enforce integrity in the DB — `not null`, `check`, `unique`,
  foreign keys with sensible `on delete`. Every schema change is a **migration**
  (never edit the DB by hand); keep migrations reproducible. After schema changes
  run `pnpm db:types` and `pnpm verify:rls`.

### Region, locale & data residency

The product targets **Cyprus (EU)**. Default country **Cyprus** (ISO `CY`, dial `+357`).

- **Hosting & database region**: deploy hosting **and** the Supabase/Postgres
  database in an **EU region** (data residency / GDPR). Use the EU region closest
  to Cyprus — e.g. Supabase **`eu-central-1` (Frankfurt)** — and keep all PII there.
  Never provision prod data stores in non-EU regions.
- **GDPR**: sick-leave reasons and doctor's notes are **special-category (health)
  data** — minimize collection, restrict access (RLS + signed URLs), store in the
  EU only, and keep deletion/retention in mind. Study & follow:
  - https://europa.eu/youreurope/business/dealing-with-customers/data-protection/data-protection-gdpr/index_en.htm
  - https://www.mydpopartner-en.fr/my-services/mandatory-gdpr-documents
  - https://gdpr.eu/checklist/ — compliance checklist (lawful basis & transparency,
    data security, accountability & governance, data-subject rights)
  - Maintain the mandatory docs: ROPA, processor list & DPAs/SCCs, DPIA,
    Privacy/Cookie policy, breach register, data-subject-rights register,
    internal security policy. Breach notification to the DPA within **72h**.
  - **Sub-processors must be EU-region too**: in prod configure **Resend in the EU
    region** (invitation emails carry PII: email + org) and sign a DPA with Resend.
- **Locale defaults**: timezone **`Europe/Nicosia`**, currency **EUR (€)**, week
  starts **Monday**, dates **dd/mm/yyyy** (we format with `en-GB`), language
  English (Greek `el-CY` a likely future addition — keep copy localizable).
