# Data Retention Policy

_Last updated: 2026-06-18. Implemented by `*_gdpr_retention.sql` +
`scripts/purge-expired.mjs` (runnable on a schedule)._

Principle: keep personal data only as long as necessary, then delete or
anonymize. Periods below are **defaults** — confirm against Cyprus employment /
social-security law with your DPO.

| Data | Retention | Action on expiry |
| ---- | --------- | ---------------- |
| **Cancelled / rejected** leave requests | 6 months after creation | Hard delete the row |
| **Reason free-text** on older requests | 24 months after `end_date` | Scrub to `NULL` (keep dates/type/status as a minimal record) |
| Approved leave records (dates/type/days) | Kept per employment-law needs | Reviewed manually; not auto-deleted |
| Account & profile | Until account deletion (erasure) | Cascades to memberships + leave requests |
| Invitations (unaccepted) | 30 days | May be deleted (manual / future job) |
| Auth logs / sessions | Per Supabase defaults | Managed by Supabase |

## How it runs

- A SQL function `public.purge_expired_data()` performs the deletions/scrubbing
  above in one transaction. It's idempotent and safe to run repeatedly.
- Scheduled daily via **pg_cron** when available; otherwise run
  `node scripts/purge-expired.mjs` from a scheduler (cron, Vercel Cron, GitHub
  Actions) using the service-role key.
- Covered by an integration test that seeds expired data and asserts it's gone.

## Erasure on request

Account deletion (right to be forgotten) is immediate and self-service from the
portal privacy page; it removes the auth user and cascades all their data.
