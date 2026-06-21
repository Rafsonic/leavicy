import { requireUser, getProfile } from "@repo/database/dal";
import { listPasskeys } from "@repo/database/actions/webauthn";
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
import { PasskeyManager } from "@/components/passkey-manager/passkey-manager";

export const metadata = { title: "Privacy & data · Leavicy" };

export default async function AccountPage() {
  const user = await requireUser();
  // Independent fetches — run them together instead of waterfalling.
  const [profile, passkeys] = await Promise.all([
    getProfile(),
    listPasskeys(),
  ]);

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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Face ID / passkeys</CardTitle>
            <CardDescription>
              Ξεκλειδώστε γρήγορα την εφαρμογή με Face ID ή Touch ID αντί για
              κωδικό. Λειτουργεί μόνο σε υποστηριζόμενες συσκευές.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasskeyManager id="passkey-manager" initialPasskeys={passkeys} />
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
