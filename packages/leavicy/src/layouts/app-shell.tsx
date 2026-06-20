import {
  requireActiveMembership,
  getProfile,
  getMemberships,
} from "@repo/database/dal";
import { AppSidebar } from "@repo/ui";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { membership } = await requireActiveMembership();
  const [profile, memberships] = await Promise.all([
    getProfile(),
    getMemberships(),
  ]);

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <AppSidebar
        profile={{
          full_name: profile?.full_name ?? null,
          email: profile?.email ?? null,
        }}
        activeOrg={{ id: membership.org_id, name: membership.organization.name }}
        role={membership.role}
        memberships={memberships.map((m) => ({
          org_id: m.org_id,
          name: m.organization.name,
          role: m.role,
        }))}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
