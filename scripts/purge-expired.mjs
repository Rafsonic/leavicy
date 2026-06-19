// GDPR retention job — run on a schedule (cron / Vercel Cron / GitHub Actions).
// Calls purge_expired_data() with the service-role key. See docs/gdpr/retention-policy.md.
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:55321";
const SERVICE = process.env.SUPABASE_SECRET_KEY;
if (!SERVICE) {
  console.error("SUPABASE_SECRET_KEY is required (get it from `supabase status`).");
  process.exit(1);
}

const supabase = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.rpc("purge_expired_data");
if (error) {
  console.error("purge failed:", error.message);
  process.exit(1);
}
console.log("purge complete:", data);
