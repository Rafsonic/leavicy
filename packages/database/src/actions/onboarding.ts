"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../server";
import { ACTIVE_ORG_COOKIE } from "../dal";

export type OnboardingState = { error?: string } | undefined;

async function setActiveOrg(orgId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

// react-doctor-disable-next-line server-auth-actions -- create_organization RPC (SECURITY DEFINER) enforces auth.uid() at the DB layer
export async function createOrganization(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Company name is required." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_organization", {
    _name: name,
  });
  if (error) return { error: error.message };

  await setActiveOrg(data as string);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// react-doctor-disable-next-line server-auth-actions -- accept_invitation RPC (SECURITY DEFINER) enforces the token + auth.uid() at the DB layer
export async function acceptInvitation(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) return { error: "Invitation token is required." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invitation", {
    _token: token,
  });
  if (error) return { error: error.message };

  await setActiveOrg(data as string);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
