import "server-only";
import { getActiveMembership, isPlatformAdmin } from "../dal";

export type AdminOrgContext = { orgId: string; orgName: string };

/**
 * Require the current user to be a platform super-admin. Returns `{ ok: true }`
 * on success, or a user-facing `{ error }` to short-circuit a server action.
 * The platform-admin-gated RPCs enforce this at the database layer too — this
 * is the friendly guard for the Central back-office actions.
 */
export async function requirePlatformAdminAction(): Promise<
  { ok: true } | { error: string }
> {
  if (!(await isPlatformAdmin())) {
    return { error: "Only platform admins can manage tenants." };
  }
  return { ok: true };
}

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
