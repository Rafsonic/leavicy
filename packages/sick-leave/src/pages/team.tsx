import { redirect } from "next/navigation";
import { requireActiveMembership } from "@repo/database/dal";
import { createClient } from "@repo/database/server";
import { PageHeader } from "@repo/ui";
import { TeamMembers, type Member } from "@repo/ui";
import { InviteForm } from "@repo/ui";
import {
  InvitationsList,
  type PendingInvite,
} from "@repo/ui";
import { OrgSettingsForm } from "@repo/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";

export const metadata = { title: "Team & settings · Leavicy" };

type MembershipRow = {
  id: string;
  user_id: string;
  role: Member["role"];
  annual_sick_days: number;
  profiles: { full_name: string | null; email: string | null } | null;
};

export default async function TeamPage() {
  const { user, membership } = await requireActiveMembership();
  if (membership.role !== "admin") redirect("/dashboard");

  const supabase = await createClient();

  const [{ data: rawMembers }, { data: rawInvites }] = await Promise.all([
    supabase
      .from("memberships")
      .select("id, user_id, role, annual_sick_days, profiles(full_name, email)")
      .eq("org_id", membership.org_id)
      .order("created_at", { ascending: true }),
    supabase
      .from("invitations")
      .select("id, email, role, token")
      .eq("org_id", membership.org_id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const members: Member[] = ((rawMembers ?? []) as unknown as MembershipRow[]).map(
    (m) => ({
      membershipId: m.id,
      userId: m.user_id,
      fullName: m.profiles?.full_name ?? null,
      email: m.profiles?.email ?? null,
      role: m.role,
      annualSickDays: m.annual_sick_days,
    }),
  );

  const invites = (rawInvites ?? []) as PendingInvite[];

  return (
    <>
      <PageHeader
        title="Team & settings"
        description={`Manage members and settings for ${membership.organization.name}.`}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite a member</CardTitle>
          <CardDescription>
            They&apos;ll join after signing up with the invited email and
            opening the invite link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteForm />
        </CardContent>
      </Card>

      {invites.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Pending invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <InvitationsList invites={invites} />
          </CardContent>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">
            Members ({members.length})
          </CardTitle>
          <CardDescription>
            Assign roles and set each member&apos;s annual sick day allowance.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <TeamMembers members={members} currentUserId={user.id} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Company settings</CardTitle>
        </CardHeader>
        <CardContent>
          <OrgSettingsForm name={membership.organization.name} />
        </CardContent>
      </Card>
    </>
  );
}
