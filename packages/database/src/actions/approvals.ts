"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../server";
import { getCurrentUser } from "../dal";

export async function reviewLeaveRequest(
  id: string,
  decision: "approved" | "rejected",
  note: string,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { error } = await supabase
    .from("leave_requests")
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_note: note.trim() || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/approvals");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}
