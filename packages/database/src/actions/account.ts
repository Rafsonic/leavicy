"use server";

import { createClient } from "../server";
import { createAdminClient } from "../admin";
import { getCurrentUser } from "../dal";

/**
 * Right to erasure (Art. 17): permanently delete the caller's account.
 * Removing the auth user cascades to profile, memberships and leave requests.
 * On success the session is signed out; the client should navigate to /login.
 */
export async function deleteMyAccount(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw new Error(error.message);

  const supabase = await createClient();
  await supabase.auth.signOut();
}
