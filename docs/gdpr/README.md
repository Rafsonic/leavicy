# GDPR documentation — Leavicy

Leavicy is a multi-tenant sick-leave platform for companies in **Cyprus (EU)**.
It processes **special-category (health) data** (sick-leave reasons, doctor's
notes), so GDPR compliance is a first-class requirement.

> ⚠️ These documents are an engineering starting point, **not legal advice**.
> Have them reviewed by a qualified DPO / lawyer before relying on them.

## Contents

| Doc | Purpose |
| --- | --- |
| [ropa.md](./ropa.md) | Record of Processing Activities (Art. 30) |
| [retention-policy.md](./retention-policy.md) | What we keep, for how long, and how it's deleted |
| [sub-processors.md](./sub-processors.md) | Third parties that process personal data |
| [breach-register.md](./breach-register.md) | Personal-data breach log (72h notification) |
| [data-subject-requests.md](./data-subject-requests.md) | DSAR register + how the app fulfils each right |

## Key principles applied in the product

- **Data minimization** — only what's needed; free-text reasons are optional.
- **Security** — Postgres Row Level Security per tenant; private Storage with
  short-lived signed URLs; TLS in transit; encryption at rest (Supabase).
- **EU data residency** — hosting, database and sub-processors in the EU.
- **Retention & erasure** — automated purge (see retention policy) + self-service
  data export and account deletion.
- **Transparency & consent** — privacy/cookie policies and signup consent.

## Roles

- **Controller**: each customer company (decides why staff sick-leave is processed).
- **Processor**: Leavicy (processes on the company's behalf) — a DPA should be in
  place between Leavicy and each customer.
- **Sub-processors**: see [sub-processors.md](./sub-processors.md).

## Where this is implemented

- Retention/auto-delete: `supabase/migrations/*_gdpr_retention.sql` + `scripts/purge-expired.mjs`.
- Data-subject rights: `export_my_data` RPC + delete-account action + portal privacy page.
- Policies & consent: privacy/cookie pages + signup consent.
