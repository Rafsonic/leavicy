import type { Database } from "./database.types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type LeaveType = Database["public"]["Enums"]["leave_type"];
export type LeaveStatus = Database["public"]["Enums"]["leave_status"];
export type OrgStatus = Database["public"]["Enums"]["org_status"];

/** Platform-wide aggregate stats (Central dashboard). */
export type PlatformStats =
  Database["public"]["Functions"]["get_platform_stats"]["Returns"][number];

/** Per-tenant row with counts (Central tenants list). */
export type TenantStats =
  Database["public"]["Functions"]["get_tenant_stats"]["Returns"][number];

export type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"];
export type Membership = Database["public"]["Tables"]["memberships"]["Row"];
export type Organization =
  Database["public"]["Tables"]["organizations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Invitation = Database["public"]["Tables"]["invitations"]["Row"];
export type ClosedDay =
  Database["public"]["Tables"]["company_closed_days"]["Row"];

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  manager: "Manager",
  employee: "Employee",
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  sick: "Sick",
  injury: "Injury",
  family_care: "Family care",
  medical_appointment: "Medical appointment",
  other: "Other",
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

/** Tailwind/shadcn badge variants per status. */
export const LEAVE_STATUS_VARIANT: Record<
  LeaveStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  cancelled: "outline",
};

export const ORG_STATUS_LABELS: Record<OrgStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  archived: "Archived",
};

/** Tailwind/shadcn badge variants per tenant lifecycle status. */
export const ORG_STATUS_VARIANT: Record<
  OrgStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  suspended: "secondary",
  archived: "outline",
};

export const ORG_STATUSES: OrgStatus[] = ["active", "suspended", "archived"];

export const LEAVE_TYPES: LeaveType[] = [
  "sick",
  "injury",
  "family_care",
  "medical_appointment",
  "other",
];

export const ROLES: AppRole[] = ["admin", "manager", "employee"];

/** Managers and admins can review (approve/reject) requests. */
export function canReview(role: AppRole) {
  return role === "admin" || role === "manager";
}
