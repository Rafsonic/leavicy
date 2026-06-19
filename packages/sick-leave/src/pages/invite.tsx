import { redirect } from "next/navigation";
import { HeartPulse } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { getCurrentUser } from "@repo/database/dal";
import { InviteAcceptForm } from "@repo/ui";

export const metadata = { title: "Accept invitation · Leavicy" };

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const user = await getCurrentUser();
  if (!user) {
    // Send them to login, then back here to accept once authenticated.
    redirect(`/login?redirectedFrom=/invite/${token}`);
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold">
          <HeartPulse className="size-6 text-primary" />
          Leavicy
        </div>
        <Card>
          <CardHeader>
            <CardTitle>You&apos;ve been invited</CardTitle>
            <CardDescription>
              Accept this invitation to join the company workspace as{" "}
              <span className="font-medium">{user.email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteAcceptForm token={token} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
