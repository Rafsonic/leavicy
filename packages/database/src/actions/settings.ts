"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../server";
import { requireAdminOrg } from "./guards";

export type SettingsActionState = { ok?: boolean; error?: string } | undefined;

/** Add a company closed day (public holiday / shutdown). Admin only. */
export async function addClosedDay(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const ctx = await requireAdminOrg();
  if ("error" in ctx) return { error: ctx.error };

  const closedDate = String(formData.get("closed_date") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!closedDate) return { error: "A date is required." };
  if (!name) return { error: "A name is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_closed_days")
    // react-doctor-disable-next-line supabase-client-owned-authz-field -- org_id comes from the server-trusted requireAdminOrg context, not client input
    .insert({ org_id: ctx.orgId, closed_date: closedDate, name });

  if (error) {
    if (error.code === "23505") {
      return { error: "That date is already marked as closed." };
    }
    return { error: error.message };
  }

  revalidatePath("/team");
  return { ok: true };
}

/** Remove a company closed day by id. Admin only (enforced by RLS). */
export async function removeClosedDay(id: string) {
  const ctx = await requireAdminOrg();
  if ("error" in ctx) throw new Error(ctx.error);
  const supabase = await createClient();
  const { error } = await supabase
    .from("company_closed_days")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/team");
}
