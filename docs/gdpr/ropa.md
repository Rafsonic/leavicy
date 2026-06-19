# Record of Processing Activities (ROPA)

_Art. 30 GDPR. Last updated: 2026-06-18. Review at least annually._

**Controller:** customer company. **Processor:** Leavicy.
**Data residency:** EU (see [sub-processors.md](./sub-processors.md)).

| # | Activity | Personal data | Subjects | Lawful basis | Retention | Recipients |
| - | -------- | ------------- | -------- | ------------ | --------- | ---------- |
| 1 | Account & authentication | name, email, hashed password | employees, managers, admins | Contract (Art. 6(1)(b)) | Until account deletion | Supabase (auth) |
| 2 | Organization membership & roles | user↔org link, role, sick-day allowance | members | Contract / legitimate interest | Until membership removed | Supabase (DB) |
| 3 | **Sick-leave management** | dates, leave type, **reason (health)**, **doctor's note (health)**, status | employees | **Art. 9(2)(b)** (employment/social-security law) + Art. 6(1)(c) | See [retention](./retention-policy.md) | Supabase (DB + Storage); managers/admins of the same org |
| 4 | Approvals | reviewer id, decision, review note, timestamp | employees, reviewers | Contract / legal obligation | With the leave record | Supabase (DB) |
| 5 | Invitations | invitee email, role | prospective members | Legitimate interest (Art. 6(1)(f)) | Until accepted or expired | Supabase (DB); Resend (email delivery) |

## Special-category data (Art. 9)

Sick-leave **reasons** and **doctor's notes** are health data. Safeguards:
- Optional free-text reason (minimization).
- Notes in a **private** Storage bucket; access only via short-lived signed URLs.
- RLS: employees see only their own; managers/admins see only their org.
- Automated retention/erasure (see retention policy).

## Technical & organizational measures (summary)

RLS tenant isolation · `SECURITY DEFINER` helpers with locked `search_path` ·
least-privilege grants · signed URLs · TLS · encryption at rest · CI tests for
RLS isolation · EU-only hosting and sub-processors.
