import { redirect } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { requireUser, getMemberships } from "@repo/database/dal";
import { OnboardingTabs } from "@repo/ui";

export const metadata = { title: "Get started · Leavicy" };

export default async function OnboardingPage() {
  await requireUser();
  const memberships = await getMemberships();
  if (memberships.length > 0) redirect("/dashboard");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold">
          <CalendarCheck className="size-6 text-primary" />
          Leavicy
        </div>
        <OnboardingTabs />
      </div>
    </div>
  );
}
