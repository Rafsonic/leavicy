# Data-Subject Requests (DSAR) Register

_Arts. 15–21 GDPR. Log requests and respond without undue delay (within 1 month)._

## How the app fulfils each right

| Right | How |
| ----- | --- |
| Access / Portability (15, 20) | **Download my data** on the portal privacy page → `export_my_data()` returns JSON (profile, memberships, leave requests). |
| Rectification (16) | Users edit their profile; admins fix org/role data. |
| Erasure (17) | **Delete my account** on the privacy page → removes the auth user; cascades all their data. |
| Restriction / Objection (18, 21) | Manual today: contact the controller; data can be withheld from processing on request. |
| Automated decisions (22) | N/A — approvals are made by humans (managers/admins). |

## Register

| ID | Received | Requester (email) | Type | Verified identity? | Status | Completed | Notes |
| -- | -------- | ----------------- | ---- | ------------------ | ------ | --------- | ----- |
| _example_ | 2026-01-01 | user@example.com | access | yes | done | 2026-01-05 | exported JSON sent |

> Verify the requester's identity before disclosing or deleting data. Most
> requests are self-service in-app; use this register for ones handled manually.
