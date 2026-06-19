// Quick RLS / multi-tenant isolation check against local Supabase.
import { createClient } from "@supabase/supabase-js";

const URL = "http://127.0.0.1:55321";
const ANON = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

const ACME = "11111111-1111-1111-1111-111111111111";
const GLOBEX = "22222222-2222-2222-2222-222222222222";

function client() {
  return createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function as(email) {
  const c = client();
  const { error } = await c.auth.signInWithPassword({
    email,
    password: "Password123!",
  });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return c;
}

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}`);
  }
}

console.log("Nina Nurse (employee @ Acme):");
{
  const c = await as("nurse@acme.test");
  const mine = await c.from("leave_requests").select("id, user_id, status");
  check("can read leave_requests", !mine.error);
  check(
    "sees only OWN requests (RLS)",
    (mine.data ?? []).every(
      (r) => r.user_id === "a0000000-0000-0000-0000-000000000003",
    ),
  );

  const cal = await c.rpc("get_team_calendar", { _org: ACME });
  check("team calendar returns org entries", (cal.data ?? []).length > 0);

  const globexCal = await c.rpc("get_team_calendar", { _org: GLOBEX });
  check(
    "CANNOT read another tenant's calendar",
    (globexCal.data ?? []).length === 0,
  );

  const ins = await c.from("leave_requests").insert({
    org_id: ACME,
    user_id: "a0000000-0000-0000-0000-000000000003",
    leave_type: "sick",
    start_date: "2030-01-06",
    end_date: "2030-01-06",
    working_days: 1,
    status: "pending",
  });
  check("can create own pending request", !ins.error);

  // Try to approve own request -> must be blocked (not a manager)
  const appr = await c
    .from("leave_requests")
    .update({ status: "approved" })
    .eq("user_id", "a0000000-0000-0000-0000-000000000003")
    .eq("status", "pending")
    .select();
  check(
    "employee CANNOT self-approve (RLS)",
    (appr.data ?? []).length === 0,
  );
}

console.log("\nMona Manager (manager @ Acme):");
{
  const c = await as("manager@acme.test");
  const all = await c
    .from("leave_requests")
    .select("id, org_id")
    .eq("org_id", ACME);
  check("manager sees org-wide requests", (all.data ?? []).length > 0);
  check(
    "all visible rows belong to Acme",
    (all.data ?? []).every((r) => r.org_id === ACME),
  );
}

console.log("\nGreg Globex (admin @ Globex):");
{
  const c = await as("admin@globex.test");
  const acme = await c
    .from("leave_requests")
    .select("id")
    .eq("org_id", ACME);
  check(
    "CANNOT see Acme leave requests (cross-tenant)",
    (acme.data ?? []).length === 0,
  );
  const members = await c.from("memberships").select("org_id");
  check(
    "only sees own tenant memberships",
    (members.data ?? []).every((m) => m.org_id === GLOBEX),
  );
}

console.log(`\nResult: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
