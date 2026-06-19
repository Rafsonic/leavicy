import { redirect } from "next/navigation";
import { HeartPulse } from "lucide-react";
import { requireUser, getMemberships } from "@repo/database/dal";
import { OnboardingTabs } from "@repo/ui";

export const metadata = { title: "Get started · SickDesk" };

export default async function OnboardingPage() {
  await requireUser();
  const memberships = await getMemberships();
  if (memberships.length > 0) redirect("/dashboard");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold">
          <HeartPulse className="size-6 text-primary" />
          SickDesk
        </div>
        <OnboardingTabs />
      </div>
    </div>
  );
}
