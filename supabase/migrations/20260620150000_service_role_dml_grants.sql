-- ============================================================================
-- Restore service_role DML on application tables.
--
-- `service_role` is the privileged backend role (it BYPASSES RLS) used for
-- admin / GDPR operations (see packages/database/src/admin.ts) and by the
-- integration-test setup that seeds rows RLS would otherwise forbid. On this
-- project the role was left with only the table-level privileges
-- (REFERENCES / TRIGGER / TRUNCATE), so any direct read/write as service_role
-- failed with "permission denied for table …". Grant it the data privileges it
-- is expected to have, and set the schema default so future tables inherit them.
-- ============================================================================

grant select, insert, update, delete
  on all tables in schema public to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
