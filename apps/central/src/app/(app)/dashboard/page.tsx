import { requirePlatformAdmin } from "@repo/database/dal";
import { createClient } from "@repo/database/server";
import { formatDate } from "@repo/database/format";
import type { PlatformStats } from "@repo/database/types";
import {
  PageHeader,
  TenantStatCards,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";

export const metadata = { title: "Dashboard · Leavicy Central" };

const EMPTY_STATS: PlatformStats = {
  total_tenants: 0,
  active_tenants: 0,
  suspended_tenants: 0,
  archived_tenants: 0,
  total_users: 0,
  total_requests: 0,
  pending_requests: 0,
};

export default async function CentralDashboardPage() {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const [{ data: statsRows }, { data: tenantRows }] = await Promise.all([
    supabase.rpc("get_platform_stats"),
    supabase.rpc("get_tenant_stats"),
  ]);

  const stats = statsRows?.[0] ?? EMPTY_STATS;
  const recent = (tenantRows ?? []).slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Platform overview across all tenants."
      />

      <TenantStatCards id="platform-stats" stats={stats} />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Recent tenants</CardTitle>
          <CardDescription>The latest companies onboarded.</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tenants yet.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((t) => (
                <li
                  key={t.org_id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.slug}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(t.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
