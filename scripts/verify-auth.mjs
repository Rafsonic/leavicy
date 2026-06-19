// Authenticated end-to-end smoke test: mint real session cookies via
// @supabase/ssr (same encoding the app uses), then fetch protected pages.
import { createServerClient } from "@supabase/ssr";

const URL = "http://127.0.0.1:55321";
const ANON = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const APP = "http://127.0.0.1:3100";

async function cookieHeaderFor(email) {
  const jar = new Map();
  const supabase = createServerClient(URL, ANON, {
    cookies: {
      getAll: () => [...jar.values()],
      setAll: (cs) => cs.forEach((c) => jar.set(c.name, c)),
    },
  });
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: "Password123!",
  });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return [...jar.values()]
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join("; ");
}

let pass = 0;
let fail = 0;
async function checkPage(cookie, path, mustInclude, mustNotRedirect = true) {
  const res = await fetch(`${APP}${path}`, {
    headers: { cookie },
    redirect: "manual",
  });
  const body = res.status === 200 ? await res.text() : "";
  const ok =
    (mustNotRedirect ? res.status === 200 : true) &&
    mustInclude.every((m) => body.includes(m));
  if (ok) {
    pass++;
    console.log(`  ✓ ${path} (${res.status}) — ${mustInclude.join(", ")}`);
  } else {
    fail++;
    console.log(
      `  ✗ ${path} (${res.status}) — missing: ${mustInclude
        .filter((m) => !body.includes(m))
        .join(", ")}`,
    );
  }
}

console.log("As manager@acme.test (manager — sees Approvals):");
{
  const cookie = await cookieHeaderFor("manager@acme.test");
  await checkPage(cookie, "/dashboard", ["Dashboard", "Annual allowance", "Acme Health"]);
  await checkPage(cookie, "/requests", ["My requests"]);
  await checkPage(cookie, "/approvals", ["Approvals", "Pending"]);
  await checkPage(cookie, "/calendar", ["Team calendar", "Out now"]);
}

console.log("\nAs nurse@acme.test (employee — no Team/admin page):");
{
  const cookie = await cookieHeaderFor("nurse@acme.test");
  await checkPage(cookie, "/dashboard", ["Dashboard"]);
  await checkPage(cookie, "/requests", ["My requests"]);
  // employee hitting /team should be redirected away (not 200 with admin UI)
  const res = await fetch(`${APP}/team`, {
    headers: { cookie },
    redirect: "manual",
  });
  const redirected = res.status === 307 || res.status === 308;
  if (redirected) {
    pass++;
    console.log(`  ✓ /team blocked for employee (${res.status})`);
  } else {
    fail++;
    console.log(`  ✗ /team NOT blocked for employee (${res.status})`);
  }
}

console.log("\nAs admin@acme.test (admin — Team & settings):");
{
  const cookie = await cookieHeaderFor("admin@acme.test");
  await checkPage(cookie, "/team", ["Invite a member", "Members", "Company settings"]);
}

console.log(`\nResult: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
