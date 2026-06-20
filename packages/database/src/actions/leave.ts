"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../server";
import { getActiveMembership } from "../dal";
import { workingDaysBetween } from "../format";
import type { LeaveType } from "../types";
import { LEAVE_TYPES } from "../types";

export type LeaveActionState = { ok?: boolean; error?: string } | undefined;

export async function createLeaveRequest(
  _prev: LeaveActionState,
  formData: FormData,
): Promise<LeaveActionState> {
  const membership = await getActiveMembership();
  if (!membership) return { error: "No active company." };

  const leaveType = String(formData.get("leave_type") ?? "") as LeaveType;
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!LEAVE_TYPES.includes(leaveType)) return { error: "Invalid leave type." };
  if (!startDate || !endDate) return { error: "Start and end dates are required." };
  if (endDate < startDate) return { error: "End date can't be before start date." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // Company closed days within the range don't count as working days, and a
  // request that lands entirely on closed/weekend days is rejected below.
  const { data: closed } = await supabase
    .from("company_closed_days")
    .select("closed_date")
    .eq("org_id", membership.org_id)
    .gte("closed_date", startDate)
    .lte("closed_date", endDate);
  const closedDates = (closed ?? []).map((c) => c.closed_date);

  const workingDays = workingDaysBetween(startDate, endDate, closedDates);
  if (workingDays < 1) {
    return {
      error:
        "Selected range has no working days — weekends and company closed days don't count.",
    };
  }

  const { error } = await supabase.from("leave_requests").insert({
    org_id: membership.org_id,
    user_id: user.id,
    leave_type: leaveType,
    start_date: startDate,
    end_date: endDate,
    working_days: workingDays,
    reason: reason || null,
    status: "pending",
  });

  if (error) return { error: error.message };

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  return { ok: true };
}

export async function cancelLeaveRequest(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leave_requests")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}
