import "server-only";
import { getActiveMembership } from "../dal";

export type AdminOrgContext = { orgId: string; orgName: string };

/**
 * Require the active membership to be an `admin`. Returns the org context on
 * success, or a user-facing `{ error }` to short-circuit a server action.
 * RLS still enforces this at the database layer — this is the friendly guard.
 */
export async function requireAdminOrg(): Promise<
  AdminOrgContext | { error: string }
> {
  const membership = await getActiveMembership();
  if (!membership) return { error: "No active company." };
  if (membership.role !== "admin") {
    return { error: "Only admins can manage the organization." };
  }
  return { orgId: membership.org_id, orgName: membership.organization.name };
}
