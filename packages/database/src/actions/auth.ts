"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "../server";
import { ACTIVE_ORG_COOKIE } from "../dal";
import { APP_UNLOCKED_COOKIE, HAS_PASSKEY_COOKIE } from "../webauthn.shared";

export type AuthState = { error?: string } | undefined;

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect("/");
}

// react-doctor-disable-next-line server-auth-actions -- public by design: account self-registration
export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const consent = formData.get("consent") === "on";

  if (!fullName || !email || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (!consent) {
    return { error: "You must accept the Privacy & Cookie Policy." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, consented_at: new Date().toISOString() },
    },
  });
  if (error) return { error: error.message };

  redirect("/");
}

// react-doctor-disable-next-line server-auth-actions -- session-scoped: acts only on the caller's own session
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Clear the device-scoped unlock flags so a different user signing in on the
  // same device isn't gated against (or by) the previous user's passkey.
  const cookieStore = await cookies();
  cookieStore.delete(APP_UNLOCKED_COOKIE);
  cookieStore.delete(HAS_PASSKEY_COOKIE);

  redirect("/login");
}

// react-doctor-disable-next-line server-auth-actions -- only sets the active-org cookie; RLS scopes data and getActiveMembership falls back to a real membership
export async function switchOrg(orgId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
