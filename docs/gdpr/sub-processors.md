# Sub-processors

_Last updated: 2026-06-18. Customers must be informed of changes before new
sub-processors start processing their data._

| Sub-processor | Purpose | Data | Region | DPA |
| ------------- | ------- | ---- | ------ | --- |
| **Supabase** | Database, Auth, hosting | all app data (account, membership, leave records) | **EU** (e.g. `eu-central-1` Frankfurt) | Sign Supabase DPA |
| **Resend** | Transactional email (invitations) | invitee email, org name | **EU region** | Sign Resend DPA |
| **Vercel** (if used) | App hosting / CDN | request metadata, cookies | **EU region** | Sign Vercel DPA |

## Requirements

- Every sub-processor handling personal data must offer **EU data residency** and
  a signed **DPA / SCCs**.
- Configure the region explicitly in production (don't rely on US defaults):
  - Supabase project region → EU.
  - Resend → EU region.
  - Vercel → EU function/edge region.
- No PII may be sent to a non-EU region without an appropriate transfer mechanism.
