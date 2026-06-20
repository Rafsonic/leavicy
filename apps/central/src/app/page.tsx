import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@repo/database/dal";

export default async function CentralHome() {
  // Redirects non-authenticated / non-super-admins to /login.
  await requirePlatformAdmin();
  redirect("/dashboard");
}
