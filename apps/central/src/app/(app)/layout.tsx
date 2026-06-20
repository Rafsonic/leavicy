import { requirePlatformAdmin, getProfile } from "@repo/database/dal";
import { CentralSidebar } from "@repo/ui";

export default async function CentralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();
  const profile = await getProfile();

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <CentralSidebar
        id="central-sidebar"
        profile={{
          full_name: profile?.full_name ?? null,
          email: profile?.email ?? null,
        }}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
