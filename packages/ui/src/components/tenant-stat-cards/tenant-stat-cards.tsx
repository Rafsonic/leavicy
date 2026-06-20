import {
  Building2,
  CheckCircle2,
  PauseCircle,
  Users,
  ClipboardList,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import type { TenantStatCardsProps } from "./tenant-stat-cards.types";

type Item = {
  label: string;
  value: number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function TenantStatCards({
  id,
  stats,
}: TenantStatCardsProps): React.JSX.Element {
  const items: Item[] = [
    {
      label: "Tenants",
      value: stats.total_tenants,
      hint: `${stats.active_tenants} active · ${stats.archived_tenants} archived`,
      icon: Building2,
    },
    {
      label: "Active",
      value: stats.active_tenants,
      hint: "Currently active",
      icon: CheckCircle2,
    },
    {
      label: "Suspended",
      value: stats.suspended_tenants,
      hint: "Frozen tenants",
      icon: PauseCircle,
    },
    {
      label: "Users",
      value: stats.total_users,
      hint: "Across all tenants",
      icon: Users,
    },
    {
      label: "Leave requests",
      value: stats.total_requests,
      hint: "All-time",
      icon: ClipboardList,
    },
    {
      label: "Pending",
      value: stats.pending_requests,
      hint: "Awaiting review",
      icon: Clock,
    },
  ];

  return (
    <div
      data-component="TenantStatCards"
      data-cy={id}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {items.map((it) => (
        <Card key={it.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {it.label}
            </CardTitle>
            <it.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{it.value}</div>
            <p className="text-xs text-muted-foreground">{it.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
