import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  Clock,
  Inbox,
  TrendingDown,
} from "lucide-react";
import { requireActiveMembership } from "@repo/database/dal";
import { createClient } from "@repo/database/server";
import { currentYear, formatDateRange, todayISO } from "@repo/database/format";
import { canReview } from "@repo/database/types";
import { PageHeader } from "@repo/ui";
import { NewRequestDialog } from "@repo/ui";
import { StatusBadge, TypeBadge } from "@repo/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { Button } from "@repo/ui";

export const metadata = { title: "Dashboard · Leavicy" };

function Stat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const { user, membership } = await requireActiveMembership();
  const supabase = await createClient();
  const year = currentYear();
  const today = todayISO();

  const [{ data: myThisYear }, { data: myPending }, { data: recent }] =
    await Promise.all([
      supabase
        .from("leave_requests")
        .select("working_days")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .gte("start_date", `${year}-01-01`)
        .lte("start_date", `${year}-12-31`),
      supabase
        .from("leave_requests")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "pending"),
      supabase
        .from("leave_requests")
        .select("id, leave_type, start_date, end_date, working_days, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const usedDays = (myThisYear ?? []).reduce(
    (sum, r) => sum + r.working_days,
    0,
  );
  const allowance = membership.annual_sick_days;
  const remaining = Math.max(allowance - usedDays, 0);
  const pendingCount = myPending?.length ?? 0;

  // Who's out today (org-wide, non-sensitive view)
  const { data: calendar } = await supabase.rpc("get_team_calendar", {
    _org: membership.org_id,
  });
  const outToday = (calendar ?? []).filter(
    (e) =>
      e.status === "approved" && e.start_date <= today && e.end_date >= today,
  );

  // Approvals queue for managers/admins
  let awaitingCount = 0;
  if (canReview(membership.role)) {
    const { count } = await supabase
      .from("leave_requests")
      .select("id", { count: "exact", head: true })
      .eq("org_id", membership.org_id)
      .eq("status", "pending");
    awaitingCount = count ?? 0;
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Your sick leave overview at ${membership.organization.name}.`}
        action={<NewRequestDialog />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Annual allowance"
          value={`${allowance} days`}
          hint={`Year ${year}`}
          icon={CalendarDays}
        />
        <Stat
          label="Used"
          value={`${usedDays} days`}
          hint="Approved leave this year"
          icon={TrendingDown}
        />
        <Stat
          label="Remaining"
          value={`${remaining} days`}
          hint="Allowance minus used"
          icon={ClipboardList}
        />
        <Stat
          label="My pending"
          value={pendingCount}
          hint="Awaiting a decision"
          icon={Clock}
        />
      </div>

      {canReview(membership.role) && awaitingCount > 0 && (
        <Card className="mt-4 border-primary/40 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Inbox className="size-5 text-primary" />
              <span className="text-sm">
                <span className="font-semibold">{awaitingCount}</span> request
                {awaitingCount === 1 ? "" : "s"} awaiting your approval.
              </span>
            </div>
            <Button size="sm" render={<Link href="/approvals" />}>
              Review
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Out today</CardTitle>
            <CardDescription>People on approved leave today.</CardDescription>
          </CardHeader>
          <CardContent>
            {outToday.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nobody is out today.
              </p>
            ) : (
              <ul className="space-y-3">
                {outToday.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-sm font-medium">{e.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      until {formatDateRange(e.end_date, e.end_date)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">My recent requests</CardTitle>
            <CardDescription>Your latest submissions.</CardDescription>
          </CardHeader>
          <CardContent>
            {!recent || recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests yet.</p>
            ) : (
              <ul className="space-y-3">
                {recent.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <TypeBadge type={r.leave_type} />
                      <span className="text-sm text-muted-foreground">
                        {formatDateRange(r.start_date, r.end_date)}
                      </span>
                    </div>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
