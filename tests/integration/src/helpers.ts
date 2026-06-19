import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:55321";
const ANON =
  process.env.SUPABASE_ANON_KEY ??
  "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const SERVICE = process.env.SUPABASE_SECRET_KEY ?? "";
if (!SERVICE) {
  throw new Error(
    "SUPABASE_SECRET_KEY is required for integration tests (get it from `supabase status`).",
  );
}

export const ACME_ORG = "11111111-1111-1111-1111-111111111111";
export const GLOBEX_ORG = "22222222-2222-2222-2222-222222222222";

export const USERS = {
  acmeAdmin: "a0000000-0000-0000-0000-000000000001",
  acmeManager: "a0000000-0000-0000-0000-000000000002",
  acmeNurse: "a0000000-0000-0000-0000-000000000003",
  acmeTech: "a0000000-0000-0000-0000-000000000004",
  globexAdmin: "b0000000-0000-0000-0000-000000000001",
} as const;

const opts = { auth: { persistSession: false, autoRefreshToken: false } };

/** Anonymous (RLS-enforced) client. */
export function anonClient(): SupabaseClient {
  return createClient(URL, ANON, opts);
}

/** Service-role client (bypasses RLS) — used only for test setup/teardown. */
export function adminClient(): SupabaseClient {
  return createClient(URL, SERVICE, opts);
}

/** Sign in as a seeded/test user and return an authenticated client. */
export async function signInAs(
  email: string,
  password = "Password123!",
): Promise<SupabaseClient> {
  const c = anonClient();
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signIn ${email}: ${error.message}`);
  return c;
}

/** Create a confirmed auth user via the admin API; returns its id. */
export async function createTestUser(
  email: string,
  password = "Password123!",
): Promise<string> {
  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: email.split("@")[0] },
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  return data.user.id;
}

/** Delete an auth user (cascades to profile/memberships/leave_requests). */
export async function deleteTestUser(id: string): Promise<void> {
  await adminClient().auth.admin.deleteUser(id);
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@itest.local`;
}
