# Personal-Data Breach Register

_Art. 33–34 GDPR. Log every personal-data breach here, even if not notifiable._
**Notify the supervisory authority within 72 hours** of becoming aware, where the
breach is likely to risk individuals' rights and freedoms. In Cyprus the
authority is the **Office of the Commissioner for Personal Data Protection**.

## How to record

For each incident, add a row and keep supporting notes in an internal ticket.

| ID | Detected (UTC) | Description | Data categories | Subjects affected (approx) | Risk level | DPA notified? (date / within 72h) | Individuals notified? | Remedial actions | Status |
| -- | -------------- | ----------- | --------------- | -------------------------- | ---------- | --------------------------------- | --------------------- | ---------------- | ------ |
| _example_ | 2026-01-01T10:00Z | _what happened_ | e.g. email, name | ~N | low/med/high | yes — 2026-01-02 (✓) | yes/no | _patched X, rotated keys_ | open/closed |

## Quick checklist when a breach is suspected

1. Contain (revoke keys/sessions, disable affected paths).
2. Assess scope & risk (which data, how many subjects).
3. Record here immediately.
4. If risk to individuals → notify the authority **within 72h**.
5. If high risk → notify affected individuals without undue delay.
6. Post-mortem: root cause + preventive measures.
