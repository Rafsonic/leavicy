import { requirePlatformAdmin } from "@repo/database/dal";
import { createClient } from "@repo/database/server";
import { PageHeader, TenantsTable } from "@repo/ui";

export const metadata = { title: "Tenants · Leavicy Central" };

export default async function TenantsPage() {
  await requirePlatformAdmin();
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_tenant_stats");

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Create and manage the companies on the platform."
      />
      <TenantsTable id="tenants-table" tenants={data ?? []} />
    </>
  );
}
