import { CalendarCheck } from "lucide-react";
import { requireUser } from "@repo/database/dal";
import { BiometricUnlock } from "@/components/biometric-unlock/biometric-unlock";
import { safeInternalPath } from "./unlock.utils";

export const metadata = { title: "Ξεκλείδωμα · Leavicy" };

export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectedFrom?: string }>;
}) {
  // The unlock gate only triggers for authenticated users, but guard anyway.
  await requireUser();

  const { redirectedFrom } = await searchParams;
  const target = safeInternalPath(redirectedFrom);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold">
          <CalendarCheck className="size-6 text-primary" />
          {process.env.NEXT_PUBLIC_APP_NAME ?? "Leavicy"}
        </div>
        <BiometricUnlock id="biometric-unlock" redirectedFrom={target} />
      </div>
    </div>
  );
}
