import { redirect } from "next/navigation";
import { getCurrentUser, getActiveMembership } from "@repo/database/dal";

// Entry point: route the visitor to the right place.
export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getActiveMembership();
  if (!membership) redirect("/onboarding");

  redirect("/dashboard");
}
