"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "../server";
import { getProfile } from "../dal";
import { ROLES, ROLE_LABELS, type AppRole } from "../types";
import { requireAdminOrg } from "./guards";
import { sendInvitationEmail } from "@repo/email/send-invitation";

export type TeamActionState = { ok?: boolean; error?: string } | undefined;

/** Build the absolute origin of the current request (for invite links). */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function inviteMember(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const ctx = await requireAdminOrg();
  if ("error" in ctx) return { error: ctx.error };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  // react-doctor-disable-next-line supabase-client-owned-authz-field -- role is validated against ROLES below and the insert is gated by requireAdminOrg + RLS
  const role = String(formData.get("role") ?? "employee") as AppRole;

  if (!email) return { error: "Email is required." };
  if (!ROLES.includes(role)) return { error: "Invalid role." };

  const supabase = await createClient();
  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({ org_id: ctx.orgId, email, role })
    .select("token")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "That email already has a pending invitation." };
    }
    return { error: error.message };
  }

  // Best-effort email — the invite link still works if delivery fails/skips.
  try {
    const origin = await requestOrigin();
    const profile = await getProfile();
    await sendInvitationEmail({
      to: email,
      orgName: ctx.orgName,
      role: ROLE_LABELS[role],
      inviteUrl: `${origin}/invite/${invitation.token}`,
      inviterName: profile?.full_name,
      appName: process.env.NEXT_PUBLIC_APP_NAME,
    });
  } catch (e) {
    console.error("[invite] failed to send email:", e);
  }

  revalidatePath("/team");
  return { ok: true };
}

export async function cancelInvitation(id: string) {
  const ctx = await requireAdminOrg();
  if ("error" in ctx) throw new Error(ctx.error);
  const supabase = await createClient();
  const { error } = await supabase.from("invitations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/team");
}

export async function updateMemberRole(membershipId: string, role: AppRole) {
  if (!ROLES.includes(role)) throw new Error("Invalid role");
  const ctx = await requireAdminOrg();
  if ("error" in ctx) throw new Error(ctx.error);
  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({ role })
    .eq("id", membershipId);
  if (error) throw new Error(error.message);
  revalidatePath("/team");
}

export async function updateMemberAllowance(
  membershipId: string,
  annualSickDays: number,
) {
  const ctx = await requireAdminOrg();
  if ("error" in ctx) throw new Error(ctx.error);
  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({ annual_sick_days: annualSickDays })
    .eq("id", membershipId);
  if (error) throw new Error(error.message);
  revalidatePath("/team");
}

export async function removeMember(membershipId: string) {
  const ctx = await requireAdminOrg();
  if ("error" in ctx) throw new Error(ctx.error);
  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("id", membershipId);
  if (error) throw new Error(error.message);
  revalidatePath("/team");
}

export async function renameOrganization(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const ctx = await requireAdminOrg();
  if ("error" in ctx) return { error: ctx.error };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Company name is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", ctx.orgId);

  if (error) return { error: error.message };

  revalidatePath("/team");
  revalidatePath("/", "layout");
  return { ok: true };
}
