import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "./server";
import type { AppRole, ClosedDay } from "./types";

export const ACTIVE_ORG_COOKIE = "active_org";

/** The authenticated user, or null. Memoized per request. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export type MembershipWithOrg = {
  id: string;
  org_id: string;
  role: AppRole;
  annual_sick_days: number;
  organization: { id: string; name: string; slug: string };
};

/** All memberships for the current user (across tenants). Memoized. */
export const getMemberships = cache(async (): Promise<MembershipWithOrg[]> => {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select(
      "id, org_id, role, annual_sick_days, organizations(id, name, slug)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return (data ?? []).map((m) => ({
    id: m.id,
    org_id: m.org_id,
    role: m.role,
    annual_sick_days: m.annual_sick_days,
    organization: m.organizations as MembershipWithOrg["organization"],
  }));
});

/**
 * The active membership, chosen from the `active_org` cookie and falling back
 * to the first membership. Returns null if the user belongs to no org.
 */
export const getActiveMembership =
  cache(async (): Promise<MembershipWithOrg | null> => {
    const memberships = await getMemberships();
    if (memberships.length === 0) return null;

    const cookieStore = await cookies();
    const activeId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
    const match = memberships.find((m) => m.org_id === activeId);
    return match ?? memberships[0];
  });

/** Require an authenticated user; redirect to /login otherwise. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Is the current user a platform super-admin (Leavicy staff)? Memoized.
 * Backed by the `is_platform_admin()` SECURITY DEFINER RPC.
 */
export const isPlatformAdmin = cache(async (): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_platform_admin");
  return data === true;
});

/**
 * Require a platform super-admin (Central back-office). Redirects to /login if
 * not authenticated or not a platform admin — tenant users never reach Central.
 */
export async function requirePlatformAdmin() {
  const user = await requireUser();
  if (!(await isPlatformAdmin())) redirect("/login");
  return user;
}

/**
 * Require an authenticated user WITH an active org membership.
 * Redirects to /login or /onboarding as appropriate.
 */
export async function requireActiveMembership() {
  const user = await requireUser();
  const membership = await getActiveMembership();
  if (!membership) redirect("/onboarding");
  return { user, membership };
}

/** Company closed days (holidays / shutdowns) for the active org, ascending. */
export const getClosedDays = cache(async (): Promise<ClosedDay[]> => {
  const membership = await getActiveMembership();
  if (!membership) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_closed_days")
    .select("*")
    .eq("org_id", membership.org_id)
    .order("closed_date", { ascending: true });
  return data ?? [];
});

/** Just the closed dates (ISO `yyyy-mm-dd`) for the active org. */
export async function getClosedDates(): Promise<string[]> {
  const days = await getClosedDays();
  return days.map((d) => d.closed_date);
}

/** The current user's profile (name/avatar). */
export const getProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data;
});
