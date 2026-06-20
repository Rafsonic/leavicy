import { requireUser, getProfile } from "@repo/database/dal";
import {
  PageHeader,
  DataExportButton,
  DeleteAccountButton,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";

export const metadata = { title: "Privacy & data · Leavicy" };

export default async function AccountPage() {
  const user = await requireUser();
  const profile = await getProfile();

  return (
    <>
      <PageHeader
        title="Privacy & data"
        description="Manage your personal data and account."
      />
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your account</CardTitle>
            <CardDescription>
              {profile?.full_name ?? user.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {user.email}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Export your data</CardTitle>
            <CardDescription>
              Download a copy of your profile, memberships and leave requests
              (GDPR access &amp; portability).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataExportButton />
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Danger zone
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data (right to
              erasure). This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAccountButton confirmEmail={user.email ?? ""} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
